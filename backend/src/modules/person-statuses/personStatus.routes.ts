import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantGuard } from '../../middleware/tenant.middleware';
import { rbac } from '../../middleware/rbac.middleware';
import {
  getPersonStatuses,
  getAllPersonStatuses,
  createPersonStatus,
  updatePersonStatus,
  deletePersonStatus,
  seedDefaultStatuses,
} from './personStatus.controller';

const router = Router();
router.use(authenticate, tenantGuard);

// Rutas públicas (lectura)
router.get('/', rbac('persons', 'read'), getPersonStatuses);
router.get('/all', rbac('persons', 'read'), getAllPersonStatuses);

// Rutas de administración
router.post('/', rbac('persons', 'create'), createPersonStatus);
router.post('/seed', rbac('persons', 'create'), seedDefaultStatuses);
router.put('/:id', rbac('persons', 'update'), updatePersonStatus);
router.delete('/:id', rbac('persons', 'delete'), deletePersonStatus);

export default router;
