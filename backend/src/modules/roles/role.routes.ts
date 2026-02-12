import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantGuard } from '../../middleware/tenant.middleware';
import { rbac } from '../../middleware/rbac.middleware';
import { getRoles, createRole, updateRole, deleteRole } from './role.controller';

const router = Router();
router.use(authenticate, tenantGuard);

router.get('/', rbac('roles', 'read'), getRoles);
router.post('/', rbac('roles', 'create'), createRole);
router.put('/:id', rbac('roles', 'update'), updateRole);
router.delete('/:id', rbac('roles', 'delete'), deleteRole);

export default router;
