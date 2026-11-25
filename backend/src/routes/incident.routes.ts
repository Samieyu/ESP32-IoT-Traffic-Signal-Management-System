import { Router } from 'express';
import { IncidentController } from '../controllers/incident.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeIntersectionScope } from '../middleware/intersection-scope.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', IncidentController.getAllIncidents);
router.post('/', authorizeIntersectionScope('intersectionId'), IncidentController.createIncident);
router.get('/:id', IncidentController.getIncidentById);
router.patch('/:id/status', authorizeRoles('ADMIN'), IncidentController.updateIncidentStatus);

export default router;
