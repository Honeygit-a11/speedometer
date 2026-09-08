# Railway Deployment Guide — LibreSpeed Backend

This guide details how to deploy the high-performance LibreSpeed backend (`backend/`) to **Railway** and link it to your Next.js Speedometer frontend.

---

## Architecture Overview

```text
Next.js Frontend (Vercel / Cloudflare / Local)
       │
       ▼ (HTTPS / WSS)
Railway Service: LibreSpeed Backend
       ├─ GET  /empty    (Latency & Ping probing)
       ├─ GET  /garbage  (Streamed binary download)
       ├─ POST /empty    (Streaming upload sink)
       └─ GET  /getIP    (Client IP & metadata)
```

---

## Step 1: Deploying the Backend on Railway

### Option A: Via Railway Web UI (Git Repository)
1. Go to [railway.com](https://railway.com) and create a **New Project**.
2. Select **Deploy from GitHub repo** and choose your repository.
3. In the project settings, set:
   * **Root Directory**: `backend`
   * Railway will automatically detect the [Dockerfile](file:///c:/LOGIC%20PRACTICE/speedometer/backend/Dockerfile) and [railway.json](file:///c:/LOGIC%20PRACTICE/speedometer/backend/railway.json).
4. Go to **Settings** → **Networking** → Click **Generate Domain**.
5. Copy your generated public URL (e.g. `https://librespeed-production-xxxx.up.railway.app`).

### Option B: Via Railway CLI
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and initialize project in backend directory
cd backend
railway login
railway init
railway up
railway domain # Generates public domain
```

---

## Step 2: Testing the Deployed Backend

Run a quick cURL check against your Railway domain:

```bash
# 1. Health check
curl -i https://YOUR_RAILWAY_DOMAIN.up.railway.app/health

# 2. Ping probe
curl -i https://YOUR_RAILWAY_DOMAIN.up.railway.app/empty

# 3. Download test (2MB)
curl -o /dev/null -w "Speed: %{speed_download} bytes/sec\n" "https://YOUR_RAILWAY_DOMAIN.up.railway.app/garbage?ckSize=2"
```

---

## Step 3: Connecting Your Frontend

Set the environment variable in your frontend hosting environment (Vercel, Cloudflare Pages, or `.env.local`):

```bash
NEXT_PUBLIC_LIBRESPEED_URL=https://YOUR_RAILWAY_DOMAIN.up.railway.app
```

Rebuild/redeploy your Next.js application. The speed test engine will automatically route all tests against your Railway LibreSpeed backend!
