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
  ChevronDown,
  Shield,
  UserCog,
  DollarSign,
  UserPlus,
  Image,
  HelpCircle,
  BookOpen,
  Megaphone,
  ClipboardList,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'react-hot-toast'
import { P } from '../../constants/permissions'
import { OnboardingTour } from '../onboarding'
import { useOnboarding } from '../../hooks/useOnboarding'
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
    className?: string
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
          item.className || ''
        } ${
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

interface NavGroupProps {
  groupKey: string
  label: string
  icon: any
  items: { name: string; href: string; icon: any; className?: string }[]
  collapsed: boolean // sidebar collapsed to 80px
  isActive: (path: string) => boolean
  onNavigate?: () => void
}

const NavGroup = ({ groupKey, label, icon: GroupIcon, items, collapsed, isActive, onNavigate }: NavGroupProps) => {
  const storageKey = `navgroup-${groupKey}`
  const [open, setOpen] = useState(() => {
    const saved = localStorage.getItem(storageKey)
    return saved !== null ? saved === 'true' : true // open by default
  })

  const hasActive = items.some((item) => isActive(item.href))

  const toggle = () => {
    const next = !open
    setOpen(next)
    localStorage.setItem(storageKey, String(next))
  }

  // When sidebar is collapsed to icons, render items flat without group header
  if (collapsed) {
    return (
      <div className="space-y-1">
        {items.map((item) => (
          <NavItem key={item.href} item={item} collapsed={collapsed} isActive={isActive(item.href)} />
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Group header button */}
      <button
        onClick={toggle}
        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
          hasActive
            ? 'text-primary-700'
            : 'text-neutral-400 hover:text-neutral-600'
        }`}
      >
        <div className="flex items-center gap-2">
          <GroupIcon className="w-3.5 h-3.5" />
          <span>{label}</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            open ? 'rotate-0' : '-rotate-90'
          }`}
        />
      </button>

      {/* Group items */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="ml-2 pl-2 border-l border-neutral-200 mt-0.5 mb-1 space-y-0.5">
              {items.map((item) => (
                <div key={item.href} onClick={onNavigate}>
                  <NavItem item={item} collapsed={false} isActive={isActive(item.href)} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const DashboardLayoutImproved = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, isAdmin, hasPermission } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showLogoutSplash, setShowLogoutSplash] = useState(false)
  const { restartTour } = useOnboarding()

  const isViewer = user?.role === 'VIEWER'

  const handleLogout = () => {
    setShowLogoutSplash(true)
  }

  const handleLogoutComplete = () => {
    // Limpiar el estado de autenticación
    logout()
    // Forzar navegación a nivel del navegador para asegurar que se complete
    // Esto evita problemas de componentes desmontados prematuramente
    window.location.href = '/login'
  }

  // Módulos permitidos para VIEWER
  const VIEWER_ALLOWED_PATHS = ['/', '/letters', '/new-members', '/calendar', '/estudios-biblicos']

  // ── Definición de grupos de navegación ────────────────────────────────────
  const navGroups = [
    {
      key: 'congregacion',
      label: 'Congregación',
      icon: Users,
      show: !isViewer,
      items: [
        { name: 'Personas',       href: '/persons',     icon: Users,    show: hasPermission(P.PERSONS_VIEW),     className: 'sidebar-personas' },
        { name: 'Actividades',    href: '/activities',  icon: Calendar, show: hasPermission(P.ACTIVITIES_VIEW), className: 'sidebar-activities' },
        { name: 'Nuevos Miembros',href: '/new-members', icon: UserPlus, show: hasPermission(P.PERSONS_VIEW),     className: 'sidebar-new-members' },
      ],
    },
    {
      key: 'contenido',
      label: 'Contenido',
      icon: BookOpen,
      show: true,
      items: [
        { name: 'Programas',        href: '/programs',          icon: FileText,    show: hasPermission(P.PROGRAMS_VIEW),      className: 'sidebar-programs' },
        { name: 'Calendario',       href: '/calendar',          icon: CalendarDays,show: hasPermission(P.CALENDAR_VIEW),      className: 'sidebar-calendar' },
        { name: 'Eventos',          href: '/events',            icon: Image,       show: true,                                className: 'sidebar-events' },
        { name: 'Estudios Bíblicos',href: '/estudios-biblicos', icon: BookOpen,    show: hasPermission(P.BIBLE_STUDIES_VIEW), className: 'sidebar-bible-studies' },
      ],
    },
    {
      key: 'comunicacion',
      label: 'Comunicación',
      icon: Megaphone,
      show: !isViewer || hasPermission(P.LETTERS_VIEW),
      items: [
        { name: 'Cartas Invitación', href: '/letters', icon: Mail, show: hasPermission(P.LETTERS_VIEW), className: 'sidebar-letters' },
      ],
    },
    {
      key: 'tesoreria',
      label: 'Tesorería',
      icon: DollarSign,
      show: !isViewer && (hasPermission(P.FINANCES_VIEW) || isAdmin()),
      items: [
        { name: 'Finanzas', href: '/finances', icon: DollarSign, show: hasPermission(P.FINANCES_VIEW) || isAdmin(), className: 'sidebar-finances' },
      ],
    },
    {
      key: 'administracion',
      label: 'Administración',
      icon: Shield,
      show: !isViewer && isAdmin(),
      items: [
        { name: 'Usuarios',       href: '/admin/users', icon: UserCog,  show: isAdmin() },
        { name: 'Auditoría',      href: '/admin/audit', icon: Shield,   show: isAdmin() },
        { name: 'Configuración',  href: '/settings',    icon: Settings, show: hasPermission(P.SETTINGS_VIEW) || isAdmin(), className: 'sidebar-settings' },
      ],
    },
  ]

  // Filtrar grupos y sus ítems según permisos
  const visibleGroups = navGroups
    .filter(g => g.show)
    .map(g => ({ ...g, items: g.items.filter(i => i.show) }))
    .filter(g => g.items.length > 0)

  // VIEWER: solo Comunicación + Contenido limitado
  const viewerNav = [
    { name: 'Calendario',        href: '/calendar',          icon: CalendarDays, className: 'sidebar-calendar' },
    { name: 'Estudios Bíblicos', href: '/estudios-biblicos', icon: BookOpen,     className: 'sidebar-bible-studies' },
    { name: 'Cartas Invitación', href: '/letters',           icon: Mail,         className: 'sidebar-letters' },
    { name: 'Nuevos Miembros',   href: '/new-members',       icon: UserPlus,     className: 'sidebar-new-members' },
  ]

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
        className="hidden lg:flex lg:flex-col fixed inset-y-0 left-0 bg-white border-r border-neutral-200 z-30 shadow-sm"
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
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {/* Dashboard - siempre visible solo */}
          <NavItem
            item={{ name: 'Dashboard', href: '/', icon: LayoutDashboard, className: 'sidebar-dashboard' }}
            collapsed={collapsed}
            isActive={isActive('/')}
          />

          {isViewer ? (
            // VIEWER: lista simple sin grupos
            viewerNav.map((item) => (
              <NavItem key={item.href} item={item} collapsed={collapsed} isActive={isActive(item.href)} />
            ))
          ) : (
            // Resto de roles: grupos colapsables
            <>
              {!collapsed && <div className="border-t border-neutral-100 my-2" />}
              {collapsed && <div className="my-1" />}
              <div className="space-y-1">
                {visibleGroups.map((group) => (
                  <NavGroup
                    key={group.key}
                    groupKey={group.key}
                    label={group.label}
                    icon={group.icon}
                    items={group.items}
                    collapsed={collapsed}
                    isActive={isActive}
                  />
                ))}
              </div>
            </>
          )}
        </nav>

        {/* User Profile */}
        <div className="flex-shrink-0 p-4 border-t border-neutral-200 bg-neutral-50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center gap-3 p-2 hover:bg-white rounded-lg transition-all user-menu"
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
              <DropdownMenuItem onClick={restartTour}>
                <HelpCircle className="mr-2 h-4 w-4" />
                Ver tour de ayuda
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
              className="lg:hidden fixed inset-y-0 left-0 w-[85vw] max-w-80 bg-white border-r border-neutral-200 z-50 shadow-xl flex flex-col"
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
              <nav className="flex-1 overflow-y-auto p-3 space-y-1 pb-4">
                {/* Dashboard */}
                <div onClick={() => setMobileMenuOpen(false)}>
                  <NavItem
                    item={{ name: 'Dashboard', href: '/', icon: LayoutDashboard, className: 'sidebar-dashboard' }}
                    collapsed={false}
                    isActive={isActive('/')}
                  />
                </div>

                {isViewer ? (
                  viewerNav.map((item) => (
                    <div key={item.href} onClick={() => setMobileMenuOpen(false)}>
                      <NavItem item={item} collapsed={false} isActive={isActive(item.href)} />
                    </div>
                  ))
                ) : (
                  <>
                    <div className="border-t border-neutral-100 my-2" />
                    <div className="space-y-1">
                      {visibleGroups.map((group) => (
                        <NavGroup
                          key={group.key}
                          groupKey={group.key}
                          label={group.label}
                          icon={group.icon}
                          items={group.items}
                          collapsed={false}
                          isActive={isActive}
                          onNavigate={() => setMobileMenuOpen(false)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </nav>
              <div className="flex-shrink-0 p-4 border-t border-neutral-200 bg-neutral-50">
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
      <main className={`min-h-screen transition-all duration-300 ${collapsed ? 'lg:pl-[80px]' : 'lg:pl-[280px]'}`}>
        <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pt-16 sm:pt-18 lg:pt-8">
          <Outlet />
        </div>
      </main>

      {/* Onboarding Tour */}
      <OnboardingTour />
    </div>
  )
}

export default DashboardLayoutImproved
