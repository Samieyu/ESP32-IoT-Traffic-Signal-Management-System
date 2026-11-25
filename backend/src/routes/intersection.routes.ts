import { Router } from 'express';
import { IntersectionController } from '../controllers/intersection.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { authorizeIntersectionScope } from '../middleware/intersection-scope.middleware.js';

const router = Router();

router.use(authenticate);

// List intersections: both admin and police (police gets scoped in service)
router.get('/', IntersectionController.getAllIntersections);

// Get intersection by ID: requires intersection scope if traffic police
router.get('/:id', authorizeIntersectionScope('id'), IntersectionController.getIntersectionById);

// Admin-only management endpoints
router.post('/', authorizeRoles('ADMIN'), IntersectionController.createIntersection);
router.patch('/:id', authorizeRoles('ADMIN'), IntersectionController.updateIntersection);
router.patch('/:id/status', authorizeRoles('ADMIN'), IntersectionController.updateIntersectionStatus);
router.delete('/:id', authorizeRoles('ADMIN'), IntersectionController.deleteIntersection);

export default router;
