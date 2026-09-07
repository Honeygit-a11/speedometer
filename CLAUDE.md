# CLAUDE.md — SpeedPulse

Browser-based internet speed test platform (FAST.com / Speedtest.net inspired) measuring **download, upload, ping, and jitter** directly from the browser against Cloudflare edge workers. No accounts, no database, zero upload retention.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4 · Cloudflare Workers (Wrangler).

## Architecture

Two independently deployable parts:

1. **Frontend** (repo root) — Next.js app. The speed test runs 100% in the browser against the worker; the Next.js server only serves the static page.
2. **Worker** (`worker/`) — Cloudflare Worker exposing the measurement endpoints: `/ping`, `/download`, `/upload`, `/health`.

```
Browser ──fetch──▶ Cloudflare Worker
  │                     ├─ GET  /ping       (latency probe, JSON)
  │                     ├─ GET  /download   (streamed 64KB chunks, octet-stream)
  │                     └─ POST /upload     (streaming sink, payload discarded, zero retention)
```

### Frontend structure

- `app/` — `page.tsx` (landing hero + container), `layout.tsx` (dark theme, Header/Footer), `globals.css` (Tailwind v4 entry, glass-panel utilities, theme tokens).
- `components/layout/` — `Header`, `Footer`.
- `components/speed-test/` — presentation layer: `SpeedTestContainer` (binds React state to the engine singleton), `SpeedMeter` (SVG gauge), `SpeedDisplay`, `MetricCard`, `Results` (includes Advanced Diagnostics accordion), `TestProgress` (phase timeline).
- `features/speed-test/engine/` — **headless, React-free measurement engine**. This is the core domain logic.
- `lib/utils.ts` — `cn()`, `formatSpeed()`, `formatLatency()`.
- `types/index.ts` — shared types (`TestPhase`, `PingMetrics`, `SpeedMetrics`, `TestResults`, `LoadedLatency`, `NetworkStability`, ...).
- `docs/` — `PHASES.md` (build tracker), `DEPLOYMENT.md` (deploy guide).
- `scripts/` — verification/simulation harnesses.

### Worker (`worker/src/index.ts`)

Single entry handling all routes with CORS + security: per-IP sliding-window rate limits with **per-route budgets** (ping 600/min, download 240/min, upload 6000/min, other 180/min — separate buckets so upload's many small chunks can't starve other endpoints), a bandwidth quota (**5 GB/10min per IP, configurable via `MAX_BANDWIDTH_BYTES`, `0` = unlimited, charged only for bytes actually transferred**), hard 50MB upload cap (413), strict method enforcement (405), `nosniff` + `X-Frame-Options: DENY`. Config: `worker/wrangler.jsonc` (`ALLOWED_ORIGINS` + `MAX_BANDWIDTH_BYTES` vars; production env has an explicit origin allowlist vs. dev `*`).

## Measurement engine (how a test works)

`SpeedTestController` (`features/speed-test/engine/test-controller.ts`) is a **state machine**: `IDLE → INITIALIZING → PING_TEST → DOWNLOAD_TEST → UPLOAD_TEST → PROCESS_RESULTS → COMPLETED`, plus `ERROR` / `CANCELLED`. A singleton (`speedTestController`) is exported; UI components subscribe via `subscribe(listener)`.

Key measurement properties (see `download.ts`, `upload.ts`, `calculations.ts`):
- **Decimal telecom Mbps** — `1 Mbps = 1,000,000 bits` (`calculateSpeedMbps`), not MiB.
- **Warm-up window** (default 1500ms) discarded before final throughput is computed — eliminates connection-establishment anomalies.
- **Rolling 1000ms throughput window** (`RollingThroughputTracker`) for smooth live readout; final speed blends cumulative post-warmup bytes (70%) with a trimmed mean of windowed samples (30%).
- **Dynamic concurrency** — download scales 2→6 parallel streams when bandwidth justifies it; upload uses 3 parallel streams.
- **RFC 3550 jitter** (`calculateJitter`) = mean absolute deviation of consecutive latency deltas.
- **Loaded latency / bufferbloat** — `/ping` probes fired *during* download/upload saturate the link; delta vs. idle produces `A+`…`F` grade (`stability.ts`).
- **Stability index** (0–100%) from CV of *real* post-warmup throughput samples + jitter/latency ratio → `Excellent/Good/Moderate/Unstable`; omitted entirely when there are too few samples. Download and upload samples are **never mixed** (different magnitudes would distort the CV), and no metrics are fabricated in `results.ts`: the bufferbloat grade is only shown when a real loaded-latency probe was captured.

## Commands

Default worker URL everywhere (frontend fallback + all scripts) is `http://127.0.0.1:8787`.

```bash
# Frontend
npm install
npm run dev          # Next.js on :3000
npm run build        # production build
npm run lint

# Worker (must be running for tests + UI speed test)
cd worker
npm install
npm run dev          # wrangler dev on :8787

# Verification scripts (hit a live worker; most default to TEST_WORKER_URL or 127.0.0.1:8787)
node worker/scripts/test-endpoints.mjs          # 19 endpoint assertions
node worker/scripts/test-security.mjs           # 11 security assertions
node features/speed-test/engine/__tests__/run-engine-test.mjs          # 14 engine assertions
node features/speed-test/engine/__tests__/run-advanced-metrics-test.mjs # 12 metric assertions
node scripts/test-simulation-profiles.mjs       # 13 multi-speed simulation assertions
node scripts/verify-production-readiness.mjs    # 10 pre-flight checklist items
```

## Environment

- `NEXT_PUBLIC_SPEEDTEST_WORKER_URL` — points the frontend at the worker. Defaults to `http://127.0.0.1:8787` in code if unset. Templates: `.env.example`, `.env.local.example`, `.env.production.example`.
- `ALLOWED_ORIGINS` (worker var) — comma-separated CORS allowlist; `*` in dev.
- `MAX_BANDWIDTH_BYTES` (worker var, optional) — per-IP 10-min bandwidth budget in bytes (default `5 GB`; `0` disables).

## Conventions & gotchas

- **Path alias**: `@/*` → repo root (tsconfig).
- **Engine purity**: `features/speed-test/engine/*` must stay free of React/UI code. UI state lives in shared types + the controller.
- **Client components**: any component using hooks/events is `"use client"`.
- **Dark theme**: enforced with `<html className="dark">`; the design is fixed dark (cyan/emerald/purple on slate). Reuse `glass-panel` / `glass-panel-glow` utility classes rather than inline backgrounds.
- **Icons**: `lucide-react`. **Styling**: Tailwind v4 (`@import "tailwindcss"` — no `tailwind.config` file; theme via CSS).
- **Local dev bypass**: the worker treats `127.0.0.1` / `::1` / `localhost` as local — no rate limit or bandwidth quota — so test loops and the dev UI won't trip limits.
- **Zero storage is a feature**: never persist upload payloads on the client or worker.
- All measurement values are computed from real network probes — do not fabricate placeholders for ping/packet-loss metrics.