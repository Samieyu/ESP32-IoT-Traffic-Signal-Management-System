import { dbStore } from '../repositories/store.js';
import { AppError } from '../middleware/error.middleware.js';

export class MonitoringService {
  static async getMonitoringIntersections(userRole: string, userId: string) {
    let intersections = [...dbStore.intersections];

    if (userRole === 'TRAFFIC_POLICE') {
      const assignedIds = dbStore.assignments
        .filter((a) => a.userId === userId && a.status === 'ACTIVE')
        .map((a) => a.intersectionId);
      intersections = intersections.filter((i) => assignedIds.includes(i.id));
    }

    return intersections.map((intersection) => {
      const controller = dbStore.controllers.find((c) => c.intersectionId === intersection.id);
      const status = dbStore.trafficStatuses.find((s) => s.intersectionId === intersection.id);
      const activeEmergency = dbStore.emergencyOperations.find(
        (e) => e.intersectionId === intersection.id && e.status === 'ACTIVE'
      );

      return {
        id: intersection.id,
        code: intersection.code,
        name: intersection.name,
        city: intersection.city,
        region: intersection.region,
        status: intersection.status,
        controller: controller
          ? {
              deviceId: controller.deviceId,
              connectionStatus: controller.connectionStatus,
              lastHeartbeatAt: controller.lastHeartbeatAt,
              lastStatusAt: controller.lastStatusAt,
            }
          : {
              deviceId: 'UNASSIGNED',
              connectionStatus: 'OFFLINE',
              lastHeartbeatAt: null,
              lastStatusAt: null,
            },
        liveSignal: status || {
          northSignal: 'RED',
          southSignal: 'RED',
          eastSignal: 'RED',
          westSignal: 'RED',
          countdownRemaining: 0,
          operatingPhase: 'UNKNOWN',
          operatingMode: 'FAULT',
          isEmergencyActive: false,
          recordedAt: null,
        },
        activeEmergency: activeEmergency || null,
      };
    });
  }

  static async getIntersectionMonitoringById(intersectionId: string) {
    const intersection = dbStore.intersections.find((i) => i.id === intersectionId);
    if (!intersection) {
      throw new AppError('Intersection not found', 404, 'INTERSECTION_NOT_FOUND');
    }

    const controller = dbStore.controllers.find((c) => c.intersectionId === intersection.id);
    const status = dbStore.trafficStatuses.find((s) => s.intersectionId === intersection.id);
    const activeConfig = dbStore.configurations.find(
      (c) => c.intersectionId === intersection.id && c.status === 'ACTIVE'
    );
    const activeEmergency = dbStore.emergencyOperations.find(
      (e) => e.intersectionId === intersection.id && e.status === 'ACTIVE'
    );

    return {
      intersection: {
        id: intersection.id,
        code: intersection.code,
        name: intersection.name,
        city: intersection.city,
        region: intersection.region,
        latitude: intersection.latitude,
        longitude: intersection.longitude,
        status: intersection.status,
      },
      controller: controller || null,
      liveSignal: status || null,
      configuration: activeConfig || null,
      activeEmergency: activeEmergency || null,
    };
  }

  static async getControllers() {
    return dbStore.controllers.map((c) => {
      const intersection = dbStore.intersections.find((i) => i.id === c.intersectionId);
      return {
        ...c,
        intersection: intersection
          ? { id: intersection.id, name: intersection.name, code: intersection.code }
          : null,
      };
    });
  }

  static async getDashboardStats(userRole: string, userId: string) {
    const isPolice = userRole === 'TRAFFIC_POLICE';
    let accessibleIntersections = [...dbStore.intersections];

    if (isPolice) {
      const assignedIds = dbStore.assignments
        .filter((a) => a.userId === userId && a.status === 'ACTIVE')
        .map((a) => a.intersectionId);
      accessibleIntersections = accessibleIntersections.filter((i) => assignedIds.includes(i.id));
    }

    const interIds = accessibleIntersections.map((i) => i.id);

    const activeIntersections = accessibleIntersections.filter((i) => i.status === 'ACTIVE').length;
    const inactiveIntersections = accessibleIntersections.filter((i) => i.status === 'INACTIVE').length;

    const totalOfficers = dbStore.users.filter((u) => u.role === 'TRAFFIC_POLICE').length;
    const activeOfficers = dbStore.users.filter((u) => u.role === 'TRAFFIC_POLICE' && u.status === 'ACTIVE').length;

    const relevantControllers = dbStore.controllers.filter((c) => interIds.includes(c.intersectionId));
    const onlineControllers = relevantControllers.filter((c) => c.connectionStatus === 'ONLINE').length;
    const offlineControllers = relevantControllers.filter((c) => c.connectionStatus === 'OFFLINE').length;

    const activeEmergencies = dbStore.emergencyOperations.filter(
      (e) => interIds.includes(e.intersectionId) && e.status === 'ACTIVE'
    ).length;

    const incidents = dbStore.incidents.filter((i) => interIds.includes(i.intersectionId));
    const totalIncidents = isPolice
      ? dbStore.incidents.filter((i) => i.reportedById === userId).length
      : incidents.length;

    const problemReports = dbStore.problemReports.filter((p) => interIds.includes(p.intersectionId));
    const unresolvedProblems = problemReports.filter((p) => p.status === 'REPORTED' || p.status === 'INVESTIGATING').length;

    const recentActivities = dbStore.auditLogs.slice(0, 10);

    return {
      totalIntersections: accessibleIntersections.length,
      activeIntersections,
      inactiveIntersections,
      totalOfficers: isPolice ? 1 : totalOfficers,
      activeOfficers: isPolice ? 1 : activeOfficers,
      onlineControllers,
      offlineControllers,
      activeEmergencies,
      totalIncidents,
      unresolvedProblems,
      recentActivities,
    };
  }
}
