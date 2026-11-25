import { Router } from 'express';
import { EmergencyController } from '../controllers/emergency.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeIntersectionScope } from '../middleware/intersection-scope.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', EmergencyController.getAllOperations);
router.post('/', authorizeIntersectionScope('intersectionId'), EmergencyController.requestEmergencyPriority);
router.get('/:id', EmergencyController.getOperationById);
router.post('/:id/terminate', EmergencyController.terminateEmergencyPriority);

export default router;
