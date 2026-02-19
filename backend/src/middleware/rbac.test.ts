import { Request, Response, NextFunction } from 'express';
import { rbac, Resource, Action } from './rbac.middleware';
import { AuthRequest } from './auth.middleware';
import User, { UserRole } from '../models/User.model';
import mongoose from 'mongoose';

describe('RBAC Middleware', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockReq = {
      user: {
        _id: new mongoose.Types.ObjectId(),
        role: UserRole.VIEWER,
        permissions: []
      } as any,
      userRole: 'VIEWER'
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    nextFunction = jest.fn();
  });

  describe('Permission Hierarchy', () => {
    it('SUPER_ADMIN debe tener acceso total a todos los recursos', () => {
      mockReq.userRole = 'SUPER_ADMIN';
      mockReq.user!.role = UserRole.SUPER_ADMIN;

      const resources: Resource[] = ['persons', 'programs', 'users', 'finances', 'churches'];
      const actions: Action[] = ['read', 'create', 'update', 'delete'];

      resources.forEach(resource => {
        actions.forEach(action => {
          const middleware = rbac(resource, action);
          middleware(mockReq as AuthRequest, mockRes as Response, nextFunction);
          expect(nextFunction).toHaveBeenCalled();
        });
      });
    });

    it('VIEWER solo debe poder read en persons y letters', () => {
      mockReq.userRole = 'VIEWER';
      mockReq.user!.role = UserRole.VIEWER;

      // VIEWER puede leer persons
      const readPersons = rbac('persons', 'read');
      readPersons(mockReq as AuthRequest, mockRes as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();

      // VIEWER NO puede crear persons
      const createPersons = rbac('persons', 'create');
      createPersons(mockReq as AuthRequest, mockRes as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(expect.any(Error));
    });

    it('EDITOR puede crear y editar persons pero NO eliminar', () => {
      mockReq.userRole = 'EDITOR';
      mockReq.user!.role = UserRole.EDITOR;

      nextFunction = jest.fn(); // Reset

      // EDITOR puede read y update persons
      const readMiddleware = rbac('persons', 'read');
      readMiddleware(mockReq as AuthRequest, mockRes as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();

      nextFunction = jest.fn(); // Reset
      const updateMiddleware = rbac('persons', 'update');
      updateMiddleware(mockReq as AuthRequest, mockRes as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();

      // EDITOR NO puede delete persons
      nextFunction = jest.fn(); // Reset
      const deleteMiddleware = rbac('persons', 'delete');
      deleteMiddleware(mockReq as AuthRequest, mockRes as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(expect.any(Error));
    });

    it('ADMIN puede gestionar persons pero NO delete users', () => {
      mockReq.userRole = 'ADMIN';
      mockReq.user!.role = UserRole.ADMIN;

      nextFunction = jest.fn();

      // ADMIN puede delete persons
      const deletePersons = rbac('persons', 'delete');
      deletePersons(mockReq as AuthRequest, mockRes as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();

      // ADMIN NO puede delete users
      nextFunction = jest.fn();
      const deleteUsers = rbac('users', 'delete');
      deleteUsers(mockReq as AuthRequest, mockRes as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(expect.any(Error));
    });

    it('PASTOR puede todo excepto billing create/update/delete', () => {
      mockReq.userRole = 'PASTOR';
      mockReq.user!.role = UserRole.PASTOR;

      nextFunction = jest.fn();

      // PASTOR puede delete persons
      const deletePersons = rbac('persons', 'delete');
      deletePersons(mockReq as AuthRequest, mockRes as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();

      // PASTOR puede read billing pero NO create
      nextFunction = jest.fn();
      const readBilling = rbac('billing', 'read');
      readBilling(mockReq as AuthRequest, mockRes as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();

      nextFunction = jest.fn();
      const createBilling = rbac('billing', 'create');
      createBilling(mockReq as AuthRequest, mockRes as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(expect.any(Error));
    });

    it('MINISTRY_LEADER puede crear programs y letters', () => {
      mockReq.userRole = 'MINISTRY_LEADER';
      mockReq.user!.role = UserRole.MINISTRY_LEADER;

      nextFunction = jest.fn();

      // MINISTRY_LEADER puede create programs
      const createPrograms = rbac('programs', 'create');
      createPrograms(mockReq as AuthRequest, mockRes as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();

      // MINISTRY_LEADER puede create letters
      nextFunction = jest.fn();
      const createLetters = rbac('letters', 'create');
      createLetters(mockReq as AuthRequest, mockRes as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();

      // MINISTRY_LEADER NO puede delete programs
      nextFunction = jest.fn();
      const deletePrograms = rbac('programs', 'delete');
      deletePrograms(mockReq as AuthRequest, mockRes as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('Custom Permissions Override', () => {
    it('debe respetar permisos personalizados sobre rol predeterminado', () => {
      mockReq.userRole = 'VIEWER';
      mockReq.user!.role = UserRole.VIEWER;
      mockReq.user!.permissions = ['PROGRAMS_CREATE']; // Custom permission
      mockReq.user!.useCustomPermissions = true;

      nextFunction = jest.fn();

      // Con permission custom, VIEWER puede crear programs
      const createPrograms = rbac('programs', 'create');
      createPrograms(mockReq as AuthRequest, mockRes as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('debe usar permisos de rol si useCustomPermissions es false', () => {
      mockReq.userRole = 'VIEWER';
      mockReq.user!.role = UserRole.VIEWER;
      mockReq.user!.permissions = ['PROGRAMS_CREATE'];
      mockReq.user!.useCustomPermissions = false; // NOT using custom

      nextFunction = jest.fn();

      // Sin custom permissions activos, VIEWER NO puede crear programs
      const createPrograms = rbac('programs', 'create');
      createPrograms(mockReq as AuthRequest, mockRes as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('Resource Protection', () => {
    it('debe bloquear acceso no autorizado a finances', () => {
      mockReq.userRole = 'VIEWER';
      mockReq.user!.role = UserRole.VIEWER;

      nextFunction = jest.fn();

      const readFinances = rbac('finances', 'read');
      readFinances(mockReq as AuthRequest, mockRes as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(expect.any(Error));
    });

    it('debe bloquear acceso no autorizado a users', () => {
      mockReq.userRole = 'EDITOR';
      mockReq.user!.role = UserRole.EDITOR;

      nextFunction = jest.fn();

      const readUsers = rbac('users', 'read');
      readUsers(mockReq as AuthRequest, mockRes as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalledWith(expect.any(Error));
    });

    it('debe permitir acceso autorizado a churches', () => {
      mockReq.userRole = 'ADMIN';
      mockReq.user!.role = UserRole.ADMIN;

      nextFunction = jest.fn();

      const readChurches = rbac('churches', 'read');
      readChurches(mockReq as AuthRequest, mockRes as Response, nextFunction);
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('debe retornar ForbiddenError con mensaje descriptivo', () => {
      mockReq.userRole = 'VIEWER';
      mockReq.user!.role = UserRole.VIEWER;

      nextFunction = jest.fn();

      const deletePrograms = rbac('programs', 'delete');
      deletePrograms(mockReq as AuthRequest, mockRes as Response, nextFunction);
      
      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('No tienes permisos')
        })
      );
    });
  });
});
