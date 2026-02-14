import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Settings,
  LogOut,
  Church,
  CalendarDays,
  Mail,
  Menu,
  X,
  ChevronLeft,
  Shield,
  UserCog,
  DollarSign,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'react-hot-toast'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import LogoutSplash from '../ui/LogoutSplash'

interface NavItemProps {
  item: {
    name: string
    href: string
    icon: any
  }
  collapsed: boolean
  isActive: boolean
}

const NavItem = ({ item, collapsed, isActive }: NavItemProps) => {
  const Icon = item.icon

  return (
    <Link to={item.href}>
      <motion.div
        whileHover={{ scale: 1.02, x: 4 }}
        whileTap={{ scale: 0.98 }}
        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-primary-50 text-primary-700 shadow-sm'
            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
        }`}
      >
        {/* Active indicator line */}
        {isActive && (
          <motion.div
            layoutId="activeNavIndicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-600 rounded-r-full"
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
        <motion.div
          whileHover={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.4 }}
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
        </motion.div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
            >
              {item.name}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </Link>
  )
}

const DashboardLayoutImproved = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, isAdmin } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showLogoutSplash, setShowLogoutSplash] = useState(false)

  const handleLogout = () => {
    setShowLogoutSplash(true)
  }

  const handleLogoutComplete = () => {
    setShowLogoutSplash(false)
    navigate('/login', { replace: true })
  }

  const nav = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Personas', href: '/persons', icon: Users },
    { name: 'Actividades', href: '/activities', icon: Calendar },
    { name: 'Programas', href: '/programs', icon: FileText },
    { name: 'Calendario', href: '/calendar', icon: CalendarDays },
    { name: 'Cartas Invitación', href: '/letters', icon: Mail },
    { name: 'Finanzas', href: '/finances', icon: DollarSign },
    { name: 'Configuración', href: '/settings', icon: Settings },
  ]

  // Admin navigation items (only for admins)
  const adminNav = isAdmin() ? [
    { name: 'Usuarios', href: '/admin/users', icon: UserCog },
    { name: 'Auditoría', href: '/admin/audit', icon: Shield },
  ] : []

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  // Mostrar splash de logout
  if (showLogoutSplash) {
    return <LogoutSplash userName={user?.fullName} onComplete={handleLogoutComplete} />
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="bg-white shadow-lg"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar - Desktop */}
      <motion.aside
        animate={{ width: collapsed ? '80px' : '280px' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:block fixed inset-y-0 left-0 bg-white border-r border-neutral-200 z-30 shadow-sm"
      >
        {/* Header */}
        <div className="flex items-center justify-between h-20 px-4 border-b border-neutral-100 bg-gradient-to-r from-white to-neutral-50/50">
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-3"
              >
                <motion.div 
                  className="relative"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Church className="w-7 h-7 text-white drop-shadow-sm" />
                  </div>
                  {/* Decorative glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl blur-lg opacity-30 -z-10" />
                </motion.div>
                <div className="flex flex-col">
                  <h1 className="font-bold text-neutral-800 text-base leading-tight tracking-tight">
                    Programa de
                  </h1>
                  <p className="text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Oportunidades
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {collapsed && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-md mx-auto"
            >
              <Church className="w-5 h-5 text-white" />
            </motion.div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="hover:bg-neutral-100 rounded-xl"
          >
            <ChevronLeft
              className={`w-5 h-5 text-neutral-500 transition-transform duration-300 ${
                collapsed ? 'rotate-180' : ''
              }`}
            />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {nav.map((item) => (
            <NavItem
              key={item.name}
              item={item}
              collapsed={collapsed}
              isActive={isActive(item.href)}
            />
          ))}
          
          {/* Admin Section */}
          {adminNav.length > 0 && (
            <>
              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="pt-4 pb-1"
                  >
                    <p className="px-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Administración
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
              {collapsed && <div className="border-t border-neutral-200 my-3" />}
              {adminNav.map((item) => (
                <NavItem
                  key={item.name}
                  item={item}
                  collapsed={collapsed}
                  isActive={isActive(item.href)}
                />
              ))}
            </>
          )}
        </nav>

        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-200 bg-neutral-50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center gap-3 p-2 hover:bg-white rounded-lg transition-all"
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary-600 text-white font-bold">
                    {user?.fullName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="flex-1 text-left overflow-hidden"
                    >
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {user?.fullName}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">{user?.role}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-danger-600">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.aside>

      {/* Sidebar - Mobile */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden fixed inset-y-0 left-0 w-80 bg-white border-r border-neutral-200 z-50 shadow-xl"
            >
              <div className="flex items-center gap-3 h-20 px-5 border-b border-neutral-100 bg-gradient-to-r from-white to-neutral-50/50">
                <motion.div 
                  className="relative"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Church className="w-7 h-7 text-white drop-shadow-sm" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl blur-lg opacity-30 -z-10" />
                </motion.div>
                <div className="flex flex-col">
                  <h1 className="font-bold text-neutral-800 text-base leading-tight tracking-tight">
                    Programa de
                  </h1>
                  <p className="text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Oportunidades
                  </p>
                </div>
              </div>
              <nav className="p-4 space-y-1">
                {nav.map((item) => (
                  <div key={item.name} onClick={() => setMobileMenuOpen(false)}>
                    <NavItem item={item} collapsed={false} isActive={isActive(item.href)} />
                  </div>
                ))}
                
                {/* Admin Section - Mobile */}
                {adminNav.length > 0 && (
                  <>
                    <div className="pt-4 pb-1">
                      <p className="px-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                        Administración
                      </p>
                    </div>
                    {adminNav.map((item) => (
                      <div key={item.name} onClick={() => setMobileMenuOpen(false)}>
                        <NavItem item={item} collapsed={false} isActive={isActive(item.href)} />
                      </div>
                    ))}
                  </>
                )}
              </nav>
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-200 bg-neutral-50">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary-600 text-white font-bold">
                      {user?.fullName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900">{user?.fullName}</p>
                    <p className="text-xs text-neutral-500">{user?.role}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar sesión
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <motion.main
        animate={{
          paddingLeft: collapsed ? '80px' : '280px',
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="lg:transition-all"
      >
        <div className="p-4 lg:p-8 pt-20 lg:pt-8">
          <Outlet />
        </div>
      </motion.main>
    </div>
  )
}

export default DashboardLayoutImproved
