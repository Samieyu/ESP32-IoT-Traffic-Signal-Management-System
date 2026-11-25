import bcrypt from 'bcryptjs';
import { uuidv4 } from '../utils/id.utils.js';

export interface UserEntity {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  fullName: string;
  phoneNumber?: string | null;
  role: 'ADMIN' | 'TRAFFIC_POLICE';
  status: 'ACTIVE' | 'INACTIVE';
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefreshSessionEntity {
  id: string;
  userId: string;
  tokenHash: string;
  deviceInfo?: string | null;
  ipAddress?: string | null;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
}

export interface IntersectionEntity {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  approachesCount: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

export interface AssignmentEntity {
  id: string;
  userId: string;
  intersectionId: string;
  assignedAt: Date;
  unassignedAt?: Date | null;
  status: 'ACTIVE' | 'INACTIVE';
  assignedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ControllerEntity {
  id: string;
  deviceId: string;
  intersectionId: string;
  firmwareVersion: string;
  hardwareType: string;
  connectionStatus: 'ONLINE' | 'OFFLINE' | 'UNCONFIGURED';
  lastHeartbeatAt?: Date | null;
  lastStatusAt?: Date | null;
  ipAddress?: string | null;
  macAddress?: string | null;
  registeredAt: Date;
  updatedAt: Date;
}

export interface SignalConfigEntity {
  id: string;
  intersectionId: string;
  version: number;
  northSouthGreenDuration: number;
  eastWestGreenDuration: number;
  yellowDuration: number;
  allRedClearanceDuration: number;
  maxEmergencyPriorityDuration: number;
  lcdEnabled: boolean;
  lcdDisplayMode: string;
  lcdCustomMessage?: string | null;
  countdownDisplayEnabled: boolean;
  outputMapping?: any;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConfigDeliveryEntity {
  id: string;
  configurationId: string;
  deviceId: string;
  deliveryStatus: 'PENDING' | 'SENT' | 'ACKNOWLEDGED' | 'FAILED' | 'TIMEOUT';
  acknowledgmentPayload?: string | null;
  failureReason?: string | null;
  sentAt?: Date | null;
  acknowledgedAt?: Date | null;
  createdAt: Date;
}

export interface TrafficStatusEntity {
  id: string;
  intersectionId: string;
  deviceId: string;
  northSignal: 'RED' | 'YELLOW' | 'GREEN';
  southSignal: 'RED' | 'YELLOW' | 'GREEN';
  eastSignal: 'RED' | 'YELLOW' | 'GREEN';
  westSignal: 'RED' | 'YELLOW' | 'GREEN';
  countdownRemaining: number;
  operatingPhase: string;
  operatingMode: 'NORMAL' | 'EMERGENCY_PREEMPTION' | 'MANUAL_OVERRIDE' | 'FAULT';
  isEmergencyActive: boolean;
  uptimeSeconds: number;
  recordedAt: Date;
}

export interface IncidentEntity {
  id: string;
  referenceId: string;
  intersectionId: string;
  reportedById: string;
  incidentType: 'ROAD_ACCIDENT' | 'ROAD_OBSTRUCTION' | 'EMERGENCY_INTERVENTION' | 'OTHER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  incidentTimestamp: Date;
  description: string;
  additionalNotes?: string | null;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
  evidence?: EvidenceEntity[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProblemReportEntity {
  id: string;
  referenceId: string;
  intersectionId: string;
  reportedById: string;
  category: 'TRAFFIC_VIOLATION' | 'TECHNICAL_INFRASTRUCTURE';
  problemType: string;
  reportTimestamp: Date;
  description: string;
  licensePlateNumber?: string | null;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  notificationStatus: 'SENT' | 'FAILED' | 'PENDING';
  status: 'REPORTED' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  evidence?: EvidenceEntity[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EvidenceEntity {
  id: string;
  incidentId?: string | null;
  problemReportId?: string | null;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
}

export interface EmergencyOperationEntity {
  id: string;
  referenceId: string;
  intersectionId: string;
  officerId: string;
  deviceId: string;
  direction: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
  movement: 'STRAIGHT' | 'LEFT' | 'RIGHT';
  maxDurationSeconds: number;
  actualDurationSeconds?: number | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'COMPLETED' | 'AUTO_TERMINATED' | 'FAILED' | 'CANCELLED';
  terminationReason?: string | null;
  requestedAt: Date;
  activatedAt?: Date | null;
  terminatedAt?: Date | null;
  createdAt: Date;
}

export interface GeneratedReportEntity {
  id: string;
  referenceId: string;
  generatedById: string;
  intersectionId?: string | null;
  reportType: 'INCIDENTS' | 'PROBLEMS' | 'VIOLATIONS' | 'TECHNICAL' | 'EMERGENCY' | 'OPERATIONAL' | 'CONTROLLERS' | 'POLICE_ACTIVITY';
  title: string;
  startDate: Date;
  endDate: Date;
  filterParameters?: any;
  exportFormat: 'PDF' | 'EXCEL';
  fileUrl?: string | null;
  createdAt: Date;
}

export interface NotificationEntity {
  id: string;
  userId: string;
  title: string;
  message: string;
  category: 'OFFICER_ACCOUNT' | 'ASSIGNMENT' | 'CONFIGURATION' | 'INCIDENT' | 'PROBLEM' | 'EMERGENCY' | 'CONTROLLER';
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  linkUrl?: string | null;
  isRead: boolean;
  readAt?: Date | null;
  createdAt: Date;
}

export interface AuditLogEntity {
  id: string;
  userId?: string | null;
  userRole: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  previousValues?: any;
  newValues?: any;
  createdAt: Date;
}

// In-Memory Repository Database Store
class InMemoryStore {
  users: UserEntity[] = [];
  refreshSessions: RefreshSessionEntity[] = [];
  intersections: IntersectionEntity[] = [];
  assignments: AssignmentEntity[] = [];
  controllers: ControllerEntity[] = [];
  configurations: SignalConfigEntity[] = [];
  configurationDeliveries: ConfigDeliveryEntity[] = [];
  trafficStatuses: TrafficStatusEntity[] = [];
  incidents: IncidentEntity[] = [];
  problemReports: ProblemReportEntity[] = [];
  evidence: EvidenceEntity[] = [];
  emergencyOperations: EmergencyOperationEntity[] = [];
  generatedReports: GeneratedReportEntity[] = [];
  notifications: NotificationEntity[] = [];
  auditLogs: AuditLogEntity[] = [];

  private isInitialized = false;

  async initSeed() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Default Passwords hashed with bcrypt
    const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 10);
    const officerPasswordHash = await bcrypt.hash('OfficerPassword123!', 10);

    const adminId = 'usr-admin-0000-0000-000000000001';
    const officer1Id = 'usr-police-0000-0000-000000000002';
    const officer2Id = 'usr-police-0000-0000-000000000003';
    const inactiveOfficerId = 'usr-police-0000-0000-000000000004';

    this.users = [
      {
        id: adminId,
        email: 'admin@traffic.wcu.edu.et',
        username: 'admin',
        passwordHash: adminPasswordHash,
        fullName: 'Mesay Aschalew (Administrator)',
        phoneNumber: '+251911002233',
        role: 'ADMIN',
        status: 'ACTIVE',
        lastLoginAt: new Date(),
        createdAt: new Date('2026-01-10T08:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: officer1Id,
        email: 'officer.mesay@traffic.wcu.edu.et',
        username: 'officer_mesay',
        passwordHash: officerPasswordHash,
        fullName: 'Officer Mesay Haile',
        phoneNumber: '+251911223344',
        role: 'TRAFFIC_POLICE',
        status: 'ACTIVE',
        lastLoginAt: new Date(),
        createdAt: new Date('2026-01-15T09:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: officer2Id,
        email: 'officer.abebe@traffic.wcu.edu.et',
        username: 'officer_abebe',
        passwordHash: officerPasswordHash,
        fullName: 'Officer Abebe Kebede',
        phoneNumber: '+251912334455',
        role: 'TRAFFIC_POLICE',
        status: 'ACTIVE',
        lastLoginAt: new Date(),
        createdAt: new Date('2026-01-20T10:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: inactiveOfficerId,
        email: 'officer.inactive@traffic.wcu.edu.et',
        username: 'officer_inactive',
        passwordHash: officerPasswordHash,
        fullName: 'Officer Inactive (Policy Test)',
        phoneNumber: '+251913445566',
        role: 'TRAFFIC_POLICE',
        status: 'INACTIVE',
        lastLoginAt: null,
        createdAt: new Date('2026-01-25T11:00:00Z'),
        updatedAt: new Date(),
      },
    ];

    const int1Id = 'int-wcu-0000-0000-000000000001';
    const int2Id = 'int-hos-0000-0000-000000000002';
    const int3Id = 'int-hos-0000-0000-000000000003';

    this.intersections = [
      {
        id: int1Id,
        code: 'INT-WCU-001',
        name: 'Wachemo University Main Gate Crossroads',
        description: 'Major intersection connecting Wachemo University main gate with Hosanna arterial highway.',
        region: 'Central Ethiopia',
        city: 'Hosanna',
        latitude: 8.020015,
        longitude: 37.850024,
        approachesCount: 4,
        status: 'ACTIVE',
        createdAt: new Date('2026-01-10T10:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: int2Id,
        code: 'INT-HOS-002',
        name: 'Hosanna Central Commercial Square',
        description: 'High-density commercial roundabout intersection in downtown Hosanna.',
        region: 'Central Ethiopia',
        city: 'Hosanna',
        latitude: 8.015042,
        longitude: 37.855011,
        approachesCount: 4,
        status: 'ACTIVE',
        createdAt: new Date('2026-01-12T11:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: int3Id,
        code: 'INT-HOS-003',
        name: 'Hosanna Intercity Bus Terminal Junction',
        description: 'Junction connecting regional bus terminals to southern transit corridors.',
        region: 'Central Ethiopia',
        city: 'Hosanna',
        latitude: 8.012011,
        longitude: 37.860045,
        approachesCount: 4,
        status: 'INACTIVE',
        createdAt: new Date('2026-01-14T12:00:00Z'),
        updatedAt: new Date(),
      },
    ];

    // Intersection Assignments
    this.assignments = [
      {
        id: 'asg-0000-0000-0000-000000000001',
        userId: officer1Id,
        intersectionId: int1Id,
        assignedAt: new Date('2026-01-16T08:00:00Z'),
        status: 'ACTIVE',
        assignedBy: 'System Administrator',
        createdAt: new Date('2026-01-16T08:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'asg-0000-0000-0000-000000000002',
        userId: officer1Id,
        intersectionId: int2Id,
        assignedAt: new Date('2026-01-18T08:00:00Z'),
        status: 'ACTIVE',
        assignedBy: 'System Administrator',
        createdAt: new Date('2026-01-18T08:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'asg-0000-0000-0000-000000000003',
        userId: officer2Id,
        intersectionId: int2Id,
        assignedAt: new Date('2026-01-21T08:00:00Z'),
        status: 'ACTIVE',
        assignedBy: 'System Administrator',
        createdAt: new Date('2026-01-21T08:00:00Z'),
        updatedAt: new Date(),
      },
    ];

    // Hardware Controllers
    this.controllers = [
      {
        id: 'ctrl-0000-0000-0000-000000000001',
        deviceId: 'ESP32-WCU-001',
        intersectionId: int1Id,
        firmwareVersion: '1.2.0-wcu',
        hardwareType: 'ESP32-WROOM-32',
        connectionStatus: 'ONLINE',
        lastHeartbeatAt: new Date(),
        lastStatusAt: new Date(),
        ipAddress: '192.168.1.150',
        macAddress: '24:6F:28:B2:A1:10',
        registeredAt: new Date('2026-01-10T12:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'ctrl-0000-0000-0000-000000000002',
        deviceId: 'ESP32-HOS-002',
        intersectionId: int2Id,
        firmwareVersion: '1.2.0-wcu',
        hardwareType: 'ESP32-WROOM-32',
        connectionStatus: 'ONLINE',
        lastHeartbeatAt: new Date(),
        lastStatusAt: new Date(),
        ipAddress: '192.168.1.151',
        macAddress: '24:6F:28:B2:A1:12',
        registeredAt: new Date('2026-01-12T13:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'ctrl-0000-0000-0000-000000000003',
        deviceId: 'ESP32-HOS-003',
        intersectionId: int3Id,
        firmwareVersion: '1.1.0-wcu',
        hardwareType: 'ESP32-WROOM-32',
        connectionStatus: 'OFFLINE',
        lastHeartbeatAt: new Date(Date.now() - 3600000 * 4), // 4 hours ago
        lastStatusAt: new Date(Date.now() - 3600000 * 4),
        ipAddress: '192.168.1.152',
        macAddress: '24:6F:28:B2:A1:14',
        registeredAt: new Date('2026-01-14T14:00:00Z'),
        updatedAt: new Date(),
      },
    ];

    // Signal Configurations
    const cfg1Id = 'cfg-0000-0000-0000-000000000001';
    this.configurations = [
      {
        id: cfg1Id,
        intersectionId: int1Id,
        version: 1,
        northSouthGreenDuration: 35,
        eastWestGreenDuration: 30,
        yellowDuration: 4,
        allRedClearanceDuration: 2,
        maxEmergencyPriorityDuration: 60,
        lcdEnabled: true,
        lcdDisplayMode: 'COUNTDOWN_AND_PHASE',
        lcdCustomMessage: 'Wachemo Univ Safe Crossing',
        countdownDisplayEnabled: true,
        outputMapping: {
          north: { red: 23, yellow: 22, green: 21 },
          south: { red: 19, yellow: 18, green: 5 },
          east: { red: 17, yellow: 16, green: 4 },
          west: { red: 2, yellow: 15, green: 13 },
        },
        status: 'ACTIVE',
        createdById: adminId,
        createdAt: new Date('2026-01-10T14:00:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'cfg-0000-0000-0000-000000000002',
        intersectionId: int2Id,
        version: 1,
        northSouthGreenDuration: 40,
        eastWestGreenDuration: 35,
        yellowDuration: 4,
        allRedClearanceDuration: 2,
        maxEmergencyPriorityDuration: 60,
        lcdEnabled: true,
        lcdDisplayMode: 'COUNTDOWN_AND_PHASE',
        lcdCustomMessage: 'Hosanna Central Traffic Control',
        countdownDisplayEnabled: true,
        status: 'ACTIVE',
        createdById: adminId,
        createdAt: new Date('2026-01-12T15:00:00Z'),
        updatedAt: new Date(),
      },
    ];

    this.configurationDeliveries = [
      {
        id: 'del-0000-0000-0000-000000000001',
        configurationId: cfg1Id,
        deviceId: 'ESP32-WCU-001',
        deliveryStatus: 'ACKNOWLEDGED',
        acknowledgmentPayload: JSON.stringify({ status: 'SUCCESS', version: 1, appliedAt: new Date().toISOString() }),
        sentAt: new Date('2026-01-10T14:01:00Z'),
        acknowledgedAt: new Date('2026-01-10T14:01:03Z'),
        createdAt: new Date('2026-01-10T14:01:00Z'),
      },
    ];

    // Live Traffic Status
    this.trafficStatuses = [
      {
        id: 'sta-0000-0000-0000-000000000001',
        intersectionId: int1Id,
        deviceId: 'ESP32-WCU-001',
        northSignal: 'GREEN',
        southSignal: 'GREEN',
        eastSignal: 'RED',
        westSignal: 'RED',
        countdownRemaining: 18,
        operatingPhase: 'NORTH_SOUTH_GREEN',
        operatingMode: 'NORMAL',
        isEmergencyActive: false,
        uptimeSeconds: 86400,
        recordedAt: new Date(),
      },
      {
        id: 'sta-0000-0000-0000-000000000002',
        intersectionId: int2Id,
        deviceId: 'ESP32-HOS-002',
        northSignal: 'RED',
        southSignal: 'RED',
        eastSignal: 'GREEN',
        westSignal: 'GREEN',
        countdownRemaining: 24,
        operatingPhase: 'EAST_WEST_GREEN',
        operatingMode: 'NORMAL',
        isEmergencyActive: false,
        uptimeSeconds: 72000,
        recordedAt: new Date(),
      },
      {
        id: 'sta-0000-0000-0000-000000000003',
        intersectionId: int3Id,
        deviceId: 'ESP32-HOS-003',
        northSignal: 'RED',
        southSignal: 'RED',
        eastSignal: 'RED',
        westSignal: 'RED',
        countdownRemaining: 0,
        operatingPhase: 'OFFLINE_STANDBY',
        operatingMode: 'FAULT',
        isEmergencyActive: false,
        uptimeSeconds: 0,
        recordedAt: new Date(Date.now() - 3600000 * 4),
      },
    ];

    // Incidents
    this.incidents = [
      {
        id: 'inc-0000-0000-0000-000000000001',
        referenceId: 'INC-20260215-0001',
        intersectionId: int1Id,
        reportedById: officer1Id,
        incidentType: 'ROAD_ACCIDENT',
        severity: 'MEDIUM',
        incidentTimestamp: new Date('2026-02-15T08:30:00Z'),
        description: 'Minor fender bender between passenger minibus and bajaj at north entry lane. Lane partially obstructed.',
        additionalNotes: 'Traffic routed smoothly via east slip lane.',
        status: 'RESOLVED',
        createdAt: new Date('2026-02-15T08:45:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'inc-0000-0000-0000-000000000002',
        referenceId: 'INC-20260218-0002',
        intersectionId: int2Id,
        reportedById: officer2Id,
        incidentType: 'ROAD_OBSTRUCTION',
        severity: 'HIGH',
        incidentTimestamp: new Date('2026-02-18T14:10:00Z'),
        description: 'Heavy construction truck stalled in central intersection zone causing severe vehicle backlog.',
        additionalNotes: 'Tow truck deployed; priority clearance requested.',
        status: 'UNDER_REVIEW',
        createdAt: new Date('2026-02-18T14:20:00Z'),
        updatedAt: new Date(),
      },
    ];

    // Problem Reports
    this.problemReports = [
      {
        id: 'prb-0000-0000-0000-000000000001',
        referenceId: 'PRB-20260210-0001',
        intersectionId: int1Id,
        reportedById: officer1Id,
        category: 'TRAFFIC_VIOLATION',
        problemType: 'Red Light Running',
        reportTimestamp: new Date('2026-02-10T16:22:00Z'),
        description: 'Toyota Hilux ignored red light phase at north approach during high-speed university transit.',
        licensePlateNumber: 'ET-3-84920',
        urgency: 'HIGH',
        notificationStatus: 'SENT',
        status: 'REPORTED',
        createdAt: new Date('2026-02-10T16:25:00Z'),
        updatedAt: new Date(),
      },
      {
        id: 'prb-0000-0000-0000-000000000002',
        referenceId: 'PRB-20260212-0002',
        intersectionId: int3Id,
        reportedById: officer2Id,
        category: 'TECHNICAL_INFRASTRUCTURE',
        problemType: 'Controller Power Supply Fluctuation',
        reportTimestamp: new Date('2026-02-12T11:05:00Z'),
        description: 'ESP32 controller at bus terminal lost grid connection due to unstable utility line voltage.',
        urgency: 'CRITICAL',
        notificationStatus: 'SENT',
        status: 'INVESTIGATING',
        createdAt: new Date('2026-02-12T11:10:00Z'),
        updatedAt: new Date(),
      },
    ];

    // Emergency Operations
    this.emergencyOperations = [
      {
        id: 'emg-0000-0000-0000-000000000001',
        referenceId: 'EMG-20260214-0001',
        intersectionId: int1Id,
        officerId: officer1Id,
        deviceId: 'ESP32-WCU-001',
        direction: 'NORTH',
        movement: 'STRAIGHT',
        maxDurationSeconds: 60,
        actualDurationSeconds: 42,
        status: 'COMPLETED',
        terminationReason: 'Officer manual termination: Hosanna Hospital ambulance cleared crossroads safely.',
        requestedAt: new Date('2026-02-14T09:12:00Z'),
        activatedAt: new Date('2026-02-14T09:12:06Z'),
        terminatedAt: new Date('2026-02-14T09:12:48Z'),
        createdAt: new Date('2026-02-14T09:12:00Z'),
      },
    ];

    // Notifications
    this.notifications = [
      {
        id: 'notif-0000-0000-0000-000000000001',
        userId: adminId,
        title: 'New Traffic Problem Reported',
        message: 'Officer Mesay reported a high-urgency Traffic Violation (Ref: PRB-20260210-0001) at INT-WCU-001.',
        category: 'PROBLEM',
        severity: 'WARNING',
        linkUrl: '/traffic-problems',
        isRead: false,
        createdAt: new Date('2026-02-10T16:25:00Z'),
      },
      {
        id: 'notif-0000-0000-0000-000000000002',
        userId: adminId,
        title: 'Emergency Priority Preemption Completed',
        message: 'Emergency vehicle successfully cleared INT-WCU-001 under manual officer preemption.',
        category: 'EMERGENCY',
        severity: 'SUCCESS',
        linkUrl: '/emergency-history',
        isRead: true,
        readAt: new Date('2026-02-14T09:30:00Z'),
        createdAt: new Date('2026-02-14T09:12:48Z'),
      },
      {
        id: 'notif-0000-0000-0000-000000000003',
        userId: officer1Id,
        title: 'New Intersection Assigned',
        message: 'You have been assigned as active patrol officer for Hosanna Central Commercial Square (INT-HOS-002).',
        category: 'ASSIGNMENT',
        severity: 'INFO',
        linkUrl: '/assigned-intersections',
        isRead: false,
        createdAt: new Date('2026-01-18T08:00:00Z'),
      },
    ];

    // Audit Logs
    this.auditLogs = [
      {
        id: 'aud-0000-0000-0000-000000000001',
        userId: adminId,
        userRole: 'ADMIN',
        action: 'UPDATE_SIGNAL_CONFIGURATION',
        entityType: 'SignalConfiguration',
        entityId: cfg1Id,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        previousValues: { northSouthGreenDuration: 30, eastWestGreenDuration: 30 },
        newValues: { northSouthGreenDuration: 35, eastWestGreenDuration: 30 },
        createdAt: new Date('2026-01-10T14:00:00Z'),
      },
      {
        id: 'aud-0000-0000-0000-000000000002',
        userId: officer1Id,
        userRole: 'TRAFFIC_POLICE',
        action: 'INITIATE_EMERGENCY_PRIORITY',
        entityType: 'EmergencyPriorityOperation',
        entityId: 'emg-0000-0000-0000-000000000001',
        ipAddress: '192.168.1.105',
        userAgent: 'TrafficPoliceMobile/1.0',
        newValues: { direction: 'NORTH', movement: 'STRAIGHT', duration: 60 },
        createdAt: new Date('2026-02-14T09:12:00Z'),
      },
    ];

    console.log('🌱 In-Memory Relational Store Seeded with 16 Entities, Users & Demo Records.');
  }
}

export const dbStore = new InMemoryStore();
