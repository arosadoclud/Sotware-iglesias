import AuditLog, { AuditAction, AuditCategory, AuditSeverity, IAuditLog } from '../models/AuditLog.model';
import { AuthRequest } from './auth.middleware';
import mongoose from 'mongoose';

// Servicio de auditoría para crear logs
export class AuditService {
  /**
   * Crear un log de auditoría
   */
  static async log(params: {
    churchId: string | mongoose.Types.ObjectId;
    userId: string | mongoose.Types.ObjectId;
    userEmail: string;
    userName: string;
    userRole: string;
    action: AuditAction;
    category: AuditCategory;
    resourceType: string;
    resourceId?: string;
    resourceName?: string;
    previousValue?: any;
    newValue?: any;
    changes?: Record<string, { old: any; new: any }>;
    success?: boolean;
    errorMessage?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    endpoint?: string;
    method?: string;
    severity?: AuditSeverity;
  }): Promise<IAuditLog | null> {
    try {
      const auditLog = await AuditLog.create({
        churchId: params.churchId,
        userId: params.userId,
        userEmail: params.userEmail,
        userName: params.userName,
        userRole: params.userRole,
        action: params.action,
        category: params.category,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        resourceName: params.resourceName,
        previousValue: params.previousValue,
        newValue: params.newValue,
        changes: params.changes,
        success: params.success ?? true,
        errorMessage: params.errorMessage,
        metadata: params.metadata,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        endpoint: params.endpoint,
        method: params.method,
        severity: params.severity ?? AuditSeverity.INFO,
      });
      
      return auditLog;
    } catch (error) {
      console.error('Error creating audit log:', error);
      return null;
    }
  }

  /**
   * Log desde un request (helper)
   */
  static async logFromRequest(
    req: AuthRequest,
    action: AuditAction,
    category: AuditCategory,
    resourceType: string,
    options: {
      resourceId?: string;
      resourceName?: string;
      previousValue?: any;
      newValue?: any;
      changes?: Record<string, { old: any; new: any }>;
      success?: boolean;
      errorMessage?: string;
      metadata?: Record<string, any>;
      severity?: AuditSeverity;
    } = {}
  ): Promise<IAuditLog | null> {
    if (!req.user || !req.churchId) {
      return null;
    }

    return this.log({
      churchId: req.churchId,
      userId: req.userId!,
      userEmail: req.user.email,
      userName: req.user.fullName,
      userRole: req.userRole!,
      action,
      category,
      resourceType,
      ...options,
      ipAddress: req.ip || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
      endpoint: req.originalUrl,
      method: req.method,
    });
  }

  /**
   * Calcular cambios entre dos objetos
   */
  static calculateChanges(oldObj: any, newObj: any, fields: string[]): Record<string, { old: any; new: any }> | undefined {
    const changes: Record<string, { old: any; new: any }> = {};
    
    for (const field of fields) {
      const oldVal = oldObj?.[field];
      const newVal = newObj?.[field];
      
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes[field] = { old: oldVal, new: newVal };
      }
    }
    
    return Object.keys(changes).length > 0 ? changes : undefined;
  }
}

// Mapeo de acciones a categorías
const ACTION_TO_CATEGORY: Record<AuditAction, AuditCategory> = {
  [AuditAction.LOGIN]: AuditCategory.AUTH,
  [AuditAction.LOGOUT]: AuditCategory.AUTH,
  [AuditAction.LOGIN_FAILED]: AuditCategory.AUTH,
  [AuditAction.PASSWORD_CHANGE]: AuditCategory.AUTH,
  
  [AuditAction.USER_CREATE]: AuditCategory.USERS,
  [AuditAction.USER_UPDATE]: AuditCategory.USERS,
  [AuditAction.USER_DELETE]: AuditCategory.USERS,
  [AuditAction.USER_ACTIVATE]: AuditCategory.USERS,
  [AuditAction.USER_DEACTIVATE]: AuditCategory.USERS,
  [AuditAction.USER_PERMISSION_CHANGE]: AuditCategory.USERS,
  
  [AuditAction.PERSON_CREATE]: AuditCategory.PERSONS,
  [AuditAction.PERSON_UPDATE]: AuditCategory.PERSONS,
  [AuditAction.PERSON_DELETE]: AuditCategory.PERSONS,
  [AuditAction.PERSON_ROLE_ASSIGN]: AuditCategory.PERSONS,
  [AuditAction.PERSON_ROLE_REMOVE]: AuditCategory.PERSONS,
  
  [AuditAction.PROGRAM_CREATE]: AuditCategory.PROGRAMS,
  [AuditAction.PROGRAM_UPDATE]: AuditCategory.PROGRAMS,
  [AuditAction.PROGRAM_DELETE]: AuditCategory.PROGRAMS,
  [AuditAction.PROGRAM_GENERATE]: AuditCategory.PROGRAMS,
  [AuditAction.PROGRAM_BATCH_GENERATE]: AuditCategory.PROGRAMS,
  [AuditAction.PROGRAM_PDF_DOWNLOAD]: AuditCategory.PROGRAMS,
  
  [AuditAction.ACTIVITY_CREATE]: AuditCategory.ACTIVITIES,
  [AuditAction.ACTIVITY_UPDATE]: AuditCategory.ACTIVITIES,
  [AuditAction.ACTIVITY_DELETE]: AuditCategory.ACTIVITIES,
  
  [AuditAction.ROLE_CREATE]: AuditCategory.ROLES,
  [AuditAction.ROLE_UPDATE]: AuditCategory.ROLES,
  [AuditAction.ROLE_DELETE]: AuditCategory.ROLES,
  
  [AuditAction.LETTER_CREATE]: AuditCategory.LETTERS,
  [AuditAction.LETTER_UPDATE]: AuditCategory.LETTERS,
  [AuditAction.LETTER_DELETE]: AuditCategory.LETTERS,
  [AuditAction.LETTER_PDF_GENERATE]: AuditCategory.LETTERS,
  
  [AuditAction.CHURCH_UPDATE]: AuditCategory.SETTINGS,
  [AuditAction.SETTINGS_UPDATE]: AuditCategory.SETTINGS,
  
  [AuditAction.CLEANING_GROUP_GENERATE]: AuditCategory.PROGRAMS,
  
  [AuditAction.EXPORT_DATA]: AuditCategory.DATA,
  [AuditAction.IMPORT_DATA]: AuditCategory.DATA,
};

// Mapeo de severidad por defecto para acciones
const ACTION_SEVERITY: Partial<Record<AuditAction, AuditSeverity>> = {
  [AuditAction.USER_DELETE]: AuditSeverity.WARNING,
  [AuditAction.USER_PERMISSION_CHANGE]: AuditSeverity.WARNING,
  [AuditAction.USER_DEACTIVATE]: AuditSeverity.WARNING,
  [AuditAction.PERSON_DELETE]: AuditSeverity.WARNING,
  [AuditAction.PROGRAM_DELETE]: AuditSeverity.WARNING,
  [AuditAction.LOGIN_FAILED]: AuditSeverity.WARNING,
  [AuditAction.EXPORT_DATA]: AuditSeverity.WARNING,
};

export { AuditAction, AuditCategory, AuditSeverity, ACTION_TO_CATEGORY, ACTION_SEVERITY };
