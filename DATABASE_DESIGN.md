# Database Design & Schema Specification
## Traffic Light System Automation — Wachemo University (SEng4162)

### 1. Database Architecture & Design Principles

The database layer utilizes **PostgreSQL** with **Prisma ORM**. It is strictly normalized to 3NF/BCNF, enforces referential integrity via foreign key constraints, indexes critical lookup columns and foreign keys, and provides immutable audit logging for all administrative, configuration, and emergency actions.

#### Key Principles:
1. **Preservation of Operational History**:
   - In compliance with FR-2 and FR-3, entities with historical associations (`User`, `Intersection`) are marked with status `INACTIVE` rather than deleted when historical records (incidents, reports, configurations, emergency interventions) exist.
2. **Transactional Integrity**:
   - Atomic state transitions (e.g. initiating emergency priority, applying signal configurations) execute within serializable or read-committed database transactions.
3. **Optimized for Real-Time & Reporting**:
   - High-write operational tables (`TrafficStatus`, `AuditLog`, `Notification`) use targeted B-Tree indexes on `intersectionId`, `createdAt`, `userId`, and `status`.

---

### 2. Entity-Relationship Diagram (Mermaid)

```mermaid
erDiagram
    User ||--o{ RefreshTokenSession : "issues"
    User ||--o{ IntersectionAssignment : "assigned to"
    User ||--o{ TrafficIncident : "records"
    User ||--o{ TrafficProblemReport : "submits"
    User ||--o{ EmergencyPriorityOperation : "requests"
    User ||--o{ GeneratedReport : "generates"
    User ||--o{ Notification : "receives"
    User ||--o{ AuditLog : "initiates"

    Intersection ||--o{ IntersectionAssignment : "manned by"
    Intersection ||--o1 TrafficController : "controlled by"
    Intersection ||--o{ SignalConfiguration : "configured with"
    Intersection ||--o{ TrafficStatus : "reports status"
    Intersection ||--o{ TrafficIncident : "occurs at"
    Intersection ||--o{ TrafficProblemReport : "affects"
    Intersection ||--o{ EmergencyPriorityOperation : "experiences"
    Intersection ||--o{ GeneratedReport : "filtered by"

    SignalConfiguration ||--o{ ConfigurationDelivery : "tracked by"

    TrafficIncident ||--o{ EvidenceAttachment : "has evidence"
    TrafficProblemReport ||--o{ EvidenceAttachment : "has evidence"

    User {
        uuid id PK
        string email UK
        string username UK
        string passwordHash
        string fullName
        string phoneNumber
        enum role "ADMIN | TRAFFIC_POLICE"
        enum status "ACTIVE | INACTIVE"
        datetime lastLoginAt
        datetime createdAt
        datetime updatedAt
    }

    RefreshTokenSession {
        uuid id PK
        uuid userId FK
        string tokenHash UK
        string deviceInfo
        string ipAddress
        datetime expiresAt
        boolean isRevoked
        datetime createdAt
    }

    Intersection {
        uuid id PK
        string code UK
        string name
        string description
        string region
        string city
        decimal latitude
        decimal longitude
        int approachesCount
        enum status "ACTIVE | INACTIVE"
        datetime createdAt
        datetime updatedAt
    }

    IntersectionAssignment {
        uuid id PK
        uuid userId FK
        uuid intersectionId FK
        datetime assignedAt
        datetime unassignedAt
        enum status "ACTIVE | INACTIVE"
        string assignedBy
        datetime createdAt
        datetime updatedAt
    }

    TrafficController {
        uuid id PK
        string deviceId UK
        uuid intersectionId FK,UK
        string firmwareVersion
        string hardwareType "ESP32-WROOM-32"
        enum connectionStatus "ONLINE | OFFLINE | UNCONFIGURED"
        datetime lastHeartbeatAt
        datetime lastStatusAt
        string ipAddress
        string macAddress
        datetime registeredAt
        datetime updatedAt
    }

    SignalConfiguration {
        uuid id PK
        uuid intersectionId FK
        int version
        int northSouthGreenDuration
        int eastWestGreenDuration
        int yellowDuration
        int allRedClearanceDuration
        int maxEmergencyPriorityDuration
        boolean lcdEnabled
        string lcdDisplayMode
        string lcdCustomMessage
        boolean countdownDisplayEnabled
        json outputMapping
        enum status "ACTIVE | DRAFT | ARCHIVED"
        uuid createdById FK
        datetime createdAt
        datetime updatedAt
    }

    ConfigurationDelivery {
        uuid id PK
        uuid configurationId FK
        string deviceId
        enum deliveryStatus "PENDING | SENT | ACKNOWLEDGED | FAILED | TIMEOUT"
        string acknowledgmentPayload
        string failureReason
        datetime sentAt
        datetime acknowledgedAt
        datetime createdAt
    }

    TrafficStatus {
        uuid id PK
        uuid intersectionId FK
        string deviceId
        enum northSignal "RED | YELLOW | GREEN"
        enum southSignal "RED | YELLOW | GREEN"
        enum eastSignal "RED | YELLOW | GREEN"
        enum westSignal "RED | YELLOW | GREEN"
        int countdownRemaining
        string operatingPhase
        enum operatingMode "NORMAL | EMERGENCY_PREEMPTION | MANUAL_OVERRIDE | FAULT"
        boolean isEmergencyActive
        int uptimeSeconds
        datetime recordedAt
    }

    TrafficIncident {
        uuid id PK
        string referenceId UK
        uuid intersectionId FK
        uuid reportedById FK
        enum incidentType "ROAD_ACCIDENT | ROAD_OBSTRUCTION | EMERGENCY_INTERVENTION | OTHER"
        enum severity "LOW | MEDIUM | HIGH | CRITICAL"
        datetime incidentTimestamp
        string description
        string additionalNotes
        enum status "OPEN | UNDER_REVIEW | RESOLVED | CLOSED"
        datetime createdAt
        datetime updatedAt
    }

    TrafficProblemReport {
        uuid id PK
        string referenceId UK
        uuid intersectionId FK
        uuid reportedById FK
        enum category "TRAFFIC_VIOLATION | TECHNICAL_INFRASTRUCTURE"
        string problemType
        datetime reportTimestamp
        string description
        string licensePlateNumber
        enum urgency "LOW | MEDIUM | HIGH | CRITICAL"
        enum notificationStatus "SENT | FAILED | PENDING"
        enum status "REPORTED | INVESTIGATING | RESOLVED | DISMISSED"
        datetime createdAt
        datetime updatedAt
    }

    EvidenceAttachment {
        uuid id PK
        uuid incidentId FK
        uuid problemReportId FK
        string fileName
        string fileUrl
        string fileType
        int fileSize
        datetime uploadedAt
    }

    EmergencyPriorityOperation {
        uuid id PK
        string referenceId UK
        uuid intersectionId FK
        uuid officerId FK
        string deviceId
        enum direction "NORTH | SOUTH | EAST | WEST"
        enum movement "STRAIGHT | LEFT | RIGHT"
        int maxDurationSeconds
        int actualDurationSeconds
        enum status "PENDING | APPROVED | REJECTED | ACTIVE | COMPLETED | AUTO_TERMINATED | FAILED | CANCELLED"
        string terminationReason
        datetime requestedAt
        datetime activatedAt
        datetime terminatedAt
        datetime createdAt
    }

    GeneratedReport {
        uuid id PK
        string referenceId UK
        uuid generatedById FK
        uuid intersectionId FK
        enum reportType "INCIDENTS | PROBLEMS | VIOLATIONS | TECHNICAL | EMERGENCY | OPERATIONAL | CONTROLLERS | POLICE_ACTIVITY"
        string title
        datetime startDate
        datetime endDate
        json filterParameters
        enum exportFormat "PDF | EXCEL"
        string fileUrl
        datetime createdAt
    }

    Notification {
        uuid id PK
        uuid userId FK
        string title
        string message
        enum category "OFFICER_ACCOUNT | ASSIGNMENT | CONFIGURATION | INCIDENT | PROBLEM | EMERGENCY | CONTROLLER"
        enum severity "INFO | WARNING | CRITICAL | SUCCESS"
        string linkUrl
        boolean isRead
        datetime readAt
        datetime createdAt
    }

    AuditLog {
        uuid id PK
        uuid userId FK
        string userRole
        string action
        string entityType
        string entityId
        string ipAddress
        string userAgent
        json previousValues
        json newValues
        datetime createdAt
    }
```

---

### 3. Schema Data Constraints and Safety Invariants

1. **Traffic Signal Durations**:
   - `northSouthGreenDuration`: Minimum 10s, Maximum 180s.
   - `eastWestGreenDuration`: Minimum 10s, Maximum 180s.
   - `yellowDuration`: Minimum 3s, Maximum 7s (Safety standard clearance).
   - `allRedClearanceDuration`: Minimum 1s, Maximum 5s (Mandatory all-red deadzone).
   - `maxEmergencyPriorityDuration`: Minimum 15s, Maximum 120s (Firmware watchdog ceiling).
2. **Intersection Code**:
   - Alphanumeric, format: `INT-[REGION]-[0-9]{3}`, e.g., `INT-AA-001`, `INT-WCU-002`. Unique index enforced.
3. **Reference IDs**:
   - Incidents: `INC-YYYYMMDD-XXXX` (Sequential/Cryptographic 4-char suffix).
   - Problems: `PRB-YYYYMMDD-XXXX`.
   - Emergency Operations: `EMG-YYYYMMDD-XXXX`.
   - Reports: `REP-YYYYMMDD-XXXX`.
