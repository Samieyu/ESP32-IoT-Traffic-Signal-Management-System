import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = Router();

// Only Administrators can manage accounts
router.use(authenticate, authorizeRoles('ADMIN'));

router.get('/', UserController.getAllUsers);
router.post('/', UserController.createUser);
router.get('/:id', UserController.getUserById);
router.patch('/:id', UserController.updateUser);
router.patch('/:id/status', UserController.updateUserStatus);
router.delete('/:id', UserController.deleteUser);

export default router;
