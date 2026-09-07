import { SpeedMetrics } from "@/types";
import {
  calculateSpeedMbps,
  calculateEMA,
  RollingThroughputTracker,
} from "./calculations";

export interface UploadTestOptions {
  workerUrl: string;
  durationMs?: number;       // Total duration (default 8000ms)
  warmupMs?: number;         // Initial warm-up window to discard (default 1500ms)
  initialStreams?: number;   // Initial parallel upload connections (default 3)
  maxStreams?: number;       // Maximum parallel upload connections (default 6)
  payloadChunkSize?: number; // Soft per-request byte target (default 4MB)
  signal?: AbortSignal;
  onProgress?: (metrics: { currentMbps: number; bytesTransferred: number; elapsedMs: number; progress: number }) => void;
}

// 128KB chunk handed to the transport per pull. Small enough that even a slow
// link (a few hundred KB/s) sees frequent progress; reused so we never allocate
// a full request-sized payload.
const SEND_CHUNK_SIZE = 128 * 1024;
let sendBuffer: Uint8Array | null = null;

/**
 * Multi-connection upload speed measurement.
 *
 * Measures bytes handed to the transport via a streaming request body — the
 * ReadableStream `pull()` is backpressure-driven, so the byte count grows exactly
 * as fast as the network consumes the payload. This fixes the previous
 * whole-chunk-counting bug where a slow connection (chunk outlives the test)
 * never completed a request and reported 0 Mbps. Bytes are credited incrementally,
 * including partial (in-flight) bytes when the test ends mid-request.
 */
export async function runUploadTest(options: UploadTestOptions): Promise<SpeedMetrics> {
  const {
    workerUrl,
    durationMs = 8000,
    warmupMs = 1500,
    initialStreams = 3,
    maxStreams = 6,
    payloadChunkSize = 4 * 1024 * 1024, // 4 MB soft target per request
    signal,
    onProgress,
  } = options;

  const uploadUrl = `${workerUrl.replace(/\/$/, "")}/upload`;
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

  let targetStreams = initialStreams;

  // Dedicated upload stream worker. Each request streams a body whose pull()
  // hands the transport 128KB at a time, counting `sent` incrementally.
  async function uploadWorker(streamId: number) {
    try {
      while (!internalController.signal.aborted) {
        const remainingTime = durationMs - (performance.now() - startTime);
        if (remainingTime <= 0) break;

        let sent = 0;
        const body = new ReadableStream<Uint8Array>({
          pull(controller) {
            // Stop handing bytes when the test ends or this request hits its target
            if (internalController.signal.aborted || sent >= payloadChunkSize) {
              controller.close();
              return;
            }
            if (!sendBuffer) {
              sendBuffer = new Uint8Array(SEND_CHUNK_SIZE);
            }
            controller.enqueue(sendBuffer);
            sent += SEND_CHUNK_SIZE;
          },
        });

        try {
          // The type assertion avoids an excess-property check on `duplex`, which
          // undici requires for streaming request bodies. Works in browser + Node.
          const init = {
            method: "POST",
            headers: {
              "Content-Type": "application/octet-stream",
            },
            body,
            duplex: "half",
            cache: "no-store",
            signal: internalController.signal,
          } as RequestInit;
          const res = await fetch(`${uploadUrl}?s=${streamId}&_t=${Date.now()}`, init);
          // Credit the bytes actually handed to the transport this request
          totalBytesTransferred += sent;
          if (!res.ok) {
            break;
          }
        } catch (err: unknown) {
          // AbortError means the test duration elapsed while this request was in
          // flight — still credit the bytes the transport already consumed.
          totalBytesTransferred += sent;
          if ((err as Error)?.name !== "AbortError") {
            console.warn(`[SpeedTest Engine] Upload stream #${streamId} encountered error:`, err);
          }
          break;
        }
      }
    } finally {
      // no-op; stream scaling tracks targetStreams externally
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
  for (let i = 0; i < targetStreams; i++) {
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

      // Smooth the display speed; decay toward 0 during stalls so the gauge
      // doesn't freeze at a stale high value while the link is idle.
      if (rollingMbps > 0) {
        currentSmoothedMbps = calculateEMA(rollingMbps, currentSmoothedMbps, 0.4);
      } else {
        currentSmoothedMbps = calculateEMA(0, currentSmoothedMbps, 0.2);
      }

      // Collect post-warmup samples
      if (warmupPassed && rollingMbps > 0) {
        postWarmupMbpsSamples.push(rollingMbps);

        // Periodically probe loaded latency every 1500ms
        if (now - lastProbeTime > 1500) {
          lastProbeTime = now;
          probeLoadedLatency();
        }

        // Dynamically scale concurrency if bandwidth justifies it
        if (rollingMbps > 50 && targetStreams < 4) {
          uploadWorker(targetStreams++);
        } else if (rollingMbps > 200 && targetStreams < maxStreams) {
          uploadWorker(targetStreams++);
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

  // Final stable upload speed = exact ground-truth bytes/duration over the
  // post-warmup window. No trimmed-mean blend: the trimmed mean removes the slow
  // tail that a sustained average must include, biasing results upward.
  const finalTime = performance.now();
  const postWarmupBytes = Math.max(0, totalBytesTransferred - bytesAtWarmupEnd);
  const postWarmupDurationSec = Math.max(0.1, (finalTime - warmupEndTime) / 1000);

  const finalMbps = calculateSpeedMbps(postWarmupBytes, postWarmupDurationSec);
  const finalReportedMbps = finalMbps > 0
    ? Number(finalMbps.toFixed(1))
    : currentSmoothedMbps;

  // Compute average loaded latency
  const avgLoadedLatency = loadedLatencySamples.length > 0
    ? Math.round(loadedLatencySamples.reduce((a, b) => a + b, 0) / loadedLatencySamples.length)
    : undefined;

  return {
    currentMbps: finalReportedMbps,
    bytesTransferred: totalBytesTransferred,
    elapsedMs: Math.round(performance.now() - startTime),
    finalMbps: finalReportedMbps,
    loadedLatencyMs: avgLoadedLatency,
    samples: postWarmupMbpsSamples,
  };
}