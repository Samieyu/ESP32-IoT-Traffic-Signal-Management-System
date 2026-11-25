# 🌐 REST API & WebSocket Real-Time Specification
> **Traffic Light System Automation — Wachemo University (SEng4162)**  
> *Base API URL: `http://localhost:5000/api/v1` (or production Render gateway)*

---

## 📌 Standard Request & Response Architecture

### 1. Authentication Header
All protected API endpoints require an `Authorization` HTTP header carrying a valid JSON Web Token (JWT):
```http
Authorization: Bearer <ACCESS_TOKEN>
```

### 2. Standard Success Response Envelope
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully.",
  "timestamp": "2026-11-25T08:30:00.000Z"
}
```

### 3. Standard Error Envelope
```json
{
  "success": false,
  "error": "VALIDATION_FAILED",
  "message": "Required timing parameters failed safety constraint envelope.",
  "details": [
    {
      "field": "yellowTime",
      "issue": "Yellow clearance must be between 3 and 7 seconds."
    }
  ],
  "timestamp": "2026-11-25T08:30:00.000Z"
}
```

---

## 🔐 1. Authentication & Session Endpoints (`/auth`)

### `POST /auth/login`
Authenticates an Administrator or Traffic Police officer.

- **Rate Limit**: 5 attempts per 15-minute window per IP.
- **Request Body**:
```json
{
  "usernameOrEmail": "officer_alemu",
  "password": "Officer@123456"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "usr-officer-01",
      "fullName": "Alemu Tadesse",
      "username": "officer_alemu",
      "email": "alemu.t@traffic.wachemo.edu.et",
      "role": "TRAFFIC_POLICE",
      "status": "ACTIVE"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```
- **Error Codes**: `400 Bad Request`, `401 Invalid Credentials`, `403 ACCOUNT_INACTIVE`, `429 Too Many Requests`.

---

### `POST /auth/refresh`
Refreshes an expired short-lived access token using a valid 7-day refresh token.
- **Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### `GET /auth/me`
Retrieves current authenticated profile and active session parameters.
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**: User profile object.

---

### `POST /auth/logout`
Revokes active session tokens and records authentication termination in system logs.
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**: `{ "success": true, "message": "Logged out successfully." }`

---

## 👥 2. Officer & Account Management (`/users`)
*Requires `ADMIN` role.*

### `GET /users`
Lists all user accounts with filtering and pagination.
- **Query Parameters**:
  - `role`: `ADMIN` | `TRAFFIC_POLICE` (optional)
  - `status`: `ACTIVE` | `INACTIVE` (optional)
  - `search`: Search query by name, username, or email
  - `page`: Page index (default: `1`)
  - `limit`: Records per page (default: `20`)

### `POST /users`
Registers a new Traffic Police officer account (`FR-2`).
- **Request Body**:
```json
{
  "fullName": "Yohannes Bekele",
  "username": "officer_yohannes",
  "email": "yohannes.b@traffic.wachemo.edu.et",
  "phone": "+251911223344",
  "password": "SecurePassword@123",
  "role": "TRAFFIC_POLICE"
}
```

### `PATCH /users/:id/status`
Activates or deactivates an officer account.
- **Request Body**:
```json
{
  "status": "INACTIVE"
}
```

### `DELETE /users/:id`
Deletes an account or performs soft-deactivation if operational records exist (`FR-2`).

---

## 🗺 3. Intersections & Crossings (`/intersections`)

### `GET /intersections`
Retrieves registered intersections. Administrators see all crossings; Traffic Police see assigned intersections (`FR-3`).
- **Query Parameters**: `status`, `search`, `region`.

### `POST /intersections` (Admin Only)
Registers a new road intersection (`FR-3`).
- **Request Body**:
```json
{
  "name": "Hosanna Commercial Bank Square",
  "code": "INT-HOS-03",
  "description": "Junction between Main Highway and Market Boulevard",
  "region": "Central Ethiopia",
  "city": "Hosanna",
  "latitude": 7.5532,
  "longitude": 37.8541,
  "numberOfApproaches": 4,
  "controllerDeviceId": "ESP32_WROOM_C4D8_03"
}
```

### `GET /intersections/my-assigned` (Police Only)
Lists intersections assigned to the currently authenticated Traffic Police officer.

---

## 🚦 4. Signal Configuration & Timing Sync (`/signal-configs`)

### `POST /signal-configs` (Admin Only)
Applies a new timing schedule and broadcasts to ESP32 via MQTT (`FR-4`).
- **Request Body**:
```json
{
  "intersectionId": "int-hosanna-01",
  "nsGreenTime": 35,
  "ewGreenTime": 25,
  "yellowTime": 4,
  "allRedTime": 2,
  "maxEmergencyTime": 90,
  "lcdEnabled": true,
  "lcdMessage": "CAUTION DRIVE SAFE"
}
```
- **Validation Constraints (NFR-14)**:
  - `nsGreenTime`: 10–120 seconds
  - `ewGreenTime`: 10–120 seconds
  - `yellowTime`: 3–7 seconds
  - `allRedTime`: 1–5 seconds
  - `maxEmergencyTime`: 10–120 seconds

### `GET /signal-configs/:intersectionId`
Returns active configuration and current controller delivery/ACK status.

---

## 🚨 5. Emergency Priority Control (`/emergency`)
*Restricted to Administrators and Police assigned to the target crossing.*

### `POST /emergency/request`
Activates green corridor priority override (`FR-5`).
- **Request Body**:
```json
{
  "intersectionId": "int-hosanna-01",
  "corridorDirection": "NORTH_SOUTH",
  "vehicleType": "AMBULANCE",
  "reason": "Critical medical emergency en route to Hosanna General Hospital"
}
```
- **Failsafe Transition**:
  - If opposing corridor (EW) is active green, backend commands immediate Yellow (4s) -> All-Red (2s) -> North-South Emergency Green.
  - Hard safety timer initiated (120s limit).

### `POST /emergency/terminate`
Manually cancels an active emergency override and returns intersection to normal cycle.
- **Request Body**:
```json
{
  "operationId": "emg-op-9821a-442"
}
```

---

## 📝 6. Traffic Incidents (`/incidents`)

### `POST /incidents`
Records a road traffic accident, collision, or traffic flow violation (`FR-6`).
- **Request Body**:
```json
{
  "intersectionId": "int-hosanna-01",
  "incidentType": "ACCIDENT",
  "severity": "HIGH",
  "description": "Two-vehicle collision blocking eastern pedestrian approach.",
  "involvedVehicles": "Minibus (Code 3) and Private Sedan",
  "actionsTaken": "Directed emergency towing and rerouted inbound traffic."
}
```

### `GET /incidents`
Lists all incidents (Admin: all, Police: restricted to assigned intersections).

---

## 🛠 7. Hardware Problem Reports (`/problems`)

### `POST /problems`
Submits an equipment malfunction or physical hardware failure report (`FR-7`).
- **Request Body**:
```json
{
  "intersectionId": "int-hosanna-01",
  "component": "TRAFFIC_LIGHT",
  "severity": "CRITICAL",
  "title": "Eastbound Green LED Signal Burnout",
  "description": "Green LED array is completely dark during EW GO phase."
}
```

### `PATCH /problems/:id/status` (Admin Only)
Updates resolution status (`FR-8`): `PENDING` -> `IN_PROGRESS` -> `RESOLVED` -> `CLOSED`.

---

## 📊 8. Analytic Reports & Export Engine (`/reports`)

### `GET /reports/summary`
Returns aggregate statistics, incident distributions, and problem status counts.

### `GET /reports/export/pdf`
Streams a formatted analytical PDF report (`FR-10`).
- **Query Params**: `startDate`, `endDate`, `intersectionId`.

### `GET /reports/export/excel`
Streams an Excel (`.xlsx`) workbook containing data sheets for Intersections, Incidents, and Problems (`FR-10`).

---

## ⚡ 9. WebSocket Socket.IO Real-Time Gateway

### Connection URL
```
ws://localhost:5000/socket.io/?token=<JWT_ACCESS_TOKEN>
```

### Client -> Server Events
| Event | Payload | Description |
| :--- | :--- | :--- |
| `join_intersection` | `{ "intersectionId": "int-hosanna-01" }` | Subscribes client to real-time telemetry room for this crossing. |
| `leave_intersection`| `{ "intersectionId": "int-hosanna-01" }` | Leaves crossing room. |

### Server -> Client Emitted Events
| Event | Payload Summary | Description |
| :--- | :--- | :--- |
| `traffic_status_update` | `{ intersectionId, phase, countdown, northSouth, eastWest, timestamp }` | Sub-second state update for visual lights and countdowns. |
| `emergency_priority_alert` | `{ intersectionId, status, corridorDirection, activeUntil }` | Broadcasted when an emergency vehicle corridor is opened or ended. |
| `controller_status_changed`| `{ intersectionId, isConnected, lastSeen }` | Broadcasted when an ESP32 connects, disconnects, or misses heartbeats. |
| `system_notification` | `{ id, title, message, type, createdAt }` | Real-time push notification for operational staff. |

---
*Maintained by Wachemo University Department of Software Engineering.*
