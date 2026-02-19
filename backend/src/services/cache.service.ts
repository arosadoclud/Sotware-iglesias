import { createClient, RedisClientType } from 'redis';
import logger from '../utils/logger';

/**
 * Redis Cache Service para optimizar performance
 * 
 * Estrategias de cache implementadas:
 * 1. Cache de queries frecuentes (persons, programs)
 * 2. Cache de datos de iglesia (church info)
 * 3. Cache de estadísticas del dashboard
 * 4. TTL automático con invalidación inteligente
 * 5. Cache tags para invalidación masiva
 * 
 * Environment variables:
 * - REDIS_URL: URL de conexión a Redis (upstash.com gratis o local)
 */

export class CacheService {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private defaultTTL = 300; // 5 minutos

  constructor() {
    this.initialize();
  }

  private async initialize() {
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      logger.warn('⚠️  REDIS_URL no configurado - cache desactivado');
      logger.info('   Para activar Redis:');
      logger.info('   1. Redis local: redis://localhost:6379');
      logger.info('   2. Upstash gratis: https://upstash.com (copia el REST URL)');
      return;
    }

    try {
      this.client = createClient({ url: redisUrl });
      
      this.client.on('error', (err) => {
        logger.error('Redis error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('🔄 Conectando a Redis...');
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        logger.info('✅ Redis cache conectado');
      });

      await this.client.connect();
    } catch (error: any) {
      logger.error('❌ Error conectando a Redis:', error.message);
      this.client = null;
    }
  }

  /**
   * Obtener valor del cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.client) return null;

    try {
      const value = await this.client.get(key);
      if (!value || typeof value !== 'string') return null;
      
      return JSON.parse(value) as T;
    } catch (error: any) {
      logger.error(`Cache GET error for key ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Guardar valor en cache con TTL
   */
  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
    if (!this.isConnected || !this.client) return;

    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
    } catch (error: any) {
      logger.error(`Cache SET error for key ${key}:`, error.message);
    }
  }

  /**
   * Eliminar un key específico
   */
  async del(key: string): Promise<void> {
    if (!this.isConnected || !this.client) return;

    try {
      await this.client.del(key);
    } catch (error: any) {
      logger.error(`Cache DEL error for key ${key}:`, error.message);
    }
  }

  /**
   * Eliminar múltiples keys por patrón
   */
  async delPattern(pattern: string): Promise<void> {
    if (!this.isConnected || !this.client) return;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
        logger.info(`🗑️  Cache invalidado: ${keys.length} keys (${pattern})`);
      }
    } catch (error: any) {
      logger.error(`Cache DEL pattern error for ${pattern}:`, error.message);
    }
  }

  /**
   * CACHE TAGS - Eliminar por tags (ej: invalidar todo lo relacionado con churchId)
   */
  async invalidateByTag(tag: string): Promise<void> {
    await this.delPattern(`*:${tag}:*`);
  }

  /**
   * Verificar si existe un key
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isConnected || !this.client) return false;

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error: any) {
      logger.error(`Cache EXISTS error for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Obtener TTL restante de un key
   */
  async ttl(key: string): Promise<number> {
    if (!this.isConnected || !this.client) return -1;

    try {
      return await this.client.ttl(key);
    } catch (error: any) {
      logger.error(`Cache TTL error for key ${key}:`, error.message);
      return -1;
    }
  }

  /**
   * Limpiar todo el cache (usar con cuidado)
   */
  async flush(): Promise<void> {
    if (!this.isConnected || !this.client) return;

    try {
      await this.client.flushAll();
      logger.warn('🗑️  Cache completamente limpiado');
    } catch (error: any) {
      logger.error('Cache FLUSH error:', error.message);
    }
  }

  /**
   * Obtener estadísticas del cache
   */
  async getStats(): Promise<{ keys: number; memory: string } | null> {
    if (!this.isConnected || !this.client) return null;

    try {
      const keys = await this.client.dbSize();
      const info = await this.client.info('memory');
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const memory = memoryMatch ? memoryMatch[1].trim() : 'N/A';

      return { keys, memory };
    } catch (error: any) {
      logger.error('Cache STATS error:', error.message);
      return null;
    }
  }

  /**
   * Wrap: Obtener de cache o ejecutar función
   */
  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    // Intentar obtener del cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      logger.debug(`📦 Cache HIT: ${key}`);
      return cached;
    }

    // Cache miss - ejecutar función
    logger.debug(`🔍 Cache MISS: ${key}`);
    const result = await fn();
    
    // Guardar en cache
    await this.set(key, result, ttl);
    
    return result;
  }

  /**
   * Helper: generar key de cache para iglesia
   */
  churchKey(churchId: string, resource: string, id?: string): string {
    return id 
      ? `church:${churchId}:${resource}:${id}`
      : `church:${churchId}:${resource}`;
  }

  /**
   * Desconectar Redis (graceful shutdown)
   */
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      logger.info('👋 Redis desconectado');
    }
  }
}

// Singleton
export const cacheService = new CacheService();

/**
 * Middleware Express para cache de rutas GET
 */
export function cacheMiddleware(ttl: number = 300) {
  return async (req: any, res: any, next: any) => {
    // Solo cachear GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `route:${req.churchId}:${req.originalUrl}`;
    const cached = await cacheService.get(key);

    if (cached) {
      logger.debug(`📦 Cache HIT (middleware): ${key}`);
      return res.json(cached);
    }

    // Interceptar res.json para cachear la respuesta
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      if (res.statusCode === 200 && body.success) {
        cacheService.set(key, body, ttl);
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * Helper: Invalidar cache cuando se modifica un recurso
 */
export async function invalidateResourceCache(
  churchId: string,
  resource: string
): Promise<void> {
  await cacheService.delPattern(`church:${churchId}:${resource}*`);
  await cacheService.delPattern(`route:${churchId}*`);
  logger.info(`♻️  Cache invalidado: ${resource} (churchId: ${churchId})`);
}
