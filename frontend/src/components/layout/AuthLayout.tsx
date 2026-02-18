import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const AuthLayout = () => {
  const { isAuthenticated } = useAuthStore()

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default AuthLayout
