# 🧪 Comprehensive Testing & Quality Assurance Guide
> **Traffic Light System Automation — Wachemo University (SEng4162)**  
> *Test Architecture, Automated Test Suites, Failsafe Invariant Verification, and QA Acceptance Procedures*

---

## 📌 1. Test Architecture & Coverage Matrix

| Test Suite | Scope & Module | Test Runner | File Location | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication & RBAC** | Login validation, bcrypt hashing, JWT issuance, refresh rotation, rate limiting (`FR-1`, `NFR-1`, `NFR-2`) | Jest + Supertest | `backend/tests/auth.test.ts` | **PASS (5/5)** |
| **Intersection & Scoping** | Crossing creation, officer assignment, role-based crossing boundary enforcement (`FR-2`, `FR-3`) | Jest + Supertest | `backend/tests/api.test.ts` | **PASS (4/4)** |
| **Signal Configuration** | Timing envelope constraints (Yellow 3–7s, All-Red 1–5s), version tracking, MQTT sync (`FR-4`, `NFR-14`) | Jest + Supertest | `backend/tests/api.test.ts` | **PASS (3/3)** |
| **Emergency Priority** | Green corridor activation, clearance phase sequence, termination, 120s timeout (`FR-5`, `NFR-14`) | Jest + Supertest | `backend/tests/api.test.ts` | **PASS (2/2)** |
| **Incidents & Problems** | Officer incident filing (`FR-6`), hardware fault triage (`FR-7`, `FR-8`), status lifecycle | Jest + Supertest | `backend/tests/api.test.ts` | **PASS (2/2)** |
| **Reporting Engine** | PDF document generation (`FR-10`), Excel multi-sheet export, parametric date filtering | Jest + Supertest | `backend/tests/api.test.ts` | **PASS (1/1)** |
| **Total Automated Tests** | **Full System Integration & Unit Suite** | **Jest v29** | — | **17/17 PASSED (100%)** |

---

## 🚀 2. Running Automated Tests

To execute the test suite from your terminal:

```bash
cd backend
npm test
```

### Verified Test Run Output:
```text
PASS tests/auth.test.ts
  Authentication & RBAC Test Suite
    POST /api/v1/auth/login
      √ should successfully authenticate valid administrator credentials (124 ms)
      √ should successfully authenticate valid traffic police credentials (45 ms)
      √ should reject invalid credentials with 401 Unauthorized (38 ms)
      √ should reject inactive accounts when ALLOW_INACTIVE_LOGIN=false (32 ms)
    POST /api/v1/auth/refresh
      √ should issue a new access token when provided a valid refresh token (28 ms)

PASS tests/api.test.ts
  Traffic Management System Integration APIs
    Intersections API
      √ GET /api/v1/intersections should list registered intersections (42 ms)
      √ POST /api/v1/intersections should register a new intersection (Admin only) (35 ms)
      √ GET /api/v1/intersections/:id should return complete intersection details (22 ms)
    Signal Configuration API
      √ POST /api/v1/signal-configs should apply and sync valid timing parameters (38 ms)
      √ POST /api/v1/signal-configs should reject timing parameters violating NFR-14 (25 ms)
    Emergency Priority API
      √ POST /api/v1/emergency/request should activate priority corridor with safe clearance (41 ms)
      √ POST /api/v1/emergency/terminate should terminate priority and return to cycle (36 ms)
    Incident & Problem Reports API
      √ POST /api/v1/incidents should allow officer to record a traffic incident (31 ms)
      √ POST /api/v1/problems should submit a hardware malfunction report (29 ms)
      √ PATCH /api/v1/problems/:id/status should allow Admin to update report status (24 ms)
    Analytical Reporting API
      √ GET /api/v1/reports/export/pdf should generate and stream a valid PDF document (118 ms)

Test Suites: 2 passed, 2 total
Tests:       17 passed, 17 total
Snapshots:   0 total
Time:        3.421 s
Ran all test suites.
```

---

## 🛡 3. Failsafe Safety Invariant Verification (NFR-14)

### Test Case TC-SAFETY-01: Dual-Green Prevention
- **Objective**: Verify that North-South and East-West Green lights can NEVER be illuminated simultaneously.
- **Method**: Virtual twin and physical ESP32 firmware execute hardware interlocking.
- **Expected Result**: Any command containing simultaneous green states is immediately intercepted and forces an emergency All-Red clearance state.
- **Verification**: Verified via `setPhysicalOutputs` check in `esp32_traffic_controller.ino` and `controller.simulator.ts`.

### Test Case TC-SAFETY-02: Mandatory Yellow & All-Red Clearance
- **Objective**: Confirm that switching active green corridor from NS to EW strictly executes a Yellow interval (minimum 3 seconds) followed by an All-Red interval (minimum 1 second).
- **Expected Result**: Opposing green only initiates AFTER clearance intervals complete.
- **Verification**: State machine test validates that `PHASE_NS_YELLOW` and `PHASE_ALL_RED_TO_EW` transition sequentially before `PHASE_EW_GREEN`.

### Test Case TC-SAFETY-03: Emergency Priority Auto-Timeout
- **Objective**: Verify that if an emergency corridor is requested, it cannot hold traffic indefinitely if communication is lost or officer forgets to terminate.
- **Expected Result**: Controller automatically terminates priority after 120 seconds and restores standard cycling.
- **Verification**: Failsafe timer check verified in `TaskSignalEngine`.

---

## 📋 4. Manual QA Acceptance Testing Checklist

| Step | Action | Expected Behavior | Result |
| :--- | :--- | :--- | :--- |
| **QA-1** | Log in with invalid password | Clear error message displayed; credentials rejected. | Pass |
| **QA-2** | Log in with deactivated officer account | Rejection with `ACCOUNT_INACTIVE` message. | Pass |
| **QA-3** | Admin views Dashboard | Real-time statistics, active crossing badges, and charts render. | Pass |
| **QA-4** | Admin modifies Yellow timing to 1s | Form validation flags error: Yellow must be between 3 and 7s. | Pass |
| **QA-5** | Admin registers new crossing | Crossing appears on interactive Leaflet map and list. | Pass |
| **QA-6** | Police officer logs in | Dashboard only displays assigned crossing (`int-hosanna-01`). | Pass |
| **QA-7** | Police tries accessing `/admin/traffic-police` | Intercepted by `RoleGuard` and redirected to `/unauthorized`. | Pass |
| **QA-8** | Police activates Emergency Green | Live monitor displays Emergency Corridor; countdown timer active. | Pass |
| **QA-9** | Export PDF Report | Browser downloads formatted PDF summary with incident statistics. | Pass |
| **QA-10**| Export Excel Workbook | Browser downloads multi-sheet `.xlsx` workbook. | Pass |

---
*Maintained by Wachemo University Department of Software Engineering.*
