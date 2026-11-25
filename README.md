# 🚦 Traffic Light System Automation — Complete Web Application
> **Wachemo University — Department of Software Engineering (SEng4162: Real Time & Embedded Systems)**  
> *Production-Ready Centralized Web Management & ESP32 IoT Traffic Signal Control Platform*

---

## 📌 Executive Summary

The **Traffic Light System Automation Web Application** is an enterprise-grade municipal traffic control room and distributed IoT solution designed to automate, optimize, and manage urban road intersections. Engineered to solve acute urban traffic congestion, manual traffic coordination hazards, emergency vehicle delays, and hardware fault diagnostic blind spots, this platform connects physical **ESP32-WROOM-32** microcontrollers directly to a high-throughput **Node.js/Express** backend via **MQTT**, delivering real-time telemetry, signal state visualization, and failsafe emergency corridor clearance to a modern **React/TypeScript** web dashboard.

---

## 🏛 System Architecture Overview

```
+-----------------------------------------------------------------------------------+
|                                PRESENTATION TIER                                  |
|   React 18 + Vite + Tailwind CSS + TanStack Query + Leaflet Maps + Socket.IO     |
|   +------------------------------------+   +------------------------------------+ |
|   |       Administrator Dashboard      |   |      Traffic Police Dashboard      | |
|   |  - Global Crossing Management      |   |  - Assigned Intersections Scope    | |
|   |  - Signal Timing Configuration     |   |  - Real-Time Live Signal Monitor   | |
|   |  - Officer Accounts & Auditing     |   |  - Emergency Corridor Clearance    | |
|   |  - PDF / Excel Analytic Reports    |   |  - Incident & Problem Logging      | |
|   +------------------------------------+   +------------------------------------+ |
+-----------------------------------------+-----------------------------------------+
                                          | HTTPS / WSS
+-----------------------------------------v-----------------------------------------+
|                                APPLICATION BACKEND                                |
|   Node.js (v20+) + Express + TypeScript + Socket.IO Gateway + Prisma ORM          |
|   - REST API v1 (`/api/v1/auth`, `intersections`, `monitoring`, `emergency`, etc.)|
|   - Role-Based Access Control (RBAC) & Crossing Ownership Interceptors            |
|   - FreeRTOS Virtual Twin Hardware Simulator with Failsafe Safety Invariants      |
|   - Background PDFKit & ExcelJS Analytical Export Engines                         |
+------------------------------------+----+-----------------------------------------+
                                     |    |
           PostgreSQL Relational DB  |    | MQTT v3.1.1 Broker (TCP/TLS)
                                     |    |
+------------------------------------v--+ +-----------------------------------------+
|           PERSISTENCE TIER            | |               IoT EDGE TIER             |
|   Neon PostgreSQL Serverless          | |   ESP32-WROOM-32 Microcontrollers       |
|   - 16 Normalized Relational Entities | |   - FreeRTOS Dual-Task Architecture     |
|   - Strict Foreign Keys & Indices     | |   - Dynamic NVS Timing Storage          |
|   - Comprehensive Audit Trail Logs    | |   - Hardware Watchdog & Yellow Interlock|
+---------------------------------------+ +-----------------------------------------+
```

---

## 🚀 Key Functional Capabilities

| Module | Features & Implemented Requirements |
| :--- | :--- |
| **Authentication & RBAC** | JWT Access (15m) + Secure Refresh (7d) tokens, bcrypt hashing, login rate-limiting, and automatic role redirection (`FR-1`, `NFR-1`, `NFR-2`). |
| **Account Management** | Officer registration, password generation, activation/deactivation, soft-deletion preserving historical audit records (`FR-2`, `UC-02`). |
| **Intersection Registry** | Geographic coordinates, multi-approach topology, ESP32 controller linking, interactive Leaflet mapping (`FR-3`, `UC-04`). |
| **Signal Configuration** | Dynamic Green, Yellow (3–7s), and All-Red (1–5s) timing validation, MQTT deployment, versioning, and controller ACK tracking (`FR-4`, `UC-06`, `NFR-14`). |
| **Emergency Priority** | Corridor clearance override (NS / EW), failsafe clearance transition, automatic 120-second hard safety timeout, and real-time broadcast (`FR-5`, `UC-07`, `NFR-14`). |
| **Incident & Fault Reporting**| Police incident recording (`FR-6`), hardware problem ticketing with severity classification (`FR-7`), and Admin status triage (`FR-8`). |
| **Reports & Analytics** | Parametric date filtering, aggregate incident counts, high-resolution PDF inspection summaries, and Excel (.xlsx) workbooks (`FR-9`, `FR-10`). |
| **Real-Time Monitoring** | Sub-second Socket.IO push updates, physical signal light representations (Red/Yellow/Green), countdown timers, and offline warnings (`FR-11`, `UC-08`). |
| **Audit Trail & System Logs** | Immutable historical logging of all administrative actions, emergency activations, and timing alterations (`FR-12`, `NFR-15`). |

---

## 🛠 Technology Stack

### Frontend
- **Framework & Runtime**: React 18, TypeScript 5, Vite 5
- **Styling & UI**: Tailwind CSS, Lucide React Icons
- **State Management**: TanStack React Query v5
- **Mapping**: Leaflet 1.9, OpenStreetMap
- **Forms & Validation**: React Hook Form, Zod
- **Data Visualizations**: Recharts
- **Live Communication**: Socket.IO Client

### Backend
- **Runtime**: Node.js (ESM), Express.js, TypeScript 5
- **Database & ORM**: PostgreSQL, Prisma ORM
- **Security**: JWT (`jsonwebtoken`), `bcryptjs`, Express Rate Limiter, Helmet
- **IoT & Protocols**: MQTT.js, Socket.IO Server
- **Report Generation**: PDFKit, ExcelJS

### IoT / Embedded Firmware
- **Hardware**: ESP32-WROOM-32 (Dual Core 240MHz, 4MB Flash)
- **OS / Environment**: FreeRTOS, Arduino Core for ESP32
- **Display & Storage**: I2C LiquidCrystal 16x2 / 20x4, ESP32 NVS (Preferences)
- **Watchdog**: Hardware Task Watchdog Timer (8s timeout)

---

## ⚡ Quick Start & Local Execution

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- Optional: PostgreSQL instance (the backend comes equipped with an out-of-the-box in-memory relational store pre-seeded with all intersections, users, and logs).

### 1. Repository Setup
```bash
git clone https://github.com/Samieyu/ESP32-IoT-Traffic-Signal-Management-System.git
cd "ESP32-IoT-Traffic-Signal-Management-System"
git checkout develop
```

### 2. Backend Startup
```bash
cd backend
npm install
npm run build
npm start
# Server listens on http://localhost:5000 (REST: http://localhost:5000/api/v1)
```

### 3. Frontend Startup
```bash
cd ../frontend
npm install
npm run dev
# Dashboard available at http://localhost:5173
```

---

## 🔑 Default Seeded Demo Credentials

| Role | Username | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin@traffic.wachemo.edu.et` | `Admin@123456` | Full system control across all intersections and officers. |
| **Traffic Police** | `officer_alemu` | `alemu.t@traffic.wachemo.edu.et` | `Officer@123456` | Assigned to Hosanna Central Post Office Crossing (`int-hosanna-01`). |
| **Traffic Police** | `officer_chala` | `chala.m@traffic.wachemo.edu.et` | `Officer@123456` | Assigned to Wachemo Main Gate & Hosanna Hospital Intersections. |

---

## 📁 Repository Structure

```
.
├── backend/                  # Node.js + Express + Prisma REST API & Socket.IO server
│   ├── prisma/               # Schema definitions & database migration seeds
│   ├── src/
│   │   ├── config/           # Database, environment variables, and constants
│   │   ├── controllers/      # Route controllers for all functional modules
│   │   ├── middleware/       # JWT auth, RBAC, scope check, error handlers
│   │   ├── mqtt/             # MQTT broker client & Virtual Twin ESP32 Simulator
│   │   ├── repositories/     # In-memory relational store mirroring Prisma
│   │   ├── routes/           # REST API endpoints mounted at /api/v1
│   │   ├── services/         # Business logic, validation, PDF/Excel generation
│   │   ├── socket/           # WebSocket room manager (intersection:{id})
│   │   └── utils/            # JWT helpers, UUID generators, time utilities
│   └── tests/                # Jest integration and unit test suite
├── frontend/                 # React 18 + Vite + Tailwind CSS Single Page Application
│   ├── src/
│   │   ├── api/              # Axios/Fetch API client with token refresh
│   │   ├── components/       # Common UI elements & Traffic Signal displays
│   │   ├── context/          # Auth and WebSocket React Context providers
│   │   ├── pages/            # Admin & Traffic Police page implementations
│   │   └── types/            # TypeScript interfaces & API contracts
├── firmware/                 # C++ Arduino FreeRTOS sketch for physical ESP32
│   └── esp32_traffic_controller.ino
└── docs/                     # Comprehensive System Documentation
    ├── REQUIREMENTS_TRACEABILITY.md
    ├── SYSTEM_ARCHITECTURE.md
    ├── DATABASE_DESIGN.md
    ├── API_DOCUMENTATION.md
    ├── ESP32_MQTT_INTEGRATION.md
    ├── INSTALLATION_GUIDE.md
    ├── DEPLOYMENT_GUIDE.md
    ├── TESTING_GUIDE.md
    ├── ENVIRONMENT_VARIABLES.md
    └── DEVELOPMENT_PROGRESS.md
```

---

## 🛡 Rigorous Safety Invariants (NFR-14)

1. **Hardware Interlocking**: Physical signal logic strictly prohibits North-South and East-West Green lights from illuminating simultaneously. If an invalid state is commanded, the controller immediately forces an **Emergency All-Red Failsafe**.
2. **Mandatory Clearance Intervals**: Transitioning between opposing traffic directions requires a non-negotiable **Yellow interval (3 to 7 seconds)** followed by an **All-Red clearance interval (1 to 5 seconds)**.
3. **Emergency Override Timeout**: Any emergency green corridor command enforced by a Traffic Police officer is capped at a hard maximum of **120 seconds**, after which the controller automatically cycles back through All-Red clearance into regular operation.

---

## 📚 Complete Project Documentation Index

- 📐 [System Architecture Specification](SYSTEM_ARCHITECTURE.md)
- 🗄 [Database Schema & Entity Relationship Design](DATABASE_DESIGN.md)
- 🌐 [REST API Specification & Endpoint Catalog](API_DOCUMENTATION.md)
- 📡 [ESP32 Firmware & MQTT Integration Manual](ESP32_MQTT_INTEGRATION.md)
- 💻 [Local Installation & Setup Guide](INSTALLATION_GUIDE.md)
- ☁️ [Production Deployment Guide (Render, Cloudflare, Neon)](DEPLOYMENT_GUIDE.md)
- 🧪 [Comprehensive Testing Guide & Verification Reports](TESTING_GUIDE.md)
- 📋 [Requirements Traceability Matrix](REQUIREMENTS_TRACEABILITY.md)
- 🔑 [Environment Variables Dictionary](ENVIRONMENT_VARIABLES.md)
- 📈 [Development Progress & Milestone Log](DEVELOPMENT_PROGRESS.md)

---
*Developed for Wachemo University Department of Software Engineering — SEng4162 Real Time and Embedded Systems.*
