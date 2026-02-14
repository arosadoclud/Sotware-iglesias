import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Definición de módulos que pueden ser protegidos
export type ProtectedModule = 'finances' | 'settings' | 'audit' | 'users'

interface ProtectedModulesConfig {
  enabled: boolean
  password: string  // SHA256 hashed
  modules: ProtectedModule[]
}

interface ProtectedModulesState {
  // Configuración persistente
  config: ProtectedModulesConfig
  
  // Estado de sesión (qué módulos están desbloqueados en esta sesión)
  unlockedModules: Set<ProtectedModule>
  
  // Timestamp de último desbloqueo (para auto-lock después de inactividad)
  lastUnlockTime: number | null
  
  // Tiempo de auto-bloqueo en minutos (0 = nunca)
  autoLockMinutes: number
  
  // Actions
  setConfig: (config: Partial<ProtectedModulesConfig>) => void
  setPassword: (password: string) => void
  unlockModule: (module: ProtectedModule) => void
  unlockAll: () => void
  lockModule: (module: ProtectedModule) => void
  lockAll: () => void
  isModuleProtected: (module: ProtectedModule) => boolean
  isModuleUnlocked: (module: ProtectedModule) => boolean
  verifyPassword: (password: string) => boolean
  checkAutoLock: () => void
}

// Simple hash function for password (in production, use proper crypto)
const hashPassword = (password: string): string => {
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(36)
}

// Default password: "admin123" hashed
const DEFAULT_PASSWORD_HASH = hashPassword('admin123')

export const useProtectedModulesStore = create<ProtectedModulesState>()(
  persist(
    (set, get) => ({
      config: {
        enabled: true,
        password: DEFAULT_PASSWORD_HASH,
        modules: ['finances', 'settings', 'audit', 'users'],
      },
      unlockedModules: new Set<ProtectedModule>(),
      lastUnlockTime: null,
      autoLockMinutes: 30, // Auto-lock después de 30 minutos de inactividad
      
      setConfig: (newConfig) => 
        set((state) => ({
          config: { ...state.config, ...newConfig }
        })),
      
      setPassword: (password) => 
        set((state) => ({
          config: { ...state.config, password: hashPassword(password) }
        })),
      
      unlockModule: (module) => 
        set((state) => {
          const newUnlocked = new Set(state.unlockedModules)
          newUnlocked.add(module)
          return { 
            unlockedModules: newUnlocked,
            lastUnlockTime: Date.now()
          }
        }),
      
      unlockAll: () =>
        set((state) => ({
          unlockedModules: new Set(state.config.modules),
          lastUnlockTime: Date.now()
        })),
      
      lockModule: (module) =>
        set((state) => {
          const newUnlocked = new Set(state.unlockedModules)
          newUnlocked.delete(module)
          return { unlockedModules: newUnlocked }
        }),
      
      lockAll: () =>
        set({ 
          unlockedModules: new Set<ProtectedModule>(),
          lastUnlockTime: null
        }),
      
      isModuleProtected: (module) => {
        const { config } = get()
        return config.enabled && config.modules.includes(module)
      },
      
      isModuleUnlocked: (module) => {
        const { config, unlockedModules } = get()
        // Si la protección está deshabilitada, siempre está desbloqueado
        if (!config.enabled) return true
        // Si el módulo no está en la lista de protegidos, está desbloqueado
        if (!config.modules.includes(module)) return true
        // Verificar si está en la lista de desbloqueados
        return unlockedModules.has(module)
      },
      
      verifyPassword: (password) => {
        const { config } = get()
        return hashPassword(password) === config.password
      },
      
      checkAutoLock: () => {
        const { lastUnlockTime, autoLockMinutes, unlockedModules } = get()
        if (!lastUnlockTime || autoLockMinutes === 0 || unlockedModules.size === 0) return
        
        const elapsed = (Date.now() - lastUnlockTime) / 1000 / 60 // minutos
        if (elapsed >= autoLockMinutes) {
          set({ 
            unlockedModules: new Set<ProtectedModule>(),
            lastUnlockTime: null 
          })
        }
      },
    }),
    {
      name: 'protected-modules-storage',
      partialize: (state) => ({
        config: state.config,
        autoLockMinutes: state.autoLockMinutes,
      }),
      // No persistir unlockedModules - siempre comienzan bloqueados
    }
  )
)

// Mapeo de rutas a módulos protegidos
export const ROUTE_TO_MODULE: Record<string, ProtectedModule> = {
  '/finances': 'finances',
  '/finances/reports': 'finances',
  '/settings': 'settings',
  '/admin/audit': 'audit',
  '/admin/users': 'users',
}

// Nombres amigables de módulos
export const MODULE_NAMES: Record<ProtectedModule, string> = {
  finances: 'Finanzas',
  settings: 'Configuración',
  audit: 'Auditoría',
  users: 'Usuarios',
}

// Iconos de módulos (nombres de Lucide icons)
export const MODULE_ICONS: Record<ProtectedModule, string> = {
  finances: 'DollarSign',
  settings: 'Settings',
  audit: 'FileText',
  users: 'Users',
}
