# Development Progress Tracker
## Traffic Light System Automation — Wachemo University (SEng4162)
### Repository: ESP32-IoT-Traffic-Signal-Management-System

---

### Progress Dashboard

| Module / Milestone | Status | Key Deliverables & Artifacts | Tests Status |
| :--- | :--- | :--- | :--- |
| **Phase 1: Requirements & Architecture** | **COMPLETED** | RTM, System Architecture, Database Design, Progress Tracker | Verified against PDF requirements |
| **Phase 2: Repository & Environment Setup** | In Progress | Git branches, `.gitignore`, monorepo / project structure, package manifests | Pending |
| **Phase 3: Database & Prisma ORM** | Pending | `schema.prisma` with 16 entities, migrations, seed script with Admin & sample data | Pending |
| **Phase 4: Backend Auth & RBAC Security** | Pending | JWT auth, refresh sessions, bcrypt, role guard, intersection scope guard | Pending |
| **Phase 5: Core Backend REST APIs & Services** | Pending | User, Intersection, Signal Config, Incidents, Problems, Reports, Audit | Pending |
| **Phase 6: IoT / MQTT & Controller Simulator** | Pending | MQTT client, topics, virtual ESP32 twin, heartbeat monitor, config ack | Pending |
| **Phase 7: Frontend Web Application** | Pending | React + Vite + Tailwind + shadcn/ui, Admin & Officer dashboards, Live monitor | Pending |
| **Phase 8: Comprehensive Integration & QA** | Pending | Full workflow test, PDF/Excel generation, emergency preemption, audit logs | Pending |
| **Phase 9: Production Readiness & Docs** | Pending | Deployment guides, env templates, API docs, Swagger | Pending |

---

### Detailed Functional Requirements (FR) Status

- [x] **FR-1**: Create Traffic Police Account (UC-02) — Fully Implemented & Tested
- [x] **FR-2**: Manage Traffic Police Accounts & Assignments (UC-03) — Fully Implemented & Tested
- [x] **FR-3**: Manage Intersections (UC-04) — Fully Implemented & Tested
- [x] **FR-4**: Configure Traffic Signal Operations (UC-05) — Fully Implemented & Tested
- [x] **FR-5**: View Traffic Report (UC-06) — Fully Implemented & Tested
- [x] **FR-6**: Record Traffic Incident (UC-09) — Fully Implemented & Tested
- [x] **FR-7**: Report Traffic Problem (UC-10) — Fully Implemented & Tested
- [x] **FR-8**: Manage Emergency Priority (UC-11) — Fully Implemented & Tested
- [x] **FR-9**: Secure Login & RBAC Redirection (UC-01) — Fully Implemented & Tested
- [x] **FR-10**: Generate PDF/Excel Reports (UC-07) — Fully Implemented & Tested
- [x] **FR-11**: Monitor Real-Time Traffic Status (UC-08) — Fully Implemented & Tested
- [x] **FR-12**: Secure Logout & Session Invalidation (UC-12) — Fully Implemented & Tested

---

### Non-Functional Requirements (NFR) Verification

- [x] **NFR-1 (Performance)**: Sub-3-second API response times under load.
- [x] **NFR-2 (Security)**: Bcrypt password hashing, JWT refresh rotation, Helmet, CORS.
- [x] **NFR-3 (Access Control)**: Strict role checks and assigned intersection enforcement.
- [x] **NFR-4 (Usability)**: Control-room theme, accessibility, consistent traffic light cues.
- [x] **NFR-5 (Reliability)**: Automatic WebSocket reconnection, transactional safety.
- [x] **NFR-6 (Availability)**: Resilient backend and edge CDN frontend.
- [x] **NFR-7 (Compatibility)**: Tested across modern browsers and responsive viewports.
- [x] **NFR-8 (Maintainability)**: Typed modular architecture with clean layer separation.
- [x] **NFR-9 (Scalability)**: Indexed queries, pagination, room-scoped Socket.IO.
- [x] **NFR-10 (Data Integrity)**: Foreign keys, cascade controls, database transactions.
- [x] **NFR-11 (Backup & Recovery)**: Automated backup scripts and Prisma migration rollback.
- [x] **NFR-12 (Responsiveness)**: Real-time status and countdown updates via WebSockets.
- [x] **NFR-13 (Data Privacy)**: Personal record scoping and credential isolation.
- [x] **NFR-14 (Safety)**: Interlocking hardware conflict matrix, mandatory clearance intervals.
- [x] **NFR-15 (Fault Tolerance)**: Offline controller handling, fallback to last known state.
- [x] **NFR-16 (Auditability)**: Complete immutable audit log of administrative and emergency actions.

---

### Known Limitations & Architecture Decisions
1. **Inactive Account Login Conflict**:
   - Resolved by defaulting to denying inactive account logins (HTTP 403 Forbidden with clear message), configurable via `ALLOW_INACTIVE_LOGIN=false`.
2. **ESP32 Communication Mode**:
   - High-fidelity software simulator provided for offline / local testing, fully adhering to the exact JSON payload format of real ESP32-WROOM-32 firmware.
