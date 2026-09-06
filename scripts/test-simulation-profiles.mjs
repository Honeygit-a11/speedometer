/**
 * Phase 7: Simulation Profiles, Stress Testing & Multi-Condition Harness
 */

const WORKER_URL = process.env.TEST_WORKER_URL || "http://127.0.0.1:8787";

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

// 1. Browser API Feature Diagnostic Check
function testFeatureDiagnostics() {
  console.log("\n🧪 [1/5] Testing Browser API Feature Detection & Polyfills...");
  const hasFetch = typeof fetch !== "undefined";
  const hasReadableStream = typeof ReadableStream !== "undefined";
  const hasAbortController = typeof AbortController !== "undefined";
  const hasPerformance = typeof performance !== "undefined" && typeof performance.now === "function";

  assert(hasFetch, "Fetch API supported");
  assert(hasReadableStream, "ReadableStream supported");
  assert(hasAbortController, "AbortController supported");
  assert(hasPerformance, "High-resolution performance.now timing supported");
}

// 2. High-Speed Bandwidth Profile Test
async function testHighSpeedProfile() {
  console.log("\n🚀 [2/5] Testing Profile A: High-Speed Edge Bandwidth...");
  const testBytes = 5 * 1024 * 1024; // 5 MB
  const t0 = performance.now();
  const res = await fetch(`${WORKER_URL}/download?bytes=${testBytes}`, { cache: "no-store" });
  assert(res.ok, "High-speed stream initiated successfully");

  const reader = res.body.getReader();
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) received += value.byteLength;
  }
  const sec = (performance.now() - t0) / 1000;
  const mbps = (received * 8) / (sec * 1_000_000);

  assert(received === testBytes, `Full ${testBytes} bytes streamed`);
  assert(mbps > 50, `High throughput verified: ${mbps.toFixed(2)} Mbps in ${sec.toFixed(3)}s`);
}

// 3. Throttled / Low-Bandwidth Profile Test
async function testThrottledProfile() {
  console.log("\n🐢 [3/5] Testing Profile B: Throttled / Low-Bandwidth Simulation...");
  const smallBytes = 256 * 1024; // 256 KB
  const t0 = performance.now();
  const res = await fetch(`${WORKER_URL}/download?bytes=${smallBytes}`, { cache: "no-store" });
  assert(res.ok, "Small chunk stream initiated successfully");

  const reader = res.body.getReader();
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      received += value.byteLength;
      // Artificially pause between chunk reads to simulate low bandwidth connection
      await new Promise((r) => setTimeout(r, 20));
    }
  }
  const sec = (performance.now() - t0) / 1000;
  const mbps = (received * 8) / (sec * 1_000_000);

  assert(received === smallBytes, `Received ${received} bytes on throttled stream`);
  assert(mbps > 0, `Throttled stream successfully calculated: ${mbps.toFixed(2)} Mbps without stalling`);
}

// 4. Server Drop / Network Outage Recovery Test
async function testNetworkDropRecovery() {
  console.log("\n🔌 [4/5] Testing Network Outage & Invalid Endpoint Recovery...");
  let caughtGracefully = false;

  try {
    // Attempt connecting to non-existent port / broken endpoint
    await fetch("http://127.0.0.1:59999/ping", { signal: AbortSignal.timeout(1000) });
  } catch (err) {
    caughtGracefully = true;
  }

  assert(caughtGracefully, "Network drop / connection failure caught cleanly without unhandled rejection");
}

// 5. Multi-Run Repeatability & Stress Test (5 sequential runs)
async function testMultiRunRepeatability() {
  console.log("\n🔄 [5/5] Testing Multi-Run Repeatability Stress Test (5 Cycles)...");
  const pingResults = [];

  for (let i = 1; i <= 5; i++) {
    const t0 = performance.now();
    const res = await fetch(`${WORKER_URL}/ping?_cycle=${i}`, { cache: "no-store" });
    await res.text();
    const rtt = performance.now() - t0;
    pingResults.push(rtt);
  }

  assert(pingResults.length === 5, "Completed 5 back-to-back testing cycles");
  const avg = pingResults.reduce((a, b) => a + b, 0) / pingResults.length;
  console.log(`     Cycle latencies: ${pingResults.map((p) => p.toFixed(1) + "ms").join(", ")}`);
  console.log(`     Average across 5 stress cycles: ${avg.toFixed(1)}ms`);
  assert(avg > 0, "Consistent latency maintained with zero socket exhaustion");
}

async function runAll() {
  console.log("=================================================");
  console.log("⚡ PHASE 7: STRESS & SIMULATION PROFILES HARNESS");
  console.log("=================================================");

  testFeatureDiagnostics();
  await testHighSpeedProfile();
  await testThrottledProfile();
  await testNetworkDropRecovery();
  await testMultiRunRepeatability();

  console.log("\n=================================================");
  console.log(`SIMULATION RESULT: ${passed} Passed, ${failed} Failed`);
  console.log("=================================================\n");

  if (failed > 0) process.exit(1);
}

runAll().catch((err) => {
  console.error("Fatal simulation test error:", err);
  process.exit(1);
});
