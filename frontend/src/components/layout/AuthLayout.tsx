import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const AuthLayout = () => {
  const { isAuthenticated } = useAuthStore()

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <div className="auth-surface"><Outlet /></div>
}

export default AuthLayout
