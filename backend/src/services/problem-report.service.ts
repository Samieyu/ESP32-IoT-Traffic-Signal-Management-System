import { uuidv4 } from '../utils/id.utils.js';
import { dbStore, ProblemReportEntity } from '../repositories/store.js';
import { AppError } from '../middleware/error.middleware.js';

export class ProblemReportService {
  static async getAllReports(filters?: {
    category?: string;
    intersectionId?: string;
    urgency?: string;
    status?: string;
    userRole?: string;
    userId?: string;
  }) {
    let list = [...dbStore.problemReports];

    if (filters?.userRole === 'TRAFFIC_POLICE' && filters.userId) {
      const assignedIds = dbStore.assignments
        .filter((a) => a.userId === filters.userId && a.status === 'ACTIVE')
        .map((a) => a.intersectionId);
      list = list.filter((p) => p.reportedById === filters.userId || assignedIds.includes(p.intersectionId));
    }

    if (filters?.category) {
      list = list.filter((p) => p.category === filters.category);
    }
    if (filters?.intersectionId) {
      list = list.filter((p) => p.intersectionId === filters.intersectionId);
    }
    if (filters?.urgency) {
      list = list.filter((p) => p.urgency === filters.urgency);
    }
    if (filters?.status) {
      list = list.filter((p) => p.status === filters.status);
    }

    return list.map((p) => {
      const intersection = dbStore.intersections.find((item) => item.id === p.intersectionId);
      const officer = dbStore.users.find((u) => u.id === p.reportedById);
      return {
        ...p,
        intersection: intersection ? { id: intersection.id, name: intersection.name, code: intersection.code } : null,
        reporter: officer ? { id: officer.id, fullName: officer.fullName, username: officer.username } : null,
      };
    });
  }

  static async getReportById(id: string) {
    const item = dbStore.problemReports.find((p) => p.id === id || p.referenceId === id);
    if (!item) {
      throw new AppError('Problem report not found', 404, 'REPORT_NOT_FOUND');
    }
    const intersection = dbStore.intersections.find((int) => int.id === item.intersectionId);
    const officer = dbStore.users.find((u) => u.id === item.reportedById);

    return {
      ...item,
      intersection: intersection ? { id: intersection.id, name: intersection.name, code: intersection.code } : null,
      reporter: officer ? { id: officer.id, fullName: officer.fullName, username: officer.username } : null,
    };
  }

  static async createReport(data: any, officerId: string) {
    const intersection = dbStore.intersections.find((i) => i.id === data.intersectionId);
    if (!intersection) {
      throw new AppError('Intersection not found', 404, 'INTERSECTION_NOT_FOUND');
    }

    // Generate unique reference ID: PRB-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const referenceId = `PRB-${dateStr}-${randSuffix}`;

    const newId = uuidv4();
    const newReport: ProblemReportEntity = {
      id: newId,
      referenceId,
      intersectionId: data.intersectionId,
      reportedById: officerId,
      category: data.category,
      problemType: data.problemType.trim(),
      reportTimestamp: new Date(data.reportTimestamp || Date.now()),
      description: data.description.trim(),
      licensePlateNumber: data.licensePlateNumber?.trim() || null,
      urgency: data.urgency || 'MEDIUM',
      notificationStatus: 'SENT',
      status: 'REPORTED',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dbStore.problemReports.unshift(newReport);

    // Save evidence attachments if provided
    if (data.evidenceFileUrls && data.evidenceFileUrls.length > 0) {
      for (const url of data.evidenceFileUrls) {
        dbStore.evidence.push({
          id: uuidv4(),
          problemReportId: newId,
          fileName: url.split('/').pop() || 'problem_photo.jpg',
          fileUrl: url,
          fileType: 'image/jpeg',
          fileSize: 1024 * 250,
          uploadedAt: new Date(),
        });
      }
    }

    // Try notifying Administrator (FR-7 resilience: retains report and records failure if not delivered)
    try {
      const admins = dbStore.users.filter((u) => u.role === 'ADMIN');
      for (const admin of admins) {
        dbStore.notifications.unshift({
          id: uuidv4(),
          userId: admin.id,
          title: `Problem Reported: ${data.category}`,
          message: `${data.problemType} reported at ${intersection.name} (${referenceId}). Urgency: ${newReport.urgency}.`,
          category: 'PROBLEM',
          severity: newReport.urgency === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
          linkUrl: `/traffic-problems`,
          isRead: false,
          createdAt: new Date(),
        });
      }
      newReport.notificationStatus = 'SENT';
    } catch (notifError) {
      console.warn('⚠️ Admin notification failed, retaining problem report and logging delivery failure:', notifError);
      newReport.notificationStatus = 'FAILED';
    }

    // Audit log
    dbStore.auditLogs.unshift({
      id: uuidv4(),
      userId: officerId,
      userRole: 'TRAFFIC_POLICE',
      action: 'REPORT_TRAFFIC_PROBLEM',
      entityType: 'TrafficProblemReport',
      entityId: newId,
      newValues: { referenceId, category: data.category, urgency: newReport.urgency },
      createdAt: new Date(),
    });

    return newReport;
  }

  static async updateReportStatus(id: string, status: string, adminUserId?: string) {
    const item = dbStore.problemReports.find((p) => p.id === id);
    if (!item) {
      throw new AppError('Problem report not found', 404, 'REPORT_NOT_FOUND');
    }

    item.status = status as any;
    item.updatedAt = new Date();

    if (adminUserId) {
      dbStore.auditLogs.unshift({
        id: uuidv4(),
        userId: adminUserId,
        userRole: 'ADMIN',
        action: 'UPDATE_PROBLEM_STATUS',
        entityType: 'TrafficProblemReport',
        entityId: id,
        newValues: { status },
        createdAt: new Date(),
      });
    }

    return item;
  }
}
