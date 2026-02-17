import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { UserRole } from '../models/User.model';
import { ForbiddenError } from '../utils/errors';

/**
 * RBAC MIDDLEWARE — Paso 2: Sistema de Permisos Granulares
 *
 * Define qué puede hacer cada rol en cada recurso.
 * Se usa después de `authenticate` y `tenantGuard`.
 *
 * Uso:
 *   router.post('/persons', authenticate, tenantGuard, rbac('persons', 'create'), createPerson);
 *   router.delete('/programs/:id', authenticate, tenantGuard, rbac('programs', 'delete'), deleteProgram);
 */

// Recursos del sistema
export type Resource =
  | 'persons'
  | 'programs'
  | 'roles'
  | 'activities'
  | 'letters'
  | 'users'
  | 'churches'
  | 'finances'
  | 'billing';

// Acciones posibles sobre cada recurso
export type Action = 'read' | 'create' | 'update' | 'delete';

// ────────────────────────────────────────────────────────────────────────────
// Matriz de permisos por rol (alineada con permissions.ts)
//
// Jerarquía:  SUPER_ADMIN > PASTOR > ADMIN > MINISTRY_LEADER > EDITOR > VIEWER
//
// VIEWER  → Solo lectura: puede ver datos pero NO crear, editar ni eliminar nada
// EDITOR  → Lectura + crear/editar (no borrar, no gestionar usuarios)
// MINISTRY_LEADER → Como EDITOR + generar programas y cartas en su ámbito
// ADMIN   → Casi todo excepto eliminar usuarios y configurar iglesia
// PASTOR  → Todo excepto gestión de usuarios avanzada
// SUPER_ADMIN → Sin restricciones
// ────────────────────────────────────────────────────────────────────────────
const PERMISSIONS: Record<UserRole, Partial<Record<Resource, Action[]>>> = {
  [UserRole.SUPER_ADMIN]: {
    persons:    ['read', 'create', 'update', 'delete'],
    programs:   ['read', 'create', 'update', 'delete'],
    roles:      ['read', 'create', 'update', 'delete'],
    activities: ['read', 'create', 'update', 'delete'],
    letters:    ['read', 'create', 'update', 'delete'],
    users:      ['read', 'create', 'update', 'delete'],
    churches:   ['read', 'create', 'update', 'delete'],
    finances:   ['read', 'create', 'update', 'delete'],
    billing:    ['read', 'create', 'update', 'delete'],
  },

  [UserRole.PASTOR]: {
    persons:    ['read', 'create', 'update', 'delete'],
    programs:   ['read', 'create', 'update', 'delete'],
    roles:      ['read', 'create', 'update', 'delete'],
    activities: ['read', 'create', 'update', 'delete'],
    letters:    ['read', 'create', 'update', 'delete'],
    users:      ['read'],           // Solo ver usuarios
    churches:   ['read', 'update'], // Puede editar su iglesia
    finances:   ['read', 'create', 'update', 'delete'],
    billing:    ['read'],
  },

  [UserRole.ADMIN]: {
    persons:    ['read', 'create', 'update', 'delete'],
    programs:   ['read', 'create', 'update', 'delete'],
    roles:      ['read', 'create', 'update'],    // No puede eliminar roles
    activities: ['read', 'create', 'update'],    // No puede eliminar actividades
    letters:    ['read', 'create', 'update'],    // No puede eliminar cartas
    users:      ['read', 'create', 'update'],    // No puede eliminar usuarios
    churches:   ['read', 'update'],
    finances:   ['read', 'create', 'update'],    // No puede eliminar finanzas
    billing:    ['read'],
  },

  [UserRole.MINISTRY_LEADER]: {
    persons:    ['read', 'update'],              // Editar personas de su área
    programs:   ['read', 'create', 'update'],    // Crear/editar programas
    roles:      ['read'],
    activities: ['read'],
    letters:    ['read', 'create'],              // Crear cartas
    users:      [],
    churches:   ['read'],
    finances:   ['read'],                        // Solo ver finanzas
    billing:    [],
  },

  [UserRole.EDITOR]: {
    persons:    ['read', 'update'],              // Editar personas
    programs:   ['read', 'create', 'update'],    // Crear/editar programas
    roles:      ['read'],
    activities: ['read'],
    letters:    ['read', 'create'],
    users:      [],
    churches:   ['read'],
    finances:   ['read'],                        // Solo ver finanzas
    billing:    [],
  },

  // ⚠️ VIEWER: Solo lectura — NO puede crear, editar ni eliminar NADA
  [UserRole.VIEWER]: {
    persons:    ['read'],
    programs:   ['read'],
    roles:      ['read'],
    activities: ['read'],
    letters:    ['read'],
    users:      [],
    churches:   ['read'],
    finances:   [],                              // Sin acceso a finanzas
    billing:    [],
  },
};

/**
 * Middleware principal de RBAC
 * Verifica que el rol del usuario tiene el permiso requerido sobre el recurso.
 */
export const rbac = (resource: Resource, action: Action) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // SuperUsuarios tienen acceso completo a todo automáticamente
    if (req.isSuperUser) {
      return next();
    }

    const userRole = req.user?.role as UserRole;

    if (!userRole) {
      return next(new ForbiddenError('Rol de usuario no identificado'));
    }

    const rolePermissions = PERMISSIONS[userRole];
    if (!rolePermissions) {
      return next(new ForbiddenError(`Rol desconocido: ${userRole}`));
    }

    const resourceActions = rolePermissions[resource] || [];
    if (!resourceActions.includes(action)) {
      return next(
        new ForbiddenError(
          `El rol '${userRole}' no tiene permiso para '${action}' en '${resource}'`
        )
      );
    }

    next();
  };
};

/**
 * Verifica si un rol específico tiene un permiso (útil en controllers)
 * Ejemplo: if (canDo(req.user.role, 'programs', 'delete')) { ... }
 */
export const canDo = (
  role: UserRole | string,
  resource: Resource,
  action: Action
): boolean => {
  const rolePermissions = PERMISSIONS[role as UserRole];
  if (!rolePermissions) return false;
  return (rolePermissions[resource] || []).includes(action);
};

/**
 * Verifica si el usuario es al menos de cierto nivel jerárquico
 * Útil para simplificar guards en operaciones sensibles.
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]:    6,
  [UserRole.PASTOR]:         5,
  [UserRole.ADMIN]:          4,
  [UserRole.MINISTRY_LEADER]: 3,
  [UserRole.EDITOR]:         2,
  [UserRole.VIEWER]:         1,
};

export const isAtLeast = (requiredRole: UserRole) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role as UserRole;
    const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 999;

    if (userLevel < requiredLevel) {
      return next(
        new ForbiddenError(
          `Se requiere rol '${requiredRole}' o superior. Tu rol actual es '${userRole}'`
        )
      );
    }
    next();
  };
};

/**
 * Backward compatibility: reemplaza el authorize() antiguo
 * Permite migración gradual sin romper código existente.
 *
 * El authorize() original recibía string[]. Ahora delega a isAtLeast o rbac.
 * Úsalo durante la transición, luego migra a rbac() específico por ruta.
 */
export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    if (!userRole || !roles.includes(userRole)) {
      return next(new ForbiddenError('No tienes permisos para esta acción'));
    }
    next();
  };
};
