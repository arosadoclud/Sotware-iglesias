import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantGuard } from '../../middleware/tenant.middleware';
import { rbac } from '../../middleware/rbac.middleware';
import { getActivityTypes, getActivityType, createActivityType, updateActivityType, deleteActivityType } from './activity.controller';

const router = Router();
router.use(authenticate, tenantGuard);

router.get('/', rbac('activities', 'read'), getActivityTypes);
router.get('/:id', rbac('activities', 'read'), getActivityType);
router.post('/', rbac('activities', 'create'), createActivityType);
router.put('/:id', rbac('activities', 'update'), updateActivityType);
router.delete('/:id', rbac('activities', 'delete'), deleteActivityType);

export default router;
