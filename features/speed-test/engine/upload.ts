import { SpeedMetrics } from "@/types";
import {
  calculateSpeedMbps,
  calculateTrimmedMean,
  calculateEMA,
  RollingThroughputTracker,
} from "./calculations";

export interface UploadTestOptions {
  workerUrl: string;
  durationMs?: number;       // Total duration (default 8000ms)
  warmupMs?: number;         // Initial warm-up window to discard (default 1500ms)
  initialStreams?: number;   // Initial parallel upload connections (default 3)
  payloadChunkSize?: number; // Size of synthetic binary chunk (default 256KB for frequent progress)
  signal?: AbortSignal;
  onProgress?: (metrics: { currentMbps: number; bytesTransferred: number; elapsedMs: number; progress: number }) => void;
}

/**
 * Generates an in-memory synthetic payload buffer without storing state.
 */
function createSyntheticBuffer(size: number): Uint8Array {
  const buffer = new Uint8Array(size);
  for (let i = 0; i < size; i += 64) {
    buffer[i] = (i * 31) % 256;
  }
  return buffer;
}

/**
 * Multi-connection upload speed measurement.
 * Uses a rolling 1000ms window for smooth live readout and cumulative post-warmup
 * throughput calculation for exact, reliable final results.
 */
export async function runUploadTest(options: UploadTestOptions): Promise<SpeedMetrics> {
  const {
    workerUrl,
    durationMs = 8000,
    warmupMs = 1500,
    initialStreams = 3,
    payloadChunkSize = 256 * 1024, // 256 KB chunk gives high-frequency updates
    signal,
    onProgress,
  } = options;

  const uploadUrl = `${workerUrl.replace(/\/$/, "")}/upload`;
  const internalController = new AbortController();

  const onExternalAbort = () => internalController.abort();
  signal?.addEventListener("abort", onExternalAbort);

  const payloadBuffer = createSyntheticBuffer(payloadChunkSize);

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

  // Dedicated upload stream worker
  async function uploadWorker(streamId: number) {
    try {
      while (!internalController.signal.aborted) {
        const remainingTime = durationMs - (performance.now() - startTime);
        if (remainingTime <= 0) break;

        const res = await fetch(`${uploadUrl}?s=${streamId}&_t=${Date.now()}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
          },
          body: payloadBuffer as BodyInit,
          cache: "no-store",
          signal: internalController.signal,
        });

        if (res.ok) {
          totalBytesTransferred += payloadChunkSize;
        } else {
          break;
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== "AbortError") {
        console.warn(`[SpeedTest Engine] Upload stream #${streamId} encountered error:`, err);
      }
    }
  }

  // Concurrent loaded latency probe runner
  async function probeLoadedLatency() {
    const pingUrl = `${workerUrl.replace(/\/$/, "")}/ping?_loaded_up=1&_t=${Date.now()}`;
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
  for (let i = 0; i < initialStreams; i++) {
    uploadWorker(i);
  }

  // Measurement and sampling ticker (every 100ms)
  await new Promise<void>((resolve, reject) => {
    const interval = setInterval(() => {
      if (internalController.signal.aborted) {
        clearInterval(interval);
        reject(new DOMException("Upload test aborted", "AbortError"));
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

      // Smooth the display speed
      if (rollingMbps > 0) {
        currentSmoothedMbps = calculateEMA(rollingMbps, currentSmoothedMbps, 0.4);
      }

      // Collect post-warmup samples
      if (warmupPassed && rollingMbps > 0) {
        postWarmupMbpsSamples.push(rollingMbps);

        // Periodically probe loaded latency every 1500ms
        if (now - lastProbeTime > 1500) {
          lastProbeTime = now;
          probeLoadedLatency();
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

  // Compute final stable upload speed
  const finalTime = performance.now();
  const postWarmupBytes = Math.max(0, totalBytesTransferred - bytesAtWarmupEnd);
  const postWarmupDurationSec = Math.max(0.1, (finalTime - warmupEndTime) / 1000);

  const cumulativeThroughput = calculateSpeedMbps(postWarmupBytes, postWarmupDurationSec);
  const trimmedMeanThroughput = postWarmupMbpsSamples.length > 0
    ? calculateTrimmedMean(postWarmupMbpsSamples, 0.15)
    : currentSmoothedMbps;

  const finalMbps = cumulativeThroughput > 0
    ? Number(((cumulativeThroughput * 0.7) + (trimmedMeanThroughput * 0.3)).toFixed(1))
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
  };
}
