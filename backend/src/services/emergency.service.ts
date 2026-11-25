import { uuidv4 } from '../utils/id.utils.js';
import { dbStore, EmergencyOperationEntity } from '../repositories/store.js';
import { AppError } from '../middleware/error.middleware.js';
import { MqttClientService } from '../mqtt/mqtt.client.js';
import { ControllerSimulator } from '../mqtt/controller.simulator.js';

export class EmergencyService {
  static async getAllOperations(filters?: {
    intersectionId?: string;
    status?: string;
    userRole?: string;
    userId?: string;
  }) {
    let list = [...dbStore.emergencyOperations];

    if (filters?.userRole === 'TRAFFIC_POLICE' && filters.userId) {
      const assignedIds = dbStore.assignments
        .filter((a) => a.userId === filters.userId && a.status === 'ACTIVE')
        .map((a) => a.intersectionId);
      list = list.filter((e) => e.officerId === filters.userId || assignedIds.includes(e.intersectionId));
    }

    if (filters?.intersectionId) {
      list = list.filter((e) => e.intersectionId === filters.intersectionId);
    }
    if (filters?.status) {
      list = list.filter((e) => e.status === filters.status);
    }

    return list.map((e) => {
      const intersection = dbStore.intersections.find((item) => item.id === e.intersectionId);
      const officer = dbStore.users.find((u) => u.id === e.officerId);
      return {
        ...e,
        intersection: intersection ? { id: intersection.id, name: intersection.name, code: intersection.code } : null,
        officer: officer ? { id: officer.id, fullName: officer.fullName, username: officer.username } : null,
      };
    });
  }

  static async getOperationById(id: string) {
    const item = dbStore.emergencyOperations.find((e) => e.id === id || e.referenceId === id);
    if (!item) {
      throw new AppError('Emergency operation not found', 404, 'EMERGENCY_NOT_FOUND');
    }
    const intersection = dbStore.intersections.find((int) => int.id === item.intersectionId);
    const officer = dbStore.users.find((u) => u.id === item.officerId);

    return {
      ...item,
      intersection: intersection ? { id: intersection.id, name: intersection.name, code: intersection.code } : null,
      officer: officer ? { id: officer.id, fullName: officer.fullName, username: officer.username } : null,
    };
  }

  static async requestEmergencyPriority(
    data: {
      intersectionId: string;
      direction: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
      movement?: 'STRAIGHT' | 'LEFT' | 'RIGHT';
      durationSeconds?: number;
    },
    officerId: string
  ) {
    const intersection = dbStore.intersections.find((i) => i.id === data.intersectionId);
    if (!intersection) {
      throw new AppError('Intersection not found', 404, 'INTERSECTION_NOT_FOUND');
    }

    // Check if an emergency operation is already ACTIVE on this intersection
    const activeExisting = dbStore.emergencyOperations.find(
      (e) => e.intersectionId === data.intersectionId && e.status === 'ACTIVE'
    );
    if (activeExisting) {
      throw new AppError(
        `Emergency priority is already active on this intersection (Ref: ${activeExisting.referenceId}). Terminate existing operation first.`,
        409,
        'EMERGENCY_ALREADY_ACTIVE'
      );
    }

    const controller = dbStore.controllers.find((c) => c.intersectionId === data.intersectionId);
    const deviceId = controller ? controller.deviceId : `ESP32-${intersection.code}`;

    const config = dbStore.configurations.find(
      (c) => c.intersectionId === data.intersectionId && c.status === 'ACTIVE'
    );
    const maxDuration = data.durationSeconds || config?.maxEmergencyPriorityDuration || 60;

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const referenceId = `EMG-${dateStr}-${randSuffix}`;

    const newId = uuidv4();
    const operation: EmergencyOperationEntity = {
      id: newId,
      referenceId,
      intersectionId: data.intersectionId,
      officerId,
      deviceId,
      direction: data.direction,
      movement: data.movement || 'STRAIGHT',
      maxDurationSeconds: maxDuration,
      status: 'PENDING',
      requestedAt: new Date(),
      createdAt: new Date(),
    };

    dbStore.emergencyOperations.unshift(operation);

    // Send command to ESP32 controller
    const commandPayload = {
      command: 'REQUEST_EMERGENCY_PRIORITY',
      referenceId,
      direction: data.direction,
      movement: data.movement || 'STRAIGHT',
      durationSeconds: maxDuration,
      timestamp: new Date().toISOString(),
    };

    let controllerAckReceived = false;

    if (MqttClientService.isBrokerConnected()) {
      MqttClientService.sendCommand(data.intersectionId, commandPayload);
    } else {
      // Simulator Virtual Twin handling
      const result = ControllerSimulator.requestEmergency(
        data.intersectionId,
        data.direction,
        data.movement || 'STRAIGHT',
        maxDuration,
        referenceId
      );
      if (result.success) {
        operation.status = 'ACTIVE';
        operation.activatedAt = new Date();
        controllerAckReceived = true;
      } else {
        operation.status = 'REJECTED';
        operation.terminationReason = result.message;
      }
    }

    // Audit log
    dbStore.auditLogs.unshift({
      id: uuidv4(),
      userId: officerId,
      userRole: 'TRAFFIC_POLICE',
      action: 'REQUEST_EMERGENCY_PRIORITY',
      entityType: 'EmergencyPriorityOperation',
      entityId: newId,
      newValues: { referenceId, direction: data.direction, maxDuration },
      createdAt: new Date(),
    });

    return {
      operation,
      status: operation.status,
      message: controllerAckReceived
        ? `Emergency green activated for ${data.direction} approach after clearance safety intervals.`
        : 'Emergency priority command dispatched to controller. Awaiting hardware clearance acknowledgment.',
    };
  }

  static async terminateEmergencyPriority(
    operationId: string,
    reason?: string,
    officerId?: string
  ) {
    const operation = dbStore.emergencyOperations.find(
      (e) => e.id === operationId || e.referenceId === operationId
    );
    if (!operation) {
      throw new AppError('Emergency operation record not found', 404, 'EMERGENCY_NOT_FOUND');
    }

    if (operation.status !== 'ACTIVE' && operation.status !== 'PENDING') {
      throw new AppError(`Cannot terminate operation with status: ${operation.status}`, 400, 'OPERATION_NOT_ACTIVE');
    }

    const terminationReason = reason || 'Manually terminated by officer: emergency vehicle passed safely.';

    // Send termination command to ESP32
    const commandPayload = {
      command: 'TERMINATE_EMERGENCY_PRIORITY',
      referenceId: operation.referenceId,
      reason: terminationReason,
      timestamp: new Date().toISOString(),
    };

    if (MqttClientService.isBrokerConnected()) {
      MqttClientService.sendCommand(operation.intersectionId, commandPayload);
    } else {
      ControllerSimulator.terminateEmergency(
        operation.intersectionId,
        operation.referenceId,
        false,
        terminationReason
      );
    }

    operation.status = 'COMPLETED';
    operation.terminatedAt = new Date();
    operation.terminationReason = terminationReason;
    if (operation.activatedAt) {
      operation.actualDurationSeconds = Math.round(
        (operation.terminatedAt.getTime() - operation.activatedAt.getTime()) / 1000
      );
    }

    // Audit log
    dbStore.auditLogs.unshift({
      id: uuidv4(),
      userId: officerId,
      userRole: 'TRAFFIC_POLICE',
      action: 'TERMINATE_EMERGENCY_PRIORITY',
      entityType: 'EmergencyPriorityOperation',
      entityId: operation.id,
      newValues: { referenceId: operation.referenceId, reason: terminationReason },
      createdAt: new Date(),
    });

    return {
      operation,
      message: 'Emergency priority terminated. Controller transitioning safely back to normal cycle.',
    };
  }
}
