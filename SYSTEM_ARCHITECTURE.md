# System Architecture Document
## Traffic Light System Automation — Wachemo University (SEng4162)

### 1. Architectural Overview & Design Goals

The **Traffic Light System Automation** is an integrated IoT-enabled cyber-physical system designed to modernize intersection management, real-time signal monitoring, incident recording, and emergency vehicle preemption. The system consists of:
1. **Physical / Simulated Edge Controllers**: ESP32-WROOM-32 microcontrollers managing 4-way intersection signals (North, South, East, West) and 16x2 I2C LCD countdown displays over MQTT.
2. **Centralized Backend Service**: High-performance Node.js / Express / TypeScript backend handling business logic, relational persistence with Prisma ORM and PostgreSQL, JWT auth, MQTT brokering, and live WebSockets (Socket.IO).
3. **Web-Based Management Control Room**: Responsive React + Vite + TypeScript application tailored for Traffic Administrators and field Traffic Police.
4. **Future-Proof Mobile API Gateway**: Universal REST + WebSocket interface ready for immediate consumption by the upcoming Flutter Android application without requiring separate backends.

---

### 2. End-to-End System Architecture Diagram

```mermaid
flowchart TD
    subgraph EdgeLayer["Edge / IoT Layer (ESP32-WROOM-32)"]
        ESP32["ESP32 Microcontroller<br/>(FreeRTOS / Arduino Core)"]
        LEDs["Traffic Signals (12 LEDs)<br/>North/South/East/West (R, Y, G)"]
        LCD["16x2 I2C LCD Display<br/>Phase & Countdown Time"]
        ESP32 --> LEDs
        ESP32 --> LCD
    end

    subgraph CommunicationBroker["MQTT Broker (HiveMQ / EMQX / Mosquitto)"]
        MQTT_STATUS["traffic/intersections/{id}/status"]
        MQTT_HB["traffic/intersections/{id}/heartbeat"]
        MQTT_CMD["traffic/intersections/{id}/commands"]
        MQTT_CONFIG["traffic/intersections/{id}/config"]
        MQTT_ACK["traffic/intersections/{id}/ack"]
    end

    ESP32 -->|Publishes Status (1s)| MQTT_STATUS
    ESP32 -->|Publishes Heartbeat (5s)| MQTT_HB
    ESP32 -->|Publishes Acks| MQTT_ACK
    MQTT_CMD -->|Subscribes to Commands| ESP32
    MQTT_CONFIG -->|Subscribes to Config| ESP32

    subgraph BackendLayer["Central Backend Service (Node.js + Express + TypeScript)"]
        MqttClientService["MQTT Client Service<br/>(MQTT.js Bridge)"]
        SocketServer["Socket.IO Gateway<br/>(Real-Time Rooms)"]
        
        API_GW["REST API Gateway (/api/v1)"]
        AuthModule["Auth & RBAC Module<br/>(JWT, Bcrypt, Refresh Sessions)"]
        SignalService["Signal & Safety Engine<br/>(Timing, Clearance, Interlock)"]
        EmergencyService["Emergency Priority Engine<br/>(Safety Validation & Timeout)"]
        ReportingService["Report Engine<br/>(PDFKit, ExcelJS)"]
        AuditService["Audit Logger<br/>(Immutable Operational Trail)"]
        
        MqttClientService <--> CommunicationBroker
        MqttClientService --> SignalService
        MqttClientService --> EmergencyService
        MqttClientService --> SocketServer
        
        API_GW --> AuthModule
        API_GW --> SignalService
        API_GW --> EmergencyService
        API_GW --> ReportingService
        API_GW --> AuditService
    end

    subgraph DatabaseLayer["Relational Persistence Layer"]
        PostgresDB[(Neon PostgreSQL Database)]
        PrismaORM["Prisma ORM Client"]
        BackendLayer --> PrismaORM
        PrismaORM --> PostgresDB
    end

    subgraph PresentationLayer["Presentation Clients"]
        AdminWeb["Admin Web Dashboard<br/>(React, Vite, Tailwind, shadcn/ui)"]
        PoliceWeb["Traffic Police Portal<br/>(React, Vite, TanStack Query)"]
        FlutterApp["Future Flutter Mobile App<br/>(iOS / Android via same APIs)"]
    end

    AdminWeb <-->|HTTPS REST API /api/v1| API_GW
    AdminWeb <-->|WSS Socket.IO Live Events| SocketServer
    
    PoliceWeb <-->|HTTPS REST API /api/v1| API_GW
    PoliceWeb <-->|WSS Socket.IO Live Events| SocketServer
    
    FlutterApp -.->|HTTPS REST API /api/v1| API_GW
    FlutterApp -.->|WSS Socket.IO Live Events| SocketServer
```

---

### 3. Backend Architecture & Modular Decomposition

The backend utilizes a strict, enterprise-grade **Layered Architecture**:

```
backend/
├── src/
│   ├── config/              # Environment validation (Zod), constants, CORS, database configs
│   ├── controllers/         # Request handling, HTTP status codes, validation binding
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── intersection.controller.ts
│   │   ├── signal-config.controller.ts
│   │   ├── monitoring.controller.ts
│   │   ├── incident.controller.ts
│   │   ├── problem-report.controller.ts
│   │   ├── emergency.controller.ts
│   │   ├── report.controller.ts
│   │   ├── notification.controller.ts
│   │   └── audit-log.controller.ts
│   ├── services/            # Business logic, safety interlocking, transaction management
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── intersection.service.ts
│   │   ├── signal-config.service.ts
│   │   ├── emergency.service.ts
│   │   ├── incident.service.ts
│   │   ├── problem-report.service.ts
│   │   ├── report-generator.service.ts
│   │   ├── notification.service.ts
│   │   ├── audit-log.service.ts
│   │   ├── pdf-export.service.ts
│   │   └── excel-export.service.ts
│   ├── mqtt/                # MQTT client, message dispatchers, topic handlers, simulator
│   │   ├── mqtt.client.ts
│   │   ├── mqtt.topics.ts
│   │   ├── mqtt.handlers.ts
│   │   └── controller.simulator.ts # High-fidelity ESP32 virtual twin for tests/demo
│   ├── socket/              # Socket.IO event emitters, room managers, client subscriptions
│   │   └── socket.server.ts
│   ├── middleware/          # JWT auth guard, RBAC permission guard, intersection scope guard, rate limiting
│   │   ├── auth.middleware.ts
│   │   ├── role.middleware.ts
│   │   ├── intersection-scope.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── rate-limiter.middleware.ts
│   ├── validators/          # Zod validation schemas for all inputs & API requests
│   ├── types/               # TypeScript interfaces, enums, DTOs
│   ├── utils/               # Reference ID generator, date formatters, logger
│   └── index.ts             # Server entrypoint
├── prisma/
│   ├── schema.prisma        # Normalized schema with 16 core entities
│   └── seed.ts              # Idempotent development & demo data seed
```

---

### 4. Traffic Signal State Machine & Safety Interlocking (NFR-14)

Traffic signal safety is enforced through mathematical guarantees and strict state transitions:
1. **Conflict Matrix**:
   - $\text{Phase 1 (North-South)}: \text{Green}_{\text{NS}} \land \text{Red}_{\text{EW}}$
   - $\text{Phase 2 (North-South Clearance)}: \text{Yellow}_{\text{NS}} \land \text{Red}_{\text{EW}}$ (3–5 seconds)
   - $\text{Phase 3 (All-Red Clearance)}: \text{Red}_{\text{NS}} \land \text{Red}_{\text{EW}}$ (1–3 seconds mandatory clearance)
   - $\text{Phase 4 (East-West)}: \text{Red}_{\text{NS}} \land \text{Green}_{\text{EW}}$
   - $\text{Phase 5 (East-West Clearance)}: \text{Red}_{\text{NS}} \land \text{Yellow}_{\text{EW}}$ (3–5 seconds)
   - $\text{Phase 6 (All-Red Clearance)}: \text{Red}_{\text{NS}} \land \text{Red}_{\text{EW}}$ (1–3 seconds mandatory clearance)
2. **Emergency Preemption Interlocking**:
   - An emergency request **NEVER** jumps directly to Green on the requested approach.
   - If conflicting traffic is currently Green, it immediately transitions to Yellow for the configured yellow interval, then to All-Red for the clearance interval, and only then grants Green to the requested emergency approach.
   - All opposing approaches are forced into Solid Red.
   - Maximum emergency duration is strictly bounded (default 60s, max 120s). A watchdog timer inside both backend and ESP32 hardware forces a safe transition back to normal fixed-time cycling if the officer fails to manually terminate.

---

### 5. Future Flutter Android Application Integration Design

The system is designed with forward API compatibility for the upcoming Flutter Android application:
- **Unified REST API**: Mobile client accesses `/api/v1/*` with identical JSON payloads.
- **Stateless Authorization**: Header-based `Authorization: Bearer <access_token>` supported alongside HTTP-only browser cookies.
- **Refresh Token Rotation**: Mobile uses `/api/v1/auth/refresh` with device fingerprinting and refresh tokens.
- **Multi-Platform Socket.IO**: Real-time traffic monitoring maps 1:1 with `socket_io_client` Flutter package.
- **Multipart Form Uploads**: Standard `multipart/form-data` endpoints for incident photos and violation evidence.
- **OpenAPI / Swagger Specification**: Automatically generated schema enables Flutter client generation via `openapi-generator`.

---

### 6. Deployment Architecture

- **Frontend**: Cloudflare Pages (Global Edge CDN distribution, automated SSL, SPA routing).
- **Backend API**: Render Web Service (Node.js runtime, HTTPS termination, auto-restarts).
- **Database**: Neon Serverless PostgreSQL (auto-scaling connection pooling, automated backups, zero-maintenance).
- **MQTT Transport**: Secure MQTTS (TLS v1.3 on port 8883) with device credential authentication.
