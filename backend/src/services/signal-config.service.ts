import { uuidv4 } from '../utils/id.utils.js';
import { dbStore, SignalConfigEntity, ConfigDeliveryEntity } from '../repositories/store.js';
import { AppError } from '../middleware/error.middleware.js';
import { SignalConfigInput } from '../validators/signal-config.validator.js';
import { MqttClientService } from '../mqtt/mqtt.client.js';
import { ControllerSimulator } from '../mqtt/controller.simulator.js';

export class SignalConfigService {
  static async getConfigurationByIntersection(intersectionId: string) {
    const activeConfig = dbStore.configurations.find(
      (c) => c.intersectionId === intersectionId && c.status === 'ACTIVE'
    );
    const history = dbStore.configurations
      .filter((c) => c.intersectionId === intersectionId)
      .sort((a, b) => b.version - a.version);

    const latestDelivery = activeConfig
      ? dbStore.configurationDeliveries.find((d) => d.configurationId === activeConfig.id)
      : null;

    return {
      activeConfiguration: activeConfig || null,
      history,
      deliveryStatus: latestDelivery || null,
    };
  }

  static async updateConfiguration(intersectionId: string, input: SignalConfigInput, adminUserId: string) {
    const intersection = dbStore.intersections.find((i) => i.id === intersectionId);
    if (!intersection) {
      throw new AppError('Intersection not found', 404, 'INTERSECTION_NOT_FOUND');
    }

    // Safety Interlock Validation (NFR-14)
    if (input.yellowDuration < 3) {
      throw new AppError('Safety violation: Yellow clearance interval must be at least 3 seconds.', 400, 'UNSAFE_YELLOW_INTERVAL');
    }
    if (input.allRedClearanceDuration < 1) {
      throw new AppError('Safety violation: All-Red clearance interval must be at least 1 second.', 400, 'UNSAFE_ALL_RED_INTERVAL');
    }

    const currentActiveConfig = dbStore.configurations.find(
      (c) => c.intersectionId === intersectionId && c.status === 'ACTIVE'
    );

    const newVersion = currentActiveConfig ? currentActiveConfig.version + 1 : 1;
    const newConfigId = uuidv4();

    // Archive current configuration
    if (currentActiveConfig) {
      currentActiveConfig.status = 'ARCHIVED';
      currentActiveConfig.updatedAt = new Date();
    }

    const newConfig: SignalConfigEntity = {
      id: newConfigId,
      intersectionId,
      version: newVersion,
      northSouthGreenDuration: input.northSouthGreenDuration,
      eastWestGreenDuration: input.eastWestGreenDuration,
      yellowDuration: input.yellowDuration,
      allRedClearanceDuration: input.allRedClearanceDuration,
      maxEmergencyPriorityDuration: input.maxEmergencyPriorityDuration,
      lcdEnabled: input.lcdEnabled,
      lcdDisplayMode: input.lcdDisplayMode,
      lcdCustomMessage: input.lcdCustomMessage || null,
      countdownDisplayEnabled: input.countdownDisplayEnabled,
      outputMapping: input.outputMapping || null,
      status: 'ACTIVE',
      createdById: adminUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dbStore.configurations.push(newConfig);

    // Track delivery
    const controller = dbStore.controllers.find((c) => c.intersectionId === intersectionId);
    const deviceId = controller ? controller.deviceId : `ESP32-${intersection.code}`;

    const delivery: ConfigDeliveryEntity = {
      id: uuidv4(),
      configurationId: newConfigId,
      deviceId,
      deliveryStatus: 'SENT',
      sentAt: new Date(),
      createdAt: new Date(),
    };
    dbStore.configurationDeliveries.push(delivery);

    // Send through MQTT if broker connected; otherwise deliver via Simulator
    let applied = false;
    if (MqttClientService.isBrokerConnected()) {
      applied = MqttClientService.sendConfig(intersectionId, {
        command: 'UPDATE_CONFIGURATION',
        configurationId: newConfigId,
        version: newVersion,
        ...input,
      });
    } else {
      // Simulate controller acknowledgment
      const simResult = ControllerSimulator.applyConfiguration(intersectionId, newConfig);
      delivery.deliveryStatus = simResult.success ? 'ACKNOWLEDGED' : 'FAILED';
      delivery.acknowledgedAt = new Date();
      delivery.acknowledgmentPayload = JSON.stringify(simResult);
      applied = simResult.success;
    }

    // Audit log
    dbStore.auditLogs.unshift({
      id: uuidv4(),
      userId: adminUserId,
      userRole: 'ADMIN',
      action: 'UPDATE_TRAFFIC_SIGNAL_CONFIGURATION',
      entityType: 'SignalConfiguration',
      entityId: newConfigId,
      previousValues: currentActiveConfig ? { version: currentActiveConfig.version } : null,
      newValues: { version: newVersion, ...input },
      createdAt: new Date(),
    });

    return {
      configuration: newConfig,
      delivery,
      applied,
      message: 'Configuration saved in database and dispatched to traffic controller.',
    };
  }

  static async getDeliveryStatus(configId: string) {
    const delivery = dbStore.configurationDeliveries.find((d) => d.configurationId === configId);
    if (!delivery) {
      throw new AppError('Delivery record not found', 404, 'DELIVERY_NOT_FOUND');
    }
    return delivery;
  }
}
