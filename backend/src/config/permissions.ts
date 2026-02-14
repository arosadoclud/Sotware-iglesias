// Sistema de permisos granulares para el sistema de gestión de iglesias

// Definición de todos los permisos disponibles
export enum Permission {
  // ── USUARIOS ────────────────────────────────────────────────────────────────
  USERS_VIEW = 'users:view',
  USERS_CREATE = 'users:create',
  USERS_EDIT = 'users:edit',
  USERS_DELETE = 'users:delete',
  USERS_MANAGE_PERMISSIONS = 'users:manage_permissions',
  
  // ── PERSONAS ────────────────────────────────────────────────────────────────
  PERSONS_VIEW = 'persons:view',
  PERSONS_CREATE = 'persons:create',
  PERSONS_EDIT = 'persons:edit',
  PERSONS_DELETE = 'persons:delete',
  PERSONS_ASSIGN_ROLES = 'persons:assign_roles',
  PERSONS_EXPORT = 'persons:export',
  
  // ── PROGRAMAS ───────────────────────────────────────────────────────────────
  PROGRAMS_VIEW = 'programs:view',
  PROGRAMS_CREATE = 'programs:create',
  PROGRAMS_EDIT = 'programs:edit',
  PROGRAMS_DELETE = 'programs:delete',
  PROGRAMS_GENERATE = 'programs:generate',
  PROGRAMS_DOWNLOAD_PDF = 'programs:download_pdf',
  PROGRAMS_BATCH_GENERATE = 'programs:batch_generate',
  
  // ── ACTIVIDADES ─────────────────────────────────────────────────────────────
  ACTIVITIES_VIEW = 'activities:view',
  ACTIVITIES_CREATE = 'activities:create',
  ACTIVITIES_EDIT = 'activities:edit',
  ACTIVITIES_DELETE = 'activities:delete',
  
  // ── ROLES ───────────────────────────────────────────────────────────────────
  ROLES_VIEW = 'roles:view',
  ROLES_CREATE = 'roles:create',
  ROLES_EDIT = 'roles:edit',
  ROLES_DELETE = 'roles:delete',
  
  // ── CARTAS ──────────────────────────────────────────────────────────────────
  LETTERS_VIEW = 'letters:view',
  LETTERS_CREATE = 'letters:create',
  LETTERS_EDIT = 'letters:edit',
  LETTERS_DELETE = 'letters:delete',
  LETTERS_GENERATE_PDF = 'letters:generate_pdf',
  
  // ── CALENDARIO ──────────────────────────────────────────────────────────────
  CALENDAR_VIEW = 'calendar:view',
  CALENDAR_MANAGE = 'calendar:manage',
  
  // ── CONFIGURACIÓN ───────────────────────────────────────────────────────────
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_EDIT = 'settings:edit',
  CHURCH_EDIT = 'church:edit',
  
  // ── AUDITORÍA ───────────────────────────────────────────────────────────────
  AUDIT_VIEW = 'audit:view',
  AUDIT_EXPORT = 'audit:export',
  
  // ── LIMPIEZA ────────────────────────────────────────────────────────────────
  CLEANING_VIEW = 'cleaning:view',
  CLEANING_GENERATE = 'cleaning:generate',
  CLEANING_MANAGE = 'cleaning:manage',
  
  // ── WHATSAPP ────────────────────────────────────────────────────────────────
  WHATSAPP_SEND = 'whatsapp:send',
}

// Permisos por defecto según el rol
export const DEFAULT_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: Object.values(Permission), // Todos los permisos
  
  PASTOR: [
    // Usuarios (solo ver)
    Permission.USERS_VIEW,
    // Personas (todos)
    Permission.PERSONS_VIEW,
    Permission.PERSONS_CREATE,
    Permission.PERSONS_EDIT,
    Permission.PERSONS_DELETE,
    Permission.PERSONS_ASSIGN_ROLES,
    Permission.PERSONS_EXPORT,
    // Programas (todos)
    Permission.PROGRAMS_VIEW,
    Permission.PROGRAMS_CREATE,
    Permission.PROGRAMS_EDIT,
    Permission.PROGRAMS_DELETE,
    Permission.PROGRAMS_GENERATE,
    Permission.PROGRAMS_DOWNLOAD_PDF,
    Permission.PROGRAMS_BATCH_GENERATE,
    // Actividades (todos)
    Permission.ACTIVITIES_VIEW,
    Permission.ACTIVITIES_CREATE,
    Permission.ACTIVITIES_EDIT,
    Permission.ACTIVITIES_DELETE,
    // Roles (todos)
    Permission.ROLES_VIEW,
    Permission.ROLES_CREATE,
    Permission.ROLES_EDIT,
    Permission.ROLES_DELETE,
    // Cartas (todos)
    Permission.LETTERS_VIEW,
    Permission.LETTERS_CREATE,
    Permission.LETTERS_EDIT,
    Permission.LETTERS_DELETE,
    Permission.LETTERS_GENERATE_PDF,
    // Calendario
    Permission.CALENDAR_VIEW,
    Permission.CALENDAR_MANAGE,
    // Configuración
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_EDIT,
    Permission.CHURCH_EDIT,
    // Auditoría (solo ver)
    Permission.AUDIT_VIEW,
    // Limpieza
    Permission.CLEANING_VIEW,
    Permission.CLEANING_GENERATE,
    Permission.CLEANING_MANAGE,
    // WhatsApp
    Permission.WHATSAPP_SEND,
  ],
  
  ADMIN: [
    Permission.USERS_VIEW,
    Permission.USERS_CREATE,
    Permission.USERS_EDIT,
    // Personas
    Permission.PERSONS_VIEW,
    Permission.PERSONS_CREATE,
    Permission.PERSONS_EDIT,
    Permission.PERSONS_ASSIGN_ROLES,
    Permission.PERSONS_EXPORT,
    // Programas
    Permission.PROGRAMS_VIEW,
    Permission.PROGRAMS_CREATE,
    Permission.PROGRAMS_EDIT,
    Permission.PROGRAMS_GENERATE,
    Permission.PROGRAMS_DOWNLOAD_PDF,
    Permission.PROGRAMS_BATCH_GENERATE,
    // Actividades
    Permission.ACTIVITIES_VIEW,
    Permission.ACTIVITIES_CREATE,
    Permission.ACTIVITIES_EDIT,
    // Roles
    Permission.ROLES_VIEW,
    Permission.ROLES_CREATE,
    Permission.ROLES_EDIT,
    // Cartas
    Permission.LETTERS_VIEW,
    Permission.LETTERS_CREATE,
    Permission.LETTERS_EDIT,
    Permission.LETTERS_GENERATE_PDF,
    // Calendario
    Permission.CALENDAR_VIEW,
    Permission.CALENDAR_MANAGE,
    // Configuración
    Permission.SETTINGS_VIEW,
    // Auditoría
    Permission.AUDIT_VIEW,
    // Limpieza
    Permission.CLEANING_VIEW,
    Permission.CLEANING_GENERATE,
    Permission.CLEANING_MANAGE,
    // WhatsApp
    Permission.WHATSAPP_SEND,
  ],
  
  MINISTRY_LEADER: [
    Permission.PERSONS_VIEW,
    Permission.PERSONS_EDIT,
    Permission.PERSONS_ASSIGN_ROLES,
    Permission.PROGRAMS_VIEW,
    Permission.PROGRAMS_CREATE,
    Permission.PROGRAMS_EDIT,
    Permission.PROGRAMS_GENERATE,
    Permission.PROGRAMS_DOWNLOAD_PDF,
    Permission.ACTIVITIES_VIEW,
    Permission.ROLES_VIEW,
    Permission.LETTERS_VIEW,
    Permission.LETTERS_CREATE,
    Permission.LETTERS_GENERATE_PDF,
    Permission.CALENDAR_VIEW,
    Permission.CLEANING_VIEW,
    Permission.CLEANING_GENERATE,
    Permission.WHATSAPP_SEND,
  ],
  
  EDITOR: [
    Permission.PERSONS_VIEW,
    Permission.PERSONS_EDIT,
    Permission.PROGRAMS_VIEW,
    Permission.PROGRAMS_CREATE,
    Permission.PROGRAMS_EDIT,
    Permission.PROGRAMS_GENERATE,
    Permission.PROGRAMS_DOWNLOAD_PDF,
    Permission.ACTIVITIES_VIEW,
    Permission.ROLES_VIEW,
    Permission.LETTERS_VIEW,
    Permission.LETTERS_CREATE,
    Permission.LETTERS_GENERATE_PDF,
    Permission.CALENDAR_VIEW,
    Permission.CLEANING_VIEW,
  ],
  
  VIEWER: [
    Permission.PERSONS_VIEW,
    Permission.PROGRAMS_VIEW,
    Permission.PROGRAMS_DOWNLOAD_PDF,
    Permission.ACTIVITIES_VIEW,
    Permission.ROLES_VIEW,
    Permission.LETTERS_VIEW,
    Permission.CALENDAR_VIEW,
    Permission.CLEANING_VIEW,
  ],
};

// Descripciones de permisos para la UI
export const PERMISSION_DESCRIPTIONS: Record<Permission, { label: string; description: string; category: string }> = {
  // Usuarios
  [Permission.USERS_VIEW]: { label: 'Ver usuarios', description: 'Ver lista de usuarios del sistema', category: 'Usuarios' },
  [Permission.USERS_CREATE]: { label: 'Crear usuarios', description: 'Crear nuevos usuarios', category: 'Usuarios' },
  [Permission.USERS_EDIT]: { label: 'Editar usuarios', description: 'Modificar datos de usuarios', category: 'Usuarios' },
  [Permission.USERS_DELETE]: { label: 'Eliminar usuarios', description: 'Eliminar usuarios del sistema', category: 'Usuarios' },
  [Permission.USERS_MANAGE_PERMISSIONS]: { label: 'Gestionar permisos', description: 'Asignar/revocar permisos a usuarios', category: 'Usuarios' },
  
  // Personas
  [Permission.PERSONS_VIEW]: { label: 'Ver personas', description: 'Ver lista de miembros', category: 'Personas' },
  [Permission.PERSONS_CREATE]: { label: 'Crear personas', description: 'Agregar nuevos miembros', category: 'Personas' },
  [Permission.PERSONS_EDIT]: { label: 'Editar personas', description: 'Modificar datos de miembros', category: 'Personas' },
  [Permission.PERSONS_DELETE]: { label: 'Eliminar personas', description: 'Eliminar miembros', category: 'Personas' },
  [Permission.PERSONS_ASSIGN_ROLES]: { label: 'Asignar roles', description: 'Asignar roles a miembros', category: 'Personas' },
  [Permission.PERSONS_EXPORT]: { label: 'Exportar personas', description: 'Exportar lista de miembros', category: 'Personas' },
  
  // Programas
  [Permission.PROGRAMS_VIEW]: { label: 'Ver programas', description: 'Ver programas generados', category: 'Programas' },
  [Permission.PROGRAMS_CREATE]: { label: 'Crear programas', description: 'Crear programas manualmente', category: 'Programas' },
  [Permission.PROGRAMS_EDIT]: { label: 'Editar programas', description: 'Modificar programas', category: 'Programas' },
  [Permission.PROGRAMS_DELETE]: { label: 'Eliminar programas', description: 'Eliminar programas', category: 'Programas' },
  [Permission.PROGRAMS_GENERATE]: { label: 'Generar programas', description: 'Generar programas automáticamente', category: 'Programas' },
  [Permission.PROGRAMS_DOWNLOAD_PDF]: { label: 'Descargar PDF', description: 'Descargar programas en PDF', category: 'Programas' },
  [Permission.PROGRAMS_BATCH_GENERATE]: { label: 'Generación en lote', description: 'Generar múltiples programas', category: 'Programas' },
  
  // Actividades
  [Permission.ACTIVITIES_VIEW]: { label: 'Ver actividades', description: 'Ver tipos de actividades', category: 'Actividades' },
  [Permission.ACTIVITIES_CREATE]: { label: 'Crear actividades', description: 'Crear tipos de actividades', category: 'Actividades' },
  [Permission.ACTIVITIES_EDIT]: { label: 'Editar actividades', description: 'Modificar actividades', category: 'Actividades' },
  [Permission.ACTIVITIES_DELETE]: { label: 'Eliminar actividades', description: 'Eliminar tipos de actividades', category: 'Actividades' },
  
  // Roles
  [Permission.ROLES_VIEW]: { label: 'Ver roles', description: 'Ver roles disponibles', category: 'Roles' },
  [Permission.ROLES_CREATE]: { label: 'Crear roles', description: 'Crear nuevos roles', category: 'Roles' },
  [Permission.ROLES_EDIT]: { label: 'Editar roles', description: 'Modificar roles', category: 'Roles' },
  [Permission.ROLES_DELETE]: { label: 'Eliminar roles', description: 'Eliminar roles', category: 'Roles' },
  
  // Cartas
  [Permission.LETTERS_VIEW]: { label: 'Ver cartas', description: 'Ver cartas generadas', category: 'Cartas' },
  [Permission.LETTERS_CREATE]: { label: 'Crear cartas', description: 'Crear nuevas cartas', category: 'Cartas' },
  [Permission.LETTERS_EDIT]: { label: 'Editar cartas', description: 'Modificar cartas', category: 'Cartas' },
  [Permission.LETTERS_DELETE]: { label: 'Eliminar cartas', description: 'Eliminar cartas', category: 'Cartas' },
  [Permission.LETTERS_GENERATE_PDF]: { label: 'Generar PDF cartas', description: 'Generar cartas en PDF', category: 'Cartas' },
  
  // Calendario
  [Permission.CALENDAR_VIEW]: { label: 'Ver calendario', description: 'Ver calendario de actividades', category: 'Calendario' },
  [Permission.CALENDAR_MANAGE]: { label: 'Gestionar calendario', description: 'Administrar eventos del calendario', category: 'Calendario' },
  
  // Configuración
  [Permission.SETTINGS_VIEW]: { label: 'Ver configuración', description: 'Ver configuración del sistema', category: 'Configuración' },
  [Permission.SETTINGS_EDIT]: { label: 'Editar configuración', description: 'Modificar configuración', category: 'Configuración' },
  [Permission.CHURCH_EDIT]: { label: 'Editar iglesia', description: 'Modificar datos de la iglesia', category: 'Configuración' },
  
  // Auditoría
  [Permission.AUDIT_VIEW]: { label: 'Ver auditoría', description: 'Ver logs de auditoría', category: 'Auditoría' },
  [Permission.AUDIT_EXPORT]: { label: 'Exportar auditoría', description: 'Exportar logs de auditoría', category: 'Auditoría' },
  
  // Limpieza
  [Permission.CLEANING_VIEW]: { label: 'Ver limpieza', description: 'Ver grupos de limpieza', category: 'Limpieza' },
  [Permission.CLEANING_GENERATE]: { label: 'Generar limpieza', description: 'Generar grupos de limpieza', category: 'Limpieza' },
  [Permission.CLEANING_MANAGE]: { label: 'Gestionar limpieza', description: 'Administrar grupos de limpieza', category: 'Limpieza' },
  
  // WhatsApp
  [Permission.WHATSAPP_SEND]: { label: 'Enviar WhatsApp', description: 'Enviar mensajes por WhatsApp', category: 'WhatsApp' },
};

// Agrupar permisos por categoría para la UI
export const PERMISSION_CATEGORIES = [
  'Usuarios',
  'Personas',
  'Programas',
  'Actividades',
  'Roles',
  'Cartas',
  'Calendario',
  'Configuración',
  'Auditoría',
  'Limpieza',
  'WhatsApp',
];

// Helper para verificar si un usuario tiene un permiso
export function hasPermission(userPermissions: string[], permission: Permission): boolean {
  return userPermissions.includes(permission);
}

// Helper para verificar si tiene al menos uno de varios permisos
export function hasAnyPermission(userPermissions: string[], permissions: Permission[]): boolean {
  return permissions.some(p => userPermissions.includes(p));
}

// Helper para verificar si tiene todos los permisos requeridos
export function hasAllPermissions(userPermissions: string[], permissions: Permission[]): boolean {
  return permissions.every(p => userPermissions.includes(p));
}
