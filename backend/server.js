import http from "node:http";
import crypto from "node:crypto";

const PORT = parseInt(process.env.PORT || "8888", 10);
const HOST = "0.0.0.0";

// Pre-allocate a 1MB buffer of random bytes for maximum download streaming throughput
const CHUNK_SIZE = 1024 * 1024; // 1 MB
const RANDOM_CHUNK = crypto.randomBytes(CHUNK_SIZE);

// Standard CORS and Cache-Control headers for LibreSpeed compatibility
function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, HEAD");
  res.setHeader("Access-Control-Allow-Headers", "Content-Encoding, Content-Type, Authorization, X-Requested-With, Range");
  res.setHeader("Access-Control-Expose-Headers", "Content-Length, Content-Range, Server-Timing, X-Bytes-Received");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0, s-maxage=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Connection", "keep-alive");
}

const server = http.createServer((req, res) => {
  setCorsHeaders(res);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname.replace(/\/+$/, "") || "/";

  // Root landing page for browser inspection
  if (pathname === "/") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>LibreSpeed Backend</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b132b; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: #1c2541; padding: 2.5rem; border-radius: 1.25rem; box-shadow: 0 20px 40px rgba(0,0,0,0.5); max-width: 520px; width: 90%; border: 1px solid rgba(6,182,212,0.2); }
    h1 { color: #06b6d4; margin: 0 0 0.5rem 0; font-size: 1.6rem; display: flex; align-items: center; justify-content: space-between; }
    .badge { background: #10b981; color: #022c22; font-size: 0.75rem; font-weight: 800; padding: 0.25rem 0.6rem; border-radius: 9999px; letter-spacing: 0.05em; }
    p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; margin-bottom: 1.5rem; }
    .endpoint { background: #0f172a; border: 1px solid #334155; border-radius: 0.5rem; padding: 0.6rem 0.9rem; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center; font-family: monospace; font-size: 0.85rem; }
    .method { color: #06b6d4; font-weight: bold; }
    .path { color: #e2e8f0; }
    .desc { color: #64748b; font-family: sans-serif; font-size: 0.8rem; }
    .btn { display: inline-block; margin-top: 1.2rem; background: #06b6d4; color: #0b132b; font-weight: bold; padding: 0.75rem 1.5rem; border-radius: 0.5rem; text-decoration: none; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <h1>LibreSpeed Backend <span class="badge">ONLINE</span></h1>
    <p>The speed test measurement server is active and listening on port 8888.</p>
    <div class="endpoint">
      <span><span class="method">GET</span> <span class="path">/empty</span></span>
      <span class="desc">Ping & Jitter</span>
    </div>
    <div class="endpoint">
      <span><span class="method">GET</span> <span class="path">/garbage</span></span>
      <span class="desc">Download Stream</span>
    </div>
    <div class="endpoint">
      <span><span class="method">POST</span> <span class="path">/empty</span></span>
      <span class="desc">Upload Sink</span>
    </div>
    <div class="endpoint">
      <span><span class="method">GET</span> <span class="path">/getIP</span></span>
      <span class="desc">Client IP</span>
    </div>
    <div class="endpoint">
      <span><span class="method">GET</span> <span class="path">/health</span></span>
      <span class="desc">Health Check</span>
    </div>
    <a class="btn" href="http://localhost:3000" target="_blank">Open Speedometer UI (Port 3000) &rarr;</a>
  </div>
</body>
</html>`);
    return;
  }

  // 1. Health check
  if (pathname === "/health") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ status: "healthy", service: "librespeed-backend", timestamp: Date.now() }));
    return;
  }

  // 2. Client IP & ISP lookup (/getIP or /getIP.php)
  if (pathname === "/getIP" || pathname === "/getIP.php") {
    const forwarded = req.headers["x-forwarded-for"];
    const clientIp = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.socket.remoteAddress || "127.0.0.1";
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      processedString: clientIp,
      rawIspInfo: ""
    }));
    return;
  }

  // 3. Ping / Jitter probe (/empty, /empty.php, /ping - GET/HEAD)
  if ((pathname === "/empty" || pathname === "/empty.php" || pathname === "/ping") && (req.method === "GET" || req.method === "HEAD")) {
    res.statusCode = 200;
    res.setHeader("Content-Length", "0");
    res.end();
    return;
  }

  // 4. Upload sink (/empty, /empty.php, /upload - POST)
  if ((pathname === "/empty" || pathname === "/empty.php" || pathname === "/upload") && req.method === "POST") {
    let bytesReceived = 0;

    req.on("data", (chunk) => {
      bytesReceived += chunk.length;
    });

    req.on("end", () => {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.setHeader("X-Bytes-Received", bytesReceived.toString());
      res.end(JSON.stringify({ status: "ok", bytesReceived }));
    });

    req.on("error", (err) => {
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 5. Download stream (/garbage, /garbage.php, /download - GET)
  if ((pathname === "/garbage" || pathname === "/garbage.php" || pathname === "/download") && req.method === "GET") {
    // ckSize query parameter in MB (default: 4 MB chunks up to 100 MB per request)
    const ckSizeParam = parseInt(url.searchParams.get("ckSize") || "4", 10);
    const ckSizeMb = Math.min(Math.max(Number.isFinite(ckSizeParam) ? ckSizeParam : 4, 1), 100);
    const totalBytes = ckSizeMb * 1024 * 1024;

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", "attachment; filename=random.dat");
    res.setHeader("Content-Length", totalBytes.toString());

    let sentBytes = 0;

    function sendNext() {
      while (sentBytes < totalBytes) {
        const remaining = totalBytes - sentBytes;
        const toWrite = Math.min(remaining, CHUNK_SIZE);
        const slice = toWrite === CHUNK_SIZE ? RANDOM_CHUNK : RANDOM_CHUNK.subarray(0, toWrite);
        sentBytes += toWrite;

        const canContinue = res.write(slice);
        if (!canContinue && sentBytes < totalBytes) {
          res.once("drain", sendNext);
          return;
        }
      }
      res.end();
    }

    req.on("close", () => {
      // Client aborted download stream; clean up
      res.destroy();
    });

    sendNext();
    return;
  }

  // 404 fallback
  res.statusCode = 404;
  res.setHeader("Content-Type", "text/plain");
  res.end("Not Found");
});

server.listen(PORT, HOST, () => {
  console.log(`[LibreSpeed Backend] Running on http://${HOST}:${PORT}`);
  console.log(`[LibreSpeed Backend] Endpoints: /empty, /garbage, /getIP, /health`);
});
