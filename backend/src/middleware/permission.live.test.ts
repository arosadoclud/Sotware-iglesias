import jwt from 'jsonwebtoken';
import User from '../models/User.model';
import { authenticate } from './auth.middleware';
import { requirePermission, Permission } from './permission.middleware';

jest.mock('../config/env', () => ({ __esModule: true, default: { jwtSecret: 'qa-live-secret' } }));
jest.mock('../models/User.model', () => ({ __esModule: true, default: { findById: jest.fn() } }));

describe('Current database permissions take precedence over an existing JWT', () => {
  it('uses the current role instead of the administrator role in an old token', async () => {
    const token = jwt.sign({ id: 'user1', role: 'ADMIN' }, 'qa-live-secret');
    (User.findById as jest.Mock).mockResolvedValue({ _id: 'user1', churchId: 'church1', role: 'VIEWER', isActive: true });
    const req: any = { headers: { authorization: `Bearer ${token}` } };
    const next = jest.fn();
    await authenticate(req, {} as any, next);
    expect(req.userRole).toBe('VIEWER');
    const authorize = jest.fn();
    await requirePermission(Permission.USERS_EDIT)(req, {} as any, authorize);
    expect(authorize).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('an empty custom list revokes access instead of restoring role defaults', async () => {
    const next = jest.fn();
    const req: any = { userRole: 'ADMIN', isSuperUser: false, user: { role: 'ADMIN', useCustomPermissions: true, permissions: [] } };
    await requirePermission(Permission.PROGRAMS_VIEW)(req, {} as any, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('a newly granted custom permission takes effect on the next request', async () => {
    const next = jest.fn();
    const req: any = { userRole: 'VIEWER', isSuperUser: false, user: { role: 'VIEWER', useCustomPermissions: true, permissions: [Permission.PROGRAMS_VIEW] } };
    await requirePermission(Permission.PROGRAMS_VIEW)(req, {} as any, next);
    expect(next).toHaveBeenCalledWith();
  });
});
