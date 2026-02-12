// Status de personas
export const PERSON_STATUS = {
  ACTIVE: { label: 'Activo', value: 'ACTIVE', variant: 'success' as const },
  INACTIVE: { label: 'Inactivo', value: 'INACTIVE', variant: 'secondary' as const },
  NEW: { label: 'Nuevo', value: 'NEW', variant: 'default' as const },
  LEADER: { label: 'Líder', value: 'LEADER', variant: 'warning' as const },
} as const

// Status de programas
export const PROGRAM_STATUS = {
  DRAFT: { label: 'Borrador', value: 'DRAFT', variant: 'secondary' as const },
  PUBLISHED: { label: 'Publicado', value: 'PUBLISHED', variant: 'success' as const },
  COMPLETED: { label: 'Completado', value: 'COMPLETED', variant: 'default' as const },
  CANCELLED: { label: 'Cancelado', value: 'CANCELLED', variant: 'danger' as const },
} as const

// Roles del sistema
export const SYSTEM_ROLES = {
  SUPER_ADMIN: { label: 'Super Admin', value: 'SUPER_ADMIN' },
  PASTOR: { label: 'Pastor', value: 'PASTOR' },
  ADMIN: { label: 'Administrador', value: 'ADMIN' },
  MINISTRY_LEADER: { label: 'Líder de Ministerio', value: 'MINISTRY_LEADER' },
  EDITOR: { label: 'Editor', value: 'EDITOR' },
  VIEWER: { label: 'Visualizador', value: 'VIEWER' },
} as const

// Prioridades
export const PRIORITY_LEVELS = Array.from({ length: 10 }, (_, i) => ({
  label: `${i + 1}`,
  value: i + 1,
}))

// Tamaños de paginación
export const PAGE_SIZES = [10, 20, 30, 50, 100]

// Formatos de fecha
export const DATE_FORMATS = {
  SHORT: 'dd/MM/yyyy',
  LONG: "dd 'de' MMMM 'de' yyyy",
  WITH_TIME: 'dd/MM/yyyy HH:mm',
  ISO: "yyyy-MM-dd'T'HH:mm:ss",
} as const

// Rutas de navegación
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  PERSONS: '/persons',
  PERSON_DETAIL: '/persons/:id',
  ACTIVITIES: '/activities',
  PROGRAMS: '/programs',
  PROGRAM_NEW: '/programs/generate',
  PROGRAM_EDIT: '/programs/:id/edit',
  PROGRAM_FLYER: '/programs/:id/flyer',
  CALENDAR: '/calendar',
  LETTERS: '/letters',
  SETTINGS: '/settings',
} as const

// Mensajes de validación
export const VALIDATION_MESSAGES = {
  REQUIRED: 'Este campo es requerido',
  EMAIL_INVALID: 'Email inválido',
  PASSWORD_MIN: 'La contraseña debe tener al menos 6 caracteres',
  PHONE_INVALID: 'Teléfono inválido',
  MIN_LENGTH: (min: number) => `Mínimo ${min} caracteres`,
  MAX_LENGTH: (max: number) => `Máximo ${max} caracteres`,
} as const

// Colores del tema
export const THEME_COLORS = {
  primary: '#2563eb',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  neutral: '#737373',
} as const

// Configuración de toast
export const TOAST_CONFIG = {
  duration: 4000,
  position: 'top-right' as const,
  style: {
    fontFamily: 'system-ui, sans-serif',
  },
}

// Límites de caracteres
export const CHAR_LIMITS = {
  NAME: 255,
  PHONE: 20,
  EMAIL: 255,
  MINISTRY: 100,
  NOTES: 1000,
  PROGRAM_TITLE: 200,
  PROGRAM_DESCRIPTION: 2000,
} as const

// Configuración de DataTable
export const TABLE_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  MIN_PAGE_SIZE: 5,
  MAX_PAGE_SIZE: 100,
} as const
