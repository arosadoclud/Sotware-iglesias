import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { Permission, DEFAULT_ROLE_PERMISSIONS, hasPermission, hasAnyPermission } from '../config/permissions';
import { ForbiddenError } from '../utils/errors';

/**
 * Middleware para verificar que el usuario tiene un permiso específico
 */
export const requirePermission = (permission: Permission) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ForbiddenError('Usuario no autenticado');
      }

      const userPermissions = getUserPermissions(req);
      
      if (!hasPermission(userPermissions, permission)) {
        throw new ForbiddenError(`No tiene permiso para: ${permission}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware para verificar que el usuario tiene al menos uno de los permisos
 */
export const requireAnyPermission = (...permissions: Permission[]) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ForbiddenError('Usuario no autenticado');
      }

      const userPermissions = getUserPermissions(req);
      
      if (!hasAnyPermission(userPermissions, permissions)) {
        throw new ForbiddenError(`No tiene ninguno de los permisos requeridos`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware para verificar que el usuario tiene todos los permisos
 */
export const requireAllPermissions = (...permissions: Permission[]) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ForbiddenError('Usuario no autenticado');
      }

      const userPermissions = getUserPermissions(req);
      
      const missing = permissions.filter(p => !userPermissions.includes(p));
      if (missing.length > 0) {
        throw new ForbiddenError(`Faltan permisos: ${missing.join(', ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware para verificar que es SUPER_ADMIN o PASTOR
 */
export const requireAdmin = () => {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ForbiddenError('Usuario no autenticado');
      }

      const allowedRoles = ['SUPER_ADMIN', 'PASTOR', 'ADMIN'];
      if (!allowedRoles.includes(req.userRole || '')) {
        throw new ForbiddenError('Se requiere rol de administrador');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware para verificar que es SUPER_ADMIN
 */
export const requireSuperAdmin = () => {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ForbiddenError('Usuario no autenticado');
      }

      if (req.userRole !== 'SUPER_ADMIN') {
        throw new ForbiddenError('Se requiere rol de Super Administrador');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware para verificar que es SuperUsuario (flag especial)
 */
export const requireSuperUser = () => {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ForbiddenError('Usuario no autenticado');
      }

      if (!req.isSuperUser) {
        throw new ForbiddenError('Solo el superusuario puede realizar esta acción');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Helper para obtener los permisos del usuario
 */
function getUserPermissions(req: AuthRequest): string[] {
  const user = req.user;
  if (!user) return [];

  // SuperUsuarios tienen todos los permisos
  if (req.isSuperUser) {
    return Object.values(Permission);
  }

  // Si el usuario tiene permisos personalizados habilitados
  if (user.useCustomPermissions && user.permissions && user.permissions.length > 0) {
    return user.permissions;
  }

  // Usar permisos por defecto del rol
  return DEFAULT_ROLE_PERMISSIONS[user.role] || [];
}

/**
 * Agregar permisos al request para uso en controladores
 */
export const attachPermissions = () => {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (req.user) {
      (req as any).userPermissions = getUserPermissions(req);
    }
    next();
  };
};

export { Permission };
