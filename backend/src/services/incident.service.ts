import { uuidv4 } from '../utils/id.utils.js';
import { dbStore, IncidentEntity } from '../repositories/store.js';
import { AppError } from '../middleware/error.middleware.js';

export class IncidentService {
  static async getAllIncidents(filters?: {
    intersectionId?: string;
    type?: string;
    severity?: string;
    status?: string;
    userRole?: string;
    userId?: string;
  }) {
    let list = [...dbStore.incidents];

    if (filters?.userRole === 'TRAFFIC_POLICE' && filters.userId) {
      // Traffic Police sees their own incidents or incidents at their assigned intersections
      const assignedIds = dbStore.assignments
        .filter((a) => a.userId === filters.userId && a.status === 'ACTIVE')
        .map((a) => a.intersectionId);
      list = list.filter((i) => i.reportedById === filters.userId || assignedIds.includes(i.intersectionId));
    }

    if (filters?.intersectionId) {
      list = list.filter((i) => i.intersectionId === filters.intersectionId);
    }
    if (filters?.type) {
      list = list.filter((i) => i.incidentType === filters.type);
    }
    if (filters?.severity) {
      list = list.filter((i) => i.severity === filters.severity);
    }
    if (filters?.status) {
      list = list.filter((i) => i.status === filters.status);
    }

    return list.map((i) => {
      const intersection = dbStore.intersections.find((item) => item.id === i.intersectionId);
      const officer = dbStore.users.find((u) => u.id === i.reportedById);
      return {
        ...i,
        intersection: intersection ? { id: intersection.id, name: intersection.name, code: intersection.code } : null,
        reporter: officer ? { id: officer.id, fullName: officer.fullName, username: officer.username } : null,
      };
    });
  }

  static async getIncidentById(id: string) {
    const item = dbStore.incidents.find((i) => i.id === id || i.referenceId === id);
    if (!item) {
      throw new AppError('Incident not found', 404, 'INCIDENT_NOT_FOUND');
    }
    const intersection = dbStore.intersections.find((int) => int.id === item.intersectionId);
    const officer = dbStore.users.find((u) => u.id === item.reportedById);

    return {
      ...item,
      intersection: intersection ? { id: intersection.id, name: intersection.name, code: intersection.code } : null,
      reporter: officer ? { id: officer.id, fullName: officer.fullName, username: officer.username } : null,
    };
  }

  static async createIncident(data: any, officerId: string) {
    const intersection = dbStore.intersections.find((i) => i.id === data.intersectionId);
    if (!intersection) {
      throw new AppError('Intersection not found', 404, 'INTERSECTION_NOT_FOUND');
    }

    // Generate unique reference ID: INC-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const referenceId = `INC-${dateStr}-${randSuffix}`;

    const newId = uuidv4();
    const newIncident: IncidentEntity = {
      id: newId,
      referenceId,
      intersectionId: data.intersectionId,
      reportedById: officerId,
      incidentType: data.incidentType,
      severity: data.severity || 'MEDIUM',
      incidentTimestamp: new Date(data.incidentTimestamp),
      description: data.description.trim(),
      additionalNotes: data.additionalNotes || null,
      status: 'OPEN',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dbStore.incidents.unshift(newIncident);

    // Save evidence attachments if provided
    if (data.evidenceFileUrls && data.evidenceFileUrls.length > 0) {
      for (const url of data.evidenceFileUrls) {
        dbStore.evidence.push({
          id: uuidv4(),
          incidentId: newId,
          fileName: url.split('/').pop() || 'evidence.jpg',
          fileUrl: url,
          fileType: 'image/jpeg',
          fileSize: 1024 * 250,
          uploadedAt: new Date(),
        });
      }
    }

    // Notify administrators
    const adminUsers = dbStore.users.filter((u) => u.role === 'ADMIN');
    for (const admin of adminUsers) {
      dbStore.notifications.unshift({
        id: uuidv4(),
        userId: admin.id,
        title: `New Incident: ${data.incidentType}`,
        message: `Incident ${referenceId} reported at ${intersection.name} with severity ${data.severity}.`,
        category: 'INCIDENT',
        severity: data.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
        linkUrl: `/traffic-incidents`,
        isRead: false,
        createdAt: new Date(),
      });
    }

    // Audit log
    dbStore.auditLogs.unshift({
      id: uuidv4(),
      userId: officerId,
      userRole: 'TRAFFIC_POLICE',
      action: 'RECORD_TRAFFIC_INCIDENT',
      entityType: 'TrafficIncident',
      entityId: newId,
      newValues: { referenceId, type: data.incidentType, severity: data.severity },
      createdAt: new Date(),
    });

    return newIncident;
  }

  static async updateIncidentStatus(id: string, status: string, notes?: string, adminUserId?: string) {
    const item = dbStore.incidents.find((i) => i.id === id);
    if (!item) {
      throw new AppError('Incident not found', 404, 'INCIDENT_NOT_FOUND');
    }

    item.status = status as any;
    if (notes) {
      item.additionalNotes = item.additionalNotes ? `${item.additionalNotes}\n${notes}` : notes;
    }
    item.updatedAt = new Date();

    if (adminUserId) {
      dbStore.auditLogs.unshift({
        id: uuidv4(),
        userId: adminUserId,
        userRole: 'ADMIN',
        action: 'UPDATE_INCIDENT_STATUS',
        entityType: 'TrafficIncident',
        entityId: id,
        newValues: { status, notes },
        createdAt: new Date(),
      });
    }

    return item;
  }
}
