import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

export class SocketService {
  private static io: SocketIOServer | null = null;

  static initialize(httpServer: HttpServer, clientUrl: string) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: clientUrl,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.io.on('connection', (socket) => {
      // Subscribe to real-time updates for a specific intersection
      socket.on('join_intersection', (intersectionId: string) => {
        socket.join(`intersection:${intersectionId}`);
      });

      socket.on('leave_intersection', (intersectionId: string) => {
        socket.leave(`intersection:${intersectionId}`);
      });

      // Subscribe to personal notification room
      socket.on('join_user', (userId: string) => {
        socket.join(`user:${userId}`);
      });
    });

    console.log('⚡ Socket.IO real-time gateway initialized');
    return this.io;
  }

  static getIO(): SocketIOServer {
    if (!this.io) {
      throw new Error('Socket.IO is not initialized yet');
    }
    return this.io;
  }

  static emitTrafficStatus(intersectionId: string, status: any) {
    if (!this.io) return;
    this.io.to(`intersection:${intersectionId}`).emit('traffic_status_update', status);
    // Also emit to global monitoring room
    this.io.emit('global_traffic_status', { intersectionId, ...status });
  }

  static emitEmergencyState(intersectionId: string, emergencyData: any) {
    if (!this.io) return;
    this.io.to(`intersection:${intersectionId}`).emit('emergency_status_update', emergencyData);
    this.io.emit('global_emergency_alert', { intersectionId, ...emergencyData });
  }

  static emitControllerStatus(deviceId: string, controllerData: any) {
    if (!this.io) return;
    this.io.emit('controller_status_change', { deviceId, ...controllerData });
  }

  static emitNotification(userId: string, notification: any) {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit('new_notification', notification);
    this.io.emit('admin_notification', notification);
  }

  static emitConfigUpdate(intersectionId: string, configData: any) {
    if (!this.io) return;
    this.io.to(`intersection:${intersectionId}`).emit('configuration_update', configData);
  }
}
