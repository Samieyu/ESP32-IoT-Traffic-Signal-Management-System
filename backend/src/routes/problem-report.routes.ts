import { Router } from 'express';
import { ProblemReportController } from '../controllers/problem-report.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeIntersectionScope } from '../middleware/intersection-scope.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', ProblemReportController.getAllReports);
router.post('/', authorizeIntersectionScope('intersectionId'), ProblemReportController.createReport);
router.get('/:id', ProblemReportController.getReportById);
router.patch('/:id/status', authorizeRoles('ADMIN'), ProblemReportController.updateReportStatus);

export default router;
