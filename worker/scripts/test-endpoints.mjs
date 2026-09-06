/**
 * Independent Endpoint Verification Test Script
 * Runs tests against the Cloudflare Worker endpoints.
 */

const BASE_URL = process.env.TEST_WORKER_URL || "http://127.0.0.1:8787";

async function runTests() {
  console.log(`\n🚀 Starting Speed Test Endpoint Verification against: ${BASE_URL}\n`);
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // TEST 1: Health Check
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    assert(res.status === 200, "Health check responds with 200");
    assert(data.status === "healthy", "Health check status is 'healthy'");
    assert(res.headers.get("access-control-allow-origin") !== null, "CORS origin header present");
  } catch (err) {
    assert(false, `Health check failed: ${err.message}`);
  }

  // TEST 2: CORS Preflight
  try {
    const res = await fetch(`${BASE_URL}/ping`, {
      method: "OPTIONS",
      headers: {
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "GET",
      },
    });
    assert(res.status === 204, "OPTIONS preflight returns 204 No Content");
    assert(res.headers.get("access-control-allow-methods")?.includes("GET"), "Allows GET method in CORS");
    assert(res.headers.get("access-control-allow-origin") !== null, "CORS allow origin returned in preflight");
  } catch (err) {
    assert(false, `CORS preflight test failed: ${err.message}`);
  }

  // TEST 3: Ping Endpoint
  try {
    const t0 = performance.now();
    const res = await fetch(`${BASE_URL}/ping`, {
      cache: "no-store",
    });
    const roundTrip = performance.now() - t0;
    const data = await res.json();
    assert(res.status === 200, "GET /ping returns 200 OK");
    assert(data.status === "ok", "GET /ping body status is 'ok'");
    assert(typeof data.timestamp === "number", "GET /ping returns valid timestamp");
    assert(res.headers.get("cache-control")?.includes("no-store"), "Ping enforces cache-control: no-store");
    console.log(`     (Round trip latency: ${roundTrip.toFixed(2)}ms)`);
  } catch (err) {
    assert(false, `Ping test failed: ${err.message}`);
  }

  // TEST 4: Download Streaming Endpoint
  try {
    const testBytes = 2 * 1024 * 1024; // 2 MB
    const t0 = performance.now();
    const res = await fetch(`${BASE_URL}/download?bytes=${testBytes}`, {
      cache: "no-store",
    });
    assert(res.status === 200, "GET /download returns 200 OK");
    assert(res.headers.get("content-type") === "application/octet-stream", "Content-Type is application/octet-stream");
    const hasLength = res.headers.get("content-length") === testBytes.toString() ||
                      res.headers.get("x-content-length") === testBytes.toString();
    assert(hasLength, `Content length header matches requested size (${testBytes})`);

    const reader = res.body.getReader();
    let totalReceived = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) totalReceived += value.byteLength;
    }
    const duration = (performance.now() - t0) / 1000;
    const mbps = (totalReceived * 8) / (duration * 1000 * 1000);

    assert(totalReceived === testBytes, `Downloaded exactly ${testBytes} bytes (received ${totalReceived})`);
    console.log(`     (Transferred: ${(totalReceived / 1024 / 1024).toFixed(2)}MB in ${duration.toFixed(3)}s -> ${mbps.toFixed(2)} Mbps)`);
  } catch (err) {
    assert(false, `Download test failed: ${err.message}`);
  }

  // TEST 5: Download Abort / Cancellation
  try {
    const testBytes = 10 * 1024 * 1024; // 10 MB
    const controller = new AbortController();
    const fetchPromise = fetch(`${BASE_URL}/download?bytes=${testBytes}`, {
      signal: controller.signal,
    });

    // Abort after 50ms
    setTimeout(() => controller.abort(), 50);

    try {
      const res = await fetchPromise;
      const reader = res.body.getReader();
      while (true) {
        const { done } = await reader.read();
        if (done) break;
      }
      assert(false, "Download stream should have aborted");
    } catch (e) {
      assert(e.name === "AbortError", "Client download cancellation handled cleanly via AbortError");
    }
  } catch (err) {
    assert(false, `Download abort test failed: ${err.message}`);
  }

  // TEST 6: Upload Sink Endpoint (Zero Storage)
  try {
    const uploadBytes = 2 * 1024 * 1024; // 2 MB
    const payload = new Uint8Array(uploadBytes);
    for (let i = 0; i < uploadBytes; i++) payload[i] = i % 256;

    const t0 = performance.now();
    const res = await fetch(`${BASE_URL}/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
      },
      body: payload,
    });
    const duration = (performance.now() - t0) / 1000;
    const data = await res.json();

    assert(res.status === 200, "POST /upload returns 200 OK");
    assert(data.status === "ok", "POST /upload status is 'ok'");
    assert(data.bytesReceived === uploadBytes, `Upload sink received and verified ${data.bytesReceived} bytes`);
    const mbps = (uploadBytes * 8) / (duration * 1000 * 1000);
    console.log(`     (Uploaded: ${(uploadBytes / 1024 / 1024).toFixed(2)}MB in ${duration.toFixed(3)}s -> ${mbps.toFixed(2)} Mbps)`);
  } catch (err) {
    assert(false, `Upload test failed: ${err.message}`);
  }

  // TEST 7: Upload Oversize Protection (enforces max_bytes limit)
  try {
    const payloadBytes = 2 * 1024 * 1024; // 2 MB
    const payload = new Uint8Array(payloadBytes);
    const limitBytes = 1 * 1024 * 1024;   // 1 MB limit
    const res = await fetch(`${BASE_URL}/upload?max_bytes=${limitBytes}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
      },
      body: payload,
    });
    assert(res.status === 413, "POST /upload rejects payloads exceeding limit with 413 Payload Too Large");
  } catch (err) {
    assert(false, `Upload oversize protection test failed: ${err.message}`);
  }

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test runner encountered fatal error:", err);
  process.exit(1);
});
