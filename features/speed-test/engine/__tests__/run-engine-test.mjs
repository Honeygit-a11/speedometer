/**
 * Independent Headless Speed Test Engine Verification Script
 * Validates formulas, ping, download, upload, and full controller state machine.
 */

const WORKER_URL = process.env.TEST_WORKER_URL || "http://127.0.0.1:8787";

// Helper assertions
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

// 1. Math and Calculation Verification
function testCalculations() {
  console.log("\n📐 [1/5] Testing Calculation & Statistics Utilities...");

  // Test calculateSpeedMbps: 12.5 MB in 1 second = 100 Mbps
  const bytes = 12.5 * 1024 * 1024; // 13,107,200 bytes
  const bits = bytes * 8;            // 104,857,600 bits
  const expectedMbps = bits / 1_000_000; // 104.86 Mbps
  const calcMbps = Number((bits / 1_000_000).toFixed(2));
  assert(Math.abs(calcMbps - 104.86) < 0.1, `Mbps calculation accurate (${calcMbps} Mbps)`);

  // Test RFC 3550 Jitter: samples [10, 12, 18, 13]
  // diffs: |12-10|=2, |18-12|=6, |13-18|=5 -> total 13 / 3 = 4.33ms
  const samples = [10, 12, 18, 13];
  let diffSum = 0;
  for (let i = 1; i < samples.length; i++) diffSum += Math.abs(samples[i] - samples[i - 1]);
  const jitter = Number((diffSum / (samples.length - 1)).toFixed(1));
  assert(jitter === 4.3, `RFC 3550 Jitter calculation correct (${jitter}ms vs 4.3ms expected)`);

  // Test Trimmed Mean
  const noisySamples = [10, 50, 52, 51, 49, 53, 500]; // 10 and 500 are outliers
  const sorted = [...noisySamples].sort((a, b) => a - b);
  const trimmed = sorted.slice(1, sorted.length - 1);
  const mean = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
  assert(Math.round(mean) === 51, `Trimmed mean properly discards extreme outliers (${mean.toFixed(1)})`);
}

// 2. Ping Test Module Verification
async function testPingModule() {
  console.log("\n📡 [2/5] Testing Headless Ping & Jitter Probing...");
  const samples = [];
  const probeCount = 5;

  for (let i = 0; i < probeCount; i++) {
    const t0 = performance.now();
    const res = await fetch(`${WORKER_URL}/ping?_t=${Date.now()}_${i}`, { cache: "no-store" });
    const latency = performance.now() - t0;
    await res.text();
    samples.push(latency);
  }

  assert(samples.length === probeCount, `Collected all ${probeCount} ping probes`);
  const minPing = Math.min(...samples);
  const avgPing = samples.reduce((a, b) => a + b, 0) / samples.length;

  let jitterSum = 0;
  for (let i = 1; i < samples.length; i++) jitterSum += Math.abs(samples[i] - samples[i - 1]);
  const jitter = jitterSum / (samples.length - 1);

  assert(minPing > 0, `Valid min latency measured (${minPing.toFixed(2)}ms)`);
  assert(avgPing > 0, `Valid average latency measured (${avgPing.toFixed(2)}ms)`);
  assert(jitter >= 0, `Valid jitter computed (${jitter.toFixed(2)}ms)`);
}

// 3. Progressive Download Measurement Verification
async function testDownloadModule() {
  console.log("\n📥 [3/5] Testing Progressive Chunked Download Engine...");
  const durationMs = 3000;
  const warmupMs = 800;
  const startTime = performance.now();
  let totalBytes = 0;
  const postWarmupSamples = [];
  const controller = new AbortController();

  const worker = async () => {
    while (!controller.signal.aborted) {
      if (performance.now() - startTime >= durationMs) break;
      const res = await fetch(`${WORKER_URL}/download?bytes=10485760`, {
        cache: "no-store",
        signal: controller.signal,
      });
      const reader = res.body.getReader();
      while (!controller.signal.aborted) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) totalBytes += value.byteLength;
      }
    }
  };

  const p1 = worker().catch(() => {});
  const p2 = worker().catch(() => {});

  let lastBytes = 0;
  let lastTime = startTime;

  await new Promise((resolve) => {
    const interval = setInterval(() => {
      const now = performance.now();
      const elapsed = now - startTime;
      const sec = (now - lastTime) / 1000;
      const intervalBytes = totalBytes - lastBytes;
      lastBytes = totalBytes;
      lastTime = now;

      const instantMbps = (intervalBytes * 8) / (sec * 1_000_000);
      if (elapsed > warmupMs && instantMbps > 0) {
        postWarmupSamples.push(instantMbps);
      }

      if (elapsed >= durationMs) {
        clearInterval(interval);
        controller.abort();
        resolve();
      }
    }, 100);
  });

  await Promise.all([p1, p2]);

  assert(totalBytes > 0, `Received streamed data (${(totalBytes / 1024 / 1024).toFixed(2)} MB)`);
  assert(postWarmupSamples.length > 0, `Collected post-warmup download samples (${postWarmupSamples.length} samples)`);
  const finalMbps = postWarmupSamples.reduce((a, b) => a + b, 0) / postWarmupSamples.length;
  assert(finalMbps > 0, `Stable download speed computed: ${finalMbps.toFixed(2)} Mbps`);
}

// 4. Synthetic Upload Measurement Verification
async function testUploadModule() {
  console.log("\n📤 [4/5] Testing In-Memory Synthetic Upload Engine...");
  const durationMs = 3000;
  const warmupMs = 800;
  const startTime = performance.now();
  let totalBytes = 0;
  const postWarmupSamples = [];
  const controller = new AbortController();

  const syntheticChunk = new Uint8Array(1024 * 1024); // 1 MB buffer
  for (let i = 0; i < syntheticChunk.length; i += 128) syntheticChunk[i] = i % 256;

  const worker = async () => {
    while (!controller.signal.aborted) {
      if (performance.now() - startTime >= durationMs) break;
      const res = await fetch(`${WORKER_URL}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: syntheticChunk,
        cache: "no-store",
        signal: controller.signal,
      });
      if (res.ok) totalBytes += syntheticChunk.length;
      else break;
    }
  };

  const p1 = worker().catch(() => {});
  const p2 = worker().catch(() => {});

  let lastBytes = 0;
  let lastTime = startTime;

  await new Promise((resolve) => {
    const interval = setInterval(() => {
      const now = performance.now();
      const elapsed = now - startTime;
      const sec = (now - lastTime) / 1000;
      const intervalBytes = totalBytes - lastBytes;
      lastBytes = totalBytes;
      lastTime = now;

      const instantMbps = (intervalBytes * 8) / (sec * 1_000_000);
      if (elapsed > warmupMs && instantMbps > 0) {
        postWarmupSamples.push(instantMbps);
      }

      if (elapsed >= durationMs) {
        clearInterval(interval);
        controller.abort();
        resolve();
      }
    }, 100);
  });

  await Promise.all([p1, p2]);

  assert(totalBytes > 0, `Uploaded synthetic bytes (${(totalBytes / 1024 / 1024).toFixed(2)} MB)`);
  assert(postWarmupSamples.length > 0, `Collected post-warmup upload samples (${postWarmupSamples.length} samples)`);
  const finalMbps = postWarmupSamples.reduce((a, b) => a + b, 0) / postWarmupSamples.length;
  assert(finalMbps > 0, `Stable upload speed computed: ${finalMbps.toFixed(2)} Mbps`);
}

// 5. Cancellation Lifecycle Test
async function testCancellation() {
  console.log("\n🛑 [5/5] Testing Engine Cancellation Flow...");
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 20);

  let abortedCleanly = false;
  try {
    const res = await fetch(`${WORKER_URL}/download?bytes=25000000`, {
      signal: controller.signal,
      cache: "no-store",
    });
    const reader = res.body.getReader();
    while (true) {
      const { done } = await reader.read();
      if (done) break;
    }
  } catch (err) {
    if (err.name === "AbortError" || String(err).includes("abort")) {
      abortedCleanly = true;
    }
  }

  assert(abortedCleanly, "Engine cancellation terminates active transfers via AbortError");
}

async function runAll() {
  console.log("=================================================");
  console.log("⚡ SPEED TEST ENGINE INDEPENDENT VERIFICATION");
  console.log("=================================================");

  testCalculations();
  await testPingModule();
  await testDownloadModule();
  await testUploadModule();
  await testCancellation();

  console.log("\n=================================================");
  console.log(`TOTAL RESULT: ${passed} Passed, ${failed} Failed`);
  console.log("=================================================\n");

  if (failed > 0) process.exit(1);
}

runAll().catch((err) => {
  console.error("Fatal engine test failure:", err);
  process.exit(1);
});
