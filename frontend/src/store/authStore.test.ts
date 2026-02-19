import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from './authStore';

describe('AuthStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().logout();
  });

  it('debe inicializar con estado no autenticado', () => {
    const { result } = renderHook(() => useAuthStore());
    
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
  });

  it('debe hacer login correctamente', () => {
    const { result } = renderHook(() => useAuthStore());

    const mockUser = {
      id: '123',
      email: 'test@test.com',
      fullName: 'Test User',
      role: 'ADMIN' as const,
      churchId: 'church123',
      permissions: ['PERSONS_VIEW']
    };

    const mockToken = 'test-token-123';

    act(() => {
      result.current.setAuth(mockUser, mockToken);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.accessToken).toBe(mockToken);
  });

  it('debe hacer logout correctamente', () => {
    const { result } = renderHook(() => useAuthStore());

    const mockUser = {
      id: '123',
      email: 'test@test.com',
      fullName: 'Test User',
      role: 'ADMIN' as const,
      churchId: 'church123',
      permissions: []
    };

    act(() => {
      result.current.setAuth(mockUser, 'token');
    });

    expect(result.current.isAuthenticated).toBe(true);

    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
  });

  it('debe persistir sesión en localStorage', () => {
    const { result } = renderHook(() => useAuthStore());

    const mockUser = {
      id: '123',
      email: 'test@test.com',
      fullName: 'Test User',
      role: 'VIEWER' as const,
      churchId: 'church123',
      permissions: []
    };

    act(() => {
      result.current.setAuth(mockUser, 'test-token');
    });

    // El store usa zustand persist, verifica la key completa
    const stored = localStorage.getItem('auth-storage');
    expect(stored).toBeTruthy();
  });

  it('debe verificar permisos correctamente', () => {
    const { result } = renderHook(() => useAuthStore());

    const mockUser = {
      id: '123',
      email: 'test@test.com',
      fullName: 'Test User',
      role: 'ADMIN' as const,
      churchId: 'church123',
      permissions: ['PERSONS_VIEW', 'PERSONS_CREATE']
    };

    act(() => {
      result.current.setAuth(mockUser, 'token');
    });

    expect(result.current.hasPermission('PERSONS_VIEW')).toBe(true);
    expect(result.current.hasPermission('PERSONS_DELETE')).toBe(false);
  });

  it('debe actualizar información del usuario', () => {
    const { result } = renderHook(() => useAuthStore());

    const mockUser = {
      id: '123',
      email: 'test@test.com',
      fullName: 'Test User',
      role: 'ADMIN' as const,
      churchId: 'church123',
      permissions: []
    };

    act(() => {
      result.current.setAuth(mockUser, 'token');
    });

    const updates = { fullName: 'Updated Name' };

    act(() => {
      result.current.updateUser(updates);
    });

    expect(result.current.user?.fullName).toBe('Updated Name');
  });

  it('SUPER_ADMIN debe tener todos los permisos', () => {
    const { result } = renderHook(() => useAuthStore());

    const superAdmin = {
      id: '123',
      email: 'admin@iglesia.com',
      fullName: 'Super Admin',
      role: 'SUPER_ADMIN' as const,
      churchId: 'church123',
      permissions: []
    };

    act(() => {
      result.current.setAuth(superAdmin, 'token');
    });

    // SUPER_ADMIN debe tener acceso a todo
    expect(result.current.hasPermission('PERSONS_VIEW')).toBe(true);
    expect(result.current.hasPermission('PERSONS_DELETE')).toBe(true);
    expect(result.current.hasPermission('USERS_DELETE')).toBe(true);
  });
});
