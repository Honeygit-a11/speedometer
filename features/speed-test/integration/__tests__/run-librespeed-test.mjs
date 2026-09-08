import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { LibreSpeedClient } from "../librespeed-client.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverScript = path.resolve(__dirname, "../../../../backend/server.js");
const TEST_PORT = 8890;
const SERVER_URL = `http://127.0.0.1:${TEST_PORT}`;

console.log("=================================================");
console.log("⚡ LIBRESPEED CLIENT & INTEGRATION TEST");
console.log("=================================================");

const proc = spawn(process.execPath, [serverScript], {
  env: { ...process.env, PORT: TEST_PORT.toString() },
  stdio: ["ignore", "pipe", "pipe"],
});

// Wait for backend to be ready
await new Promise((resolve) => {
  proc.stdout.on("data", (d) => {
    if (d.toString().includes("Running on")) resolve();
  });
});

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

try {
  const client = new LibreSpeedClient();
  const telemetryHistory = [];

  console.log("\n🧪 [1/3] Testing Full LibreSpeed Measurement Cycle...");
  const results = await client.runTest(
    {
      serverUrl: SERVER_URL,
      pingProbes: 5,
      downloadDurationMs: 2500,
      uploadDurationMs: 2500,
      warmupMs: 800,
      concurrency: 2,
    },
    (t) => telemetryHistory.push(t)
  );

  assert(results.ping > 0, `Ping measured (${results.ping}ms > 0)`);
  assert(results.downloadSpeed > 0, `Download speed measured (${results.downloadSpeed} Mbps > 0)`);
  assert(results.uploadSpeed > 0, `Upload speed measured (${results.uploadSpeed} Mbps > 0)`);
  assert(results.downloadBytes > 0, `Download bytes accounted (${(results.downloadBytes / (1024 * 1024)).toFixed(2)} MB)`);
  assert(results.uploadBytes > 0, `Upload bytes accounted (${(results.uploadBytes / (1024 * 1024)).toFixed(2)} MB)`);

  console.log("\n📡 [2/3] Validating Telemetry & Speedometer Streaming Events...");
  const hasPingTelemetry = telemetryHistory.some((t) => t.phase === "PING" && t.currentPing > 0);
  const hasDlTelemetry = telemetryHistory.some((t) => t.phase === "DOWNLOAD" && t.currentMbps > 0);
  const hasUlTelemetry = telemetryHistory.some((t) => t.phase === "UPLOAD" && t.currentMbps > 0);

  assert(hasPingTelemetry, "Received real-time Ping latency probes");
  assert(hasDlTelemetry, "Received real-time Download Mbps for Speedometer needle");
  assert(hasUlTelemetry, "Received real-time Upload Mbps for Speedometer needle");

  console.log("\n🛑 [3/3] Testing Test Cancellation & Stream Teardown...");
  const cancelClient = new LibreSpeedClient();
  let cancelledCleanly = false;

  const cancelPromise = cancelClient.runTest(
    {
      serverUrl: SERVER_URL,
      pingProbes: 10,
      downloadDurationMs: 10000,
      uploadDurationMs: 10000,
    },
    () => {}
  ).catch((err) => {
    if (err.name === "AbortError" || err.message.includes("aborted")) {
      cancelledCleanly = true;
    }
  });

  // Cancel after 300ms
  setTimeout(() => cancelClient.cancel(), 300);
  await cancelPromise;

  assert(cancelledCleanly, "Client cancellation cleanly terminates via AbortController");

} catch (err) {
  console.error("Test error:", err);
  failed++;
} finally {
  proc.kill("SIGKILL");
}

console.log("\n=================================================");
console.log(`TOTAL RESULT: ${passed} Passed, ${failed} Failed`);
console.log("=================================================");

if (failed > 0) {
  process.exit(1);
}
