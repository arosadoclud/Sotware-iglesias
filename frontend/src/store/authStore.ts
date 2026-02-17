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
        // SUPER_ADMIN siempre tiene todos los permisos
        if (user.role === 'SUPER_ADMIN') return true
        return user.permissions?.includes(permission) ?? false
      },

      // Verificar si tiene al menos uno de los permisos
      hasAnyPermission: (...permissions: string[]) => {
        const { user } = get()
        if (!user) return false
        if (user.role === 'SUPER_ADMIN') return true
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
    }),
    {
      name: 'auth-storage',
    }
  )
)
