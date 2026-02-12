/**
 * CACHE ADAPTER — Paso 8
 *
 * Wrapper sobre Redis con fallback en memoria (Map) cuando Redis no está disponible.
 * El servidor funciona correctamente en ambos casos — Redis solo mejora el rendimiento.
 *
 * Uso:
 *   await cache.set('key', value, 300);      // TTL en segundos
 *   const val = await cache.get<MyType>('key');
 *   await cache.del('key');
 *   await cache.delPattern('church:abc123:*');
 *
 * Instalación (opcional): npm install ioredis @types/ioredis
 */

interface CacheEntry {
  value: string;
  expiresAt: number; // timestamp ms
}

// Fallback en memoria con TTL
class MemoryCache {
  private store = new Map<string, CacheEntry>();
  private cleanupInterval: NodeJS.Timer;

  constructor() {
    // Limpiar entradas expiradas cada 5 minutos
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of this.store.keys()) {
      if (regex.test(key)) this.store.delete(key);
    }
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }
}

// Adapter Redis (si está disponible)
class RedisCache {
  private client: any;

  constructor(redisUrl: string) {
    try {
      const Redis = require('ioredis');
      this.client = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 3,
        enableReadyCheck: false,
      });
      this.client.on('error', (err: Error) => {
        console.warn('[Cache/Redis] Error:', err.message);
      });
      this.client.on('connect', () => console.info('[Cache/Redis] Conectado ✓'));
    } catch {
      console.warn('[Cache/Redis] ioredis no instalado — usando cache en memoria');
      this.client = null;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (!this.client) return;
    await this.client.setex(key, ttlSeconds, value);
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    await this.client.del(key);
  }

  async delPattern(pattern: string): Promise<void> {
    if (!this.client) return;
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) await this.client.del(...keys);
  }
}

// Interface unificada
export class CacheAdapter {
  private backend: MemoryCache | RedisCache;
  private readonly usingRedis: boolean;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      this.backend = new RedisCache(redisUrl);
      this.usingRedis = true;
    } else {
      this.backend = new MemoryCache();
      this.usingRedis = false;
      console.info('[Cache] Usando cache en memoria (sin Redis)');
    }
  }

  /**
   * Obtiene un valor cacheado y lo deserializa.
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await this.backend.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  /**
   * Guarda un valor con TTL en segundos.
   */
  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      await this.backend.set(key, JSON.stringify(value), ttlSeconds);
    } catch (err) {
      console.warn('[Cache] Error al guardar:', err);
    }
  }

  /**
   * Elimina una clave específica.
   */
  async del(key: string): Promise<void> {
    await this.backend.del(key);
  }

  /**
   * Elimina todas las claves que coincidan con el patrón.
   * Ejemplo: cache.delPattern('church:abc123:*')
   */
  async delPattern(pattern: string): Promise<void> {
    await this.backend.delPattern(pattern);
  }

  /**
   * Get-or-set: devuelve el valor cacheado o ejecuta la función y guarda el resultado.
   *
   * Uso:
   *   const stats = await cache.wrap('stats:abc123', () => computeExpensiveStats(), 300);
   */
  async wrap<T>(key: string, fn: () => Promise<T>, ttlSeconds: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const value = await fn();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  isRedis() { return this.usingRedis; }
}

// Singleton exportado — importar en cualquier módulo
export const cache = new CacheAdapter();

// ── CLAVES DE CACHE (convención) ──────────────────────────────────────────────
// Estandarizar las claves para evitar typos y colisiones.

export const CacheKeys = {
  // Validación de tenant (5 min) — evita query a DB por cada request
  tenantValid: (churchId: string) => `tenant:${churchId}:valid`,

  // Configuración de la iglesia (10 min) — casi no cambia
  churchSettings: (churchId: string) => `church:${churchId}:settings`,

  // Stats del dashboard (5 min) — relativamente costosas
  dashboardStats: (churchId: string) => `church:${churchId}:stats`,

  // Historial de participación (1 min) — cambia con cada generación
  participationHistory: (churchId: string) => `church:${churchId}:history`,

  // Lista de personas activas (2 min)
  activePersons: (churchId: string) => `church:${churchId}:persons:active`,

  // Actividades (10 min)
  activities: (churchId: string) => `church:${churchId}:activities`,

  // Patrón para invalidar todo de una iglesia
  churchPattern: (churchId: string) => `church:${churchId}:*`,
};

// TTLs en segundos
export const CacheTTL = {
  TENANT:       5 * 60,    // 5 min
  SETTINGS:    10 * 60,    // 10 min
  STATS:        5 * 60,    // 5 min
  HISTORY:      1 * 60,    // 1 min
  PERSONS:      2 * 60,    // 2 min
  ACTIVITIES:  10 * 60,    // 10 min
};
