import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantGuard } from '../../middleware/tenant.middleware';
import { rbac } from '../../middleware/rbac.middleware';
import { getMyChurch, updateMyChurch } from './church.controller';

const router = Router();

router.use(authenticate, tenantGuard);
router.get('/mine', rbac('churches', 'read'), getMyChurch);
router.put('/mine', rbac('churches', 'update'), updateMyChurch);

export default router;
