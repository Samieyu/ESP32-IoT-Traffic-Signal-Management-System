import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import intersectionRoutes from './intersection.routes.js';
import assignmentRoutes from './assignment.routes.js';
import signalConfigRoutes from './signal-config.routes.js';
import monitoringRoutes from './monitoring.routes.js';
import incidentRoutes from './incident.routes.js';
import problemReportRoutes from './problem-report.routes.js';
import emergencyRoutes from './emergency.routes.js';
import reportRoutes from './report.routes.js';
import notificationRoutes from './notification.routes.js';
import auditLogRoutes from './audit-log.routes.js';
import { MqttClientService } from '../mqtt/mqtt.client.js';

const router = Router();

// Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'HEALTHY',
    service: 'Traffic Light Management Backend',
    institution: 'Wachemo University - SEng4162',
    timestamp: new Date().toISOString(),
    uptimeSeconds: process.uptime(),
    mqttBrokerConnected: MqttClientService.isBrokerConnected(),
    environment: process.env.NODE_ENV || 'development',
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/intersections', intersectionRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/', signalConfigRoutes);
router.use('/monitoring', monitoringRoutes);
router.use('/incidents', incidentRoutes);
router.use('/traffic-problems', problemReportRoutes);
router.use('/emergency-priorities', emergencyRoutes);
router.use('/reports', reportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit-logs', auditLogRoutes);

export default router;
