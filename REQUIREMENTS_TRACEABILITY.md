# Requirements Traceability Matrix (RTM)
## Traffic Light System Automation — Wachemo University (SEng4162)

### 1. Overview & Document Context
This document maps all Functional Requirements (FR-1 to FR-12), Non-Functional Requirements (NFR-1 to NFR-16), and Use Cases (UC-01 to UC-12) extracted directly from the primary project document:
**Traffic Light System Automation — Wachemo University, College of Engineering and Technology, Department of Software Engineering (Course: SEng4162 - Real Time and Embedded Systems)**.

---

### 2. Ambiguity & Conflict Analysis

#### Conflict: Inactive / Deactivated Account Login Policy
* **Source Conflict**:
  * **FR-2 (Page 4)** states: *"Accounts associated with operational records are deactivated instead of permanently deleted to preserve historical information. Deactivated Traffic Police accounts are allowed to log in."*
  * **UC-01 Login (Page 9)** states: *"Precondition: 2. The user's account must be active. Alternative Scenario Step 3: If the account is inactive, the system denies access."*
  * **UC-03 Notes (Page 11)** states: *"3. Deactivated accounts cannot log in."*
  * **Login Activity Diagram (Page 22)** states: *"is account active? -> [NO] system display inactive account -> End."*
* **Architectural Resolution & Configurable Policy**:
  * **Default Security Policy**: In accordance with the project prompt and standard security practices, the system **prevents inactive/deactivated accounts from logging in** by default.
  * Attempting to log in with a deactivated account returns HTTP 403 Forbidden with `{ "code": "ACCOUNT_INACTIVE", "message": "Your account has been deactivated. Please contact the system administrator." }`.
  * The policy is governed by a configurable environment variable `ALLOW_INACTIVE_LOGIN=false`. If explicitly set to `true`, deactivated accounts receive read-only/restricted access, but cannot perform operational overrides (emergency priority, incident submissions, or signal configurations).

---

### 3. Functional Requirements Traceability Matrix

| Req ID | Requirement Title | Actor | Source Use Case | Implementation Component | Verification / Test Case | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-1** | Create Traffic Police Account | Administrator | UC-02 | `UserController.createOfficer`, `UserService`, `UserFormDialog` | Validation test, Duplicate email/username rejection, Password hashing | Pending |
| **FR-2** | Manage Traffic Police Accounts | Administrator | UC-03 | `UserController`, `AssignmentController`, `UserTable`, `AssignOfficerModal` | Deactivation on record presence, Assignment update/remove, Historical record preservation | Pending |
| **FR-3** | Manage Intersections | Administrator | UC-04 | `IntersectionController`, `IntersectionService`, `IntersectionFormDialog`, `IntersectionList` | Unique intersection code, Coordinate validation, Deactivation on operational records | Pending |
| **FR-4** | Configure Traffic Signal Operations | Administrator | UC-05 | `SignalConfigController`, `SignalConfigService`, `MqttService`, `SignalConfigPage` | Safety validation (min clearance, no green conflicts), MQTT dispatch, Versioning, Acknowledgment tracking | Pending |
| **FR-5** | View Traffic Report | Administrator | UC-06 | `ReportController.getReports`, `ReportViewerModal`, `ReportList` | Role-based retrieval, Filter by date/intersection/type, PDF/Excel rendering | Pending |
| **FR-6** | Record Traffic Incident | Traffic Police | UC-09 | `IncidentController.createIncident`, `IncidentForm`, `EvidenceUploader` | Assigned intersection check, Unique reference ID (`INC-YYYYMMDD-XXXX`), Photo attachment | Pending |
| **FR-7** | Report Traffic Problem | Traffic Police | UC-10 | `ProblemReportController.createReport`, `ProblemForm`, `NotificationService` | Category branching (Traffic Violation vs Technical), Plate capture, Admin notification failure tolerance | Pending |
| **FR-8** | Manage Emergency Priority | Traffic Police | UC-11 | `EmergencyController`, `MqttService`, `EmergencyPriorityModal`, ESP32 Firmware/Simulator | Safety verification, Yellow/All-Red clearance interval, 120s max duration cutoff, Manual/Auto termination | Pending |
| **FR-9** | Login | All Authenticated | UC-01 | `AuthController.login`, `JwtService`, `LoginForm`, `AuthGuard` | Bcrypt compare, Role redirection (Admin vs Traffic Police), Inactive account denial, JWT refresh cookie | Pending |
| **FR-10** | Generate Report | Admin, Traffic Police | UC-07 | `ReportGeneratorService`, `PdfExportService`, `ExcelExportService`, `ReportFilter` | Dynamic PDF styling with KaTeX/tables, ExcelJS worksheets, Scope restriction by assigned intersection | Pending |
| **FR-11** | Monitor Real-Time Traffic Status | Admin, Traffic Police | UC-08 | `MonitoringController`, `SocketService`, `MqttSubscriber`, `LiveIntersectionMonitor` | Live signal state (R/Y/G per approach), Live countdown, Controller connection state, OFFLINE/stale badge | Pending |
| **FR-12** | Logout | All Authenticated | UC-12 | `AuthController.logout`, `TokenRevocationService`, `NavbarMenu` | Refresh token invalidation, Clear cookie, Client state reset, Redirect to /login | Pending |

---

### 4. Non-Functional Requirements Matrix

| NFR ID | Category | Requirement Description | Architecture & Technical Implementation | Verification Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **NFR-1** | Performance | Respond to normal requests within 3 seconds | Database indexing on foreign keys & lookup codes, lean payload serialization, TanStack Query caching | Load & latency benchmarking (< 500ms typical) |
| **NFR-2** | Security | Protect accounts, configurations, operational data | Bcrypt password hashing (12 salt rounds), short-lived JWT access tokens (15m), secure HTTP-only refresh tokens, CORS, Helmet headers, Zod input validation | Security audit, unauthorized payload injection tests |
| **NFR-3** | Access Control | Role-based permissions & intersection scoping | `authMiddleware`, `roleGuard(['ADMIN', 'TRAFFIC_POLICE'])`, `intersectionScopeGuard` on officer actions | Access restriction tests (police accessing admin endpoints or unauthorized intersections) |
| **NFR-4** | Usability | Clear, modern, control-room UI | Dark navy sidebar (`#0f172a`), neutral light backdrop, high contrast traffic state indicators (Red, Yellow, Green, Blue, Gray), accessible aria labels | Responsive UI review, screen layout verification |
| **NFR-5** | Reliability | Accurate traffic light status & fault recovery | Socket.IO reconnection backoff, MQTT QoS 1 for commands and status updates, transactional database operations | Intermittent connection simulation, status recovery verification |
| **NFR-6** | Availability | High availability & resilience | Stateless Express API architecture, Cloudflare Pages CDN for frontend, robust health check endpoints (`/api/v1/health`) | Process uptime checks, database disconnection graceful handling |
| **NFR-7** | Compatibility | Modern desktop and mobile browser support | Vite responsive build, Tailwind CSS breakpoints (`sm`, `md`, `lg`, `xl`), touch-friendly controls | Chrome, Firefox, Edge, Safari, and mobile viewport testing |
| **NFR-8** | Maintainability | Clean, modular, well-documented architecture | Layered architecture (`controllers`, `services`, `repositories`, `mqtt`, `socket`), comprehensive TypeScript typing, JSDoc | ESLint compliance, zero TypeScript build errors |
| **NFR-9** | Scalability | Support additional intersections & users | Cursor/offset pagination, database connection pooling with Prisma, room-based Socket.IO subscriptions per intersection | Multi-intersection throughput and room broadcast testing |
| **NFR-10** | Data Integrity | Consistent and accurate records | Prisma relational schema with FK cascades/restrict rules, DB transactions (`prisma.$transaction`) on atomic updates | Relational integrity tests, rollback verification |
| **NFR-11** | Backup & Recovery | Regular backups and recovery procedures | Documented backup procedures (`scripts/backup-db.sh`, `pg_dump`), automated migration management with Prisma | Migration deployment and rollback dry run |
| **NFR-12** | Responsiveness | Immediate update of signal status and countdown | MQTT broker publishes into backend -> Node.js MQTT subscriber -> Socket.IO emits directly to connected clients (< 200ms) | Real-time latency measurement between controller tick and UI render |
| **NFR-13** | Data Privacy | Restrict personal data & operational records | Password hashes excluded from API serialization, Traffic Police can only view their own reports & assigned intersection data | Officer data isolation verification |
| **NFR-14** | Safety | Prevent conflicting green movements & enforce clearance | Interlocking logic: North-South green STRICTLY forbids East-West green. Mandatory yellow transition (3-5s) and all-red clearance (1-3s) before direction change | Safety validation unit tests, illegal transition rejection |
| **NFR-15** | Fault Tolerance | Controller continues on last valid config during failure | ESP32 stores active timing parameters in EEPROM/NVS; backend shows OFFLINE + last known timestamp without crashing | Network severance simulation, controller autonomous looping |
| **NFR-16** | Auditability | Traceable records of admin changes & emergency ops | Immutable `AuditLog` table capturing actor, action, IP, timestamp, previous value, new value | Audit trail query tests for config updates & emergency actions |
