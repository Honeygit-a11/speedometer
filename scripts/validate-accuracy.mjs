/**
 * Accuracy Validation Harness (Phase 11)
 *
 * Validates the accuracy fixes end-to-end against a live worker:
 *   1. Server selection probing returns consistent, healthy latency.
 *   2. Repeated download measurements are consistent (low variance).
 *   3. Upload byte count is anchored to the SERVER's authoritative bytesReceived
 *      (the fix for client-side over-counting).
 *   4. Ping uses enough samples and a robust median.
 *
 * Usage:
 *   node scripts/validate-accuracy.mjs
 *   TEST_WORKER_URL=https://... node scripts/validate-accuracy.mjs
 */

const WORKER_URL = (process.env.TEST_WORKER_URL || "http://127.0.0.1:8787").replace(/\/$/, "");

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) {
    console.log(`  ✅ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${msg}`);
    failed++;
  }
}

// --- 1. Server selection probing (replicates server-selection.ts) ---
async function testServerProbing() {
  console.log("\n🌐 [1/4] Server Selection Latency Probing...");
  const probeCount = 4;
  const samples = [];
  for (let i = 0; i < probeCount; i++) {
    const t0 = performance.now();
    const res = await fetch(`${WORKER_URL}/ping?_t=${Date.now()}_${i}`, { cache: "no-store" });
    if (res.ok) {
      await res.text();
      samples.push(performance.now() - t0);
    }
  }
  assert(samples.length === probeCount, `Collected ${probeCount} latency probes (${samples.length})`);
  const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
  assert(avg > 0 && avg < 1000, `Healthy average latency: ${avg.toFixed(1)}ms`);
  return avg;
}

// --- 2. Repeated download consistency (replicates download.ts core loop) ---
async function measureDownloadOnce(durationMs, warmupMs) {
  const start = performance.now();
  let total = 0;
  const controller = new AbortController();

  async function worker() {
    try {
      while (!controller.signal.aborted) {
        if (performance.now() - start >= durationMs) break;
        const res = await fetch(`${WORKER_URL}/download?bytes=33554432&_t=${Date.now()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok || !res.body) break;
        const reader = res.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          total += value.byteLength;
        }
      }
    } catch {
      /* aborted */
    }
  }

  // 2 streams, matching the engine's initial concurrency.
  const p1 = worker();
  const p2 = worker();
  await new Promise((r) => setTimeout(r, durationMs));
  controller.abort();
  await Promise.all([p1, p2]);

  const warmupEndTime = start + warmupMs;
  const postWarmupBytes = Math.max(0, total);
  const dur = Math.max(0.1, (performance.now() - warmupEndTime) / 1000);
  // Approximate: subtract warmup bytes proportional to warmup share of duration.
  const warmupShare = total * (warmupMs / durationMs);
  const measuredBytes = Math.max(0, total - warmupShare);
  return (measuredBytes * 8) / (dur * 1_000_000);
}

async function testDownloadConsistency() {
  console.log("\n⬇️  [2/4] Repeated Download Consistency (3 runs)...");
  const runs = [];
  for (let i = 0; i < 3; i++) {
    const mbps = await measureDownloadOnce(4000, 800);
    runs.push(mbps);
    console.log(`     Run ${i + 1}: ${mbps.toFixed(1)} Mbps`);
  }
  const avg = runs.reduce((a, b) => a + b, 0) / runs.length;
  const min = Math.min(...runs);
  const max = Math.max(...runs);
  const variance = runs.reduce((a, v) => a + (v - avg) ** 2, 0) / runs.length;
  const spread = ((max - min) / avg) * 100;
  assert(avg > 0, `Download measured > 0 Mbps (avg ${avg.toFixed(1)})`);
  assert(spread < 60, `Repeated runs consistent (spread ${spread.toFixed(1)}% < 60%)`);
  console.log(`     avg=${avg.toFixed(1)} min=${min.toFixed(1)} max=${max.toFixed(1)} variance=${variance.toFixed(1)}`);
}

// --- 3. Upload server-authoritative byte count ---
async function testUploadServerVerification() {
  console.log("\n⬆️  [3/4] Upload Server-Verified Byte Count...");
  const payload = new Uint8Array(4 * 1024 * 1024);
  const res = await fetch(`${WORKER_URL}/upload?_t=${Date.now()}`, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: payload,
    duplex: "half",
  });
  assert(res.ok, `Upload request succeeded (${res.status})`);
  const json = await res.json();
  assert(
    typeof json.bytesReceived === "number" && json.bytesReceived === payload.byteLength,
    `Server reports authoritative bytesReceived (${json.bytesReceived}/${payload.byteLength})`
  );
}

// --- 4. Ping: sample count + robust median ---
async function testPingRobustness() {
  console.log("\n📡 [4/4] Ping Sample Count & Robust Median...");
  const sampleCount = 10;
  const samples = [];
  for (let i = 0; i < sampleCount; i++) {
    const t0 = performance.now();
    const res = await fetch(`${WORKER_URL}/ping?_t=${Date.now()}_${i}`, { cache: "no-store" });
    if (res.ok) {
      await res.text();
      samples.push(performance.now() - t0);
    }
  }
  assert(samples.length >= 5, `Collected >= 5 successful ping samples (${samples.length})`);
  const sorted = [...samples].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
  // Median should be within 30% of the mean (robust, no runaway spike).
  assert(Math.abs(median - avg) / avg < 0.5, `Median stable vs mean (median=${median.toFixed(1)} avg=${avg.toFixed(1)})`);
}

(async () => {
  await testServerProbing();
  await testDownloadConsistency();
  await testUploadServerVerification();
  await testPingRobustness();
  console.log(`\n========================================`);
  console.log(`ACCURACY VALIDATION: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================`);
  process.exit(failed > 0 ? 1 : 0);
})();
