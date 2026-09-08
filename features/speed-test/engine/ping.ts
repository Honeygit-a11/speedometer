import { PingMetrics, JitterMetrics } from "@/types";
import { analyzeJitter } from "./jitter";
import { buildPingUrl, detectServerBackend, type ServerBackend } from "./server-endpoints";
import type { SpeedTestServer } from "./server-registry";

export interface PingTestOptions {
  workerUrl: string;
  /** Server API style — auto-detected when server is provided. */
  backend?: ServerBackend;
  server?: SpeedTestServer;
  sampleCount?: number;
  delayBetweenMs?: number;
  /** Minimum successful probes required; below this the ping test fails. */
  minSuccessful?: number;
  signal?: AbortSignal;
  onProbe?: (currentPing: number, stats: { min: number; avg: number; median: number; jitter: number }) => void;
}

export interface PingTestResult {
  ping: PingMetrics;
  jitter: JitterMetrics;
}

/**
 * Executes multi-sample latency testing against the worker /ping endpoint.
 *
 * Each probe is a cache-busted GET; failed probes are ignored (not counted as
 * samples). A larger sample count than a single-shot ping yields a stable
 * median and a meaningful RFC 3550 jitter estimate.
 */
export async function runPingTest(options: PingTestOptions): Promise<PingTestResult> {
  const {
    workerUrl,
    backend: backendOverride,
    server,
    sampleCount = 10,
    delayBetweenMs = 120,
    minSuccessful = 5,
    signal,
    onProbe,
  } = options;

  const backend =
    backendOverride ?? (server ? detectServerBackend(server) : "standard");
  const pingBaseUrl = buildPingUrl(workerUrl, backend);
  const samples: number[] = [];

  for (let i = 0; i < sampleCount; i++) {
    if (signal?.aborted) {
      throw new DOMException("Ping test aborted by user", "AbortError");
    }

    const start = performance.now();
    try {
      // Timestamp query param busts any intermediate browser/proxy cache.
      const probeRes = await fetch(`${pingBaseUrl}?_t=${Date.now()}_${i}`, {
        method: "GET",
        cache: "no-store",
        signal,
      });

      if (!probeRes.ok) {
        throw new Error(`Ping probe failed with status: ${probeRes.status}`);
      }

      await probeRes.text();
      const latency = performance.now() - start;
      samples.push(latency);

      const analysis = analyzeJitter(samples);
      if (onProbe) {
        onProbe(Number(latency.toFixed(1)), {
          min: analysis.minPingMs,
          avg: analysis.avgPingMs,
          median: analysis.medianPingMs,
          jitter: analysis.jitterMs,
        });
      }
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") {
        throw err;
      }
      // A failed probe is skipped; we keep probing as long as some succeed.
      console.warn(`[SpeedTest Engine] Ping probe #${i + 1} error:`, err);
    }

    if (i < sampleCount - 1 && delayBetweenMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenMs));
    }
  }

  if (samples.length === 0) {
    throw new Error("All ping probes failed. Check network connection or worker endpoint.");
  }

  if (samples.length < minSuccessful) {
    throw new Error(
      `Insufficient successful ping probes (${samples.length}/${sampleCount}). Network may be unstable.`
    );
  }

  const finalAnalysis = analyzeJitter(samples);

  return {
    ping: {
      currentPing: samples[samples.length - 1],
      minPing: finalAnalysis.minPingMs,
      avgPing: finalAnalysis.avgPingMs,
      medianPing: finalAnalysis.medianPingMs,
      samples,
    },
    jitter: {
      jitter: finalAnalysis.jitterMs,
    },
  };
}
