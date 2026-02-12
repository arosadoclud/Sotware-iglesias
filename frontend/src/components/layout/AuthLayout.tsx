import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Church } from 'lucide-react'

const AuthLayout = () => {
  const { isAuthenticated } = useAuthStore()

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
            <Church className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-white">Church Program Manager</h1>
          <p className="text-primary-100 mt-2">Sistema de gestión de programas</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <Outlet />
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-primary-100 text-sm">
          <p>© 2026 Church Program Manager. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
