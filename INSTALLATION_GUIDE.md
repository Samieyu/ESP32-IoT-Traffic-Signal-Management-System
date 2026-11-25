# 💻 Local Installation & Setup Guide
> **Traffic Light System Automation — Wachemo University (SEng4162)**  
> *Complete Step-by-Step Developer Setup for Windows, macOS, and Linux*

---

## 📋 1. Prerequisites & Environment

Before beginning, ensure the following developer tools are installed on your host machine:

| Component | Minimum Version | Recommended Version | Verification Command |
| :--- | :--- | :--- | :--- |
| **Node.js** | `v18.17.0` | `v20.12.0` (LTS) | `node --version` |
| **npm** | `v9.6.0` | `v10.5.0` | `npm --version` |
| **Git** | `v2.30.0` | `v2.40.0+` | `git --version` |
| **Web Browser** | Chrome 110+, Firefox 110+, or Edge | Latest Chromium | — |

*Note: You do NOT need a physical ESP32 or external MQTT broker to test the complete application. The backend includes an integrated high-fidelity Virtual Twin ESP32 simulator that runs state machines, yellow/all-red clearance transitions, and publishes telemetry out-of-the-box.*

---

## 📥 2. Clone the Repository

Clone the project repository and check out the active `develop` branch:

```bash
git clone https://github.com/Samieyu/ESP32-IoT-Traffic-Signal-Management-System.git
cd "ESP32-IoT-Traffic-Signal-Management-System"
git checkout develop
```

---

## ⚙️ 3. Backend Setup & Configuration

### A. Navigate to Backend Directory
```bash
cd backend
```

### B. Configure Environment Variables
Copy the template `.env.example` into `.env`:
```bash
# On Windows Command Prompt:
copy .env.example .env

# On macOS / Linux / PowerShell:
cp .env.example .env
```

Verify or update the default parameters in `backend/.env`:
```ini
NODE_ENV=development
PORT=5000

# PostgreSQL Connection (or Neon Serverless)
DATABASE_URL="postgresql://traffic_user:password@localhost:5432/traffic_light_db?schema=public"

# Security & Tokens
JWT_ACCESS_SECRET="wachemo-traffic-access-jwt-secret-key-super-secure-2026"
JWT_REFRESH_SECRET="wachemo-traffic-refresh-jwt-secret-key-super-secure-2026"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Operational Policies (Default: Inactive accounts cannot log in)
ALLOW_INACTIVE_LOGIN="false"

# MQTT Broker Settings
MQTT_BROKER_URL="mqtt://localhost:1883"
ENABLE_VIRTUAL_CONTROLLERS="true"
```

### C. Install Dependencies
```bash
npm install
```

### D. Compile TypeScript & Verify Tests
```bash
# Run unit & integration test suite (17 tests)
npm test

# Build production TypeScript distribution
npm run build
```

### E. Start the Backend Server
```bash
npm start
# Server listens on http://localhost:5000 (REST: http://localhost:5000/api/v1)
```

---

## 🎨 4. Frontend Setup & Configuration

### A. Open a New Terminal & Navigate to Frontend
```bash
cd frontend
```

### B. Configure Frontend Environment
Ensure `frontend/.env` is present:
```ini
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
```

### C. Install Dependencies
```bash
npm install
```

### D. Verify Build
```bash
npm run build
```

### E. Start the Frontend Development Server
```bash
npm run dev
# The Vite server starts at http://localhost:5173
```

---

## 🧪 5. Testing the Integrated Platform

1. Open your web browser and navigate to: **`http://localhost:5173`**
2. **Log in as Administrator**:
   - **Username**: `admin`
   - **Password**: `Admin@123456`
   - Verify the Overview Dashboard, active intersections, live traffic signal summaries, and audit logs.
3. **Inspect Signal Configuration**:
   - Click **Signal Configurations** in the sidebar.
   - Select `Hosanna Central Post Office Junction`.
   - Modify North-South green duration to `35` seconds and click **Apply & Deploy to Controller**.
   - Notice the instant configuration delivery and controller ACK.
4. **Log in as Traffic Police**:
   - Log out, then log in with:
     - **Username**: `officer_alemu`
     - **Password**: `Officer@123456`
   - Verify assigned intersections list (`int-hosanna-01`).
   - Click **Manage Emergency**.
   - Request an Emergency Priority Corridor for an Ambulance heading North-South.
   - Observe the yellow clearance interval, all-red safety pause, and emergency green transition.
   - Terminate the priority corridor and witness the failsafe return to the standard cycle.
5. **Generate Analytic Reports**:
   - Click **My Reports** / **Reports & Analytics**.
   - Select Date Range and click **Export PDF Report** or **Export Excel Workbook**.

---

## ❓ 6. Troubleshooting Common Issues

### Issue 1: Port `5000` or `5173` Already in Use
- Change `PORT=5001` in `backend/.env` and update `VITE_API_URL=http://localhost:5001/api/v1` in `frontend/.env`.

### Issue 2: Cross-Origin Resource Sharing (CORS) Error
- Verify that `backend/src/index.ts` allows `http://localhost:5173` in its CORS configuration.

### Issue 3: Virtual Controller State Not Appearing
- Ensure `ENABLE_VIRTUAL_CONTROLLERS=true` is set in `backend/.env`.

---
*Maintained by Wachemo University Department of Software Engineering.*
