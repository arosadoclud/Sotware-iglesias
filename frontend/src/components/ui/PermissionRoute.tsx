import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

interface PermissionRouteProps {
  /** El permiso (o alguno de los permisos) necesario para acceder */
  permissions: string | string[]
  /** Ruta de redirección si no tiene permiso (default: /) */
  fallback?: string
  children: React.ReactNode
}

/**
 * Protege una ruta según permisos del usuario.
 * Si el usuario no tiene ninguno de los permisos requeridos, redirige.
 */
export function PermissionRoute({ permissions, fallback = '/', children }: PermissionRouteProps) {
  const { hasPermission, hasAnyPermission } = useAuthStore()

  const allowed = Array.isArray(permissions)
    ? hasAnyPermission(...permissions)
    : hasPermission(permissions)

  if (!allowed) return <Navigate to={fallback} replace />

  return <>{children}</>
}

export default PermissionRoute
