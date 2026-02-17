// ────────────────────────────────────────────────────────────────────────────
// Permisos del frontend — espejo de backend/src/config/permissions.ts
// ────────────────────────────────────────────────────────────────────────────

export const P = {
  // Usuarios
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_EDIT: 'users:edit',
  USERS_DELETE: 'users:delete',
  USERS_MANAGE: 'users:manage_permissions',

  // Personas
  PERSONS_VIEW: 'persons:view',
  PERSONS_CREATE: 'persons:create',
  PERSONS_EDIT: 'persons:edit',
  PERSONS_DELETE: 'persons:delete',
  PERSONS_ASSIGN_ROLES: 'persons:assign_roles',
  PERSONS_EXPORT: 'persons:export',

  // Programas
  PROGRAMS_VIEW: 'programs:view',
  PROGRAMS_CREATE: 'programs:create',
  PROGRAMS_EDIT: 'programs:edit',
  PROGRAMS_DELETE: 'programs:delete',
  PROGRAMS_GENERATE: 'programs:generate',
  PROGRAMS_DOWNLOAD_PDF: 'programs:download_pdf',
  PROGRAMS_BATCH: 'programs:batch_generate',

  // Actividades
  ACTIVITIES_VIEW: 'activities:view',
  ACTIVITIES_CREATE: 'activities:create',
  ACTIVITIES_EDIT: 'activities:edit',
  ACTIVITIES_DELETE: 'activities:delete',

  // Roles
  ROLES_VIEW: 'roles:view',
  ROLES_CREATE: 'roles:create',
  ROLES_EDIT: 'roles:edit',
  ROLES_DELETE: 'roles:delete',

  // Cartas
  LETTERS_VIEW: 'letters:view',
  LETTERS_CREATE: 'letters:create',
  LETTERS_EDIT: 'letters:edit',
  LETTERS_DELETE: 'letters:delete',
  LETTERS_PDF: 'letters:generate_pdf',

  // Calendario
  CALENDAR_VIEW: 'calendar:view',
  CALENDAR_MANAGE: 'calendar:manage',

  // Configuración
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT: 'settings:edit',
  CHURCH_EDIT: 'church:edit',

  // Auditoría
  AUDIT_VIEW: 'audit:view',
  AUDIT_EXPORT: 'audit:export',

  // Limpieza
  CLEANING_VIEW: 'cleaning:view',
  CLEANING_GENERATE: 'cleaning:generate',
  CLEANING_MANAGE: 'cleaning:manage',

  // WhatsApp
  WHATSAPP_SEND: 'whatsapp:send',

  // Finanzas (implícito — basado en los permisos de finances en rbac)
  FINANCES_VIEW: 'finances:view',
  FINANCES_CREATE: 'finances:create',
  FINANCES_EDIT: 'finances:edit',
  FINANCES_DELETE: 'finances:delete',
} as const

export type PermissionKey = (typeof P)[keyof typeof P]
