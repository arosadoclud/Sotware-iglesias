import AuditLog, { AuditAction, AuditCategory } from './AuditLog.model';

describe('AuditLog identity validation', () => {
  const anonymousFailure = {
    churchId: null,
    userId: null,
    userEmail: 'unknown@example.com',
    userName: 'Unknown',
    userRole: 'VIEWER',
    action: AuditAction.LOGIN_FAILED,
    category: AuditCategory.AUTH,
    resourceType: 'Auth',
    success: false,
  };

  it('records failed login attempts before a user or church is identified', () => {
    expect(new AuditLog(anonymousFailure).validateSync()).toBeUndefined();
  });

  it('still requires user and church for successful authentication', () => {
    const error = new AuditLog({ ...anonymousFailure, action: AuditAction.LOGIN, success: true }).validateSync();
    expect(error?.errors.churchId).toBeDefined();
    expect(error?.errors.userId).toBeDefined();
  });

  it('still requires user and church for changes to church resources', () => {
    const error = new AuditLog({ ...anonymousFailure, action: AuditAction.PROGRAM_CREATE, category: AuditCategory.PROGRAMS }).validateSync();
    expect(error?.errors.churchId).toBeDefined();
    expect(error?.errors.userId).toBeDefined();
  });
});
