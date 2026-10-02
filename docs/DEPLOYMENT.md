# AquaTwin Production Deployment Guide (Render & Vercel)

This document provides step-by-step instructions for deploying the **AquaTwin SCADA & Digital Twin System** to production using **Render** (FastAPI Backend + PostgreSQL Database) and **Vercel** (React Frontend).

---

## Architecture Overview

```
Physical / Emulated ESP32
        ↓ (HTTPS POST /api/hardware/telemetry)
FastAPI Backend on Render (https://aquatwin-backend.onrender.com)
        ↓
Render PostgreSQL Database
        v (WebSocket wss://aquatwin-backend.onrender.com/ws/telemetry)
React Frontend on Vercel (https://aquatwin.vercel.app)
```

---

## 1. Step-by-Step Backend & Database Deployment (Render)

### Step 1: Create a PostgreSQL Database on Render
1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **PostgreSQL**.
3. Name your database: `aquatwin-db`.
4. Region: Choose your preferred region (e.g., Singapore or Oregon).
5. Database Name: `aquatwin`
6. User: `aquatwin_user`
7. Click **Create Database**.
8. Copy the **Internal Database URL** or **External Database URL** (format: `postgresql://aquatwin_user:PASSWORD@ep-xxx.render.com/aquatwin`).

### Step 2: Deploy the FastAPI Backend Service on Render
1. Push your code to a GitHub or GitLab repository.
2. In the Render Dashboard, click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Select the repository root or specify the root directory as `backend`.
5. Configure the Web Service:
   - **Name:** `aquatwin-backend`
   - **Environment:** `Python 3`
   - **Region:** Same region as your database.
   - **Branch:** `main`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:$PORT`
6. Add Environment Variables:
   - `PYTHON_VERSION`: `3.10.10`
   - `DATABASE_URL`: Paste the PostgreSQL URL from Step 1 (`postgresql://...`).
   - `SECRET_KEY`: A secure random string (e.g. `aquatwin_scada_prod_key_2026`).
   - `CORS_ORIGINS`: `https://YOUR-FRONTEND.vercel.app,http://localhost:5173`
7. Click **Create Web Service**.
8. Render will deploy your service and provide a URL: `https://aquatwin-backend.onrender.com`.
9. Verify by opening `https://aquatwin-backend.onrender.com/` in your browser. You should receive `{"system": "AquaTwin SCADA Digital Twin", "status": "ONLINE", "database_type": "PostgreSQL"}`.

---

## 2. Step-by-Step Frontend Deployment (Vercel)

### Step 1: Prepare Frontend for Vercel
Ensure `frontend/vercel.json` exists with SPA routing rewrites:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Step 2: Deploy to Vercel
1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository.
4. Set **Root Directory** to `frontend`.
5. Framework Preset: **Vite**.
6. Expand **Environment Variables** and add:
   - `VITE_API_URL`: `https://aquatwin-backend.onrender.com` (Use your actual Render backend URL).
7. Click **Deploy**.
8. Vercel will build and deploy your frontend to a URL like `https://aquatwin.vercel.app`.

---

## 3. Post-Deployment Verification

1. Open your deployed Vercel frontend (`https://aquatwin.vercel.app`).
2. Log in with credentials (`EMP001` / `pass123`).
3. Check the top status bar:
   - `WS:` should report `CONNECTED` (using `wss://aquatwin-backend.onrender.com/ws/telemetry`).
   - `DB:` should report `Sync OK`.
4. Test real-time hardware telemetry by pointing your ESP32 or running the test sender pointing to Render:
   ```bash
   BACKEND_URL="https://aquatwin-backend.onrender.com/api/hardware/telemetry" python backend/tools/test_esp32_sender.py
   ```
5. Observe the live 3D Digital Twin tank level filling/emptying in real time without refreshing the page!
