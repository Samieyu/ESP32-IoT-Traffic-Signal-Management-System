import { Router } from 'express';
import { AssignmentController } from '../controllers/assignment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = Router();

router.use(authenticate, authorizeRoles('ADMIN'));

router.get('/', AssignmentController.getAllAssignments);
router.post('/', AssignmentController.createAssignment);
router.delete('/:id', AssignmentController.removeAssignment);

export default router;
