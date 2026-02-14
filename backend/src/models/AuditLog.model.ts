import mongoose, { Schema, Document } from 'mongoose';

// Tipos de acciones que se pueden auditar
export enum AuditAction {
  // Autenticación
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  
  // Usuarios
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',
  USER_ACTIVATE = 'USER_ACTIVATE',
  USER_DEACTIVATE = 'USER_DEACTIVATE',
  USER_PERMISSION_CHANGE = 'USER_PERMISSION_CHANGE',
  
  // Personas
  PERSON_CREATE = 'PERSON_CREATE',
  PERSON_UPDATE = 'PERSON_UPDATE',
  PERSON_DELETE = 'PERSON_DELETE',
  PERSON_ROLE_ASSIGN = 'PERSON_ROLE_ASSIGN',
  PERSON_ROLE_REMOVE = 'PERSON_ROLE_REMOVE',
  
  // Programas
  PROGRAM_CREATE = 'PROGRAM_CREATE',
  PROGRAM_UPDATE = 'PROGRAM_UPDATE',
  PROGRAM_DELETE = 'PROGRAM_DELETE',
  PROGRAM_GENERATE = 'PROGRAM_GENERATE',
  PROGRAM_BATCH_GENERATE = 'PROGRAM_BATCH_GENERATE',
  PROGRAM_PDF_DOWNLOAD = 'PROGRAM_PDF_DOWNLOAD',
  
  // Actividades
  ACTIVITY_CREATE = 'ACTIVITY_CREATE',
  ACTIVITY_UPDATE = 'ACTIVITY_UPDATE',
  ACTIVITY_DELETE = 'ACTIVITY_DELETE',
  
  // Roles
  ROLE_CREATE = 'ROLE_CREATE',
  ROLE_UPDATE = 'ROLE_UPDATE',
  ROLE_DELETE = 'ROLE_DELETE',
  
  // Cartas
  LETTER_CREATE = 'LETTER_CREATE',
  LETTER_UPDATE = 'LETTER_UPDATE',
  LETTER_DELETE = 'LETTER_DELETE',
  LETTER_PDF_GENERATE = 'LETTER_PDF_GENERATE',
  
  // Iglesia/Configuración
  CHURCH_UPDATE = 'CHURCH_UPDATE',
  SETTINGS_UPDATE = 'SETTINGS_UPDATE',
  
  // Grupos de limpieza
  CLEANING_GROUP_GENERATE = 'CLEANING_GROUP_GENERATE',
  
  // Otros
  EXPORT_DATA = 'EXPORT_DATA',
  IMPORT_DATA = 'IMPORT_DATA',
}

// Categoría de la acción
export enum AuditCategory {
  AUTH = 'AUTH',
  USERS = 'USERS',
  PERSONS = 'PERSONS',
  PROGRAMS = 'PROGRAMS',
  ACTIVITIES = 'ACTIVITIES',
  ROLES = 'ROLES',
  LETTERS = 'LETTERS',
  SETTINGS = 'SETTINGS',
  DATA = 'DATA',
}

// Nivel de severidad
export enum AuditSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

export interface IAuditLog extends Document {
  churchId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userEmail: string;
  userName: string;
  userRole: string;
  
  action: AuditAction;
  category: AuditCategory;
  severity: AuditSeverity;
  
  // Detalles de la acción
  resourceType: string;       // 'Person', 'Program', 'User', etc.
  resourceId?: string;        // ID del recurso afectado
  resourceName?: string;      // Nombre descriptivo del recurso
  
  // Cambios realizados
  previousValue?: any;        // Valor anterior (para updates)
  newValue?: any;             // Nuevo valor
  changes?: Record<string, { old: any; new: any }>; // Campos específicos cambiados
  
  // Contexto técnico
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  
  // Resultado
  success: boolean;
  errorMessage?: string;
  
  // Metadatos adicionales
  metadata?: Record<string, any>;
  
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    churchId: {
      type: Schema.Types.ObjectId,
      ref: 'Church',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userRole: {
      type: String,
      required: true,
    },
    
    action: {
      type: String,
      enum: Object.values(AuditAction),
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: Object.values(AuditCategory),
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: Object.values(AuditSeverity),
      default: AuditSeverity.INFO,
    },
    
    resourceType: {
      type: String,
      required: true,
    },
    resourceId: String,
    resourceName: String,
    
    previousValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed,
    changes: Schema.Types.Mixed,
    
    ipAddress: String,
    userAgent: String,
    endpoint: String,
    method: String,
    
    success: {
      type: Boolean,
      default: true,
    },
    errorMessage: String,
    
    metadata: Schema.Types.Mixed,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'audit_logs',
  }
);

// Índices compuestos para búsquedas eficientes
AuditLogSchema.index({ churchId: 1, createdAt: -1 });
AuditLogSchema.index({ churchId: 1, userId: 1, createdAt: -1 });
AuditLogSchema.index({ churchId: 1, action: 1, createdAt: -1 });
AuditLogSchema.index({ churchId: 1, category: 1, createdAt: -1 });
AuditLogSchema.index({ churchId: 1, resourceType: 1, resourceId: 1 });

// TTL index para limpiar logs antiguos (opcional - 1 año)
// AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
