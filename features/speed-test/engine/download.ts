import { SpeedMetrics } from "@/types";
import {
  calculateSpeedMbps,
  calculateEMA,
  RollingThroughputTracker,
} from "./calculations";

export interface DownloadTestOptions {
  workerUrl: string;
  durationMs?: number;       // Total duration (default 8000ms)
  warmupMs?: number;         // Initial warm-up window to discard (default 1500ms)
  initialStreams?: number;   // Initial parallel streams (default 2)
  maxStreams?: number;       // Maximum parallel streams (default 6)
  signal?: AbortSignal;
  onProgress?: (metrics: { currentMbps: number; bytesTransferred: number; elapsedMs: number; progress: number }) => void;
}

/**
 * Progressive multi-connection download speed measurement.
 * Uses a rolling 1000ms window for smooth live readout and cumulative post-warmup
 * throughput calculation for exact, reliable final results.
 */
export async function runDownloadTest(options: DownloadTestOptions): Promise<SpeedMetrics> {
  const {
    workerUrl,
    durationMs = 8000,
    warmupMs = 1500,
    initialStreams = 2,
    maxStreams = 6,
    signal,
    onProgress,
  } = options;

  const downloadUrl = `${workerUrl.replace(/\/$/, "")}/download`;
  const internalController = new AbortController();

  const onExternalAbort = () => internalController.abort();
  signal?.addEventListener("abort", onExternalAbort);

  const startTime = performance.now();
  let totalBytesTransferred = 0;
  let currentSmoothedMbps = 0;
  const postWarmupMbpsSamples: number[] = [];
  const loadedLatencySamples: number[] = [];
  let lastProbeTime = 0;

  // Track warmup transition
  let warmupPassed = false;
  let bytesAtWarmupEnd = 0;
  let warmupEndTime = startTime + warmupMs;

  const rollingTracker = new RollingThroughputTracker(1000);

  let activeStreams = 0;
  let targetStreams = initialStreams;

  // Stream worker
  async function streamWorker(streamId: number) {
    activeStreams++;
    try {
      while (!internalController.signal.aborted) {
        const remainingTime = durationMs - (performance.now() - startTime);
        if (remainingTime <= 0) break;

        // Request 32MB chunks: large enough to amortize connection/RTT overhead
        // between sequential requests so fast lines stay saturated.
        const chunkSize = 32 * 1024 * 1024;
        const res = await fetch(`${downloadUrl}?bytes=${chunkSize}&s=${streamId}&_t=${Date.now()}`, {
          cache: "no-store",
          signal: internalController.signal,
        });

        if (!res.ok || !res.body) break;

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
        console.warn(`[SpeedTest Engine] Download stream #${streamId} encountered error:`, err);
      }
    } finally {
      activeStreams--;
    }
  }

  // Concurrent loaded latency probe runner
  async function probeLoadedLatency() {
    const pingUrl = `${workerUrl.replace(/\/$/, "")}/ping?_loaded=1&_t=${Date.now()}`;
    const t0 = performance.now();
    try {
      const res = await fetch(pingUrl, {
        cache: "no-store",
        signal: internalController.signal,
      });
      if (res.ok) {
        await res.text();
        const latency = performance.now() - t0;
        loadedLatencySamples.push(latency);
      }
    } catch {
      // Ignore probe aborts
    }
  }

  // Launch initial parallel streams
  for (let i = 0; i < targetStreams; i++) {
    streamWorker(i);
  }

  // Measurement and sampling ticker (every 100ms)
  await new Promise<void>((resolve, reject) => {
    const interval = setInterval(() => {
      if (internalController.signal.aborted) {
        clearInterval(interval);
        reject(new DOMException("Download test aborted", "AbortError"));
        return;
      }

      const now = performance.now();
      const elapsedTotalMs = now - startTime;

      // Feed rolling tracker
      rollingTracker.record(now, totalBytesTransferred);
      const rollingMbps = rollingTracker.getCurrentMbps();

      // Check warmup boundary
      if (!warmupPassed && elapsedTotalMs >= warmupMs) {
        warmupPassed = true;
        bytesAtWarmupEnd = totalBytesTransferred;
        warmupEndTime = now;
      }

      // Smooth the display speed; decay toward 0 during stalls so the gauge
      // doesn't freeze at a stale high value while the link is idle.
      if (rollingMbps > 0) {
        currentSmoothedMbps = calculateEMA(rollingMbps, currentSmoothedMbps, 0.4);
      } else {
        currentSmoothedMbps = calculateEMA(0, currentSmoothedMbps, 0.2);
      }

      // Post-warmup sampling and stream scaling
      if (warmupPassed && rollingMbps > 0) {
        postWarmupMbpsSamples.push(rollingMbps);

        // Periodically probe loaded latency every 1500ms
        if (now - lastProbeTime > 1500) {
          lastProbeTime = now;
          probeLoadedLatency();
        }

        // Dynamically scale concurrency if bandwidth justifies it
        if (rollingMbps > 40 && targetStreams < 4) {
          const newStreamId = targetStreams++;
          streamWorker(newStreamId);
        } else if (rollingMbps > 150 && targetStreams < maxStreams) {
          const newStreamId = targetStreams++;
          streamWorker(newStreamId);
        }
      }

      const progress = Math.min(1, elapsedTotalMs / durationMs);

      if (onProgress) {
        onProgress({
          currentMbps: currentSmoothedMbps,
          bytesTransferred: totalBytesTransferred,
          elapsedMs: Math.round(elapsedTotalMs),
          progress: Number(progress.toFixed(2)),
        });
      }

      if (elapsedTotalMs >= durationMs) {
        clearInterval(interval);
        internalController.abort(); // Terminate remaining active streams
        resolve();
      }
    }, 100);
  }).catch((err) => {
    internalController.abort();
    signal?.removeEventListener("abort", onExternalAbort);
    throw err;
  });

  signal?.removeEventListener("abort", onExternalAbort);

  // Compute final stable speed from ground truth post-warmup bytes and duration
  const finalTime = performance.now();
  const postWarmupBytes = Math.max(0, totalBytesTransferred - bytesAtWarmupEnd);
  const postWarmupDurationSec = Math.max(0.1, (finalTime - warmupEndTime) / 1000);

  // Final speed = exact ground-truth bytes/duration over the post-warmup window.
  // No trimmed-mean blend: the trimmed mean drops the slow tail that a sustained
  // average must include, biasing results upward on variable links.
  const cumulativeThroughput = calculateSpeedMbps(postWarmupBytes, postWarmupDurationSec);
  const finalMbps = cumulativeThroughput > 0
    ? Number(cumulativeThroughput.toFixed(1))
    : currentSmoothedMbps;

  // Compute average loaded latency
  const avgLoadedLatency = loadedLatencySamples.length > 0
    ? Math.round(loadedLatencySamples.reduce((a, b) => a + b, 0) / loadedLatencySamples.length)
    : undefined;

  return {
    currentMbps: finalMbps,
    bytesTransferred: totalBytesTransferred,
    elapsedMs: Math.round(performance.now() - startTime),
    finalMbps,
    loadedLatencyMs: avgLoadedLatency,
    samples: postWarmupMbpsSamples,
  };
}
