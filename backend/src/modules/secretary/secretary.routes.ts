import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantGuard } from '../../middleware/tenant.middleware';
import { rbac } from '../../middleware/rbac.middleware';
import { getAll, getOne, create, update, remove, getStats } from './secretary.controller';

const router = Router();

// Todas las rutas requieren autenticación y tenantGuard
router.use(authenticate, tenantGuard);

// Stats generales
router.get('/stats', rbac('secretary', 'read'), getStats);

// CRUD genérico para los 6 recursos
// :resource = child-presentations | weddings | baptisms | conversions | board-minutes | preachers
router.get('/:resource',        rbac('secretary', 'read'),   getAll);
router.get('/:resource/:id',    rbac('secretary', 'read'),   getOne);
router.post('/:resource',       rbac('secretary', 'create'), create);
router.put('/:resource/:id',    rbac('secretary', 'update'), update);
router.delete('/:resource/:id', rbac('secretary', 'delete'), remove);

export default router;
