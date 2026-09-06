/**
 * Cloudflare Worker Speed Testing Infrastructure
 * Enhanced with Phase 6 Security and Abuse Protection:
 * - Dynamic origin CORS allowlisting
 * - Sliding-window rate limiting (180 requests/min)
 * - Bandwidth quota budgeting (500MB per 10 min per IP)
 * - Strict HTTP method enforcement (405 Method Not Allowed)
 * - Hard payload bounds (50MB cap, 413 Payload Too Large)
 * - Security headers (nosniff, frame-ancestors, cache-control)
 */

export interface Env {
  ALLOWED_ORIGINS?: string;
}

const DEFAULT_DOWNLOAD_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_DOWNLOAD_BYTES = 50 * 1024 * 1024;     // 50 MB
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;       // 50 MB
const CHUNK_SIZE = 64 * 1024;                    // 64 KB per stream chunk

// Reusable pre-allocated 64KB chunk to minimize allocation overhead
const REUSABLE_CHUNK = new Uint8Array(CHUNK_SIZE);
for (let i = 0; i < CHUNK_SIZE; i++) {
  REUSABLE_CHUNK[i] = i % 256;
}

// 1. Sliding Window Request Rate Limiter (Max 180 req / min per IP)
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 180;
const clientIpMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const client = clientIpMap.get(ip);

  if (!client || now > client.resetAt) {
    clientIpMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    if (clientIpMap.size > 5000) {
      for (const [k, v] of clientIpMap.entries()) {
        if (now > v.resetAt) clientIpMap.delete(k);
      }
    }
    return true;
  }

  if (client.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  client.count += 1;
  return true;
}

// 2. Sliding Window Bandwidth Quota Tracker (Max 500 MB per 10 min per IP)
const BANDWIDTH_WINDOW_MS = 10 * 60 * 1000;
const MAX_BANDWIDTH_BYTES = 500 * 1024 * 1024; // 500 MB
const ipBandwidthMap = new Map<string, { bytesUsed: number; resetAt: number }>();

function checkBandwidthQuota(ip: string, incomingBytes: number): boolean {
  const now = Date.now();
  const entry = ipBandwidthMap.get(ip);

  if (!entry || now > entry.resetAt) {
    ipBandwidthMap.set(ip, { bytesUsed: incomingBytes, resetAt: now + BANDWIDTH_WINDOW_MS });
    return true;
  }

  if (entry.bytesUsed + incomingBytes > MAX_BANDWIDTH_BYTES) {
    return false;
  }

  entry.bytesUsed += incomingBytes;
  return true;
}

function recordBandwidthUsage(ip: string, bytes: number) {
  const now = Date.now();
  const entry = ipBandwidthMap.get(ip);
  if (entry && now <= entry.resetAt) {
    entry.bytesUsed += bytes;
  } else {
    ipBandwidthMap.set(ip, { bytesUsed: bytes, resetAt: now + BANDWIDTH_WINDOW_MS });
  }
}

// 3. Security & CORS Headers Builder
function getSecurityHeaders(origin: string | null, allowedOriginsEnv?: string): HeadersInit {
  let allowOrigin = "*";

  if (origin) {
    // In local development or testing, permit localhost & 127.0.0.1
    const isLocalhost =
      origin.startsWith("http://localhost:") ||
      origin.startsWith("http://127.0.0.1:") ||
      origin === "http://localhost" ||
      origin === "http://127.0.0.1";

    if (isLocalhost) {
      allowOrigin = origin;
    } else if (allowedOriginsEnv) {
      const allowedList = allowedOriginsEnv.split(",").map((o) => o.trim());
      if (allowedList.includes(origin) || allowedList.includes("*")) {
        allowOrigin = origin;
      } else {
        allowOrigin = allowedList[0] || "*";
      }
    } else {
      allowOrigin = origin;
    }
  }

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, HEAD",
    "Access-Control-Allow-Headers": "Content-Type, Content-Length, Authorization, X-Requested-With",
    "Access-Control-Expose-Headers": "Content-Length, Content-Type, X-Content-Length, X-Speedtest-Timestamp",
    "Access-Control-Max-Age": "86400",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  };
}

export default {
  async fetch(request: Request, env: Env = {}): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    const securityHeaders = getSecurityHeaders(origin, env.ALLOWED_ORIGINS);

    // 1. CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: securityHeaders,
      });
    }

    const clientIp =
      request.headers.get("CF-Connecting-IP") ||
      request.headers.get("X-Forwarded-For") ||
      "127.0.0.1";

    // 2. Request Rate Limiting
    if (!checkRateLimit(clientIp)) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Maximum 180 requests per minute.",
          retryAfterSeconds: 60,
        }),
        {
          status: 429,
          headers: {
            ...securityHeaders,
            "Content-Type": "application/json",
            "Retry-After": "60",
          },
        }
      );
    }

    const path = url.pathname.replace(/\/$/, "");

    // 3. Health Endpoint
    if (path === "" || path === "/health") {
      if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
          status: 405,
          headers: { ...securityHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          service: "speedtest-worker",
          status: "healthy",
          security: "active",
          edgeTime: Date.now(),
        }),
        {
          status: 200,
          headers: {
            ...securityHeaders,
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    // 4. Ping Endpoint (Strict GET/HEAD only)
    if (path === "/ping" || path === "/api/ping") {
      if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response(JSON.stringify({ error: "Method Not Allowed. Use GET." }), {
          status: 405,
          headers: {
            ...securityHeaders,
            "Content-Type": "application/json",
            Allow: "GET, HEAD, OPTIONS",
          },
        });
      }

      return new Response(
        JSON.stringify({
          status: "ok",
          timestamp: Date.now(),
        }),
        {
          status: 200,
          headers: {
            ...securityHeaders,
            "Content-Type": "application/json",
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            Pragma: "no-cache",
            "X-Speedtest-Timestamp": Date.now().toString(),
          },
        }
      );
    }

    // 5. Download Streaming Endpoint (Strict GET/HEAD only)
    if (path === "/download" || path === "/api/download") {
      if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response(JSON.stringify({ error: "Method Not Allowed. Use GET." }), {
          status: 405,
          headers: {
            ...securityHeaders,
            "Content-Type": "application/json",
            Allow: "GET, HEAD, OPTIONS",
          },
        });
      }

      const requestedBytes = parseInt(url.searchParams.get("bytes") || "", 10);
      const totalBytes =
        isNaN(requestedBytes) || requestedBytes <= 0
          ? DEFAULT_DOWNLOAD_BYTES
          : Math.min(requestedBytes, MAX_DOWNLOAD_BYTES);

      // Bandwidth quota check
      if (!checkBandwidthQuota(clientIp, totalBytes)) {
        return new Response(
          JSON.stringify({
            error: "Bandwidth quota exceeded for this IP. Please wait 10 minutes.",
          }),
          {
            status: 429,
            headers: {
              ...securityHeaders,
              "Content-Type": "application/json",
              "Retry-After": "600",
            },
          }
        );
      }

      let bytesSent = 0;

      const stream = new ReadableStream({
        pull(controller) {
          if (bytesSent >= totalBytes) {
            controller.close();
            recordBandwidthUsage(clientIp, bytesSent);
            return;
          }

          const remaining = totalBytes - bytesSent;
          if (remaining >= CHUNK_SIZE) {
            controller.enqueue(REUSABLE_CHUNK);
            bytesSent += CHUNK_SIZE;
          } else {
            controller.enqueue(REUSABLE_CHUNK.subarray(0, remaining));
            bytesSent += remaining;
          }
        },
        cancel() {
          recordBandwidthUsage(clientIp, bytesSent);
        },
      });

      return new Response(stream, {
        status: 200,
        headers: {
          ...securityHeaders,
          "Content-Type": "application/octet-stream",
          "Content-Length": totalBytes.toString(),
          "X-Content-Length": totalBytes.toString(),
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          Pragma: "no-cache",
        },
      });
    }

    // 6. Upload Sink Endpoint (Strict POST only)
    if (path === "/upload" || path === "/api/upload") {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method Not Allowed. Use POST." }), {
          status: 405,
          headers: {
            ...securityHeaders,
            "Content-Type": "application/json",
            Allow: "POST, OPTIONS",
          },
        });
      }

      const paramLimit = parseInt(url.searchParams.get("max_bytes") || "", 10);
      const uploadLimit =
        !isNaN(paramLimit) && paramLimit > 0
          ? Math.min(paramLimit, MAX_UPLOAD_BYTES)
          : MAX_UPLOAD_BYTES;

      const contentLengthHeader = request.headers.get("content-length");
      if (contentLengthHeader && parseInt(contentLengthHeader, 10) > uploadLimit) {
        return new Response(
          JSON.stringify({
            error: `Payload Too Large. Maximum allowed size is ${uploadLimit} bytes.`,
          }),
          {
            status: 413,
            headers: {
              ...securityHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      if (!request.body) {
        return new Response(JSON.stringify({ error: "Empty request body" }), {
          status: 400,
          headers: {
            ...securityHeaders,
            "Content-Type": "application/json",
          },
        });
      }

      const startTime = performance.now();
      const reader = request.body.getReader();
      let totalBytesReceived = 0;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          if (value) {
            totalBytesReceived += value.byteLength;

            // Enforce maximum upload bound during streaming
            if (totalBytesReceived > uploadLimit) {
              await reader.cancel();
              return new Response(
                JSON.stringify({ error: `Upload exceeded ${uploadLimit} bytes limit` }),
                {
                  status: 413,
                  headers: {
                    ...securityHeaders,
                    "Content-Type": "application/json",
                  },
                }
              );
            }
            // Discard immediately — zero retention
          }
        }
      } catch (err) {
        return new Response(
          JSON.stringify({ error: "Failed to read upload stream", details: String(err) }),
          {
            status: 400,
            headers: {
              ...securityHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      recordBandwidthUsage(clientIp, totalBytesReceived);
      const durationMs = Math.max(1, performance.now() - startTime);

      return new Response(
        JSON.stringify({
          status: "ok",
          bytesReceived: totalBytesReceived,
          durationMs: Math.round(durationMs),
        }),
        {
          status: 200,
          headers: {
            ...securityHeaders,
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        }
      );
    }

    // 7. Fallback: 404 Not Found
    return new Response(JSON.stringify({ error: "Not Found", path }), {
      status: 404,
      headers: {
        ...securityHeaders,
        "Content-Type": "application/json",
      },
    });
  },
};
