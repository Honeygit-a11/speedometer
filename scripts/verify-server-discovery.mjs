/**
 * Verification for the Antigravity Phase 3/4 additions:
 *  - /getIP client identity (live worker)
 *  - registry `enabled` filtering and `priority`-aware ranking (actual TS source)
 *  - /health probe step in server selection (actual TS source)
 *
 * The engine modules are pure TS (no React, no `@/` runtime imports in the
 * selection layer), so they're transpiled with the project's own TypeScript
 * compiler and exercised directly.
 */

import { readFileSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import ts from "typescript";

const HERE = dirname(fileURLToPath(import.meta.url));
const ENGINE = join(HERE, "..", "features", "speed-test", "engine");
const OUT = join(tmpdir(), "speedtest-registry-verify");
const require = createRequire(import.meta.url);

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

// Transpile the selection-layer modules to CommonJS and load them.
const FILES = ["server-endpoints.ts", "server-registry.ts", "server-selection.ts"];
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
for (const file of FILES) {
  const src = readFileSync(join(ENGINE, file), "utf8");
  const out = ts.transpileModule(src, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: file,
  }).outputText;
  writeFileSync(join(OUT, file.replace(/\.ts$/, ".js")), out);
}

// Emitted as CommonJS `.js`; OUT has no package.json so Node treats them as CJS.
const { buildHealthUrl, buildGetIpUrl, isLoopbackUrl } = require(
  join(OUT, "server-endpoints.js")
);
const { filterServersForRuntime, getServerList } = require(
  join(OUT, "server-registry.js")
);
const { probeServerLatency, rankServersByLatency } = require(
  join(OUT, "server-selection.js")
);

console.log(`\n🌐 Verifying server registry & discovery additions\n`);

// --- 1. /getIP live endpoint ---
try {
  const data = await (await fetch(`${WORKER_URL}/getIP`, { cache: "no-store" })).json();
  assert(data.status === "ok" && typeof data.ip === "string" && data.ip.length > 0,
    `Live /getIP returns a client ip (${data.ip})`);
} catch (err) {
  assert(false, `Live /getIP failed: ${err.message}`);
}

// --- 2. URL builders ---
const healthUrl = buildHealthUrl(WORKER_URL, "standard") ?? "";
assert(healthUrl.startsWith(`${WORKER_URL}/health`), "buildHealthUrl targets /health for standard backends");
assert(buildHealthUrl(WORKER_URL, "librespeed") === null, "LibreSpeed backends have no /health probe");
assert(buildGetIpUrl(WORKER_URL).startsWith(`${WORKER_URL}/getIP`), "buildGetIpUrl targets /getIP");

// --- 3. enabled filtering + priority normalization (actual source) ---
const env = {
  NEXT_PUBLIC_ALLOW_LOCAL_SERVERS: "true",
  NEXT_PUBLIC_SPEEDTEST_SERVERS: JSON.stringify([
    { id: "a", name: "A", region: "x", baseUrl: "https://server-a.example", enabled: false, priority: 1 },
    { id: "b", name: "B", region: "x", baseUrl: "https://server-b.example", enabled: true, priority: 9 },
  ]),
};
const resolved = getServerList(env);
assert(resolved.length === 1 && resolved[0].id === "b", "registry parsing drops enabled:false servers");
assert(resolved[0].priority === 9 && resolved[0].enabled === true,
  "normalizeServer carries priority + enabled flags through from env JSON");

// --- 4. priority ordering (actual source), against the live worker ---
const rankedServers = [
  { id: "low", name: "Low Priority", region: "local", baseUrl: WORKER_URL, priority: 50 },
  { id: "high", name: "High Priority", region: "local", baseUrl: WORKER_URL, priority: 1 },
];
const ranked = await rankServersByLatency({ servers: rankedServers, probeCount: 1, probeTimeoutMs: 3000 });
assert(ranked.length === 2 && ranked[0].server.id === "high",
  "rankServersByLatency prefers lower priority value (then latency)");

// --- 5. health probe surfaces on the probe result (actual source) ---
const probe = await probeServerLatency(
  { id: "health", name: "H", region: "local", baseUrl: WORKER_URL },
  2,
  2500,
  20
);
assert(probe.healthy === true, "probeServerLatency reports healthy against a live worker");
assert(probe.healthOk === true, "/health liveness probe reported OK (Phase 4 health check)");

// --- 6. loopback detection helper still works ---
assert(isLoopbackUrl(WORKER_URL) === true, "isLoopbackUrl detects the local loopback worker");

console.log(`\n========================================`);
console.log(`REGISTRY VERIFICATION: ${passed} Passed, ${failed} Failed`);
console.log(`========================================\n`);
process.exit(failed > 0 ? 1 : 0);