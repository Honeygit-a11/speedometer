import { isLoopbackUrl, type ServerBackend } from "./server-endpoints";

/**
 * Test server configuration and registry.
 *
 * Replaces the previous single-hardcoded-worker-URL design with a configurable
 * registry of test servers. The measurement engine never hardcodes a server;
 * it is handed a list (via the registry below or explicitly) and selects the
 * best one based on measured latency.
 *
 * Standard (Cloudflare Worker) endpoints:
 *   {baseUrl}/ping, /download, /upload
 *
 * LibreSpeed-compatible endpoints:
 *   {baseUrl}/empty (ping), /garbage (download), /empty POST (upload)
 */

export interface SpeedTestServer {
  id: string;
  name: string;
  region: string;
  baseUrl: string;
  /** API style — auto-detected from id/name when omitted. */
  backend?: ServerBackend;
  /** Disabled servers are excluded from discovery (default true). */
  enabled?: boolean;
  /** Lower = preferred. Used as a tiebreaker after measured latency. */
  priority?: number;
}

export interface ServerSelectionResult {
  server: SpeedTestServer;
  /** Average probe latency in ms, or Infinity if the server was unreachable. */
  latencyMs: number;
  /** Number of successful probes used to derive latencyMs. */
  probeCount: number;
}

function normalizeBaseUrl(baseUrl: string): string {
  let url = baseUrl.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return url;
}

function normalizeServer(input: Partial<SpeedTestServer>): SpeedTestServer | null {
  if (!input || typeof input.baseUrl !== "string" || input.baseUrl.trim() === "") {
    return null;
  }
  const server: SpeedTestServer = {
    id: input.id || `server-${input.baseUrl}`,
    name: input.name || "Edge Server",
    region: input.region || "auto",
    baseUrl: normalizeBaseUrl(input.baseUrl),
    enabled: input.enabled !== false,
  };
  if (input.backend === "librespeed" || input.backend === "standard") {
    server.backend = input.backend;
  }
  if (typeof input.priority === "number" && Number.isFinite(input.priority)) {
    server.priority = input.priority;
  }
  return server;
}

/**
 * Loopback servers measure machine-to-machine throughput, not ISP speed.
 * Exclude them in the browser unless explicitly allowed (local dev).
 */
export function filterServersForRuntime(
  servers: SpeedTestServer[],
  env?: NodeJS.ProcessEnv
): SpeedTestServer[] {
  // Disabled servers are never eligible, in any runtime.
  const enabled = servers.filter((s) => s.enabled !== false);

  const allowLocal =
    (env?.NEXT_PUBLIC_ALLOW_LOCAL_SERVERS ??
      process.env.NEXT_PUBLIC_ALLOW_LOCAL_SERVERS) === "true";
  if (allowLocal) return enabled;

  const isBrowser = typeof globalThis !== "undefined" && typeof globalThis.window !== "undefined";
  if (!isBrowser) return enabled;

  return enabled.filter((s) => !isLoopbackUrl(s.baseUrl));
}

/**
 * Resolves the configured list of test servers.
 *
 * Precedence:
 *   1. NEXT_PUBLIC_SPEEDTEST_SERVERS — JSON array of server objects.
 *   2. NEXT_PUBLIC_SPEEDTEST_WORKER_URL — Cloudflare Worker (recommended for ISP speed).
 *   3. NEXT_PUBLIC_LIBRESPEED_URL — LibreSpeed / Railway backend (remote only for accuracy).
 *   4. Local fallback (worker on 8787, then LibreSpeed on 8888).
 */
export function getServerList(env?: NodeJS.ProcessEnv): SpeedTestServer[] {
  let servers: SpeedTestServer[] = [];

  const raw =
    env?.NEXT_PUBLIC_SPEEDTEST_SERVERS ??
    process.env.NEXT_PUBLIC_SPEEDTEST_SERVERS;
  if (raw && raw.trim() !== "") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        servers = parsed
          .map((entry) => normalizeServer(entry as Partial<SpeedTestServer>))
          .filter((s): s is SpeedTestServer => s !== null);
      }
    } catch (err) {
      console.warn("[SpeedTest] Invalid NEXT_PUBLIC_SPEEDTEST_SERVERS JSON:", err);
    }
  }

  if (servers.length === 0) {
    const workerUrl =
      env?.NEXT_PUBLIC_SPEEDTEST_WORKER_URL ??
      process.env.NEXT_PUBLIC_SPEEDTEST_WORKER_URL;
    if (workerUrl && workerUrl.trim() !== "") {
      servers = [
        {
          id: "default",
          name: "Primary Edge",
          region: "auto",
          baseUrl: normalizeBaseUrl(workerUrl),
          backend: "standard",
        },
      ];
    }
  }

  if (servers.length === 0) {
    const librespeedUrl =
      env?.NEXT_PUBLIC_LIBRESPEED_URL ??
      process.env.NEXT_PUBLIC_LIBRESPEED_URL;
    if (librespeedUrl && librespeedUrl.trim() !== "") {
      servers = [
        {
          id: "librespeed-primary",
          name: "LibreSpeed Backend",
          region: "remote",
          baseUrl: normalizeBaseUrl(librespeedUrl),
          backend: "librespeed",
        },
      ];
    }
  }

  if (servers.length === 0) {
    servers = [
      {
        id: "worker-local",
        name: "Local Edge Worker",
        region: "local",
        baseUrl: "http://127.0.0.1:8787",
        backend: "standard",
      },
      {
        id: "librespeed-local",
        name: "LibreSpeed Backend (Local)",
        region: "local",
        baseUrl: "http://127.0.0.1:8888",
        backend: "librespeed",
      },
    ];
  }

  return filterServersForRuntime(servers, env);
}
