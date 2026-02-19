/**
 * Configuración de Sentry DESHABILITADA
 * 
 * Este módulo exporta funciones vacías (no-op) para mantener
 * compatibilidad con el código existente sin activar Sentry.
 * 
 * Para activar Sentry en el futuro:
 * 1. npm install @sentry/node @sentry/profiling-node
 * 2. Crear cuenta en sentry.io
 * 3. Agregar SENTRY_DSN a .env
 * 4. Descomentar el código real de Sentry
 */

// Sentry DESHABILITADO - solo exportamos stubs
export function initSentry() {
  console.log('ℹ️  Sentry deshabilitado');
}

export function captureError(error: Error, context?: Record<string, any>) {
  // No-op: Sentry deshabilitado
}

export function captureMessage(message: string, level?: string) {
  // No-op: Sentry deshabilitado
}

export const sentryRequestHandler = () => {
  return (req: any, res: any, next: any) => next();
};

export const sentryErrorHandler = () => {
  return (err: any, req: any, res: any, next: any) => next(err);
};

export function startTransaction(name: string, op: string) {
  return null;
}

// Mock de Sentry para mantener compatibilidad
export const Sentry = {
  captureException: () => {},
  captureMessage: () => {},
  startTransaction: () => null,
};
