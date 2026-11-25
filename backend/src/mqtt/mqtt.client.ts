import mqtt, { MqttClient } from 'mqtt';
import { env } from '../config/env.js';
import { MqttTopics } from './mqtt.topics.js';
import { SocketService } from '../socket/socket.server.js';
import { dbStore } from '../repositories/store.js';

export class MqttClientService {
  private static client: MqttClient | null = null;
  private static isConnected = false;

  static initialize() {
    console.log(`🔌 Initializing MQTT client to broker: ${env.MQTT_BROKER_URL}`);

    try {
      this.client = mqtt.connect(env.MQTT_BROKER_URL, {
        clientId: `${env.MQTT_CLIENT_ID}_${Math.random().toString(16).substring(2, 8)}`,
        username: env.MQTT_USERNAME || undefined,
        password: env.MQTT_PASSWORD || undefined,
        reconnectPeriod: 10000,
        connectTimeout: 5000,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        console.log('✅ MQTT connected successfully to broker');

        // Subscribe to all intersection topics
        this.client?.subscribe(MqttTopics.wildcardAll(), (err) => {
          if (err) console.error('MQTT subscription error:', err);
          else console.log(`📡 Subscribed to MQTT topics: ${MqttTopics.wildcardAll()}`);
        });
      });

      this.client.on('message', (topic, payload) => {
        this.handleIncomingMessage(topic, payload.toString());
      });

      this.client.on('error', (err) => {
        console.warn('⚠️ MQTT broker connection error:', err.message);
      });

      this.client.on('offline', () => {
        this.isConnected = false;
        console.warn('⚠️ MQTT client offline');
      });
    } catch (error: any) {
      console.warn('⚠️ Could not initialize MQTT client:', error.message);
    }
  }

  static isBrokerConnected(): boolean {
    return this.isConnected;
  }

  static publish(topic: string, message: any): boolean {
    if (!this.client || !this.isConnected) {
      return false;
    }
    const payloadStr = typeof message === 'string' ? message : JSON.stringify(message);
    this.client.publish(topic, payloadStr, { qos: 1 });
    return true;
  }

  static sendCommand(intersectionId: string, command: any): boolean {
    const topic = MqttTopics.commands(intersectionId);
    return this.publish(topic, command);
  }

  static sendConfig(intersectionId: string, config: any): boolean {
    const topic = MqttTopics.config(intersectionId);
    return this.publish(topic, config);
  }

  private static handleIncomingMessage(topic: string, payloadStr: string) {
    try {
      const data = JSON.parse(payloadStr);
      const parts = topic.split('/');
      const intersectionId = parts[2];
      const messageType = parts[3];

      if (messageType === 'status') {
        this.processStatusUpdate(intersectionId, data);
      } else if (messageType === 'heartbeat') {
        this.processHeartbeat(intersectionId, data);
      } else if (messageType === 'ack') {
        this.processAck(intersectionId, data);
      }
    } catch (err: any) {
      console.error('Failed to parse MQTT message on topic', topic, err);
    }
  }

  private static processStatusUpdate(intersectionId: string, data: any) {
    // Update store
    let statusEntry = dbStore.trafficStatuses.find((s) => s.intersectionId === intersectionId);
    if (!statusEntry) {
      statusEntry = {
        id: `sta-${Date.now()}`,
        intersectionId,
        deviceId: data.deviceId || 'UNKNOWN',
        northSignal: data.northSignal || 'RED',
        southSignal: data.southSignal || 'RED',
        eastSignal: data.eastSignal || 'RED',
        westSignal: data.westSignal || 'RED',
        countdownRemaining: data.countdownRemaining || 0,
        operatingPhase: data.operatingPhase || 'NORTH_SOUTH_GREEN',
        operatingMode: data.operatingMode || 'NORMAL',
        isEmergencyActive: !!data.isEmergencyActive,
        uptimeSeconds: data.deviceUptime || 0,
        recordedAt: new Date(),
      };
      dbStore.trafficStatuses.push(statusEntry);
    } else {
      statusEntry.northSignal = data.northSignal;
      statusEntry.southSignal = data.southSignal;
      statusEntry.eastSignal = data.eastSignal;
      statusEntry.westSignal = data.westSignal;
      statusEntry.countdownRemaining = data.countdownRemaining;
      statusEntry.operatingPhase = data.operatingPhase;
      statusEntry.operatingMode = data.operatingMode;
      statusEntry.isEmergencyActive = !!data.isEmergencyActive;
      statusEntry.uptimeSeconds = data.deviceUptime || statusEntry.uptimeSeconds;
      statusEntry.recordedAt = new Date();
    }

    // Update controller connection
    const controller = dbStore.controllers.find((c) => c.intersectionId === intersectionId);
    if (controller) {
      controller.connectionStatus = 'ONLINE';
      controller.lastStatusAt = new Date();
    }

    // Broadcast live over WebSockets
    SocketService.emitTrafficStatus(intersectionId, {
      ...statusEntry,
      isSimulated: !!data.isSimulated,
      timestamp: new Date().toISOString(),
    });
  }

  private static processHeartbeat(intersectionId: string, data: any) {
    const controller = dbStore.controllers.find((c) => c.intersectionId === intersectionId);
    if (controller) {
      controller.connectionStatus = 'ONLINE';
      controller.lastHeartbeatAt = new Date();
      SocketService.emitControllerStatus(controller.deviceId, {
        connectionStatus: 'ONLINE',
        lastHeartbeatAt: controller.lastHeartbeatAt,
      });
    }
  }

  private static processAck(intersectionId: string, data: any) {
    console.log(`📥 Received ACK from intersection ${intersectionId}:`, data);

    if (data.command === 'UPDATE_CONFIGURATION') {
      const delivery = dbStore.configurationDeliveries.find(
        (d) => d.configurationId === data.configurationId || d.deviceId === data.deviceId
      );
      if (delivery) {
        delivery.deliveryStatus = data.success ? 'ACKNOWLEDGED' : 'FAILED';
        delivery.acknowledgedAt = new Date();
        delivery.acknowledgmentPayload = JSON.stringify(data);
        if (!data.success) {
          delivery.failureReason = data.error || 'Controller rejected configuration';
        }
      }
      SocketService.emitConfigUpdate(intersectionId, {
        status: data.success ? 'APPLIED' : 'FAILED',
        configurationId: data.configurationId,
        message: data.message,
      });
    } else if (data.command === 'REQUEST_EMERGENCY_PRIORITY') {
      const op = dbStore.emergencyOperations.find((e) => e.referenceId === data.referenceId);
      if (op) {
        if (data.success) {
          op.status = 'ACTIVE';
          op.activatedAt = new Date();
        } else {
          op.status = 'REJECTED';
          op.terminationReason = data.error || 'Safety interlock rejection by controller';
        }
        SocketService.emitEmergencyState(intersectionId, {
          operation: op,
          success: data.success,
          message: data.message,
        });
      }
    } else if (data.command === 'TERMINATE_EMERGENCY_PRIORITY') {
      const op = dbStore.emergencyOperations.find((e) => e.referenceId === data.referenceId);
      if (op) {
        op.status = data.autoTerminated ? 'AUTO_TERMINATED' : 'COMPLETED';
        op.terminatedAt = new Date();
        op.terminationReason = data.reason || 'Terminated safely and returned to normal schedule';
        SocketService.emitEmergencyState(intersectionId, {
          operation: op,
          status: op.status,
        });
      }
    }
  }
}
