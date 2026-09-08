import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverScript = path.resolve(__dirname, "../server.js");
const TEST_PORT = 8889;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

console.log("=================================================");
console.log("🚀 LIBRESPEED BACKEND ENDPOINTS VERIFICATION");
console.log("=================================================");

const proc = spawn(process.execPath, [serverScript], {
  env: { ...process.env, PORT: TEST_PORT.toString() },
  stdio: ["ignore", "pipe", "pipe"],
});

proc.stderr.on("data", (d) => console.error("[Backend Err]", d.toString()));

// Wait for server to start
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
  // 1. Health check
  console.log("\n🏥 [1/5] Testing /health endpoint...");
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthJson = await healthRes.json();
  assert(healthRes.status === 200, "Health status 200");
  assert(healthJson.service === "librespeed-backend", "Health service identifier matched");
  assert(healthRes.headers.get("access-control-allow-origin") === "*", "CORS header present on /health");

  // 2. Client IP lookup (/getIP)
  console.log("\n🌐 [2/5] Testing /getIP endpoint...");
  const ipRes = await fetch(`${BASE_URL}/getIP`);
  const ipJson = await ipRes.json();
  assert(ipRes.status === 200, "/getIP status 200");
  assert(typeof ipJson.processedString === "string" && ipJson.processedString.length > 0, "/getIP returns valid IP string");

  // 3. Ping probe (/empty GET)
  console.log("\n📡 [3/5] Testing /empty GET latency probe...");
  const t0 = performance.now();
  const emptyRes = await fetch(`${BASE_URL}/empty`, { cache: "no-store" });
  const latency = performance.now() - t0;
  const emptyBody = await emptyRes.text();
  assert(emptyRes.status === 200, "/empty status 200");
  assert(emptyBody.length === 0, "/empty body is empty");
  assert(latency < 100, `Ping round-trip low (${latency.toFixed(2)}ms < 100ms)`);

  // 4. Download chunk stream (/garbage GET)
  console.log("\n📥 [4/5] Testing /garbage GET download chunk stream...");
  const ckSize = 2; // 2MB
  const garbageRes = await fetch(`${BASE_URL}/garbage?ckSize=${ckSize}`, { cache: "no-store" });
  assert(garbageRes.status === 200, "/garbage status 200");
  assert(garbageRes.headers.get("content-type") === "application/octet-stream", "Binary octet-stream content-type");

  let totalReceived = 0;
  for await (const chunk of garbageRes.body) {
    totalReceived += chunk.length;
  }
  const expectedBytes = ckSize * 1024 * 1024;
  assert(totalReceived === expectedBytes, `Received full ${ckSize}MB (${totalReceived} == ${expectedBytes} bytes)`);

  // 5. Upload sink (/empty POST)
  console.log("\n📤 [5/5] Testing /empty POST upload sink...");
  const uploadPayloadSize = 1024 * 1024; // 1 MB
  const payload = new Uint8Array(uploadPayloadSize);
  payload.fill(42);

  const uploadRes = await fetch(`${BASE_URL}/empty`, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body: payload,
  });
  assert(uploadRes.status === 200, "/empty POST status 200");
  const uploadJson = await uploadRes.json();
  assert(uploadJson.bytesReceived === uploadPayloadSize, `Server received exact bytes (${uploadJson.bytesReceived} == ${uploadPayloadSize})`);

} catch (err) {
  console.error("Test execution failed:", err);
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
