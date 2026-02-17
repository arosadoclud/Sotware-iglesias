// Exportar todos los modelos desde un solo archivo
export { default as Church, IChurch } from './Church.model';
export { default as User, IUser, UserRole } from './User.model';
export { default as Person, IPerson, IPersonRole, IUnavailability } from './Person.model';
export { default as PersonStatusModel, IPersonStatus } from './PersonStatus.model';
export { default as Role, IRole } from './Role.model';
export { default as ActivityType, IActivityType, IActivityRoleConfig } from './ActivityType.model';
export { default as Program, IProgram, ProgramStatus, IAssignment } from './Program.model';
export { default as LetterTemplate, ILetterTemplate } from './LetterTemplate.model';
export { default as GeneratedLetter, IGeneratedLetter } from './GeneratedLetter.model';
export { default as AuditLog, IAuditLog, AuditAction, AuditCategory, AuditSeverity } from './AuditLog.model';
export { default as LoginAttempt, ILoginAttempt } from './LoginAttempt.model';

// Módulo de Finanzas
export { FinanceCategory, IFinanceCategory, DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from './FinanceCategory.model';
export { Fund, IFund, DEFAULT_FUNDS } from './Fund.model';
export { FinanceTransaction, IFinanceTransaction, PAYMENT_METHODS, APPROVAL_THRESHOLDS } from './FinanceTransaction.model';

// Módulo de Nuevos Miembros (CRM)
export { default as NewMember, INewMember } from './NewMember.model';

// Seguridad y Auditoría
export { default as Ministry, IMinistry } from './Ministry.model';
