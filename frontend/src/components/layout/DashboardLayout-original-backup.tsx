import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { LayoutDashboard, Users, Calendar, FileText, Settings, LogOut, Church, CalendarDays, Mail } from 'lucide-react'
import { toast } from 'sonner'

const DashboardLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => { logout(); toast.success('Sesión cerrada'); navigate('/login') }

  const nav = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Personas', href: '/persons', icon: Users },
    { name: 'Actividades', href: '/activities', icon: Calendar },
    { name: 'Programas', href: '/programs', icon: FileText },
    { name: 'Calendario', href: '/calendar', icon: CalendarDays },
    { name: 'Cartas', href: '/letters', icon: Mail },
    { name: 'Configuración', href: '/settings', icon: Settings },
  ]

  const isActive = (path: string) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-30">
        <div className="flex items-center gap-3 h-16 px-6 border-b border-gray-200">
          <Church className="w-8 h-8 text-primary-600" />
          <div><h1 className="font-bold text-gray-900 text-sm">Programa de</h1><p className="text-xs text-gray-500 -mt-0.5">Oportunidades</p></div>
        </div>
        <nav className="px-4 py-6 space-y-1">
          {nav.map(item => {
            const Icon = item.icon
            return (
              <Link key={item.name} to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(item.href) ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                <Icon className="w-5 h-5" />{item.name}
              </Link>
            )
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center"><span className="text-sm font-bold text-primary-700">{user?.fullName?.charAt(0)}</span></div>
            <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 truncate">{user?.fullName}</p><p className="text-xs text-gray-500">{user?.role}</p></div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"><LogOut className="w-4 h-4" /> Cerrar sesión</button>
        </div>
      </div>
      <div className="pl-64">
        <main className="p-8"><Outlet /></main>
      </div>
    </div>
  )
}
export default DashboardLayout
