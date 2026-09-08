import { buildGetIpUrl, fetchWithTimeout } from "./server-endpoints";

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
    const res = await fetchWithTimeout(buildGetIpUrl(baseUrl), timeoutMs, signal, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as ClientIdentity;
    if (!data.ip) return EMPTY;
    return data;
  } catch {
    return null;
  }
}
