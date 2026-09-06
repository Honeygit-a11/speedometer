import { PingMetrics, JitterMetrics } from "@/types";
import { analyzeJitter } from "./jitter";

export interface PingTestOptions {
  workerUrl: string;
  sampleCount?: number;
  delayBetweenMs?: number;
  signal?: AbortSignal;
  onProbe?: (currentPing: number, stats: { min: number; avg: number; jitter: number }) => void;
}

export interface PingTestResult {
  ping: PingMetrics;
  jitter: JitterMetrics;
}

/**
 * Executes multi-sample latency testing against the worker /ping endpoint.
 */
export async function runPingTest(options: PingTestOptions): Promise<PingTestResult> {
  const {
    workerUrl,
    sampleCount = 6,
    delayBetweenMs = 120,
    signal,
    onProbe,
  } = options;

  const pingUrl = `${workerUrl.replace(/\/$/, "")}/ping`;
  const samples: number[] = [];

  for (let i = 0; i < sampleCount; i++) {
    if (signal?.aborted) {
      throw new DOMException("Ping test aborted by user", "AbortError");
    }

    const start = performance.now();
    try {
      // Add timestamp query param to completely bust any intermediate browser or proxy cache
      const probeRes = await fetch(`${pingUrl}?_t=${Date.now()}_${i}`, {
        method: "GET",
        cache: "no-store",
        signal,
      });

      if (!probeRes.ok) {
        throw new Error(`Ping probe failed with status: ${probeRes.status}`);
      }

      // Consume response
      await probeRes.text();
      const latency = Math.max(1, performance.now() - start);
      samples.push(latency);

      const analysis = analyzeJitter(samples);
      if (onProbe) {
        onProbe(Number(latency.toFixed(1)), {
          min: analysis.minPingMs,
          avg: analysis.avgPingMs,
          jitter: analysis.jitterMs,
        });
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") {
        throw err;
      }
      // If one probe fails, log and continue if we have at least one sample
      console.warn(`[SpeedTest Engine] Ping probe #${i + 1} error:`, err);
    }

    if (i < sampleCount - 1 && delayBetweenMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenMs));
    }
  }

  if (samples.length === 0) {
    throw new Error("All ping probes failed. Check network connection or worker endpoint.");
  }

  const finalAnalysis = analyzeJitter(samples);

  return {
    ping: {
      currentPing: samples[samples.length - 1],
      minPing: finalAnalysis.minPingMs,
      avgPing: finalAnalysis.avgPingMs,
      samples,
    },
    jitter: {
      jitter: finalAnalysis.jitterMs,
    },
  };
}
