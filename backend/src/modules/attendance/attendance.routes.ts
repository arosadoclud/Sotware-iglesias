import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { tenantGuard } from '../../middleware/tenant.middleware';
import { rbac } from '../../middleware/rbac.middleware';
import {
  getAttendances,
  getAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceStats,
  getMembersForAttendance,
} from './attendance.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Stats y listado de miembros
router.get('/stats',   tenantGuard, rbac('attendance', 'read'),   getAttendanceStats);
router.get('/members', tenantGuard, rbac('attendance', 'read'),   getMembersForAttendance);

// CRUD
router.get('/',        tenantGuard, rbac('attendance', 'read'),   getAttendances);
router.get('/:id',     tenantGuard, rbac('attendance', 'read'),   getAttendance);
router.post('/',       tenantGuard, rbac('attendance', 'create'), createAttendance);
router.put('/:id',     tenantGuard, rbac('attendance', 'update'), updateAttendance);
router.delete('/:id',  tenantGuard, rbac('attendance', 'delete'), deleteAttendance);

export default router;
