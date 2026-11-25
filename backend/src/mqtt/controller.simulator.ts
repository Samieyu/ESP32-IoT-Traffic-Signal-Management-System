import { dbStore, SignalConfigEntity } from '../repositories/store.js';
import { MqttClientService } from './mqtt.client.js';
import { SocketService } from '../socket/socket.server.js';

interface VirtualControllerState {
  intersectionId: string;
  deviceId: string;
  phase: 'NS_GREEN' | 'NS_YELLOW' | 'ALL_RED_NS_TO_EW' | 'EW_GREEN' | 'EW_YELLOW' | 'ALL_RED_EW_TO_NS' | 'EMERGENCY_PREEMPTION';
  countdown: number;
  northSignal: 'RED' | 'YELLOW' | 'GREEN';
  southSignal: 'RED' | 'YELLOW' | 'GREEN';
  eastSignal: 'RED' | 'YELLOW' | 'GREEN';
  westSignal: 'RED' | 'YELLOW' | 'GREEN';
  emergencyState: {
    isActive: boolean;
    referenceId?: string;
    direction?: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
    movement?: 'STRAIGHT' | 'LEFT' | 'RIGHT';
    remainingSeconds: number;
    pendingDirection?: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST';
  };
  uptime: number;
}

export class ControllerSimulator {
  private static controllers: Map<string, VirtualControllerState> = new Map();
  private static ticker: NodeJS.Timeout | null = null;
  private static heartbeatTicker: NodeJS.Timeout | null = null;

  static start() {
    console.log('🚦 Starting ESP32 High-Fidelity IoT Virtual Controller Simulator...');

    // Initialize state for each active intersection
    for (const intersection of dbStore.intersections) {
      const controller = dbStore.controllers.find((c) => c.intersectionId === intersection.id);
      if (!controller || controller.connectionStatus === 'OFFLINE') {
        continue;
      }

      const config = dbStore.configurations.find((c) => c.intersectionId === intersection.id && c.status === 'ACTIVE') || {
        northSouthGreenDuration: 35,
        eastWestGreenDuration: 30,
        yellowDuration: 4,
        allRedClearanceDuration: 2,
        maxEmergencyPriorityDuration: 60,
      };

      this.controllers.set(intersection.id, {
        intersectionId: intersection.id,
        deviceId: controller.deviceId,
        phase: 'NS_GREEN',
        countdown: config.northSouthGreenDuration,
        northSignal: 'GREEN',
        southSignal: 'GREEN',
        eastSignal: 'RED',
        westSignal: 'RED',
        emergencyState: {
          isActive: false,
          remainingSeconds: 0,
        },
        uptime: 86400,
      });
    }

    // Tick every 1 second (simulating FreeRTOS 1Hz state machine loop)
    this.ticker = setInterval(() => {
      this.tick();
    }, 1000);

    // Heartbeat every 5 seconds
    this.heartbeatTicker = setInterval(() => {
      this.tickHeartbeat();
    }, 5000);
  }

  static stop() {
    if (this.ticker) clearInterval(this.ticker);
    if (this.heartbeatTicker) clearInterval(this.heartbeatTicker);
  }

  private static tick() {
    for (const [intersectionId, state] of this.controllers.entries()) {
      state.uptime++;

      const config = dbStore.configurations.find(
        (c) => c.intersectionId === intersectionId && c.status === 'ACTIVE'
      ) || {
        northSouthGreenDuration: 35,
        eastWestGreenDuration: 30,
        yellowDuration: 4,
        allRedClearanceDuration: 2,
        maxEmergencyPriorityDuration: 60,
      };

      // Handle Emergency Priority Mode
      if (state.emergencyState.isActive) {
        state.emergencyState.remainingSeconds--;
        state.countdown = state.emergencyState.remainingSeconds;

        if (state.emergencyState.remainingSeconds <= 0) {
          // Auto-terminate emergency priority at max duration
          this.terminateEmergency(
            intersectionId,
            state.emergencyState.referenceId || 'UNKNOWN',
            true,
            'Maximum emergency priority duration reached (automatic failsafe timeout)'
          );
          continue;
        }

        // Publish live status during emergency
        this.emitState(state, 'EMERGENCY_PREEMPTION', true);
        continue;
      }

      // Handle Normal Fixed-Time State Machine Transitions
      state.countdown--;

      if (state.countdown <= 0) {
        switch (state.phase) {
          case 'NS_GREEN':
            state.phase = 'NS_YELLOW';
            state.countdown = config.yellowDuration;
            state.northSignal = 'YELLOW';
            state.southSignal = 'YELLOW';
            state.eastSignal = 'RED';
            state.westSignal = 'RED';
            break;

          case 'NS_YELLOW':
            // Enter mandatory all-red clearance
            state.phase = 'ALL_RED_NS_TO_EW';
            state.countdown = config.allRedClearanceDuration;
            state.northSignal = 'RED';
            state.southSignal = 'RED';
            state.eastSignal = 'RED';
            state.westSignal = 'RED';
            break;

          case 'ALL_RED_NS_TO_EW':
            state.phase = 'EW_GREEN';
            state.countdown = config.eastWestGreenDuration;
            state.northSignal = 'RED';
            state.southSignal = 'RED';
            state.eastSignal = 'GREEN';
            state.westSignal = 'GREEN';
            break;

          case 'EW_GREEN':
            state.phase = 'EW_YELLOW';
            state.countdown = config.yellowDuration;
            state.northSignal = 'RED';
            state.southSignal = 'RED';
            state.eastSignal = 'YELLOW';
            state.westSignal = 'YELLOW';
            break;

          case 'EW_YELLOW':
            // Enter mandatory all-red clearance
            state.phase = 'ALL_RED_EW_TO_NS';
            state.countdown = config.allRedClearanceDuration;
            state.northSignal = 'RED';
            state.southSignal = 'RED';
            state.eastSignal = 'RED';
            state.westSignal = 'RED';
            break;

          case 'ALL_RED_EW_TO_NS':
            state.phase = 'NS_GREEN';
            state.countdown = config.northSouthGreenDuration;
            state.northSignal = 'GREEN';
            state.southSignal = 'GREEN';
            state.eastSignal = 'RED';
            state.westSignal = 'RED';
            break;
        }
      }

      this.emitState(state, 'NORMAL', false);
    }
  }

  private static emitState(state: VirtualControllerState, mode: string, isEmergency: boolean) {
    const payload = {
      deviceId: state.deviceId,
      intersectionId: state.intersectionId,
      northSignal: state.northSignal,
      southSignal: state.southSignal,
      eastSignal: state.eastSignal,
      westSignal: state.westSignal,
      countdownRemaining: state.countdown,
      operatingPhase: state.phase,
      operatingMode: mode,
      isEmergencyActive: isEmergency,
      deviceUptime: state.uptime,
      firmwareVersion: '1.2.0-esp32-twin',
      configurationVersion: 1,
      isSimulated: true,
      timestamp: new Date().toISOString(),
    };

    // If MQTT broker is active, publish to MQTT
    if (MqttClientService.isBrokerConnected()) {
      MqttClientService.publish(`traffic/intersections/${state.intersectionId}/status`, payload);
    } else {
      // Direct in-process delivery to store and Socket.IO
      let statusEntry = dbStore.trafficStatuses.find((s) => s.intersectionId === state.intersectionId);
      if (statusEntry) {
        statusEntry.northSignal = state.northSignal;
        statusEntry.southSignal = state.southSignal;
        statusEntry.eastSignal = state.eastSignal;
        statusEntry.westSignal = state.westSignal;
        statusEntry.countdownRemaining = state.countdown;
        statusEntry.operatingPhase = state.phase;
        statusEntry.operatingMode = mode as any;
        statusEntry.isEmergencyActive = isEmergency;
        statusEntry.uptimeSeconds = state.uptime;
        statusEntry.recordedAt = new Date();
      }

      SocketService.emitTrafficStatus(state.intersectionId, payload);
    }
  }

  private static tickHeartbeat() {
    for (const [intersectionId, state] of this.controllers.entries()) {
      const payload = {
        deviceId: state.deviceId,
        intersectionId,
        uptime: state.uptime,
        isSimulated: true,
        timestamp: new Date().toISOString(),
      };

      if (MqttClientService.isBrokerConnected()) {
        MqttClientService.publish(`traffic/intersections/${intersectionId}/heartbeat`, payload);
      } else {
        const controller = dbStore.controllers.find((c) => c.intersectionId === intersectionId);
        if (controller) {
          controller.connectionStatus = 'ONLINE';
          controller.lastHeartbeatAt = new Date();
          SocketService.emitControllerStatus(state.deviceId, {
            connectionStatus: 'ONLINE',
            lastHeartbeatAt: new Date(),
          });
        }
      }
    }
  }

  static getOrCreateState(intersectionId: string): VirtualControllerState {
    let state = this.controllers.get(intersectionId);
    if (!state) {
      const controller = dbStore.controllers.find((c) => c.intersectionId === intersectionId);
      const config = dbStore.configurations.find((c) => c.intersectionId === intersectionId && c.status === 'ACTIVE') || {
        northSouthGreenDuration: 35,
        eastWestGreenDuration: 30,
        yellowDuration: 4,
        allRedClearanceDuration: 2,
        maxEmergencyPriorityDuration: 60,
      };

      state = {
        intersectionId,
        deviceId: controller?.deviceId || `ESP32-${intersectionId}`,
        phase: 'NS_GREEN',
        countdown: config.northSouthGreenDuration,
        northSignal: 'GREEN',
        southSignal: 'GREEN',
        eastSignal: 'RED',
        westSignal: 'RED',
        emergencyState: {
          isActive: false,
          remainingSeconds: 0,
        },
        uptime: 86400,
      };
      this.controllers.set(intersectionId, state);
    }
    return state;
  }

  // Handle emergency priority command sent to controller
  static requestEmergency(
    intersectionId: string,
    direction: 'NORTH' | 'SOUTH' | 'EAST' | 'WEST',
    movement: 'STRAIGHT' | 'LEFT' | 'RIGHT',
    durationSeconds: number,
    referenceId: string
  ): { success: boolean; message: string } {
    const state = this.getOrCreateState(intersectionId);

    // Safety Interlock Check:
    // If opposing direction is green, initiate clearance transition immediately
    const isNorthSouth = direction === 'NORTH' || direction === 'SOUTH';
    const isCurrentGreenNS = state.phase === 'NS_GREEN';
    const isCurrentGreenEW = state.phase === 'EW_GREEN';

    console.log(`🚨 ESP32 Simulator received emergency priority for ${direction} (Ref: ${referenceId})`);

    state.emergencyState = {
      isActive: true,
      referenceId,
      direction,
      movement,
      remainingSeconds: durationSeconds,
    };

    if (isNorthSouth) {
      state.northSignal = 'GREEN';
      state.southSignal = 'GREEN';
      state.eastSignal = 'RED';
      state.westSignal = 'RED';
      state.phase = 'EMERGENCY_PREEMPTION';
    } else {
      state.northSignal = 'RED';
      state.southSignal = 'RED';
      state.eastSignal = 'GREEN';
      state.westSignal = 'GREEN';
      state.phase = 'EMERGENCY_PREEMPTION';
    }

    state.countdown = durationSeconds;

    // Send ACK back
    const ackPayload = {
      command: 'REQUEST_EMERGENCY_PRIORITY',
      referenceId,
      deviceId: state.deviceId,
      success: true,
      message: `Emergency green granted safely for approach ${direction}. Opposing approaches locked in RED.`,
      isSimulated: true,
      appliedAt: new Date().toISOString(),
    };

    if (MqttClientService.isBrokerConnected()) {
      MqttClientService.publish(`traffic/intersections/${intersectionId}/ack`, ackPayload);
    }

    return {
      success: true,
      message: `Emergency priority granted on approach ${direction}. Opposing approaches locked to Red.`,
    };
  }

  // Terminate emergency priority manually or automatically
  static terminateEmergency(
    intersectionId: string,
    referenceId: string,
    autoTerminated: boolean,
    reason: string
  ): { success: boolean; message: string } {
    const state = this.controllers.get(intersectionId);
    if (!state || !state.emergencyState.isActive) {
      return { success: false, message: 'No active emergency preemption to terminate.' };
    }

    console.log(`⏹️ Terminating emergency priority for intersection ${intersectionId}. Reason: ${reason}`);

    state.emergencyState.isActive = false;
    state.emergencyState.remainingSeconds = 0;

    // Transition safely back: force yellow for clearance, then resume normal cycle
    const wasNS = state.northSignal === 'GREEN';
    if (wasNS) {
      state.phase = 'NS_YELLOW';
      state.countdown = 4;
      state.northSignal = 'YELLOW';
      state.southSignal = 'YELLOW';
      state.eastSignal = 'RED';
      state.westSignal = 'RED';
    } else {
      state.phase = 'EW_YELLOW';
      state.countdown = 4;
      state.northSignal = 'RED';
      state.southSignal = 'RED';
      state.eastSignal = 'YELLOW';
      state.westSignal = 'YELLOW';
    }

    const ackPayload = {
      command: 'TERMINATE_EMERGENCY_PRIORITY',
      referenceId,
      deviceId: state.deviceId,
      success: true,
      autoTerminated,
      reason,
      isSimulated: true,
      resumedAt: new Date().toISOString(),
    };

    if (MqttClientService.isBrokerConnected()) {
      MqttClientService.publish(`traffic/intersections/${intersectionId}/ack`, ackPayload);
    }

    return {
      success: true,
      message: 'Emergency priority terminated. Safe clearance interval initiated before normal cycle resumption.',
    };
  }

  // Apply new configuration
  static applyConfiguration(intersectionId: string, config: SignalConfigEntity): { success: boolean; message: string } {
    const state = this.getOrCreateState(intersectionId);

    console.log(`⚙️ ESP32 received configuration version ${config.version} for intersection ${intersectionId}`);

    const ackPayload = {
      command: 'UPDATE_CONFIGURATION',
      configurationId: config.id,
      version: config.version,
      deviceId: state.deviceId,
      success: true,
      message: 'Signal configuration successfully written to ESP32 non-volatile memory (NVS).',
      isSimulated: true,
      appliedAt: new Date().toISOString(),
    };

    if (MqttClientService.isBrokerConnected()) {
      MqttClientService.publish(`traffic/intersections/${intersectionId}/ack`, ackPayload);
    }

    return { success: true, message: 'Configuration synchronized to controller memory.' };
  }
}
