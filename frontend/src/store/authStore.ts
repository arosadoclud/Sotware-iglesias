import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Roles de usuario
export type UserRole = 'SUPER_ADMIN' | 'PASTOR' | 'ADMIN' | 'MINISTRY_LEADER' | 'EDITOR' | 'VIEWER'

interface User {
  id: string
  email: string
  fullName: string
  role: UserRole
  churchId: string
  isSuperUser?: boolean
  permissions: string[]
  useCustomPermissions?: boolean
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  
  setAuth: (user: User, accessToken: string) => void
  updateUser: (userData: Partial<User>) => void
  logout: () => void
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (...permissions: string[]) => boolean
  isAdmin: () => boolean
  isSuperAdmin: () => boolean
  isSuperUser: () => boolean
  canManagePermissions: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken) =>
        set({
          user,
          accessToken,
          isAuthenticated: true,
        }),

      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),

      logout: () => {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        })
      },

      // Verificar si el usuario tiene un permiso específico
      hasPermission: (permission: string) => {
        const { user } = get()
        if (!user) return false
        // SuperUsuarios y SUPER_ADMIN siempre tienen todos los permisos
        if (user.isSuperUser || user.role === 'SUPER_ADMIN') return true
        return user.permissions?.includes(permission) ?? false
      },

      // Verificar si tiene al menos uno de los permisos
      hasAnyPermission: (...permissions: string[]) => {
        const { user } = get()
        if (!user) return false
        if (user.isSuperUser || user.role === 'SUPER_ADMIN') return true
        return permissions.some(p => user.permissions?.includes(p))
      },

      // Verificar si es admin o superior
      isAdmin: () => {
        const { user } = get()
        if (!user) return false
        return ['SUPER_ADMIN', 'PASTOR', 'ADMIN'].includes(user.role)
      },

      // Verificar si es super admin
      isSuperAdmin: () => {
        const { user } = get()
        return user?.role === 'SUPER_ADMIN'
      },

      // Verificar si es superusuario (flag especial)
      isSuperUser: () => {
        const { user } = get()
        return user?.isSuperUser === true
      },

      // Verificar si puede gestionar permisos de otros usuarios
      canManagePermissions: () => {
        const { user } = get()
        if (!user) return false
        // Solo superusuarios pueden gestionar permisos
        return user.isSuperUser === true
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
