import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantGuard } from '../../middleware/tenant.middleware';
import { rbac } from '../../middleware/rbac.middleware';
import { getMinistries, createMinistry, updateMinistry, deleteMinistry, seedDefaultMinistries } from './ministry.controller';

const router = Router();
router.use(authenticate, tenantGuard);

router.get('/', rbac('persons', 'read'), getMinistries);
router.post('/', rbac('persons', 'create'), createMinistry);
router.post('/seed', rbac('persons', 'create'), seedDefaultMinistries);
router.put('/:id', rbac('persons', 'update'), updateMinistry);
router.delete('/:id', rbac('persons', 'delete'), deleteMinistry);

export default router;
