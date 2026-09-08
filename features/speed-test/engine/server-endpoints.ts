/** Measurement API style: Cloudflare worker vs LibreSpeed-compatible backend. */
export type ServerBackend = "standard" | "librespeed";

export interface ServerEndpointInfo {
  id: string;
  name: string;
  backend?: ServerBackend;
}

/**
 * Fetch with an independent per-request timeout. The timeout's AbortController
 * is separate from the caller's external `signal`: either the timeout or an
 * external abort can cancel the request, and cleanup is always performed.
 */
export async function fetchWithTimeout(
  url: string | URL,
  timeoutMs: number,
  signal?: AbortSignal,
  init?: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  const onExternalAbort = () => controller.abort();
  signal?.addEventListener("abort", onExternalAbort, { once: true });
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
    signal?.removeEventListener("abort", onExternalAbort);
  }
}

export function isLoopbackUrl(baseUrl: string): boolean {
  try {
    const hostname = new URL(baseUrl).hostname.toLowerCase();
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

export function detectServerBackend(server: ServerEndpointInfo): ServerBackend {
  if (server.backend === "librespeed" || server.backend === "standard") {
    return server.backend;
  }
  const id = server.id.toLowerCase();
  const name = server.name.toLowerCase();
  if (id.includes("librespeed") || name.includes("librespeed")) {
    return "librespeed";
  }
  return "standard";
}

export function getPingPath(backend: ServerBackend): string {
  return backend === "librespeed" ? "/empty" : "/ping";
}

/** Both backend families expose a /getIP endpoint for identity/geo lookup. */
export function buildGetIpUrl(baseUrl: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  return `${base}/getIP?_t=${Date.now()}`;
}

/** Health/liveness endpoint. Only the standard worker exposes /health. */
export function getHealthPath(backend: ServerBackend): string | null {
  return backend === "librespeed" ? null : "/health";
}

export function buildHealthUrl(baseUrl: string, backend: ServerBackend): string | null {
  const path = getHealthPath(backend);
  if (!path) return null;
  const base = baseUrl.replace(/\/+$/, "");
  return `${base}${path}?_t=${Date.now()}`;
}

export function getDownloadPath(backend: ServerBackend): string {
  return backend === "librespeed" ? "/garbage" : "/download";
}

export function getUploadPath(backend: ServerBackend): string {
  return backend === "librespeed" ? "/empty" : "/upload";
}

export function buildPingUrl(baseUrl: string, backend: ServerBackend, suffix = ""): string {
  const base = baseUrl.replace(/\/+$/, "");
  return `${base}${getPingPath(backend)}${suffix}`;
}

export function buildDownloadUrl(
  baseUrl: string,
  backend: ServerBackend,
  chunkBytes: number,
  streamId: number
): string {
  const base = baseUrl.replace(/\/+$/, "");
  const ts = Date.now();
  if (backend === "librespeed") {
    const ckSizeMb = Math.min(100, Math.max(1, Math.round(chunkBytes / (1024 * 1024))));
    return `${base}${getDownloadPath(backend)}?ckSize=${ckSizeMb}&s=${streamId}&_t=${ts}`;
  }
  return `${base}${getDownloadPath(backend)}?bytes=${chunkBytes}&s=${streamId}&_t=${ts}`;
}

export function buildUploadUrl(baseUrl: string, backend: ServerBackend, streamId: number): string {
  const base = baseUrl.replace(/\/+$/, "");
  return `${base}${getUploadPath(backend)}?s=${streamId}&_t=${Date.now()}`;
}
