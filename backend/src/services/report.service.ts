import { uuidv4 } from '../utils/id.utils.js';
import { dbStore, GeneratedReportEntity } from '../repositories/store.js';
import { AppError } from '../middleware/error.middleware.js';

export class ReportService {
  static async getAllReports(userRole: string, userId: string) {
    let reports = [...dbStore.generatedReports];
    if (userRole === 'TRAFFIC_POLICE') {
      reports = reports.filter((r) => r.generatedById === userId);
    }
    return reports.map((r) => {
      const u = dbStore.users.find((user) => user.id === r.generatedById);
      const inter = dbStore.intersections.find((i) => i.id === r.intersectionId);
      return {
        ...r,
        generatedBy: u ? u.fullName : 'System',
        intersectionName: inter ? inter.name : 'All Intersections',
      };
    });
  }

  static async getReportById(id: string) {
    const report = dbStore.generatedReports.find((r) => r.id === id || r.referenceId === id);
    if (!report) {
      throw new AppError('Report not found', 404, 'REPORT_NOT_FOUND');
    }
    const u = dbStore.users.find((user) => user.id === report.generatedById);
    const inter = dbStore.intersections.find((i) => i.id === report.intersectionId);
    return {
      ...report,
      generatedBy: u ? u.fullName : 'System',
      intersectionName: inter ? inter.name : 'All Intersections',
    };
  }

  static async generateReport(params: {
    reportType: string;
    intersectionId?: string | null;
    startDate: Date;
    endDate: Date;
    exportFormat?: 'PDF' | 'EXCEL';
    filters?: any;
  }, userId: string, userRole: string) {
    const user = dbStore.users.find((u) => u.id === userId);
    if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

    // Scope check: If traffic police, verify assigned intersection
    if (userRole === 'TRAFFIC_POLICE' && params.intersectionId) {
      const isAssigned = dbStore.assignments.some(
        (a) => a.userId === userId && a.intersectionId === params.intersectionId && a.status === 'ACTIVE'
      );
      if (!isAssigned) {
        throw new AppError('Unauthorized: You can only generate reports for your assigned intersections.', 403, 'UNAUTHORIZED_REPORT_SCOPE');
      }
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const referenceId = `REP-${dateStr}-${randSuffix}`;

    const reportTitle = `${params.reportType.replace('_', ' ')} Report`;

    const report: GeneratedReportEntity = {
      id: uuidv4(),
      referenceId,
      generatedById: userId,
      intersectionId: params.intersectionId || null,
      reportType: params.reportType as any,
      title: reportTitle,
      startDate: params.startDate,
      endDate: params.endDate,
      filterParameters: params.filters || null,
      exportFormat: params.exportFormat || 'PDF',
      fileUrl: null,
      createdAt: new Date(),
    };

    dbStore.generatedReports.unshift(report);

    // Audit log
    dbStore.auditLogs.unshift({
      id: uuidv4(),
      userId,
      userRole,
      action: 'GENERATE_REPORT',
      entityType: 'GeneratedReport',
      entityId: report.id,
      newValues: { referenceId, type: params.reportType, format: params.exportFormat },
      createdAt: new Date(),
    });

    return report;
  }

  static getReportPayload(report: GeneratedReportEntity) {
    const user = dbStore.users.find((u) => u.id === report.generatedById);
    const intersection = dbStore.intersections.find((i) => i.id === report.intersectionId);

    let headers: string[] = [];
    let rows: any[][] = [];
    let summary: Record<string, any> = {};

    switch (report.reportType) {
      case 'INCIDENTS': {
        headers = ['Ref ID', 'Timestamp', 'Intersection', 'Type', 'Severity', 'Status', 'Reported By'];
        let items = dbStore.incidents.filter(
          (i) => i.createdAt >= report.startDate && i.createdAt <= report.endDate
        );
        if (report.intersectionId) {
          items = items.filter((i) => i.intersectionId === report.intersectionId);
        }
        rows = items.map((i) => {
          const inter = dbStore.intersections.find((x) => x.id === i.intersectionId);
          const rep = dbStore.users.find((u) => u.id === i.reportedById);
          return [
            i.referenceId,
            new Date(i.incidentTimestamp).toLocaleString(),
            inter ? inter.name : 'Unknown',
            i.incidentType,
            i.severity,
            i.status,
            rep ? rep.fullName : 'Unknown',
          ];
        });
        summary = {
          'Total Incidents': items.length,
          'Critical Incidents': items.filter((i) => i.severity === 'CRITICAL').length,
          'Resolved Incidents': items.filter((i) => i.status === 'RESOLVED').length,
        };
        break;
      }

      case 'PROBLEMS':
      case 'VIOLATIONS':
      case 'TECHNICAL': {
        headers = ['Ref ID', 'Date/Time', 'Category', 'Type', 'Plate / Hardware', 'Urgency', 'Status'];
        let items = dbStore.problemReports.filter(
          (p) => p.createdAt >= report.startDate && p.createdAt <= report.endDate
        );
        if (report.intersectionId) {
          items = items.filter((p) => p.intersectionId === report.intersectionId);
        }
        if (report.reportType === 'VIOLATIONS') {
          items = items.filter((p) => p.category === 'TRAFFIC_VIOLATION');
        } else if (report.reportType === 'TECHNICAL') {
          items = items.filter((p) => p.category === 'TECHNICAL_INFRASTRUCTURE');
        }
        rows = items.map((p) => [
          p.referenceId,
          new Date(p.reportTimestamp).toLocaleString(),
          p.category,
          p.problemType,
          p.licensePlateNumber || 'N/A',
          p.urgency,
          p.status,
        ]);
        summary = {
          'Total Reports': items.length,
          'Traffic Violations': items.filter((p) => p.category === 'TRAFFIC_VIOLATION').length,
          'Technical Issues': items.filter((p) => p.category === 'TECHNICAL_INFRASTRUCTURE').length,
        };
        break;
      }

      case 'EMERGENCY': {
        headers = ['Ref ID', 'Intersection', 'Officer', 'Direction', 'Movement', 'Status', 'Duration (s)', 'Requested At'];
        let items = dbStore.emergencyOperations.filter(
          (e) => e.createdAt >= report.startDate && e.createdAt <= report.endDate
        );
        if (report.intersectionId) {
          items = items.filter((e) => e.intersectionId === report.intersectionId);
        }
        rows = items.map((e) => {
          const inter = dbStore.intersections.find((x) => x.id === e.intersectionId);
          const off = dbStore.users.find((u) => u.id === e.officerId);
          return [
            e.referenceId,
            inter ? inter.name : 'Unknown',
            off ? off.fullName : 'Unknown',
            e.direction,
            e.movement,
            e.status,
            e.actualDurationSeconds || e.maxDurationSeconds,
            new Date(e.requestedAt).toLocaleTimeString(),
          ];
        });
        summary = {
          'Total Priority Interventions': items.length,
          'Completed Interventions': items.filter((e) => e.status === 'COMPLETED').length,
          'Auto Terminated (Timeouts)': items.filter((e) => e.status === 'AUTO_TERMINATED').length,
        };
        break;
      }

      default: {
        headers = ['Entity ID', 'Intersection', 'Status', 'Updated At'];
        rows = dbStore.intersections.map((i) => [i.code, i.name, i.status, new Date(i.updatedAt).toLocaleDateString()]);
        summary = { 'Total Intersections': dbStore.intersections.length };
        break;
      }
    }

    return {
      title: report.title,
      referenceId: report.referenceId,
      generatedAt: report.createdAt,
      generatedBy: user ? user.fullName : 'System Administrator',
      dateRange: `${new Date(report.startDate).toLocaleDateString()} to ${new Date(report.endDate).toLocaleDateString()}`,
      intersectionName: intersection ? intersection.name : 'All Intersections',
      headers,
      rows,
      summary,
    };
  }
}
