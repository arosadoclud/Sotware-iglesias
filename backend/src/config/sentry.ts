import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import envConfig from './env';

/**
 * Configuración de Sentry para monitoreo de errores y performance
 * 
 * Para obtener tu DSN:
 * 1. Crea cuenta gratis en sentry.io
 * 2. Crea nuevo proyecto Node.js
 * 3. Copia el DSN y agrégalo a tu .env como SENTRY_DSN
 * 
 * Environment variables necesarias:
 * - SENTRY_DSN: tu DSN de Sentry
 * - SENTRY_ENVIRONMENT: desarrollo|produccion
 * - SENTRY_SAMPLE_RATE: 1.0 (100%) o 0.1 (10%)
 */

export function initSentry() {
  const sentryDsn = process.env.SENTRY_DSN;
  
  if (!sentryDsn) {
    console.log('⚠️  Sentry DSN no configurado - skipping');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    
    // Entorno (desarrollo, staging, producción)
    environment: process.env.SENTRY_ENVIRONMENT || envConfig.nodeEnv,
    
    // Release/version tracking
    release: `church-manager-backend@${process.env.npm_package_version || '1.0.0'}`,
    
    // Performance Monitoring
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '1.0'), // 100% en dev, 10% en prod
    
    // Profiling
    profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '1.0'),
    
    integrations: [
      // Performance profiling
      new ProfilingIntegration(),
      
      // HTTP tracking
      new Sentry.Integrations.Http({ tracing: true }),
      
      // Express integration
      new Sentry.Integrations.Express({ app: undefined }),
      
      // MongoDB tracking
      new Sentry.Integrations.Mongo({
        useMongoose: true
      })
    ],
    
    // Filtrar información sensible
    beforeSend(event, hint) {
      // No enviar errores 404 (rutas no encontradas)
      if (event.exception?.values?.[0]?.value?.includes('404')) {
        return null;
      }
      
      // Sanitizar datos sensibles
      if (event.request) {
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
        }
      }
      
      return event;
    },
    
    // Tags adicionales para filtrado
    initialScope: {
      tags: {
        app: 'church-manager',
        layer: 'backend'
      }
    }
  });

  console.log('✅ Sentry inicializado:', process.env.SENTRY_ENVIRONMENT || envConfig.nodeEnv);
}

/**
 * Helper para capturar excepciones manualmente
 */
export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context
  });
}

/**
 * Helper para capturar mensajes custom
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * Middleware para Express - agregar en app.ts ANTES de las rutas
 */
export const sentryRequestHandler = () => Sentry.Handlers.requestHandler();

/**
 * Middleware para Express - agregar DESPUÉS de las rutas
 */
export const sentryErrorHandler = () => Sentry.Handlers.errorHandler();

/**
 * Para tracing de transactions personalizadas
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({ name, op });
}

export { Sentry };
