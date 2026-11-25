import { Router } from 'express';
import { AuditLogController } from '../controllers/audit-log.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = Router();

// Audit logs are visible only to Administrators (NFR-16)
router.use(authenticate, authorizeRoles('ADMIN'));

router.get('/', AuditLogController.getAuditLogs);

export default router;
