/**
 * Phase 6: Security and Abuse Protection Verification Script
 * Validates method restrictions, payload caps, rate limiting, and CORS headers.
 */

const BASE_URL = process.env.TEST_WORKER_URL || "http://127.0.0.1:8787";

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

// 1. Method Enforcement Tests
async function testMethodEnforcement() {
  console.log("\n🚫 [1/5] Testing HTTP Method Enforcement...");

  // DELETE /ping -> 405
  try {
    const res = await fetch(`${BASE_URL}/ping`, { method: "DELETE" });
    assert(res.status === 405, `DELETE /ping returns 405 Method Not Allowed (got ${res.status})`);
    assert(res.headers.get("allow")?.includes("GET"), "Allow header indicates supported methods");
  } catch (err) {
    assert(false, `DELETE /ping failed: ${err.message}`);
  }

  // PUT /download -> 405
  try {
    const res = await fetch(`${BASE_URL}/download`, { method: "PUT" });
    assert(res.status === 405, `PUT /download returns 405 Method Not Allowed (got ${res.status})`);
  } catch (err) {
    assert(false, `PUT /download failed: ${err.message}`);
  }

  // GET /upload -> 405
  try {
    const res = await fetch(`${BASE_URL}/upload`, { method: "GET" });
    assert(res.status === 405, `GET /upload returns 405 Method Not Allowed (got ${res.status})`);
  } catch (err) {
    assert(false, `GET /upload failed: ${err.message}`);
  }
}

// 2. Payload Bounds and Upload Protection
async function testPayloadBounds() {
  console.log("\n📦 [2/5] Testing Payload Size Limits & Abuse Guards...");

  // Upload exceeding max_bytes limit
  try {
    const testPayload = new Uint8Array(2 * 1024 * 1024); // 2 MB
    const res = await fetch(`${BASE_URL}/upload?max_bytes=1048576`, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: testPayload,
    });
    assert(res.status === 413, `Oversized upload rejected with 413 Payload Too Large (got ${res.status})`);
  } catch (err) {
    assert(false, `Payload limit test failed: ${err.message}`);
  }
}

// 3. Unknown Route Rejection
async function testUnknownRoutes() {
  console.log("\n🔍 [3/5] Testing Unknown Path Handling...");

  try {
    const res = await fetch(`${BASE_URL}/invalid-random-path`);
    assert(res.status === 404, `Unknown route returns 404 Not Found (got ${res.status})`);
  } catch (err) {
    assert(false, `Unknown route test failed: ${err.message}`);
  }
}

// 4. Security Headers Verification
async function testSecurityHeaders() {
  console.log("\n🛡️  [4/5] Testing Security Headers & CORS...");

  try {
    const res = await fetch(`${BASE_URL}/ping`);
    assert(res.headers.get("x-content-type-options") === "nosniff", "X-Content-Type-Options: nosniff present");
    assert(res.headers.get("x-frame-options") === "DENY", "X-Frame-Options: DENY present");
    assert(res.headers.get("access-control-allow-origin") !== null, "Access-Control-Allow-Origin header present");
  } catch (err) {
    assert(false, `Security headers test failed: ${err.message}`);
  }
}

// 5. Origin Whitelist & Preflight
async function testOriginValidation() {
  console.log("\n🌐 [5/5] Testing CORS Preflight Handling...");

  try {
    const res = await fetch(`${BASE_URL}/download`, {
      method: "OPTIONS",
      headers: {
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "GET",
      },
    });
    assert(res.status === 204, "Preflight OPTIONS returns 204 No Content");
    assert(res.headers.get("access-control-allow-methods")?.includes("GET"), "Allows GET in preflight");
  } catch (err) {
    assert(false, `CORS preflight failed: ${err.message}`);
  }
}

async function runAll() {
  console.log("=================================================");
  console.log("🔒 PHASE 6: SECURITY & ABUSE PROTECTION AUDIT");
  console.log("=================================================");

  await testMethodEnforcement();
  await testPayloadBounds();
  await testUnknownRoutes();
  await testSecurityHeaders();
  await testOriginValidation();

  console.log("\n=================================================");
  console.log(`SECURITY AUDIT RESULT: ${passed} Passed, ${failed} Failed`);
  console.log("=================================================\n");

  if (failed > 0) process.exit(1);
}

runAll().catch((err) => {
  console.error("Fatal security test error:", err);
  process.exit(1);
});
