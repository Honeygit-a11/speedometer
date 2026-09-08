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
  buildDownloadUrl,
  buildPingUrl,
  detectServerBackend,
  type ServerBackend,
} from "./server-endpoints";
import type { SpeedTestServer } from "./server-registry";

export interface DownloadTestOptions {
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
  /** CV threshold (0-1) below which throughput is considered stable. */
  stabilityThreshold?: number;
  /** How long throughput must remain stable to end early (default 1500ms). */
  stableDurationMs?: number;
  /** Minimum samples before early termination is considered. */
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

/**
 * Progressive multi-connection download measurement.
 *
 * Accuracy rules (per the measurement plan):
 *  - Final result = actual post-warmup bytes / actual post-warmup duration.
 *    The smoothed `currentMbps` shown on the gauge is NEVER used as a result.
 *  - Connection startup (warmup) is discarded, so slow-start doesn't bias speed.
 *  - Stream concurrency is ramped up DURING WARMUP ONLY and then frozen, so a
 *    mid-measurement scaling transient can't distort the post-warmup average.
 *  - Adaptive duration: ends early once throughput is stable (after a minimum
 *    duration), and never exceeds the hard cap.
 *  - No fabricated fallback: if zero bytes transferred post-warmup, final is 0.
 */
export async function runDownloadTest(options: DownloadTestOptions): Promise<SpeedMetrics> {
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
  let totalBytesTransferred = 0;
  let currentSmoothedMbps = 0;
  const postWarmupMbpsSamples: number[] = [];
  const rawSamples: RawMeasurementSample[] = [];
  const loadedLatencySamples: number[] = [];
  let lastProbeTime = 0;

  // Warmup transition tracking.
  let warmupPassed = false;
  let bytesAtWarmupEnd = 0;
  let warmupEndTime = startTime + warmupMs;

  const rollingTracker = new RollingThroughputTracker(1000);

  let activeStreams = 0;
  let targetStreams = initialStreams;
  let streamFailures = 0;

  // Stream worker: each maintains a keep-alive connection across sequential
  // large chunk requests, so connection setup is confined to warmup.
  async function streamWorker(streamId: number) {
    activeStreams++;
    try {
      while (!internalController.signal.aborted) {
        const remainingTime = maxDurationMs - (performance.now() - startTime);
        if (remainingTime <= 0) break;

        const chunkSize = 32 * 1024 * 1024;
        const res = await fetch(
          buildDownloadUrl(workerUrl, backend, chunkSize, streamId),
          { cache: "no-store", signal: internalController.signal }
        );

        if (!res.ok || !res.body) {
          streamFailures++;
          break;
        }

        const reader = res.body.getReader();
        try {
          while (!internalController.signal.aborted) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) {
              totalBytesTransferred += value.byteLength;
            }
          }
        } finally {
          reader.releaseLock();
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== "AbortError") {
        streamFailures++;
        console.warn(`[SpeedTest Engine] Download stream #${streamId} error:`, err);
      }
    } finally {
      activeStreams--;
    }
  }

  // Concurrent loaded-latency probe under load.
  async function probeLoadedLatency() {
    const pingUrl = buildPingUrl(workerUrl, backend, "?_loaded=1");
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
    streamWorker(i);
  }

  let stableSince = 0;

  await new Promise<void>((resolve, reject) => {
    const interval = setInterval(() => {
      if (internalController.signal.aborted) {
        clearInterval(interval);
        reject(new DOMException("Download test aborted", "AbortError"));
        return;
      }

      const now = performance.now();
      const elapsedTotalMs = now - startTime;

      rollingTracker.record(now, totalBytesTransferred);
      const rollingMbps = rollingTracker.getCurrentMbps();

      // Warmup boundary.
      if (!warmupPassed && elapsedTotalMs >= warmupMs) {
        warmupPassed = true;
        bytesAtWarmupEnd = totalBytesTransferred;
        warmupEndTime = now;
      }

      // Smooth display value (UI only — never used for the final result).
      if (rollingMbps > 0) {
        currentSmoothedMbps = calculateEMA(rollingMbps, currentSmoothedMbps, 0.4);
      } else {
        currentSmoothedMbps = calculateEMA(0, currentSmoothedMbps, 0.2);
      }

      if (warmupPassed) {
        postWarmupMbpsSamples.push(rollingMbps);

        // Record a raw measurement sample (authoritative layer).
        rawSamples.push({
          timestampMs: Math.round(now),
          cumulativeBytes: totalBytesTransferred,
          throughputMbps: Number(rollingMbps.toFixed(2)),
          streamCount: targetStreams,
        });

        // Periodically probe loaded latency (~every 1500ms).
        if (now - lastProbeTime > 1500) {
          lastProbeTime = now;
          probeLoadedLatency();
        }

        // Adaptive early termination: only after min duration + enough samples,
        // and only when throughput has been stable for the required window.
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
        // Warmup phase: ramp concurrency up to fit the link. Frozen post-warmup
        // so the measurement window has a single, stable concurrency level.
        if (rollingMbps > 40 && targetStreams < 4) {
          streamWorker(targetStreams++);
        } else if (rollingMbps > 150 && targetStreams < maxStreams) {
          streamWorker(targetStreams++);
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

  // Final ground-truth result from the post-warmup window. No fabrication: if
  // zero bytes transferred, the result is 0 — never a smoothed display value.
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
