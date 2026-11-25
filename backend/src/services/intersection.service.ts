import { uuidv4 } from '../utils/id.utils.js';
import { dbStore, IntersectionEntity } from '../repositories/store.js';
import { AppError } from '../middleware/error.middleware.js';

export class IntersectionService {
  static async getAllIntersections(filters?: { status?: string; search?: string; userId?: string; userRole?: string }) {
    let intersections = [...dbStore.intersections];

    // Role-based visibility check (FR-11): Traffic Police only see assigned intersections
    if (filters?.userRole === 'TRAFFIC_POLICE' && filters.userId) {
      const assignedIds = dbStore.assignments
        .filter((a) => a.userId === filters.userId && a.status === 'ACTIVE')
        .map((a) => a.intersectionId);
      intersections = intersections.filter((i) => assignedIds.includes(i.id));
    }

    if (filters?.status) {
      intersections = intersections.filter((i) => i.status === filters.status);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      intersections = intersections.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.code.toLowerCase().includes(q) ||
          i.city.toLowerCase().includes(q) ||
          i.region.toLowerCase().includes(q)
      );
    }

    return intersections.map((item) => {
      const controller = dbStore.controllers.find((c) => c.intersectionId === item.id);
      const status = dbStore.trafficStatuses.find((s) => s.intersectionId === item.id);
      const activeAssignments = dbStore.assignments.filter(
        (a) => a.intersectionId === item.id && a.status === 'ACTIVE'
      );
      const assignedOfficers = activeAssignments.map((a) => {
        const u = dbStore.users.find((user) => user.id === a.userId);
        return {
          id: a.id,
          userId: a.userId,
          fullName: u ? u.fullName : 'Unknown Officer',
          username: u ? u.username : 'unknown',
          assignedAt: a.assignedAt,
        };
      });

      return {
        ...item,
        controller: controller
          ? {
              deviceId: controller.deviceId,
              connectionStatus: controller.connectionStatus,
              lastHeartbeatAt: controller.lastHeartbeatAt,
              firmwareVersion: controller.firmwareVersion,
            }
          : null,
        liveStatus: status || null,
        assignedOfficers,
      };
    });
  }

  static async getIntersectionById(id: string) {
    const item = dbStore.intersections.find((i) => i.id === id);
    if (!item) {
      throw new AppError('Intersection not found', 404, 'INTERSECTION_NOT_FOUND');
    }

    const controller = dbStore.controllers.find((c) => c.intersectionId === item.id);
    const liveStatus = dbStore.trafficStatuses.find((s) => s.intersectionId === item.id);
    const activeConfig = dbStore.configurations.find(
      (c) => c.intersectionId === item.id && c.status === 'ACTIVE'
    );
    const assignedOfficers = dbStore.assignments
      .filter((a) => a.intersectionId === item.id && a.status === 'ACTIVE')
      .map((a) => {
        const u = dbStore.users.find((user) => user.id === a.userId);
        return {
          id: a.id,
          userId: a.userId,
          fullName: u ? u.fullName : 'Unknown Officer',
          username: u ? u.username : 'unknown',
          phoneNumber: u?.phoneNumber,
          assignedAt: a.assignedAt,
        };
      });

    const recentIncidents = dbStore.incidents
      .filter((inc) => inc.intersectionId === item.id)
      .slice(0, 10);

    const recentProblems = dbStore.problemReports
      .filter((p) => p.intersectionId === item.id)
      .slice(0, 10);

    const emergencyHistory = dbStore.emergencyOperations
      .filter((e) => e.intersectionId === item.id)
      .slice(0, 10);

    const activityLogs = dbStore.auditLogs
      .filter((l) => l.entityId === item.id || l.entityType === 'Intersection')
      .slice(0, 15);

    return {
      overview: item,
      controller: controller || null,
      liveStatus: liveStatus || null,
      activeConfiguration: activeConfig || null,
      assignedOfficers,
      recentIncidents,
      recentProblems,
      emergencyHistory,
      activityLogs,
    };
  }

  static async createIntersection(data: any, adminUserId: string) {
    const existing = dbStore.intersections.find(
      (i) => i.code.toLowerCase() === data.code.trim().toLowerCase()
    );
    if (existing) {
      throw new AppError('An intersection with this code already exists.', 409, 'INTERSECTION_CODE_EXISTS');
    }

    const newId = uuidv4();
    const newIntersection: IntersectionEntity = {
      id: newId,
      code: data.code.trim().toUpperCase(),
      name: data.name.trim(),
      description: data.description || null,
      region: data.region.trim(),
      city: data.city.trim(),
      latitude: Number(data.latitude),
      longitude: Number(data.longitude),
      approachesCount: Number(data.approachesCount) || 4,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dbStore.intersections.push(newIntersection);

    // Register controller if deviceId provided
    if (data.deviceId) {
      dbStore.controllers.push({
        id: uuidv4(),
        deviceId: data.deviceId.trim(),
        intersectionId: newId,
        firmwareVersion: '1.2.0-wcu',
        hardwareType: 'ESP32-WROOM-32',
        connectionStatus: 'ONLINE',
        lastHeartbeatAt: new Date(),
        lastStatusAt: new Date(),
        registeredAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Default Configuration
    dbStore.configurations.push({
      id: uuidv4(),
      intersectionId: newId,
      version: 1,
      northSouthGreenDuration: 30,
      eastWestGreenDuration: 30,
      yellowDuration: 4,
      allRedClearanceDuration: 2,
      maxEmergencyPriorityDuration: 60,
      lcdEnabled: true,
      lcdDisplayMode: 'COUNTDOWN_AND_PHASE',
      lcdCustomMessage: `${newIntersection.name}`,
      countdownDisplayEnabled: true,
      status: 'ACTIVE',
      createdById: adminUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Default Traffic Status
    dbStore.trafficStatuses.push({
      id: uuidv4(),
      intersectionId: newId,
      deviceId: data.deviceId || `ESP32-${data.code}`,
      northSignal: 'RED',
      southSignal: 'RED',
      eastSignal: 'RED',
      westSignal: 'RED',
      countdownRemaining: 0,
      operatingPhase: 'INITIALIZING',
      operatingMode: 'NORMAL',
      isEmergencyActive: false,
      uptimeSeconds: 0,
      recordedAt: new Date(),
    });

    // Assign officers if provided
    if (data.assignedOfficerIds && data.assignedOfficerIds.length > 0) {
      for (const officerId of data.assignedOfficerIds) {
        dbStore.assignments.push({
          id: uuidv4(),
          userId: officerId,
          intersectionId: newId,
          assignedAt: new Date(),
          status: 'ACTIVE',
          assignedBy: 'Administrator',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    // Audit log
    dbStore.auditLogs.unshift({
      id: uuidv4(),
      userId: adminUserId,
      userRole: 'ADMIN',
      action: 'REGISTER_INTERSECTION',
      entityType: 'Intersection',
      entityId: newId,
      newValues: { code: newIntersection.code, name: newIntersection.name },
      createdAt: new Date(),
    });

    return newIntersection;
  }

  static async updateIntersection(id: string, data: any, adminUserId: string) {
    const item = dbStore.intersections.find((i) => i.id === id);
    if (!item) {
      throw new AppError('Intersection not found', 404, 'INTERSECTION_NOT_FOUND');
    }

    const previousValues = { ...item };

    if (data.name) item.name = data.name.trim();
    if (data.description !== undefined) item.description = data.description;
    if (data.region) item.region = data.region.trim();
    if (data.city) item.city = data.city.trim();
    if (data.latitude !== undefined) item.latitude = Number(data.latitude);
    if (data.longitude !== undefined) item.longitude = Number(data.longitude);
    if (data.approachesCount !== undefined) item.approachesCount = Number(data.approachesCount);

    if (data.deviceId) {
      let ctrl = dbStore.controllers.find((c) => c.intersectionId === id);
      if (ctrl) {
        ctrl.deviceId = data.deviceId.trim();
      } else {
        dbStore.controllers.push({
          id: uuidv4(),
          deviceId: data.deviceId.trim(),
          intersectionId: id,
          firmwareVersion: '1.2.0-wcu',
          hardwareType: 'ESP32-WROOM-32',
          connectionStatus: 'ONLINE',
          lastHeartbeatAt: new Date(),
          lastStatusAt: new Date(),
          registeredAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    if (data.assignedOfficerIds) {
      for (const asg of dbStore.assignments) {
        if (asg.intersectionId === id) {
          asg.status = 'INACTIVE';
          asg.unassignedAt = new Date();
        }
      }
      for (const officerId of data.assignedOfficerIds) {
        dbStore.assignments.push({
          id: uuidv4(),
          userId: officerId,
          intersectionId: id,
          assignedAt: new Date(),
          status: 'ACTIVE',
          assignedBy: 'Administrator',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    item.updatedAt = new Date();

    dbStore.auditLogs.unshift({
      id: uuidv4(),
      userId: adminUserId,
      userRole: 'ADMIN',
      action: 'UPDATE_INTERSECTION',
      entityType: 'Intersection',
      entityId: id,
      previousValues,
      newValues: data,
      createdAt: new Date(),
    });

    return item;
  }

  static async updateIntersectionStatus(id: string, status: 'ACTIVE' | 'INACTIVE', adminUserId: string) {
    const item = dbStore.intersections.find((i) => i.id === id);
    if (!item) {
      throw new AppError('Intersection not found', 404, 'INTERSECTION_NOT_FOUND');
    }

    item.status = status;
    item.updatedAt = new Date();

    dbStore.auditLogs.unshift({
      id: uuidv4(),
      userId: adminUserId,
      userRole: 'ADMIN',
      action: status === 'ACTIVE' ? 'ACTIVATE_INTERSECTION' : 'DEACTIVATE_INTERSECTION',
      entityType: 'Intersection',
      entityId: id,
      newValues: { status },
      createdAt: new Date(),
    });

    return item;
  }

  static async deleteIntersection(id: string, adminUserId: string) {
    const index = dbStore.intersections.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new AppError('Intersection not found', 404, 'INTERSECTION_NOT_FOUND');
    }

    const item = dbStore.intersections[index];

    // Preserving Historical Information (FR-3 requirement)
    const hasIncidents = dbStore.incidents.some((i) => i.intersectionId === id);
    const hasProblems = dbStore.problemReports.some((p) => p.intersectionId === id);
    const hasEmergency = dbStore.emergencyOperations.some((e) => e.intersectionId === id);

    if (hasIncidents || hasProblems || hasEmergency) {
      item.status = 'INACTIVE';
      item.updatedAt = new Date();

      dbStore.auditLogs.unshift({
        id: uuidv4(),
        userId: adminUserId,
        userRole: 'ADMIN',
        action: 'DEACTIVATE_INTERSECTION_PRESERVE_HISTORY',
        entityType: 'Intersection',
        entityId: id,
        newValues: { status: 'INACTIVE', reason: 'Associated operational records present' },
        createdAt: new Date(),
      });

      return {
        message: 'Intersection has operational records and was deactivated instead of permanently deleted to preserve historical data.',
        deactivated: true,
      };
    }

    dbStore.intersections.splice(index, 1);
    dbStore.assignments = dbStore.assignments.filter((a) => a.intersectionId !== id);
    dbStore.controllers = dbStore.controllers.filter((c) => c.intersectionId !== id);

    dbStore.auditLogs.unshift({
      id: uuidv4(),
      userId: adminUserId,
      userRole: 'ADMIN',
      action: 'DELETE_INTERSECTION_PERMANENT',
      entityType: 'Intersection',
      entityId: id,
      createdAt: new Date(),
    });

    return {
      message: 'Intersection deleted permanently.',
      deactivated: false,
    };
  }
}
