import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import Church from '../models/Church.model';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';
import { cache, CacheKeys, CacheTTL } from '../infrastructure/cache/CacheAdapter';

/**
 * TENANT GUARD — Paso 1 de Seguridad Multi-Tenant
 *
 * Problema original: El churchId solo se filtraba en cada query individualmente.
 * Un token válido de Iglesia A podía manipular el body para acceder a datos de Iglesia B.
 *
 * Solución: Este middleware:
 *  1. Valida que el usuario tenga churchId en su token
 *  2. Verifica que la iglesia exista y esté activa en la DB
 *  3. Inyecta req.churchId de forma segura desde el TOKEN (no del body)
 *  4. Bloquea cualquier intento de usar un churchId diferente al del token
 */
export const tenantGuard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. El churchId SIEMPRE viene del token JWT, nunca del body/params del request
    const churchId = req.user?.churchId?.toString();

    if (!churchId) {
      throw new UnauthorizedError('Token no contiene información de iglesia');
    }

    // 2. Verificar que la iglesia existe y está activa
    //    CACHE FIRST: evitar query a DB en cada request (TTL 5 min)
    const cacheKey = CacheKeys.tenantValid(churchId);
    const cached = await cache.get<{ isActive: boolean; name: string }>(cacheKey);

    if (cached) {
      if (!cached.isActive) {
        throw new ForbiddenError('Esta iglesia está desactivada. Contacte al administrador');
      }
    } else {
      const church = await Church.findById(churchId).select('isActive name').lean();

      if (!church) {
        throw new ForbiddenError('Iglesia no encontrada');
      }

      if (!church.isActive) {
        throw new ForbiddenError('Esta iglesia está desactivada. Contacte al administrador');
      }

      // Guardar en cache para próximas requests
      await cache.set(cacheKey, { isActive: church.isActive, name: church.name }, CacheTTL.TENANT);
    }

    // 3. Inyectar churchId seguro desde el token — sobrescribe cualquier valor previo
    req.churchId = churchId;

    // 4. Protección adicional: si alguien envía un churchId diferente en el body,
    //    lo sobrescribimos silenciosamente con el del token
    if (req.body && req.body.churchId && req.body.churchId !== churchId) {
      req.body.churchId = churchId;
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * PLAN LIMITS — Verifica límites de recursos según el plan de la iglesia
 *
 * Para Fase 3 (SaaS comercial). Por ahora retorna los límites FREE como base.
 * Cuando integres Stripe, leer church.plan de la DB aquí.
 *
 * Uso: router.post('/persons', authenticate, tenantGuard, planLimit('persons'), createPerson)
 */

type LimitedResource = 'persons' | 'programs' | 'ministries' | 'users';

// Límites por plan — fácil de extender cuando llegue Stripe
const PLAN_LIMITS: Record<string, Record<LimitedResource, number>> = {
  FREE: {
    persons: 30,
    programs: 50,
    ministries: 3,
    users: 2,
  },
  PRO: {
    persons: 200,
    programs: 500,
    ministries: 15,
    users: 10,
  },
  ENTERPRISE: {
    persons: Infinity,
    programs: Infinity,
    ministries: Infinity,
    users: Infinity,
  },
};

// Función auxiliar para contar recursos actuales
async function getCurrentCount(
  churchId: string,
  resource: LimitedResource
): Promise<number> {
  // Import dinámico para evitar dependencias circulares
  const { default: Person } = await import('../models/Person.model');
  const { default: Program } = await import('../models/Program.model');
  const { default: User } = await import('../models/User.model');
  const { default: Ministry } = await import('../models/Ministry.model');

  switch (resource) {
    case 'persons':
      return Person.countDocuments({ churchId, status: { $in: ['ACTIVE', 'LEADER'] } });
    case 'programs':
      return Program.countDocuments({ churchId });
    case 'users':
      return User.countDocuments({ churchId, isActive: true });
    case 'ministries':
      return Ministry.countDocuments({ churchId, isActive: true });
    default:
      return 0;
  }
}

export const planLimit = (resource: LimitedResource) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Por ahora todas las iglesias están en plan FREE
      // En Fase 3: leer church.plan desde DB/cache
      const plan = 'FREE'; // TODO: obtener de req.churchPlan cuando se implemente billing
      const limit = PLAN_LIMITS[plan][resource];

      if (limit === Infinity) return next();

      const current = await getCurrentCount(req.churchId!, resource);

      if (current >= limit) {
        return res.status(402).json({
          success: false,
          message: `Límite del plan alcanzado para ${resource}`,
          details: {
            currentPlan: plan,
            resource,
            current,
            limit,
            upgradeMessage: `Tu plan ${plan} permite hasta ${limit} ${resource}. Actualiza tu plan para continuar.`,
          },
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
