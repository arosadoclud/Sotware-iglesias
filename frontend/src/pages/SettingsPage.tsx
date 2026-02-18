import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { churchesApi, rolesApi, authApi } from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { useProtectedModulesStore, MODULE_NAMES, type ProtectedModule } from '../store/protectedModulesStore'
import { toast } from 'sonner'
import {
  Loader2,
  Save,
  Plus,
  Trash2,
  Church,
  Palette,
  Shield,
  Upload,
  Settings2,
  Phone,
  MapPin,
  Globe,
  Mail,
  Pencil,
  User,
  Key,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  AlertCircle,
  RefreshCw,
  Camera,
  Building2,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

// ── Types ─────────────────────────────────────────────────────────────────────

type TabId = 'general' | 'branding' | 'roles' | 'profile' | 'security' | 'advanced'

interface TabItem {
  id: TabId
  label: string
  icon: any
  description: string
}

const TABS: TabItem[] = [
  { id: 'general', label: 'General', icon: Church, description: 'Información de la iglesia' },
  { id: 'branding', label: 'Marca', icon: Palette, description: 'Logo y apariencia' },
  { id: 'roles', label: 'Roles', icon: Shield, description: 'Gestión de roles' },
  { id: 'profile', label: 'Mi Perfil', icon: User, description: 'Tu información personal' },
  { id: 'security', label: 'Seguridad', icon: Lock, description: 'Protección de módulos' },
  { id: 'advanced', label: 'Avanzado', icon: Settings2, description: 'Configuración avanzada' },
]

// ── Animated Input Component ──────────────────────────────────────────────────

interface AnimatedInputProps {
  label: string
  icon: any
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  disabled?: boolean
}

const AnimatedInput = ({ label, icon: Icon, value, onChange, placeholder, type = 'text', disabled }: AnimatedInputProps) => {
  const [focused, setFocused] = useState(false)
  
  return (
    <motion.div 
      className="space-y-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
        <Icon className="w-4 h-4 text-neutral-400" />
        {label}
      </Label>
      <div className="relative">
        <motion.div
          className={`absolute inset-0 rounded-lg pointer-events-none transition-all duration-200 ${
            focused ? 'ring-2 ring-primary-500/20' : ''
          }`}
        />
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`transition-all duration-200 ${
            focused ? 'border-primary-500 shadow-sm' : ''
          }`}
        />
      </div>
    </motion.div>
  )
}

// ── Security Tab Content Component ────────────────────────────────────────────

const SecurityTabContent = () => {
  const { 
    config, 
    setConfig, 
    setPassword, 
    lockAll,
    autoLockMinutes,
  } = useProtectedModulesStore()
  
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localAutoLock, setLocalAutoLock] = useState(autoLockMinutes)
  
  const allModules: ProtectedModule[] = ['finances', 'settings', 'audit', 'users']
  
  const handleToggleModule = (module: ProtectedModule) => {
    const current = config.modules
    const newModules = current.includes(module)
      ? current.filter(m => m !== module)
      : [...current, module]
    setConfig({ modules: newModules })
    toast.success(
      current.includes(module) 
        ? `${MODULE_NAMES[module]} ya no está protegido` 
        : `${MODULE_NAMES[module]} ahora está protegido`
    )
  }
  
  const handleChangePassword = () => {
    if (!newPassword) {
      toast.error('Ingresa una nueva contraseña')
      return
    }
    if (newPassword.length < 4) {
      toast.error('La contraseña debe tener al menos 4 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    setPassword(newPassword)
    setNewPassword('')
    setConfirmPassword('')
    lockAll() // Forzar re-autenticación
    toast.success('Contraseña actualizada correctamente')
  }
  
  const handleToggleProtection = () => {
    setConfig({ enabled: !config.enabled })
    if (!config.enabled) {
      lockAll()
    }
    toast.success(config.enabled ? 'Protección desactivada' : 'Protección activada')
  }
  
  const handleAutoLockChange = (minutes: number) => {
    setLocalAutoLock(minutes)
    useProtectedModulesStore.setState({ autoLockMinutes: minutes })
    toast.success(minutes === 0 ? 'Auto-bloqueo desactivado' : `Auto-bloqueo en ${minutes} min`)
  }
  
  return (
    <div className="space-y-6">
      {/* Main Protection Toggle */}
      <Card className="border-0 shadow-lg shadow-neutral-200/50 overflow-hidden">
        <div className={`h-2 bg-gradient-to-r ${config.enabled ? 'from-emerald-500 to-teal-600' : 'from-neutral-400 to-neutral-500'}`} />
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                Protección de Módulos
              </CardTitle>
              <CardDescription>Requiere contraseña para acceder a módulos sensibles</CardDescription>
            </div>
            <button
              onClick={handleToggleProtection}
              className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                config.enabled 
                  ? 'bg-emerald-500' 
                  : 'bg-neutral-300'
              }`}
            >
              <motion.div
                className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center"
                animate={{ x: config.enabled ? 24 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                {config.enabled ? (
                  <Lock className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Unlock className="w-3 h-3 text-neutral-400" />
                )}
              </motion.div>
            </button>
          </div>
        </CardHeader>
        
        <AnimatePresence>
          {config.enabled && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <CardContent className="space-y-4 pt-0">
                {/* Protected Modules Selection */}
                <div>
                  <Label className="text-sm font-medium text-neutral-700 mb-3 block">
                    Módulos Protegidos
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {allModules.map(module => {
                      const isProtected = config.modules.includes(module)
                      return (
                        <motion.button
                          key={module}
                          onClick={() => handleToggleModule(module)}
                          whileTap={{ scale: 0.98 }}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            isProtected
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-neutral-200 hover:border-neutral-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isProtected ? 'bg-emerald-500 text-white' : 'bg-neutral-100 text-neutral-500'
                            }`}>
                              {isProtected ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            </div>
                            <span className={`font-medium ${isProtected ? 'text-emerald-700' : 'text-neutral-600'}`}>
                              {MODULE_NAMES[module]}
                            </span>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
                
                {/* Auto-lock settings */}
                <div className="pt-2">
                  <Label className="text-sm font-medium text-neutral-700 mb-2 block">
                    Auto-bloqueo por inactividad
                  </Label>
                  <div className="flex gap-2 flex-wrap">
                    {[0, 5, 15, 30, 60].map(mins => (
                      <button
                        key={mins}
                        onClick={() => handleAutoLockChange(mins)}
                        className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                          localAutoLock === mins
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-neutral-200 hover:border-neutral-300 text-neutral-600'
                        }`}
                      >
                        {mins === 0 ? 'Nunca' : `${mins} min`}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
      
      {/* Change Password */}
      <Card className="border-0 shadow-lg shadow-neutral-200/50 overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600" />
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-600" />
            Cambiar Contraseña de Protección
          </CardTitle>
          <CardDescription>
            La contraseña por defecto es: <code className="px-2 py-1 bg-neutral-100 rounded">admin123</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nueva contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirmar Contraseña</Label>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmar contraseña"
              />
            </div>
          </div>
          
          <Button
            onClick={handleChangePassword}
            disabled={!newPassword || !confirmPassword}
            className="gap-2"
          >
            <Key className="w-4 h-4" />
            Actualizar Contraseña
          </Button>
        </CardContent>
      </Card>
      
      {/* Lock Now Button */}
      {config.enabled && (
        <Card className="border-0 shadow-lg shadow-neutral-200/50 overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-amber-500 to-orange-600" />
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <Lock className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-neutral-900">Bloquear Ahora</p>
                <p className="text-sm text-neutral-500">Bloquea todos los módulos protegidos inmediatamente</p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  lockAll()
                  toast.success('Módulos bloqueados')
                }}
                className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                <Lock className="w-4 h-4" />
                Bloquear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

const SettingsPage = () => {
  const { user } = useAuthStore()
  
  // Church state
  const [church, setChurch] = useState<any>(null)
  const [originalChurch, setOriginalChurch] = useState<any>(null)
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('general')
  
  // Role modal state
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [editingRole, setEditingRole] = useState<any>(null)
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    requiresSkill: false,
  })
  const [savingRole, setSavingRole] = useState(false)
  
  // Upload state
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingSignature, setUploadingSignature] = useState(false)
  
  // Profile state
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  // Track changes
  const hasChanges = JSON.stringify(church) !== JSON.stringify(originalChurch)

  // ── Load Data ───────────────────────────────────────────────────────────────

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || '',
        email: user.email || '',
      })
    }
  }, [user])

  const load = async () => {
    setLoading(true)
    try {
      const [cRes, rRes] = await Promise.all([churchesApi.getMine(), rolesApi.getAll()])
      setChurch(cRes.data.data)
      setOriginalChurch(cRes.data.data)
      setRoles(rRes.data.data)
    } catch {
      toast.error('Error al cargar configuración')
    }
    setLoading(false)
  }

  // ── Church Handlers ─────────────────────────────────────────────────────────

  const saveChurch = async () => {
    setSaving(true)
    try {
      const res = await churchesApi.updateMine(church)
      setChurch(res.data.data)
      setOriginalChurch(res.data.data)
      toast.success('Configuración guardada correctamente')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al guardar')
    }
    setSaving(false)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo es muy grande (máx 5MB)')
      return
    }
    
    setUploadingLogo(true)
    try {
      const res = await churchesApi.uploadLogo(file)
      setChurch(res.data.data)
      setOriginalChurch(res.data.data)
      toast.success('Logo actualizado')
    } catch {
      toast.error('Error al subir logo')
    }
    setUploadingLogo(false)
  }

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('El archivo es muy grande (máx 2MB)')
      return
    }
    
    setUploadingSignature(true)
    try {
      const res = await churchesApi.uploadSignature(file)
      setChurch(res.data.data)
      setOriginalChurch(res.data.data)
      toast.success('Firma actualizada')
    } catch {
      toast.error('Error al subir firma')
    }
    setUploadingSignature(false)
  }

  // ── Role Handlers ───────────────────────────────────────────────────────────

  const openRoleModal = (role?: any) => {
    if (role) {
      setEditingRole(role)
      setRoleForm({
        name: role.name,
        description: role.description || '',
        color: role.color || '#3B82F6',
        requiresSkill: role.requiresSkill || false,
      })
    } else {
      setEditingRole(null)
      setRoleForm({ name: '', description: '', color: '#3B82F6', requiresSkill: false })
    }
    setShowRoleModal(true)
  }

  const saveRole = async () => {
    if (!roleForm.name.trim()) return toast.error('Nombre requerido')
    setSavingRole(true)
    try {
      if (editingRole) {
        await rolesApi.update(editingRole._id, roleForm)
        toast.success('Rol actualizado')
      } else {
        await rolesApi.create(roleForm)
        toast.success('Rol creado')
      }
      setShowRoleModal(false)
      load()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error')
    }
    setSavingRole(false)
  }

  const deleteRole = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar rol "${name}"? Esta acción no se puede deshacer.`)) return
    try {
      await rolesApi.delete(id)
      toast.success('Rol eliminado')
      load()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  // ── Profile Handlers ────────────────────────────────────────────────────────

  const saveProfile = async () => {
    if (!profileForm.fullName.trim()) {
      toast.error('El nombre es requerido')
      return
    }
    
    setSavingProfile(true)
    try {
      const response = await authApi.updateProfile({ fullName: profileForm.fullName })
      const { updateUser } = useAuthStore.getState()
      updateUser({ fullName: response.data.data.fullName })
      toast.success('Perfil actualizado')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al actualizar perfil')
    }
    setSavingProfile(false)
  }

  const changePassword = async () => {
    if (!passwordForm.currentPassword) {
      toast.error('Ingresa tu contraseña actual')
      return
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    setChangingPassword(true)
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      toast.success('Contraseña actualizada')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al cambiar contraseña')
    }
    setChangingPassword(false)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-10 h-10 text-primary-600" />
        </motion.div>
        <p className="text-neutral-500 font-medium">Cargando configuración...</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto space-y-4 sm:space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row  items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/25">
            <Settings2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">Configuración</h1>
            <p className="text-sm sm:text-base text-neutral-500 hidden sm:block">Administra tu iglesia y preferencias</p>
          </div>
        </div>
        
        {/* Save indicator */}
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full"
          >
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-xs sm:text-sm text-amber-700 font-medium">Cambios sin guardar</span>
          </motion.div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="bg-neutral-100/80 p-1 sm:p-1.5 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-3 sm:flex sm:gap-1 gap-0.5 overflow-x-auto scrollbar-hide pb-1 -mb-1">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 sm:px-5 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  isActive
                    ? 'text-primary-700'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabBg"
                    className="absolute inset-0 bg-white rounded-xl shadow-sm"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex flex-col sm:flex-row items-center gap-0.5 sm:gap-2">
                  <Icon className="w-4 h-4 sm:w-4 sm:h-4" />
                  <span className="leading-tight">{tab.label}</span>
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* ── General Tab ────────────────────────────────────────────────── */}
          {activeTab === 'general' && church && (
            <div className="space-y-6">
              <Card className="border-0 shadow-lg shadow-neutral-200/50 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary-600" />
                    Información de la Iglesia
                  </CardTitle>
                  <CardDescription>Datos principales de tu organización</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <AnimatedInput
                    label="Nombre de la Iglesia"
                    icon={Church}
                    value={church.name || ''}
                    onChange={(v) => setChurch({ ...church, name: v })}
                    placeholder="Nombre de tu iglesia"
                  />

                  <AnimatedInput
                    label="Dirección"
                    icon={MapPin}
                    value={church.address?.street || ''}
                    onChange={(v) => setChurch({ ...church, address: { ...church.address, street: v } })}
                    placeholder="Calle y número"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <AnimatedInput
                      label="Ciudad"
                      icon={Globe}
                      value={church.address?.city || ''}
                      onChange={(v) => setChurch({ ...church, address: { ...church.address, city: v } })}
                      placeholder="Ciudad"
                    />
                    <AnimatedInput
                      label="Estado/Provincia"
                      icon={MapPin}
                      value={church.address?.state || ''}
                      onChange={(v) => setChurch({ ...church, address: { ...church.address, state: v } })}
                      placeholder="Estado o provincia"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <AnimatedInput
                      label="Teléfono"
                      icon={Phone}
                      value={church.phone || ''}
                      onChange={(v) => setChurch({ ...church, phone: v })}
                      placeholder="(000) 000-0000"
                    />
                    <AnimatedInput
                      label="Email"
                      icon={Mail}
                      value={church.email || ''}
                      onChange={(v) => setChurch({ ...church, email: v })}
                      placeholder="correo@iglesia.com"
                    />
                  </div>

                  <AnimatedInput
                    label="Sitio Web"
                    icon={Globe}
                    value={church.website || ''}
                    onChange={(v) => setChurch({ ...church, website: v })}
                    placeholder="https://www.tuiglesia.com"
                  />

                  <AnimatedInput
                    label="Nombre del Pastor"
                    icon={User}
                    value={church.pastorName || ''}
                    onChange={(v) => setChurch({ ...church, pastorName: v })}
                    placeholder="Pastor/a"
                  />
                </CardContent>
              </Card>

              {/* Save Button */}
              <motion.div 
                className="flex justify-end"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Button
                  onClick={saveChurch}
                  disabled={saving || !hasChanges}
                  className="gap-2 px-6 shadow-lg shadow-primary-500/25"
                  size="lg"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Guardar Cambios
                </Button>
              </motion.div>
            </div>
          )}

          {/* ── Branding Tab ───────────────────────────────────────────────── */}
          {activeTab === 'branding' && church && (
            <div className="space-y-6">
              {/* Logo */}
              <Card className="border-0 shadow-lg shadow-neutral-200/50 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500" />
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Camera className="w-5 h-5 text-purple-600" />
                    Logo de la Iglesia
                  </CardTitle>
                  <CardDescription>Imagen que aparecerá en cartas y programas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="relative group"
                    >
                      <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-neutral-300 flex items-center justify-center bg-neutral-50 overflow-hidden">
                        {church.logoUrl ? (
                          <img src={church.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                          <Church className="w-12 h-12 text-neutral-300" />
                        )}
                      </div>
                      <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl cursor-pointer">
                        <div className="text-white text-center">
                          {uploadingLogo ? (
                            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                          ) : (
                            <>
                              <Upload className="w-6 h-6 mx-auto mb-1" />
                              <span className="text-xs">Cambiar</span>
                            </>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          disabled={uploadingLogo}
                        />
                      </label>
                    </motion.div>
                    <div className="text-center sm:text-left">
                      <p className="text-sm text-neutral-600 mb-2">
                        Formatos: JPG, PNG, SVG<br />
                        Tamaño máximo: 5MB
                      </p>
                      <Button variant="outline" size="sm" asChild>
                        <label className="cursor-pointer">
                          <Upload className="w-4 h-4 mr-2" />
                          Subir Logo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                            disabled={uploadingLogo}
                          />
                        </label>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Signature */}
              <Card className="border-0 shadow-lg shadow-neutral-200/50 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-amber-500 to-orange-500" />
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Pencil className="w-5 h-5 text-amber-600" />
                    Firma del Pastor
                  </CardTitle>
                  <CardDescription>Firma que aparecerá en cartas oficiales</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="relative group"
                    >
                      <div className="w-48 h-24 rounded-xl border-2 border-dashed border-neutral-300 flex items-center justify-center bg-neutral-50 overflow-hidden">
                        {church.signatureUrl ? (
                          <img src={church.signatureUrl} alt="Firma" className="max-w-full h-auto" />
                        ) : (
                          <span className="text-neutral-400 text-sm">Sin firma</span>
                        )}
                      </div>
                      <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl cursor-pointer">
                        <div className="text-white text-center">
                          {uploadingSignature ? (
                            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                          ) : (
                            <>
                              <Upload className="w-6 h-6 mx-auto mb-1" />
                              <span className="text-xs">Cambiar</span>
                            </>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSignatureUpload}
                          className="hidden"
                          disabled={uploadingSignature}
                        />
                      </label>
                    </motion.div>
                    <div className="text-center sm:text-left">
                      <p className="text-sm text-neutral-600 mb-2">
                        Recomendado: Fondo transparente (PNG)<br />
                        Tamaño máximo: 2MB
                      </p>
                      <Button variant="outline" size="sm" asChild>
                        <label className="cursor-pointer">
                          <Upload className="w-4 h-4 mr-2" />
                          Subir Firma
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleSignatureUpload}
                            className="hidden"
                            disabled={uploadingSignature}
                          />
                        </label>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Roles Tab ──────────────────────────────────────────────────── */}
          {activeTab === 'roles' && (
            <div className="space-y-6">
              <Card className="border-0 shadow-lg shadow-neutral-200/50 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-500" />
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="w-5 h-5 text-emerald-600" />
                      Roles del Programa
                    </CardTitle>
                    <CardDescription>Define los roles disponibles para asignar</CardDescription>
                  </div>
                  <Button onClick={() => openRoleModal()} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Nuevo Rol
                  </Button>
                </CardHeader>
                <CardContent>
                  {roles.length === 0 ? (
                    <div className="text-center py-12">
                      <Shield className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
                      <p className="text-neutral-500">No hay roles creados</p>
                      <Button variant="outline" className="mt-3 gap-2" onClick={() => openRoleModal()}>
                        <Plus className="w-4 h-4" />
                        Crear primer rol
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {roles.map((role, i) => (
                        <motion.div
                          key={role._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-4 p-4 rounded-xl border border-neutral-200 bg-white hover:shadow-md transition-all group"
                        >
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shadow-sm"
                            style={{ backgroundColor: role.color || '#3B82F6' }}
                          >
                            {role.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-neutral-900">{role.name}</p>
                            {role.description && (
                              <p className="text-sm text-neutral-500 truncate">{role.description}</p>
                            )}
                          </div>
                          {role.requiresSkill && (
                            <Badge variant="outline" className="text-xs">
                              Requiere habilidad
                            </Badge>
                          )}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openRoleModal(role)}
                              className="h-8 w-8 p-0"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteRole(role._id, role.name)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Profile Tab ────────────────────────────────────────────────── */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Info */}
              <Card className="border-0 shadow-lg shadow-neutral-200/50 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500" />
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Información Personal
                  </CardTitle>
                  <CardDescription>Tu información de usuario</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <AnimatedInput
                    label="Nombre Completo"
                    icon={User}
                    value={profileForm.fullName}
                    onChange={(v) => setProfileForm({ ...profileForm, fullName: v })}
                    placeholder="Tu nombre"
                  />

                  <AnimatedInput
                    label="Email"
                    icon={Mail}
                    value={profileForm.email}
                    onChange={(v) => setProfileForm({ ...profileForm, email: v })}
                    placeholder="tu@email.com"
                    disabled
                  />

                  <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
                    <Shield className="w-5 h-5 text-neutral-400" />
                    <div>
                      <p className="text-sm font-medium text-neutral-700">Rol: {user?.role}</p>
                      <p className="text-xs text-neutral-500">El rol determina tus permisos en el sistema</p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={saveProfile}
                      disabled={savingProfile}
                      className="gap-2"
                    >
                      {savingProfile ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Guardar Perfil
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Change Password */}
              <Card className="border-0 shadow-lg shadow-neutral-200/50 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-red-500 to-rose-500" />
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Key className="w-5 h-5 text-red-600" />
                    Cambiar Contraseña
                  </CardTitle>
                  <CardDescription>Actualiza tu contraseña de acceso</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                      <Key className="w-4 h-4 text-neutral-400" />
                      Contraseña Actual
                    </Label>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                        Nueva Contraseña
                      </Label>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                        Confirmar Contraseña
                      </Label>
                      <Input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {/* Password strength indicator */}
                  {passwordForm.newPassword && (
                    <div className="space-y-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                              passwordForm.newPassword.length >= level * 3
                                ? level <= 1
                                  ? 'bg-red-400'
                                  : level <= 2
                                  ? 'bg-amber-400'
                                  : level <= 3
                                  ? 'bg-emerald-400'
                                  : 'bg-emerald-500'
                                : 'bg-neutral-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-neutral-500">
                        {passwordForm.newPassword.length < 6
                          ? 'Mínimo 6 caracteres'
                          : passwordForm.newPassword.length < 10
                          ? 'Contraseña aceptable'
                          : 'Contraseña fuerte'}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button
                      onClick={changePassword}
                      disabled={changingPassword}
                      variant="outline"
                      className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
                    >
                      {changingPassword ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Key className="w-4 h-4" />
                      )}
                      Cambiar Contraseña
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ── Security Tab ───────────────────────────────────────────────── */}
          {activeTab === 'security' && <SecurityTabContent />}

          {/* ── Advanced Tab ───────────────────────────────────────────────── */}
          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <Card className="border-0 shadow-lg shadow-neutral-200/50 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-neutral-500 to-neutral-700" />
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-neutral-600" />
                    Configuración Avanzada
                  </CardTitle>
                  <CardDescription>Opciones adicionales del sistema</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="w-5 h-5 text-neutral-500" />
                      <div className="flex-1">
                        <p className="font-medium text-neutral-900">Recargar Datos</p>
                        <p className="text-sm text-neutral-500">Forzar recarga de configuración desde el servidor</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={load}>
                        Recargar
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <div className="flex-1">
                        <p className="font-medium text-emerald-900">Estado del Sistema</p>
                        <p className="text-sm text-emerald-700">Todos los servicios funcionando correctamente</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600" />
                      <div className="flex-1">
                        <p className="font-medium text-blue-900">Versión</p>
                        <p className="text-sm text-blue-700">Programa de Oportunidades v2.0</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Role Modal */}
      <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Editar Rol' : 'Nuevo Rol'}</DialogTitle>
            <DialogDescription>
              {editingRole ? 'Modifica los datos del rol' : 'Crea un nuevo rol para asignar en programas'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                placeholder="Ej: Adoración, Predicador, Ujier"
              />
            </div>

            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input
                value={roleForm.description}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                placeholder="Descripción breve"
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={roleForm.color}
                    onChange={(e) => setRoleForm({ ...roleForm, color: e.target.value })}
                    className="w-12 h-12 rounded-xl cursor-pointer border-2 border-neutral-200"
                  />
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold shadow"
                    style={{ backgroundColor: roleForm.color }}
                  >
                    {roleForm.name?.charAt(0)?.toUpperCase() || 'R'}
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={roleForm.requiresSkill}
                    onChange={(e) => setRoleForm({ ...roleForm, requiresSkill: e.target.checked })}
                    className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">Requiere habilidad</p>
                    <p className="text-xs text-neutral-500">Solo personas capacitadas</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleModal(false)}>
              Cancelar
            </Button>
            <Button onClick={saveRole} disabled={savingRole} className="gap-2">
              {savingRole && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingRole ? 'Guardar' : 'Crear Rol'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

export default SettingsPage
