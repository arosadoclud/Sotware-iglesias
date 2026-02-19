import * as Sentry from '@sentry/react';

/**
 * Configuración de Sentry para frontend React
 * 
 * Variables de entorno necesarias (agregar a .env):
 * - VITE_SENTRY_DSN: tu DSN de Sentry (frontend)
 * - VITE_SENTRY_ENVIRONMENT: desarrollo|produccion
 */

export function initSentry() {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!sentryDsn) {
    console.warn('⚠️  Sentry DSN no configurado - error tracking desactivado');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    
    // Entorno
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    
    // Release tracking
    release: `church-manager-frontend@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
    
    // Performance Monitoring
    integrations: [
      // React Router tracking
      Sentry.browserTracingIntegration(),
      
      // React component profiling
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect: React.useEffect
      }),
      
      // Replay de sesiones para debugging
      Sentry.replayIntegration({
        maskAllText: true, // Ocultar texto por privacidad
        blockAllMedia: true // Bloquear images/videos
      })
    ],
    
    // Performance monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0, // 10% en prod, 100% en dev
    
    // Session Replay (solo errores en prod, todas las sesiones en dev)
    replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0, // Siempre grabar cuando hay error
    
    // Filtrar información sensible
    beforeSend(event, hint) {
      // No enviar errores de desarrollo local
      if (event.request?.url?.includes('localhost:5173')) {
        return null;
      }
      
      // Sanitizar datos
      if (event.request) {
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers['authorization'];
        }
      }
      
      // No enviar errores de extensiones del navegador
      if (event.exception?.values?.some(e => 
        e.stacktrace?.frames?.some(f => 
          f.filename?.includes('extensions/') || 
          f.filename?.includes('chrome-extension://')
        )
      )) {
        return null;
      }
      
      return event;
    },
    
    // Tags para filtrado
    initialScope: {
      tags: {
        app: 'church-manager',
        layer: 'frontend'
      }
    },
    
    // Ignorar errores conocidos
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'Network request failed',
      'Load failed'
    ]
  });

  console.log('✅ Sentry frontend inicializado');
}

/**
 * Helper para capturar errores manualmente
 */
export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, { extra: context });
}

/**
 * Helper para establecer contexto de usuario
 */
export function setUserContext(user: { id: string; email: string; name: string; role: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
    role: user.role
  });
}

/**
 * Helper para limpiar contexto de usuario (logout)
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

export { Sentry };

// Import React for router integration
import React from 'react';
