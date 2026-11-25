import { Router } from 'express';
import { SignalConfigController } from '../controllers/signal-config.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);

// View config: both roles can view
router.get('/intersections/:id/configuration', SignalConfigController.getConfiguration);
// Update config: Admin only
router.put('/intersections/:id/configuration', authorizeRoles('ADMIN'), SignalConfigController.updateConfiguration);
// Delivery status check
router.get('/configurations/:id/delivery-status', SignalConfigController.getDeliveryStatus);

export default router;
