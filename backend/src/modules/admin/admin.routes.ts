import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission, requireAdmin, requireSuperUser, Permission } from '../../middleware/permission.middleware';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserPermissions,
  resetUserPassword,
  deleteUser,
  hardDeleteUser,
  activateUser,
  unlockUser,
  getAuditLogs,
  getAuditStats,
  getAvailablePermissions,
} from './admin.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// ── USUARIOS ──────────────────────────────────────────────────────────────────

// Obtener todos los usuarios
router.get('/users', requirePermission(Permission.USERS_VIEW), getUsers);

// Obtener permisos disponibles
router.get('/permissions', requireAdmin(), getAvailablePermissions);

// Obtener un usuario específico
router.get('/users/:id', requirePermission(Permission.USERS_VIEW), getUserById);

// Crear usuario
router.post('/users', requirePermission(Permission.USERS_CREATE), createUser);

// Actualizar usuario
router.put('/users/:id', requirePermission(Permission.USERS_EDIT), updateUser);

// Actualizar permisos de usuario (solo superusuarios)
router.put('/users/:id/permissions', requireSuperUser(), updateUserPermissions);

// Resetear contraseña de usuario
router.post('/users/:id/reset-password', requireAdmin(), resetUserPassword);

// Eliminar usuario (soft delete)
router.delete('/users/:id', requirePermission(Permission.USERS_DELETE), deleteUser);

// Eliminar usuario permanentemente (hard delete)
router.delete('/users/:id/permanent', requirePermission(Permission.USERS_DELETE), hardDeleteUser);

// Activar usuario
router.post('/users/:id/activate', requirePermission(Permission.USERS_EDIT), activateUser);

// Desbloquear cuenta de usuario
router.post('/users/:id/unlock', requireAdmin(), unlockUser);

// ── AUDITORÍA ─────────────────────────────────────────────────────────────────

// Obtener logs de auditoría
router.get('/audit/logs', requirePermission(Permission.AUDIT_VIEW), getAuditLogs);

// Obtener estadísticas de auditoría
router.get('/audit/stats', requirePermission(Permission.AUDIT_VIEW), getAuditStats);

export default router;
