import { useState, useEffect, useRef } from 'react'
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
  ClipboardCheck,
  Cake,
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
import { BrandLogo } from './BrandLogo'

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
    <Link to={item.href} className="brand-nav-link" aria-current={isActive ? "page" : undefined} title={collapsed ? item.name : undefined}>
      <motion.div
        whileHover={{ scale: 1 }}
        whileTap={{ scale: 0.98 }}
        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
          item.className || ''
        } ${
          isActive
            ? 'bg-blue-50 text-blue-700 shadow-sm'
            : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 hover:shadow-sm'
        }`}
      >
        {/* Active indicator line */}
        {isActive && (
          <motion.div
            layoutId="activeNavIndicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full"
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
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 group ${
          hasActive
            ? 'text-blue-600 bg-blue-50'
            : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100'
        }`}
      >
        <div className="flex items-center gap-2">
          <GroupIcon className={`w-4 h-4 transition-colors duration-200 ${
            hasActive ? 'text-blue-500' : 'text-neutral-400 group-hover:text-neutral-600'
          }`} />
          <span className="tracking-widest">{label}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            open ? 'rotate-0' : '-rotate-90'
          } ${
            hasActive ? 'text-blue-400' : 'text-neutral-400 group-hover:text-neutral-500'
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
            <div className="ml-2 pl-2 border-l-2 border-neutral-200 mt-1 mb-1 space-y-0.5">
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
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const mobileNavRef = useRef<HTMLDivElement>(null)
  useEffect(() => { setMobileMenuOpen(false) }, [location.pathname])
  useEffect(() => {
    if (!mobileMenuOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const panel = mobileNavRef.current
    const focusable = () => Array.from(panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') || [])
    focusable()[0]?.focus()
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false)
      if (event.key === 'Tab') {
        const items = focusable()
        const first = items[0], last = items[items.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKey)
      menuButtonRef.current?.focus()
    }
  }, [mobileMenuOpen])
  const [showLogoutSplash, setShowLogoutSplash] = useState(false)
  const { restartTour } = useOnboarding()

  const isViewer = user?.role === 'VIEWER' && !user?.useCustomPermissions

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
        { name: 'Personas',       href: '/persons',     icon: Users,          show: hasPermission(P.PERSONS_VIEW),       className: 'sidebar-personas' },
        { name: 'Actividades',    href: '/activities',  icon: Calendar,       show: hasPermission(P.ACTIVITIES_VIEW),    className: 'sidebar-activities' },
        { name: 'Nuevos Miembros',href: '/new-members', icon: UserPlus,       show: hasPermission(P.PERSONS_VIEW),       className: 'sidebar-new-members' },
        { name: 'Asistencias',    href: '/asistencias', icon: ClipboardCheck, show: hasPermission(P.ATTENDANCE_VIEW),    className: 'sidebar-attendance' },
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
      show: hasPermission(P.FINANCES_VIEW),
      items: [
        { name: 'Finanzas', href: '/finances', icon: DollarSign, show: hasPermission(P.FINANCES_VIEW), className: 'sidebar-finances' },
      ],
    },
    {
      key: 'secretaria',
      label: 'Secretaría',
      icon: ClipboardList,
      show: hasPermission(P.SECRETARY_VIEW),
      items: [
        { name: 'Secretaría', href: '/secretaria', icon: ClipboardList, show: hasPermission(P.SECRETARY_VIEW), className: 'sidebar-secretary' },
      ],
    },
    {
      key: 'pastoral',
      label: 'Pastoral',
      icon: Church,
      show: hasPermission(P.PASTORAL_VIEW),
      items: [
        { name: 'Pastoral', href: '/pastoral', icon: Church, show: hasPermission(P.PASTORAL_VIEW), className: 'sidebar-pastoral' },
      ],
    },
    {
      key: 'cumpleanos',
      label: 'Cumpleaños',
      icon: Cake,
      show: isAdmin() || hasPermission(P.SECRETARY_VIEW),
      items: [
        { name: 'Cumpleaños', href: '/cumpleanos', icon: Cake, show: isAdmin() || hasPermission(P.SECRETARY_VIEW), className: 'sidebar-cumpleanos' },
      ],
    },
    {
      key: 'administracion',
      label: 'Administración',
      icon: Shield,
      show: hasPermission(P.USERS_VIEW) || hasPermission(P.AUDIT_VIEW) || hasPermission(P.SETTINGS_VIEW),
      items: [
        { name: 'Usuarios',       href: '/admin/users', icon: UserCog,  show: hasPermission(P.USERS_VIEW) },
        { name: 'Auditoría',      href: '/admin/audit', icon: Shield,   show: hasPermission(P.AUDIT_VIEW) },
        { name: 'Configuración',  href: '/settings',    icon: Settings, show: hasPermission(P.SETTINGS_VIEW), className: 'sidebar-settings' },
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
    <div className="app-shell min-h-screen bg-slate-50">
      {/* Mobile Menu Button */}
      <header className="lg:hidden sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          ref={menuButtonRef}
          aria-label="Abrir menú de navegación"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
          className="bg-slate-50 border-slate-200"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
        <div className="min-w-0 flex-1 flex items-center gap-3"><BrandLogo className="brand-logo-mobile" /><div><p className="text-sm font-bold text-slate-900">Dios Fuerte</p><p className="text-[10px] tracking-wider uppercase text-slate-500">Arca Evangélica</p></div></div>
        <Avatar className="h-9 w-9"><AvatarFallback className="bg-blue-50 text-blue-700 text-xs">{user?.fullName?.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
      </header>

      {/* Sidebar - Desktop */}
      <motion.aside
        animate={{ width: collapsed ? '80px' : '280px' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:flex lg:flex-col fixed inset-y-0 left-0 bg-white border-r border-neutral-200 z-30 shadow-sm"
      >
        {/* Header */}
        <div className="flex items-center justify-between h-20 px-4 border-b border-neutral-100 bg-gradient-to-r from-white to-neutral-50/50">
          <Link to="/" className="brand-home" aria-label="Arca Evangélica, inicio"><BrandLogo className={collapsed ? 'brand-logo-collapsed' : 'brand-logo-sidebar'} /></Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="hover:bg-neutral-100 rounded-xl shrink-0" aria-label={collapsed ? "Expandir navegación" : "Contraer navegación"}
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
            item={{ name: 'Inicio', href: '/', icon: LayoutDashboard, className: 'sidebar-dashboard' }}
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
              {!collapsed && <div className="border-t border-neutral-200 my-3" />}
              {collapsed && <div className="my-2" />}
              <div className="space-y-2">
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
              ref={mobileNavRef}
              id="mobile-navigation"
              role="dialog"
              aria-modal="true"
              aria-label="Navegación principal"
            >
              <div className="flex items-center gap-3 h-20 px-5 border-b border-neutral-100 bg-gradient-to-r from-white to-neutral-50/50">
                <button onClick={() => setMobileMenuOpen(false)} aria-label="Cerrar menú" className="absolute right-2 top-2 p-2 rounded-lg"><X className="h-5 w-5" /></button>
                <BrandLogo className="brand-logo-sidebar" />
              </div>
              <nav className="flex-1 overflow-y-auto p-3 space-y-1 pb-4">
                {/* Dashboard */}
                <div onClick={() => setMobileMenuOpen(false)}>
                  <NavItem
                    item={{ name: 'Inicio', href: '/', icon: LayoutDashboard, className: 'sidebar-dashboard' }}
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
                    <div className="border-t border-neutral-200 my-3" />
                    <div className="space-y-2">
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
      <main className={`min-w-0 min-h-screen transition-all duration-300 ${collapsed ? 'lg:pl-[80px]' : 'lg:pl-[280px]'}`}>
        <header className="brand-desktop-bar hidden lg:flex"><div><span className="brand-workspace-label">ARCA EVANGÉLICA</span><p>Dios Fuerte · Gestión de la iglesia</p></div><div className="brand-account"><span>{user?.fullName}</span><Avatar className="h-9 w-9"><AvatarFallback>{user?.fullName?.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar></div></header>
        <div className="app-content mx-auto max-w-[1800px] px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8">
          <Outlet />
        </div>
      </main>

      {/* Onboarding Tour */}
      <OnboardingTour />
    </div>
  )
}

export default DashboardLayoutImproved
