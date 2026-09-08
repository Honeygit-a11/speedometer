import { buildGetIpUrl } from "./server-endpoints";

/**
 * Client identity surfaced Fast.com-style (public IP / ISP / region). Purely
 * informational and optional — a failed lookup never fails the test.
 */
export interface ClientIdentity {
  ip?: string;
  isp?: string;
  country?: string;
}

const EMPTY: ClientIdentity = {};

/**
 * Queries the selected server's /getIP endpoint for the client's public
 * identity. Returns null on any failure so the caller can render nothing
 * rather than a fabricated identity.
 */
export async function fetchClientIdentity(
  baseUrl: string,
  timeoutMs = 2500,
  signal?: AbortSignal
): Promise<ClientIdentity | null> {
  try {
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);
    const onExternalAbort = () => timeoutController.abort();
    signal?.addEventListener("abort", onExternalAbort, { once: true });

    try {
      const res = await fetch(buildGetIpUrl(baseUrl), {
        cache: "no-store",
        signal: timeoutController.signal,
      });
      if (!res.ok) return null;
      const data = (await res.json()) as ClientIdentity;
      if (!data.ip) return EMPTY;
      return data;
    } finally {
      clearTimeout(timeoutId);
      signal?.removeEventListener("abort", onExternalAbort);
    }
  } catch {
    return null;
  }
}
