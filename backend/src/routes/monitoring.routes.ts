import { Router } from 'express';
import { MonitoringController } from '../controllers/monitoring.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeIntersectionScope } from '../middleware/intersection-scope.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard-stats', MonitoringController.getDashboardStats);
router.get('/intersections', MonitoringController.getMonitoringIntersections);
router.get('/intersections/:id', authorizeIntersectionScope('id'), MonitoringController.getIntersectionMonitoringById);
router.get('/controllers', MonitoringController.getControllers);

export default router;
