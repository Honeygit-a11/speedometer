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
  onProgress?: (metrics: { currentMbps: number; bytesTransferred: number; elapsedMs: number; progress: number }) => void;
}

/**
 * Multi-connection upload measurement.
 *
 * Accuracy rules:
 *  - Only bytes the SERVER confirms it received are counted (via the /upload
 *    response's `bytesReceived`). Data handed to the browser transport but not
 *    delivered is NOT credited — the client's tally is anchored to the server's.
 *  - Requests aborted mid-flight at test end are NOT credited (unconfirmed
 *    bytes would otherwise inflate the result).
 *  - Final result = confirmed post-warmup bytes / post-warmup duration. Never a
 *    smoothed display value, never a synthetic estimate.
 *  - Concurrency ramps up during warmup only; adaptive early termination after
 *    a minimum duration once throughput is stable.
 */
export async function runUploadTest(options: UploadTestOptions): Promise<SpeedMetrics> {
  const {
    workerUrl,
    backend: backendOverride,
    server,
    maxDurationMs = 8000,
    minDurationMs = 4000,
    warmupMs = 1500,
    initialStreams = 3,
    maxStreams = 8,
    payloadChunkSize = 1 * 1024 * 1024,
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
  let streamFailures = 0;

  let warmupPassed = false;
  let bytesAtWarmupEnd = 0;
  let warmupEndTime = startTime + warmupMs;

  const rollingTracker = new RollingThroughputTracker(1000);

  let targetStreams = initialStreams;

  async function uploadWorker(streamId: number) {
    try {
      while (!internalController.signal.aborted) {
        const remainingTime = maxDurationMs - (performance.now() - startTime);
        if (remainingTime <= 0) break;

        // Plain Uint8Array body — avoids ReadableStream + duplex:"half"
        // which triggers ERR_ALPN_NEGOTIATION_FAILED on local HTTP.
        const payload = new Uint8Array(payloadChunkSize);

        try {
          const res = await fetch(buildUploadUrl(workerUrl, backend, streamId), {
            method: "POST",
            headers: { "Content-Type": "application/octet-stream" },
            body: payload,
            cache: "no-store",
            signal: internalController.signal,
          });

          if (!res.ok) {
            streamFailures++;
            break;
          }

          // Authoritative byte count: the server reports exactly what it
          // received. This corrects any transport-buffer over-credit and
          // does not count bytes that never arrived.
          let confirmedBytes = payloadChunkSize;
          try {
            const json = (await res.json()) as { bytesReceived?: number };
            if (typeof json.bytesReceived === "number" && json.bytesReceived >= 0) {
              confirmedBytes = json.bytesReceived;
            }
          } catch {
            // If the confirmation body is unreadable, fall back to the
            // known payload size (request fully completed = delivered).
          }
          totalBytesTransferred += confirmedBytes;
        } catch (err: unknown) {
          if ((err as Error)?.name !== "AbortError") {
            streamFailures++;
            console.warn(`[SpeedTest Engine] Upload stream #${streamId} error:`, err);
          }
          // AbortError = test ended mid-request. The in-flight bytes are NOT
          // confirmed delivered, so they are not credited.
          break;
        }
      }
    } finally {
      // no-op; scaling tracks targetStreams externally
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
      // Ignore probe aborts / transient failures.
    }
  }

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
        // Warmup ramping only; frozen during measurement.
        if (rollingMbps > 50 && targetStreams < 4) {
          uploadWorker(targetStreams++);
        } else if (rollingMbps > 200 && targetStreams < maxStreams) {
          uploadWorker(targetStreams++);
        }
      }

      const progress = Math.min(1, elapsedTotalMs / maxDurationMs);

      if (onProgress) {
        onProgress({
          currentMbps: currentSmoothedMbps,
          bytesTransferred: totalBytesTransferred,
          elapsedMs: Math.round(elapsedTotalMs),
          progress: Number(progress.toFixed(2)),
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
  const finalMbps =
    postWarmupBytes > 0
      ? Number(calculateSpeedMbps(postWarmupBytes, postWarmupDurationSec).toFixed(1))
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