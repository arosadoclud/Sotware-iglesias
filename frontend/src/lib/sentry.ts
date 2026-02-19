/**
 * Configuración de Sentry DESHABILITADA
 * 
 * Este módulo exporta funciones vacías (no-op) para mantener
 * compatibilidad con el código existente sin activar Sentry.
 * 
 * Para activar Sentry en el futuro:
 * 1. npm install @sentry/react
 * 2. Crear cuenta en sentry.io
 * 3. Agregar VITE_SENTRY_DSN a .env
 * 4. Descomentar el código real de Sentry
 */

// Sentry DESHABILITADO - solo exportamos stubs
export function initSentry() {
  console.log('ℹ️  Sentry deshabilitado (frontend)');
}

export function captureError(error: Error, context?: Record<string, any>) {
  // No-op: Sentry deshabilitado
}

export function captureMessage(message: string, level?: string) {
  // No-op: Sentry deshabilitado
}

// ErrorBoundary mock - solo pasa los children sin hacer nada
export const ErrorBoundary = ({ children }: any) => children;

// Mock de Sentry para mantener compatibilidad
export const Sentry = {
  captureException: () => {},
  captureMessage: () => {},
  setUser: () => {},
  setContext: () => {},
  configureScope: () => {},
};

export function setUserContext(user: { id: string; email: string; name: string; role: string }) {
  // No-op: Sentry deshabilitado
}

export function clearUserContext() {
  // No-op: Sentry deshabilitado
}

