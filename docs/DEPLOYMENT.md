# Production Deployment Guide — SpeedPulse

This guide provides instructions for deploying the **SpeedPulse Internet Speed Test** application to production.

---

## Architecture Overview

```
User Browser
    │
    ▼
Next.js Application (Vercel / Cloudflare Pages)
    │
    ▼
Browser-Side Speed Test Engine
    │  (server registry → latency + /health probe → best server → failover)
    ▼
        Cloudflare Workers (one or more edge nodes)
        ├─ GET  /ping       latency probe (JSON)
        ├─ GET  /download   streamed 64KB chunks (octet-stream)
        ├─ POST /upload     streaming sink, payload discarded
        ├─ GET  /health     liveness probe (used in server selection)
        └─ GET  /getIP      client identity lookup (IP/ISP/country)
```

- **Zero Database**: Real-time calculated results directly rendered in browser.
- **Zero Authentication**: No logins, profiles, or user dashboards.
- **Zero Upload Storage**: Upload payload is discarded in-flight by the edge reader.
- **Independent Infrastructure**: High-bandwidth traffic never routes through Next.js server instances.

---

## 1. Deploy Cloudflare Workers (Edge Infrastructure)

The Cloudflare Worker provides the `/ping`, `/download`, `/upload`, `/health`, and `/getIP` endpoints with rate limiting, bandwidth budgeting, and CORS enforcement.

### Step 1.1: Authenticate with Cloudflare
```bash
cd worker
npx wrangler login
```

### Step 1.2: Configure Production Environment Variables
In `worker/wrangler.jsonc`, update the `ALLOWED_ORIGINS` to match your production frontend domain:
```jsonc
"env": {
  "production": {
    "name": "speedtest-worker-prod",
    "vars": {
      "ALLOWED_ORIGINS": "https://speedtest.yourdomain.com,https://yourdomain.com"
    }
  }
}
```

### Step 1.3: Deploy to Cloudflare Edge
```bash
npx wrangler deploy --env production
```

Once deployed, Wrangler will output your live worker URL:
```
https://speedtest-worker-prod.<your-subdomain>.workers.dev
```

*(Optional: Bind a custom domain in the Cloudflare Dashboard under Worker > Triggers > Custom Domains, e.g. `speed-edge.yourdomain.com`)*.

---

## 1.5. Multi-Server Registry (Optional, Recommended)

Deploy the worker to multiple regions (e.g. `wrangler deploy --env production` with per-region environments, or duplicate workers on distinct subdomains), then point the frontend at all of them. The engine probes each candidate by **measured latency + `/health`** and selects the lowest-latency healthy server, failing over to the next ranked server on error.

In your frontend environment variables, set `NEXT_PUBLIC_SPEEDTEST_SERVERS` (JSON array) instead of a single `NEXT_PUBLIC_SPEEDTEST_WORKER_URL`:

```json
[
  {"id":"us-east","name":"US East","region":"us-east","baseUrl":"https://speed-edge-us.yourdomain.workers.dev","priority":1},
  {"id":"eu-west","name":"EU West","region":"eu-west","baseUrl":"https://speed-edge-eu.yourdomain.workers.dev","priority":2},
  {"id":"asia","name":"Asia","region":"asia","baseUrl":"https://speed-edge-asia.yourdomain.workers.dev","priority":3}
]
```

Optional per-server fields:
- `backend` — `"standard"` (Cloudflare, default) or `"librespeed"`.
- `enabled` — `false` excludes a server from discovery (e.g. keep a staging node in config but off).
- `priority` — lower value is preferred; used as a tiebreaker after measured latency.

---

## 2. Deploy Next.js Frontend

### Option A: Deploy on Vercel (Recommended)

1. Push your code to a Git repository (GitHub / GitLab / Bitbucket).
2. Import the project into the [Vercel Dashboard](https://vercel.com/new).
3. In **Environment Variables**, add:
   - **Key**: `NEXT_PUBLIC_SPEEDTEST_WORKER_URL`
   - **Value**: `https://speedtest-worker-prod.<your-subdomain>.workers.dev` (or custom edge domain).
4. Click **Deploy**.

Alternatively, deploy using the Vercel CLI:
```bash
npx vercel --prod
```

### Option B: Deploy on Cloudflare Pages

1. Install Next-on-Pages:
   ```bash
   npx @cloudflare/next-on-pages
   ```
2. In Cloudflare Dashboard > Pages > Create a Project > Connect Git.
3. Build Settings:
   - **Framework preset**: `Next.js`
   - **Build command**: `npx @cloudflare/next-on-pages`
   - **Build output directory**: `.vercel/output/static`
4. Environment Variables:
   - `NEXT_PUBLIC_SPEEDTEST_WORKER_URL`: Your production Worker URL.
   - `NODE_VERSION`: `20` or later.
5. Click **Save and Deploy**.

---

## 3. Production Launch Checklist

Before opening to public traffic, verify:

- [x] **Environment Variables**: `NEXT_PUBLIC_SPEEDTEST_WORKER_URL` points to live worker URL with HTTPS.
- [x] **HTTPS**: Both frontend and worker enforce strict SSL/TLS encryption.
- [x] **CORS**: `ALLOWED_ORIGINS` permits production frontend domain.
- [x] **Rate Limiting**: Worker applies per-route budgets per IP (ping 600/min, download 240/min, upload 6000/min).
- [x] **Upload Protection**: 50MB payload cap strictly enforced with 413 response.
- [x] **Zero Storage**: In-flight upload chunks discarded with zero disk or DB writes.
- [x] **Error Handling**: Graceful recovery on network drops, timeouts, and cancellations.
- [x] **Mobile Responsiveness**: Verified across mobile, tablet, and desktop viewports.
- [x] **Browser Testing**: Verified on Chrome, Edge, Firefox, and Safari via Web APIs.
- [x] **Bandwidth Monitoring**: 5GB/10min sliding-window quota active per client IP (tune via `MAX_BANDWIDTH_BYTES`).
- [x] **Security Review**: Nosniff and Frame-Options DENY headers active.
