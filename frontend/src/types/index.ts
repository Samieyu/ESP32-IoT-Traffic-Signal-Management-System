export type UserRole = 'ADMIN' | 'TRAFFIC_POLICE';
export type AccountStatus = 'ACTIVE' | 'INACTIVE';
export type IntersectionStatus = 'ACTIVE' | 'INACTIVE';
export type ConnectionStatus = 'ONLINE' | 'OFFLINE' | 'UNCONFIGURED';
export type SignalColor = 'RED' | 'YELLOW' | 'GREEN';
export type OperatingMode = 'NORMAL' | 'EMERGENCY_PREEMPTION' | 'MANUAL_OVERRIDE' | 'FAULT';
export type EmergencyDirection = 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
export type EmergencyMovement = 'STRAIGHT' | 'LEFT' | 'RIGHT';
export type EmergencyStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'AUTO_TERMINATED'
  | 'FAILED'
  | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  username: string;
  fullName: string;
  phoneNumber?: string | null;
  role: UserRole;
  status: AccountStatus;
  lastLoginAt?: string | null;
  createdAt: string;
  assignments?: {
    id: string;
    intersectionId: string;
    intersectionName: string;
    intersectionCode: string;
    assignedAt: string;
  }[];
}

export interface Intersection {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  approachesCount: number;
  status: IntersectionStatus;
  createdAt: string;
  updatedAt: string;
  controller?: {
    deviceId: string;
    connectionStatus: ConnectionStatus;
    lastHeartbeatAt?: string | null;
    firmwareVersion: string;
  } | null;
  liveStatus?: TrafficStatus | null;
  assignedOfficers?: {
    id: string;
    userId: string;
    fullName: string;
    username: string;
    assignedAt: string;
  }[];
}

export interface TrafficStatus {
  id: string;
  intersectionId: string;
  deviceId: string;
  northSignal: SignalColor;
  southSignal: SignalColor;
  eastSignal: SignalColor;
  westSignal: SignalColor;
  countdownRemaining: number;
  operatingPhase: string;
  operatingMode: OperatingMode;
  isEmergencyActive: boolean;
  uptimeSeconds: number;
  recordedAt: string;
  isSimulated?: boolean;
}

export interface SignalConfiguration {
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
  createdAt: string;
  updatedAt: string;
}

export interface TrafficIncident {
  id: string;
  referenceId: string;
  intersectionId: string;
  reportedById: string;
  incidentType: 'ROAD_ACCIDENT' | 'ROAD_OBSTRUCTION' | 'EMERGENCY_INTERVENTION' | 'OTHER';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  incidentTimestamp: string;
  description: string;
  additionalNotes?: string | null;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  intersection?: { id: string; name: string; code: string } | null;
  reporter?: { id: string; fullName: string; username: string } | null;
}

export interface TrafficProblemReport {
  id: string;
  referenceId: string;
  intersectionId: string;
  reportedById: string;
  category: 'TRAFFIC_VIOLATION' | 'TECHNICAL_INFRASTRUCTURE';
  problemType: string;
  reportTimestamp: string;
  description: string;
  licensePlateNumber?: string | null;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  notificationStatus: 'SENT' | 'FAILED' | 'PENDING';
  status: 'REPORTED' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
  intersection?: { id: string; name: string; code: string } | null;
  reporter?: { id: string; fullName: string; username: string } | null;
}

export interface EmergencyOperation {
  id: string;
  referenceId: string;
  intersectionId: string;
  officerId: string;
  deviceId: string;
  direction: EmergencyDirection;
  movement: EmergencyMovement;
  maxDurationSeconds: number;
  actualDurationSeconds?: number | null;
  status: EmergencyStatus;
  terminationReason?: string | null;
  requestedAt: string;
  activatedAt?: string | null;
  terminatedAt?: string | null;
  createdAt: string;
  intersection?: { id: string; name: string; code: string } | null;
  officer?: { id: string; fullName: string; username: string } | null;
}

export interface GeneratedReport {
  id: string;
  referenceId: string;
  generatedById: string;
  intersectionId?: string | null;
  reportType: string;
  title: string;
  startDate: string;
  endDate: string;
  exportFormat: 'PDF' | 'EXCEL';
  fileUrl?: string | null;
  createdAt: string;
  generatedBy?: string;
  intersectionName?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  category: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  linkUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLogItem {
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
  createdAt: string;
  userFullName?: string;
  username?: string;
}

export interface DashboardStats {
  totalIntersections: number;
  activeIntersections: number;
  inactiveIntersections: number;
  totalOfficers: number;
  activeOfficers: number;
  onlineControllers: number;
  offlineControllers: number;
  activeEmergencies: number;
  totalIncidents: number;
  unresolvedProblems: number;
  recentActivities: AuditLogItem[];
}
