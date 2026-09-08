import {
  SpeedTestServer,
  ServerSelectionResult,
} from "./server-registry";
import { buildPingUrl, detectServerBackend } from "./server-endpoints";

export type { ServerSelectionResult };

export interface ServerSelectionOptions {
  servers: SpeedTestServer[];
  /** Number of latency probes per candidate server (default 4). */
  probeCount?: number;
  /** Per-probe timeout in ms (default 2500). */
  probeTimeoutMs?: number;
  /** Delay between probes on the same server in ms (default 80). */
  delayBetweenMs?: number;
  signal?: AbortSignal;
  /** Progress callback for UI during discovery/latency testing. */
  onStatus?: (status: string) => void;
}

export interface LatencyProbeResult {
  server: SpeedTestServer;
  latencyMs: number;
  probeCount: number;
  healthy: boolean;
}

/**
 * Runs `probeCount` latency probes against a single server and returns the
 * average RTT. Unreachable servers return latencyMs = Infinity and healthy = false.
 */
export async function probeServerLatency(
  server: SpeedTestServer,
  probeCount = 4,
  probeTimeoutMs = 2500,
  delayBetweenMs = 80,
  signal?: AbortSignal
): Promise<LatencyProbeResult> {
  const backend = detectServerBackend(server);
  const pingBaseUrl = buildPingUrl(server.baseUrl, backend);
  const samples: number[] = [];

  for (let i = 0; i < probeCount; i++) {
    if (signal?.aborted) {
      throw new DOMException("Server selection aborted", "AbortError");
    }

    // Per-probe timeout so a hanging server doesn't stall discovery.
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), probeTimeoutMs);
    const onExternalAbort = () => timeoutController.abort();
    signal?.addEventListener("abort", onExternalAbort, { once: true });

    const start = performance.now();
    try {
      const res = await fetch(`${pingBaseUrl}?_t=${Date.now()}_${i}`, {
        cache: "no-store",
        signal: timeoutController.signal,
      });
      if (res.ok) {
        await res.text();
        samples.push(performance.now() - start);
      }
    } catch {
      // A single failed probe is tolerated; only a full sweep marks the server dead.
    } finally {
      clearTimeout(timeoutId);
      signal?.removeEventListener("abort", onExternalAbort);
    }

    if (i < probeCount - 1 && delayBetweenMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenMs));
    }
  }

  if (samples.length === 0) {
    return { server, latencyMs: Infinity, probeCount: 0, healthy: false };
  }

  const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
  return {
    server,
    latencyMs: Number(avg.toFixed(1)),
    probeCount: samples.length,
    healthy: true,
  };
}

export interface ServerSelectionDetail extends ServerSelectionResult {
  /** All healthy servers ranked by latency (for failover). */
  ranked: ServerSelectionResult[];
}

/**
 * Probes all candidate servers concurrently and returns them ranked by measured
 * latency (not geography). Failed servers are discarded. If every server fails,
 * throws a descriptive error.
 */
export async function rankServersByLatency(
  options: ServerSelectionOptions
): Promise<ServerSelectionResult[]> {
  const {
    servers,
    probeCount = 4,
    probeTimeoutMs = 2500,
    delayBetweenMs = 80,
    signal,
    onStatus,
  } = options;

  if (!servers || servers.length === 0) {
    throw new Error("No test servers configured");
  }

  onStatus?.(`Probing ${servers.length} test server${servers.length > 1 ? "s" : ""}...`);

  const results = await Promise.all(
    servers.map((server) =>
      probeServerLatency(server, probeCount, probeTimeoutMs, delayBetweenMs, signal)
    )
  );

  const healthy = results
    .filter((r) => r.healthy)
    .sort((a, b) => a.latencyMs - b.latencyMs);

  if (healthy.length === 0) {
    throw new Error(
      "All test servers are unreachable. Check your network connection and try again."
    );
  }

  return healthy;
}

/**
 * Selects the best test server by measured latency. Convenience wrapper around
 * rankServersByLatency that also returns the ranked list for failover.
 */
export async function selectBestServer(
  options: ServerSelectionOptions
): Promise<ServerSelectionDetail> {
  const ranked = await rankServersByLatency(options);
  const best = ranked[0];

  return {
    server: best.server,
    latencyMs: best.latencyMs,
    probeCount: best.probeCount,
    ranked,
  };
}
