# ☁️ Production Deployment Guide
> **Traffic Light System Automation — Wachemo University (SEng4162)**  
> *Production Deployment on Cloudflare Pages, Render Web Services, and Neon PostgreSQL*

---

## 🏗 Target Architecture Overview

```
                 +---------------------------------------------+
                 |            Cloudflare Edge Network          |
                 |         Cloudflare Pages (Frontend)         |
                 |             https://traffic.wcu.et          |
                 +----------------------+----------------------+
                                        |
                            HTTPS / WSS | (Custom Domain / TLS 1.3)
                                        |
                 +----------------------v----------------------+
                 |               Render Cloud                  |
                 |        Backend Web Service (Node.js)        |
                 |          https://api.traffic.wcu.et         |
                 +------------+-------------------+------------+
                              |                   |
            Prisma Connection |                   | MQTT over TLS (Port 8883)
            (SSL / PgBouncer) |                   |
+-----------------------------v----+  +-----------v---------------------+
|         Neon PostgreSQL          |  |         HiveMQ Cloud /          |
|    Serverless Cloud Database     |  |          EMQX Cluster           |
|      (Automated Backups)         |  |   (Encrypted ESP32 Transport)   |
+----------------------------------+  +---------------------------------+
```

---

## 🗄 1. Database Provisioning: Neon PostgreSQL

1. **Create Database**:
   - Log in to [Neon Console](https://console.neon.tech).
   - Create a new project: `wachemo-traffic-production`.
   - Select region closest to target deployment (e.g. Frankfurt `eu-central-1` or Bahrain `me-south-1`).
2. **Obtain Connection String**:
   - Under the Dashboard, copy the connection URI:
   ```text
   postgresql://traffic_owner:[PASSWORD]@[HOST].neon.tech/traffic_db?sslmode=require
   ```
3. **Execute Migrations**:
   From your local development machine with the production URI:
   ```bash
   cd backend
   npx prisma migrate deploy
   npx prisma db seed
   ```

---

## 🖥 2. Backend Deployment: Render Web Service

1. **Create Web Service**:
   - Log in to [Render Dashboard](https://dashboard.render.com).
   - Click **New +** ➔ **Web Service**.
   - Connect your GitHub repository: `https://github.com/Samieyu/ESP32-IoT-Traffic-Signal-Management-System`.
   - Branch: `develop` (or `main`).
   - Root Directory: `backend`.
2. **Configure Runtime Settings**:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Starter or Standard (dedicated CPU for WebSocket concurrency).
3. **Configure Environment Variables**:
   Under the **Environment** tab, add:
   ```ini
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=postgresql://traffic_owner:...@...neon.tech/traffic_db?sslmode=require
   JWT_ACCESS_SECRET=your-random-64-char-production-secret-key-alpha
   JWT_REFRESH_SECRET=your-random-64-char-production-secret-key-beta
   JWT_ACCESS_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d
   ALLOW_INACTIVE_LOGIN=false
   MQTT_BROKER_URL=mqtts://broker.hivemq.com:8883
   MQTT_USERNAME=traffic_backend_service
   MQTT_PASSWORD=production_secure_token_9931
   ENABLE_VIRTUAL_CONTROLLERS=false
   CORS_ORIGIN=https://traffic-management.pages.dev,https://traffic.wcu.et
   ```
4. **Health Check Path**:
   Set Health Check Path to: `/api/v1/health`

---

## 🌐 3. Frontend Deployment: Cloudflare Pages

1. **Create Cloudflare Project**:
   - Log in to [Cloudflare Dashboard](https://dash.cloudflare.com).
   - Navigate to **Workers & Pages** ➔ **Create Application** ➔ **Pages** ➔ **Connect to Git**.
   - Select `ESP32-IoT-Traffic-Signal-Management-System`.
2. **Build Configuration**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `dist`
   - **Root Directory**: `frontend`
3. **Environment Variables**:
   Under **Settings** ➔ **Environment variables**, configure:
   ```ini
   VITE_API_URL=https://api.traffic.wcu.et/api/v1
   VITE_SOCKET_URL=https://api.traffic.wcu.et
   ```
4. **Single Page Application (SPA) Routing Rule**:
   Create a `frontend/public/_redirects` file (or configure Cloudflare Pages rule) containing:
   ```text
   /*    /index.html   200
   ```

---

## 🔒 4. Production Security & Hardening Checklist

- [x] **Enforce HTTPS / HSTS**: Cloudflare SSL mode set to **Full (Strict)**.
- [x] **Rate Limiting**: Backend `rate-limiter.middleware.ts` restricts authentication attempts to 5 requests per 15 minutes per IP.
- [x] **HttpOnly Cookies / Secure Storage**: Refresh tokens and JWTs isolated from cross-site scripting vectors.
- [x] **Content Security Policy (CSP) & Helmet**: HTTP response security headers enabled via `helmet`.
- [x] **Zero Secret Leakage**: No `.env` or sensitive credentials committed to GitHub.

---
*Maintained by Wachemo University Department of Software Engineering.*
