/**
 * Ejemplo de uso del Cache Service en controladores
 * 
 * Este archivo muestra las mejores prácticas para implementar
 * caching en tus endpoints existentes.
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Person from '../models/Person.model';
import { cacheService, invalidateResourceCache } from '../services/cache.service';

// ================================
// EJEMPLO 1: Cache en GET (lectura)
// ================================
export const getPersonsWithCache = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const churchId = req.churchId!;
    const { page = 1, limit = 10 } = req.query;
    
    // Generar key única del cache
    const cacheKey = `persons:${churchId}:page:${page}:limit:${limit}`;
    
    // Usar wrap para obtener del cache o ejecutar query
    const result = await cacheService.wrap(
      cacheKey,
      async () => {
        const skip = (Number(page) - 1) * Number(limit);
        const [persons, total] = await Promise.all([
          Person.find({ churchId })
            .select('fullName phone ministry status')
            .sort({ fullName: 1 })
            .skip(skip)
            .limit(Number(limit)),
          Person.countDocuments({ churchId })
        ]);
        
        return {
          persons,
          total,
          page: Number(page),
          limit: Number(limit)
        };
      },
      300 // TTL: 5 minutos
    );

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// ================================
// EJEMPLO 2: Invalidar cache en CREATE/UPDATE/DELETE
// ================================
export const createPersonWithCacheInvalidation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const churchId = req.churchId!;
    
    // Crear persona
    const person = await Person.create({
      ...req.body,
      churchId
    });

    // INVALIDAR CACHE - esto borra todos los cache keys relacionados con persons
    await invalidateResourceCache(churchId, 'persons');

    res.status(201).json({ success: true, data: person });
  } catch (error) {
    next(error);
  }
};

// ================================
// EJEMPLO 3: Cache de Dashboard Stats
// ================================
export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const churchId = req.churchId!;
    const cacheKey = `dashboard:stats:${churchId}`;

    const stats = await cacheService.wrap(
      cacheKey,
      async () => {
        // Queries pesadas que se benefician del cache
        const [
          totalPersons,
          totalPrograms,
          recentActivities
        ] = await Promise.all([
          Person.countDocuments({ churchId }),
          // Otros queries...
        ]);

        return {
          totalPersons,
          totalPrograms,
          recentActivities
        };
      },
      600 // TTL: 10 minutos (stats no cambian tan rápido)
    );

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

// ================================
// EJEMPLO 4: Cache por usuario específico
// ================================
export const getUserPreferences = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId!;
    const cacheKey = `user:${userId}:preferences`;

    const preferences = await cacheService.wrap(
      cacheKey,
      async () => {
        // Query de preferencias
        return { theme: 'dark', language: 'es' };
      },
      3600 // TTL: 1 hora
    );

    res.json({ success: true, data: preferences });
  } catch (error) {
    next(error);
  }
};

// ================================
// EJEMPLO 5: Uso con Middleware
// ================================
import { cacheMiddleware } from '../services/cache.service';

// En tus rutas:
// router.get('/persons', authenticate, tenantGuard, cacheMiddleware(300), getPersons);

// ================================
// ESTRATEGIA DE INVALIDACIÓN
// ================================

/*
CUÁNDO INVALIDAR:

1. CREATE: Invalidar lista + stats
   await invalidateResourceCache(churchId, 'persons');

2. UPDATE: Invalidar item específico + lista
   await cacheService.del(`persons:${churchId}:${personId}`);
   await invalidateResourceCache(churchId, 'persons');

3. DELETE: Invalidar todo
   await invalidateResourceCache(churchId, 'persons');

4. Operaciones masivas: Invalidar múltiples recursos
   await invalidateResourceCache(churchId, 'persons');
   await invalidateResourceCache(churchId, 'programs');
   await invalidateResourceCache(churchId, 'dashboard');

RECURSOS RECOMENDADOS PARA CACHEAR:

✅ Dashboard stats (10 min TTL)
✅ Persons list (5 min TTL)
✅ Programs list (5 min TTL)
✅ Church info (1 hora TTL)
✅ User preferences (1 hora TTL)
✅ Ministries list (15 min TTL)
✅ Roles list (15 min TTL)

❌ NO cachear:
- Operaciones de escritura (POST, PUT, DELETE)
- Datos sensibles (passwords, tokens)
- Real-time data (notificaciones)
- Reportes financieros (pueden cambiar frecuentemente)
*/
