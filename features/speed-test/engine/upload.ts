import {
  SpeedMetrics,
  RawTransferMetrics,
  RawMeasurementSample,
} from "@/types";
import {
  calculateSpeedMbps,
  calculateEMA,
  RollingThroughputTracker,
  isThroughputStable,
} from "./calculations";
import {
  buildPingUrl,
  buildUploadUrl,
  detectServerBackend,
  type ServerBackend,
} from "./server-endpoints";
import type { SpeedTestServer } from "./server-registry";

export interface UploadTestOptions {
  workerUrl: string;
  backend?: ServerBackend;
  server?: SpeedTestServer;
  /** Hard cap on total test duration (default 8000ms). */
  maxDurationMs?: number;
  /** Minimum duration before early termination is allowed (default 4000ms). */
  minDurationMs?: number;
  /** Connection ramp-up window to discard (default 1500ms). */
  warmupMs?: number;
  initialStreams?: number;
  maxStreams?: number;
  /** Soft per-request byte target; smaller = finer boundary accounting. */
  payloadChunkSize?: number;
  stabilityThreshold?: number;
  stableDurationMs?: number;
  minSampleCount?: number;
  signal?: AbortSignal;
  onProgress?: (metrics: {
    currentMbps: number;
    bytesTransferred: number;
    elapsedMs: number;
    progress: number;
    streamCount: number;
    averageMbps: number;
  }) => void;
}

// Pre-allocated static buffers to avoid continuous heap allocations and GC spikes
const CHUNK_256KB = new Uint8Array(256 * 1024);
const CHUNK_512KB = new Uint8Array(512 * 1024);
const CHUNK_1MB = new Uint8Array(1024 * 1024);

/**
 * Dynamically selects chunk size based on current throughput to ensure:
 *  - Fast start & frequent acknowledgments (<200ms) on low/medium connections
 *  - Maximum socket saturation with larger chunks on fast connections
 */
function selectUploadChunk(currentMbps: number): Uint8Array {
  if (currentMbps > 150) return CHUNK_1MB;
  if (currentMbps > 40) return CHUNK_512KB;
  return CHUNK_256KB;
}

/**
 * Multi-connection upload measurement with adaptive chunk sizing.
 *
 * Accuracy rules:
 *  - Only bytes the SERVER confirms it received are counted (via the /upload
 *    response's `bytesReceived` or completed HTTP 200 payload).
 *  - Adaptive chunk size (256KB -> 512KB -> 1MB) prevents needle freeze on low/mid speeds.
 *  - Final result = confirmed post-warmup bytes / post-warmup duration.
 *  - Concurrency ramps up geometrically during warmup only and freezes during measurement.
 */
export async function runUploadTest(options: UploadTestOptions): Promise<SpeedMetrics> {
  const {
    workerUrl,
    backend: backendOverride,
    server,
    maxDurationMs = 8000,
    minDurationMs = 4000,
    warmupMs = 1500,
    initialStreams = 2,
    maxStreams = 8,
    stabilityThreshold = 0.25,
    stableDurationMs = 1500,
    minSampleCount = 12,
    signal,
    onProgress,
  } = options;

  const backend =
    backendOverride ?? (server ? detectServerBackend(server) : "standard");

  const internalController = new AbortController();

  const onExternalAbort = () => internalController.abort();
  signal?.addEventListener("abort", onExternalAbort);

  const startTime = performance.now();
  // Confirmed bytes only (server-verified). This is the authoritative total.
  let totalBytesTransferred = 0;
  let currentSmoothedMbps = 0;
  const postWarmupMbpsSamples: number[] = [];
  const rawSamples: RawMeasurementSample[] = [];
  const loadedLatencySamples: number[] = [];
  let lastProbeTime = 0;

  let warmupPassed = false;
  let bytesAtWarmupEnd = 0;
  let warmupEndTime = startTime + warmupMs;

  const rollingTracker = new RollingThroughputTracker(1000);

  let targetStreams = initialStreams;

  async function uploadWorker(streamId: number) {
    let consecutiveErrors = 0;
    while (!internalController.signal.aborted) {
      const remainingTime = maxDurationMs - (performance.now() - startTime);
      if (remainingTime <= 0) break;

      // Use dynamically sized chunk based on current throughput
      const payload = selectUploadChunk(currentSmoothedMbps);
      const expectedBytes = payload.byteLength;

      try {
        const res = await fetch(buildUploadUrl(workerUrl, backend, streamId), {
          method: "POST",
          headers: { "Content-Type": "application/octet-stream" },
          body: payload as unknown as BodyInit,
          cache: "no-store",
          signal: internalController.signal,
        });

        if (!res.ok) {
          consecutiveErrors++;
          if (consecutiveErrors >= 3) break;
          await new Promise((r) => setTimeout(r, 50));
          continue;
        }

        consecutiveErrors = 0;

        // Authoritative byte count: read server confirmation if available
        let confirmedBytes = expectedBytes;
        try {
          const json = (await res.json()) as { bytesReceived?: number };
          if (typeof json.bytesReceived === "number" && json.bytesReceived >= 0) {
            confirmedBytes = json.bytesReceived;
          }
        } catch {
          // Server returned 200 OK without JSON body (valid for /empty POST sink)
        }

        totalBytesTransferred += confirmedBytes;
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError" || internalController.signal.aborted) {
          break;
        }
        consecutiveErrors++;
        if (consecutiveErrors >= 3) {
          console.warn(`[SpeedTest Engine] Upload stream #${streamId} stopped after errors:`, err);
          break;
        }
        await new Promise((r) => setTimeout(r, 50));
      }
    }
  }

  async function probeLoadedLatency() {
    const pingUrl = buildPingUrl(workerUrl, backend, "?_loaded_up=1");
    const t0 = performance.now();
    try {
      const res = await fetch(`${pingUrl}&_t=${Date.now()}`, {
        cache: "no-store",
        signal: internalController.signal,
      });
      if (res.ok) {
        await res.text();
        loadedLatencySamples.push(performance.now() - t0);
      }
    } catch {
      // Ignore probe aborts / transient failures
    }
  }

  // Start initial parallel upload streams
  for (let i = 0; i < targetStreams; i++) {
    uploadWorker(i);
  }

  let stableSince = 0;

  await new Promise<void>((resolve, reject) => {
    const interval = setInterval(() => {
      if (internalController.signal.aborted) {
        clearInterval(interval);
        reject(new DOMException("Upload test aborted", "AbortError"));
        return;
      }

      const now = performance.now();
      const elapsedTotalMs = now - startTime;

      rollingTracker.record(now, totalBytesTransferred);
      const rollingMbps = rollingTracker.getCurrentMbps();

      if (!warmupPassed && elapsedTotalMs >= warmupMs) {
        warmupPassed = true;
        bytesAtWarmupEnd = totalBytesTransferred;
        warmupEndTime = now;
      }

      if (rollingMbps > 0) {
        currentSmoothedMbps = calculateEMA(rollingMbps, currentSmoothedMbps, 0.4);
      } else {
        currentSmoothedMbps = calculateEMA(0, currentSmoothedMbps, 0.2);
      }

      if (warmupPassed) {
        postWarmupMbpsSamples.push(rollingMbps);

        rawSamples.push({
          timestampMs: Math.round(now),
          cumulativeBytes: totalBytesTransferred,
          throughputMbps: Number(rollingMbps.toFixed(2)),
          streamCount: targetStreams,
        });

        if (now - lastProbeTime > 1500) {
          lastProbeTime = now;
          probeLoadedLatency();
        }

        if (
          elapsedTotalMs >= minDurationMs &&
          postWarmupMbpsSamples.length >= minSampleCount
        ) {
          if (isThroughputStable(postWarmupMbpsSamples, stabilityThreshold)) {
            if (stableSince === 0) stableSince = now;
            else if (now - stableSince >= stableDurationMs) {
              clearInterval(interval);
              internalController.abort();
              resolve();
              return;
            }
          } else {
            stableSince = 0;
          }
        }
      } else {
        // Fast.com-style geometric upload scaling (Phase 9 of antigravitity.file):
        // Concurrency scales up during warmup (up to maxStreams), then is frozen
        // post-warmup so the authoritative measurement window is stable.
        if (rollingMbps > 25 && targetStreams < 4) {
          while (targetStreams < Math.min(4, maxStreams)) {
            uploadWorker(targetStreams++);
          }
        } else if (rollingMbps > 100 && targetStreams < maxStreams) {
          while (targetStreams < maxStreams) {
            uploadWorker(targetStreams++);
          }
        }
      }

      const progress = Math.min(1, elapsedTotalMs / maxDurationMs);

      if (onProgress) {
        const elapsedSec = Math.max(0.1, elapsedTotalMs / 1000);
        onProgress({
          currentMbps: currentSmoothedMbps,
          bytesTransferred: totalBytesTransferred,
          elapsedMs: Math.round(elapsedTotalMs),
          progress: Number(progress.toFixed(2)),
          streamCount: targetStreams,
          averageMbps: Number(
            calculateSpeedMbps(totalBytesTransferred, elapsedSec).toFixed(1)
          ),
        });
      }

      if (elapsedTotalMs >= maxDurationMs) {
        clearInterval(interval);
        internalController.abort();
        resolve();
      }
    }, 100);
  }).catch((err) => {
    internalController.abort();
    signal?.removeEventListener("abort", onExternalAbort);
    throw err;
  });

  signal?.removeEventListener("abort", onExternalAbort);

  // Final ground-truth result (confirmed bytes only). No fabrication.
  const finalTime = performance.now();
  const postWarmupBytes = Math.max(0, totalBytesTransferred - bytesAtWarmupEnd);
  const postWarmupDurationSec = Math.max(0.1, (finalTime - warmupEndTime) / 1000);
  const totalDurationSec = Math.max(0.1, (finalTime - startTime) / 1000);

  // Derive final result honestly: prioritize post-warmup window; fall back to
  // total duration if post-warmup window transferred 0 bytes due to slow connection.
  const finalMbps =
    postWarmupBytes > 0
      ? Number(calculateSpeedMbps(postWarmupBytes, postWarmupDurationSec).toFixed(1))
      : totalBytesTransferred > 0
      ? Number(calculateSpeedMbps(totalBytesTransferred, totalDurationSec).toFixed(1))
      : 0;

  const avgLoadedLatency =
    loadedLatencySamples.length > 0
      ? Math.round(loadedLatencySamples.reduce((a, b) => a + b, 0) / loadedLatencySamples.length)
      : undefined;

  const raw: RawTransferMetrics = {
    samples: rawSamples,
    totalBytes: totalBytesTransferred,
    measurementStartMs: Math.round(warmupEndTime),
    measurementEndMs: Math.round(finalTime),
    measurementDurationMs: Math.round(finalTime - warmupEndTime),
    streamCount: targetStreams,
  };

  return {
    currentMbps: currentSmoothedMbps,
    bytesTransferred: totalBytesTransferred,
    elapsedMs: Math.round(performance.now() - startTime),
    finalMbps,
    loadedLatencyMs: avgLoadedLatency,
    samples: postWarmupMbpsSamples,
    streamCount: targetStreams,
    raw,
  };
}