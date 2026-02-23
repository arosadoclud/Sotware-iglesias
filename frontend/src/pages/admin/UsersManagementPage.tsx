import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Users, Plus, Search, Shield, Edit2, Trash2, Key, MoreVertical, 
  UserCheck, UserX, Loader2, Eye, EyeOff, AlertTriangle, Lock, Unlock, Star, Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { adminApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

// ── Types ─────────────────────────────────────────────────────────────────────

interface User {
  _id: string
  email: string
  fullName: string
  role: string
  isActive: boolean
  isSuperUser?: boolean
  isLocked?: boolean
  lockUntil?: string
  failedLoginAttempts?: number
  permissions: string[]
  useCustomPermissions: boolean
  effectivePermissions: string[]
  lastLogin?: string
  createdAt: string
  createdBy?: { fullName: string; email: string }
}

interface PermissionInfo {
  value: string
  label: string
  description: string
  category: string
}

// ── Role Colors ───────────────────────────────────────────────────────────────

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-700 border-red-200',
  PASTOR: 'bg-purple-100 text-purple-700 border-purple-200',
  ADMIN: 'bg-blue-100 text-blue-700 border-blue-200',
  MINISTRY_LEADER: 'bg-amber-100 text-amber-700 border-amber-200',
  EDITOR: 'bg-green-100 text-green-700 border-green-200',
  VIEWER: 'bg-neutral-100 text-neutral-700 border-neutral-200',
}

const roleNames: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  PASTOR: 'Pastor',
  ADMIN: 'Administrador',
  MINISTRY_LEADER: 'Líder de Ministerio',
  EDITOR: 'Editor',
  VIEWER: 'Visor',
}

// ── Main Component ────────────────────────────────────────────────────────────

const UsersManagementPage = () => {
  const { user: currentUser, isSuperAdmin, canManagePermissions } = useAuthStore()
  
  // State
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showHardDeleteModal, setShowHardDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  
  // Permissions data
  const [permissionsData, setPermissionsData] = useState<{
    permissions: PermissionInfo[]
    grouped: Record<string, PermissionInfo[]>
    categories: string[]
    roles: string[]
    defaultRolePermissions: Record<string, string[]>
  } | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'VIEWER',
    useCustomPermissions: false,
    permissions: [] as string[],
    isSuperUser: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)

  // ── Load data ───────────────────────────────────────────────────────────────
  
  useEffect(() => {
    loadUsers()
    loadPermissions()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getUsers({ limit: 100 })
      setUsers(res.data.data || [])
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al cargar usuarios')
    }
    setLoading(false)
  }

  const loadPermissions = async () => {
    try {
      const res = await adminApi.getPermissions()
      setPermissionsData(res.data.data)
    } catch (e) {
      console.error('Error loading permissions:', e)
    }
  }

  // ── Filter users ────────────────────────────────────────────────────────────
  
  const filteredUsers = users.filter(user => {
    if (search) {
      const q = search.toLowerCase()
      if (!user.fullName.toLowerCase().includes(q) && !user.email.toLowerCase().includes(q)) {
        return false
      }
    }
    if (roleFilter !== 'all' && user.role !== roleFilter) return false
    if (statusFilter === 'active' && !user.isActive) return false
    if (statusFilter === 'inactive' && user.isActive) return false
    return true
  })

  // ── Handlers ────────────────────────────────────────────────────────────────
  
  const handleCreate = async () => {
    if (!formData.email || !formData.password || !formData.fullName) {
      toast.error('Complete todos los campos requeridos')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }
    
    setSaving(true)
    try {
      await adminApi.createUser({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        role: formData.role,
        permissions: formData.useCustomPermissions ? formData.permissions : [],
        useCustomPermissions: formData.useCustomPermissions,
      })
      toast.success('Usuario creado exitosamente')
      setShowCreateModal(false)
      resetForm()
      loadUsers()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al crear usuario')
    }
    setSaving(false)
  }

  const handleUpdate = async () => {
    if (!selectedUser) return
    
    setSaving(true)
    try {
      await adminApi.updateUser(selectedUser._id, {
        fullName: formData.fullName,
        role: formData.role,
        // Solo enviar isSuperUser si el usuario actual es SUPER_ADMIN
        ...(isSuperAdmin() && { isSuperUser: formData.isSuperUser }),
      })
      toast.success('Usuario actualizado')
      setShowEditModal(false)
      loadUsers()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al actualizar')
    }
    setSaving(false)
  }

  const handleUpdatePermissions = async () => {
    if (!selectedUser) return
    
    // Advertir si se va a dejar sin ningún permiso
    if (formData.useCustomPermissions && formData.permissions.length === 0) {
      if (!window.confirm(`¿Estás seguro? ${selectedUser.fullName} quedará sin acceso a ningún módulo aunque mantenga el rol ${roleNames[selectedUser.role]}.`)) return
    }
    
    setSaving(true)
    try {
      // Si se cambió el rol (via Elevar Permisos Rápido), guardarlo primero
      if (formData.role !== selectedUser.role) {
        await adminApi.updateUser(selectedUser._id, { role: formData.role })
      }
      // Guardar permisos custom (o limpiarlos si ya no son custom)
      await adminApi.updateUserPermissions(selectedUser._id, {
        permissions: formData.permissions,
        useCustomPermissions: formData.useCustomPermissions,
      })
      toast.success('Usuario actualizado correctamente')
      setShowPermissionsModal(false)
      loadUsers()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al actualizar')
    }
    setSaving(false)
  }

  const handleResetPassword = async () => {
    if (!selectedUser || !formData.password) return
    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }
    
    setSaving(true)
    try {
      await adminApi.resetUserPassword(selectedUser._id, formData.password)
      toast.success('Contraseña actualizada')
      setShowPasswordModal(false)
      resetForm()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al cambiar contraseña')
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!selectedUser) return
    
    setSaving(true)
    try {
      await adminApi.deleteUser(selectedUser._id)
      toast.success('Usuario desactivado')
      setShowDeleteModal(false)
      loadUsers()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al desactivar')
    }
    setSaving(false)
  }

  const handleHardDelete = async () => {
    if (!selectedUser) return
    
    setSaving(true)
    try {
      await adminApi.hardDeleteUser(selectedUser._id)
      toast.success('Usuario eliminado permanentemente')
      setShowHardDeleteModal(false)
      loadUsers()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al eliminar')
    }
    setSaving(false)
  }

  const handleUnlock = async (user: User) => {
    try {
      await adminApi.unlockUser(user._id)
      toast.success('Cuenta desbloqueada')
      loadUsers()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al desbloquear')
    }
  }

  const handleToggleStatus = async (user: User) => {
    try {
      if (user.isActive) {
        await adminApi.deleteUser(user._id) // Soft delete = desactivar
        toast.success('Usuario desactivado')
      } else {
        await adminApi.activateUser(user._id)
        toast.success('Usuario activado')
      }
      loadUsers()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error')
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────
  
  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      role: 'VIEWER',
      useCustomPermissions: false,
      permissions: [],
      isSuperUser: false,
    })
    setShowPassword(false)
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setFormData({
      ...formData,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isSuperUser: user.isSuperUser ?? false,
    })
    setShowEditModal(true)
  }

  const openPermissionsModal = (user: User) => {
    setSelectedUser(user)
    setFormData(prev => ({
      ...prev,
      role: user.role,   // ← inicializar rol actual
      // Si ya tiene control total activado, cargar la lista efectiva completa
      permissions: user.useCustomPermissions ? (user.effectivePermissions || user.permissions || []) : [],
      useCustomPermissions: user.useCustomPermissions,
    }))
    setShowPermissionsModal(true)
  }

  const openPasswordModal = (user: User) => {
    setSelectedUser(user)
    resetForm()
    setShowPasswordModal(true)
  }

  const openDeleteModal = (user: User) => {
    setSelectedUser(user)
    setShowDeleteModal(true)
  }

  const openHardDeleteModal = (user: User) => {
    setSelectedUser(user)
    setShowHardDeleteModal(true)
  }

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission],
    }))
  }

  const toggleAllPermissions = () => {
    if (!permissionsData) return
    
    const allPermissions = permissionsData.permissions.map(p => p.value)
    const allSelected = allPermissions.every(p => formData.permissions.includes(p))
    
    setFormData(prev => ({
      ...prev,
      permissions: allSelected ? [] : allPermissions,
    }))
  }

  // ── Role Management ─────────────────────────────────────────────────────────
  
  /**
   * Asigna rápidamente los permisos EXTRAS de un rol (aditivos al rol base del usuario)
   * Los permisos personalizados son los que están POR ENCIMA del rol base
   */
  const assignRolePermissions = (targetRole: string) => {
    if (!permissionsData) return
    
    const targetRolePerms = permissionsData.defaultRolePermissions[targetRole] || []
    
    // Aplicar los permisos del nivel seleccionado Y cambiar el rol base
    setFormData(prev => ({
      ...prev,
      role: targetRole,
      permissions: [...targetRolePerms],
      useCustomPermissions: false,   // rol limpio: sin custom, el rol habla por sí mismo
    }))
    toast.success(`Rol cambiado a ${roleNames[targetRole]} (${targetRolePerms.length} permisos)`)
  }

  /**
   * Detecta qué rol equivaldría a los permisos efectivos actuales (rol base + extras)
   */
  const detectRole = (): string | null => {
    if (!permissionsData || !selectedUser) return null
    
    // En custom mode, los permisos seleccionados son exactamente los efectivos
    const currentPerms = formData.useCustomPermissions && formData.permissions.length > 0
      ? [...formData.permissions].sort()
      : (permissionsData.defaultRolePermissions[formData.role || selectedUser.role] || []).slice().sort()
    
    // Compara con cada rol (de mayor a menor jerarquía)
    const rolesOrder = ['SUPER_ADMIN', 'PASTOR', 'ADMIN', 'MINISTRY_LEADER', 'EDITOR', 'VIEWER']
    
    for (const role of rolesOrder) {
      const rolePermissions = (permissionsData.defaultRolePermissions[role] || []).slice().sort()
      if (
        currentPerms.length === rolePermissions.length &&
        currentPerms.every((p, i) => p === rolePermissions[i])
      ) {
        return role
      }
    }
    
    return null
  }

  const detectedRole = detectRole()

  // ── Render ──────────────────────────────────────────────────────────────────
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-neutral-900 truncate">Gestión de Usuarios</h1>
              <p className="text-xs sm:text-sm text-neutral-500 truncate">Administrar usuarios y permisos</p>
            </div>
          </div>
          <Button onClick={() => { resetForm(); setShowCreateModal(true) }} className="gap-2 w-full sm:w-auto" size="sm">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo Usuario</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-4 sm:mb-6">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
            <div className="flex-1 min-w-full sm:min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Todos los roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                {Object.entries(roleNames).map(([key, name]) => (
                  <SelectItem key={key} value={key}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-neutral-100">
            {filteredUsers.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                <p className="text-neutral-500">No se encontraron usuarios</p>
              </div>
            ) : (
              filteredUsers.map((user, idx) => (
                <motion.div
                  key={user._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`p-4 hover:bg-neutral-50 transition-colors ${!user.isActive ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                      user.isActive 
                        ? 'bg-gradient-to-br from-primary-500 to-primary-700 text-white' 
                        : 'bg-neutral-200 text-neutral-500'
                    }`}>
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-900 truncate">{user.fullName}</span>
                        {user.isSuperUser && (
                          <Badge className="text-xs bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0">
                            ⭐ Superusuario
                          </Badge>
                        )}
                        {user._id === currentUser?.id && (
                          <Badge variant="outline" className="text-xs">Tú</Badge>
                        )}
                        {!user.isActive && (
                          <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">Inactivo</Badge>
                        )}
                        {user.isLocked && (
                          <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                            <Lock className="w-3 h-3 mr-1" />
                            Bloqueado
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-neutral-500 truncate">{user.email}</p>
                    </div>
                    
                    {/* Role Badge */}
                    <Badge className={`${roleColors[user.role] || roleColors.VIEWER} border`}>
                      {roleNames[user.role] || user.role}
                    </Badge>
                    
                    {/* Permissions indicator */}
                    <div className="hidden md:flex items-center gap-1 text-xs text-neutral-500">
                      <Shield className="w-3.5 h-3.5" />
                      {user.useCustomPermissions && user.permissions?.length > 0 ? (
                        <span className="text-blue-600">+{user.permissions.length} extra</span>
                      ) : (
                        <span>{user.effectivePermissions?.length || 0} permisos</span>
                      )}
                    </div>
                    
                    {/* Last login */}
                    <div className="hidden md:block text-xs text-neutral-400 w-24">
                      {user.lastLogin 
                        ? new Date(user.lastLogin).toLocaleDateString('es-DO')
                        : 'Nunca'
                      }
                    </div>
                    
                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditModal(user)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openPermissionsModal(user)}>
                          <Shield className="w-4 h-4 mr-2" />
                          Permisos
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openPasswordModal(user)}>
                          <Key className="w-4 h-4 mr-2" />
                          Cambiar contraseña
                        </DropdownMenuItem>
                        {user.isLocked && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleUnlock(user)} className="text-orange-600">
                              <Unlock className="w-4 h-4 mr-2" />
                              Desbloquear cuenta
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                          {user.isActive ? (
                            <>
                              <UserX className="w-4 h-4 mr-2" />
                              Desactivar
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-4 h-4 mr-2" />
                              Activar
                            </>
                          )}
                        </DropdownMenuItem>
                        {user._id !== currentUser?.id && user.role !== 'SUPER_ADMIN' && (
                          <DropdownMenuItem 
                            onClick={() => openHardDeleteModal(user)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar permanentemente
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div>
              <Label>Nombre completo *</Label>
              <Input
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Juan Pérez"
              />
            </div>
            <div>
              <Label>Contraseña *</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label>Confirmar contraseña *</Label>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div>
              <Label>Rol</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleNames).map(([key, name]) => (
                    key !== 'SUPER_ADMIN' || isSuperAdmin() ? (
                      <SelectItem key={key} value={key}>{name}</SelectItem>
                    ) : null
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Crear Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Cambia el rol y nombre. Los permisos adicionales se gestionan en "Permisos".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input value={formData.email} disabled className="bg-neutral-50" />
            </div>
            <div>
              <Label>Nombre completo</Label>
              <Input
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
            {/* Selector de rol - disponible para SUPER_ADMIN y admins */}
            {selectedUser?.role !== 'SUPER_ADMIN' && (
              <div>
                <Label>Rol base</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleNames)
                      .filter(([k]) => isSuperAdmin() ? true : k !== 'SUPER_ADMIN')
                      .map(([key, name]) => (
                        <SelectItem key={key} value={key}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Aviso cuando el rol cambia y el usuario tiene permisos custom */}
                {formData.role !== selectedUser?.role && selectedUser?.useCustomPermissions && (
                  <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>Al guardar, los permisos personalizados (+{selectedUser.permissions?.length} extra) se eliminarán y el usuario recibirá los permisos estándar del rol <strong>{roleNames[formData.role]}</strong>.</span>
                  </div>
                )}
                {formData.role !== selectedUser?.role && !selectedUser?.useCustomPermissions && (
                  <p className="text-xs text-neutral-500 mt-1">
                    Al guardar, se aplicarán los permisos estándar del rol <strong>{roleNames[formData.role]}</strong>.
                  </p>
                )}
                {formData.role === selectedUser?.role && (
                  <p className="text-xs text-neutral-500 mt-1">
                    El rol no ha cambiado.
                  </p>
                )}
              </div>
            )}

            {/* Toggle SuperUsuario - SOLO visible para SUPER_ADMIN */}
            {isSuperAdmin() && selectedUser?.role !== 'SUPER_ADMIN' && selectedUser?._id !== currentUser?.id && (
              <div className="border-2 border-amber-200 rounded-lg p-3 bg-amber-50">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-amber-800 font-semibold flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                      Superusuario
                    </Label>
                    <p className="text-xs text-amber-600 mt-0.5">
                      Acceso completo a todos los módulos, sin restricciones
                    </p>
                  </div>
                  <Checkbox
                    checked={formData.isSuperUser}
                    onCheckedChange={(checked: boolean | 'indeterminate') =>
                      setFormData({ ...formData, isSuperUser: !!checked })
                    }
                    className="w-5 h-5 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                  />
                </div>
                {formData.isSuperUser && (
                  <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-700 bg-amber-100 p-2 rounded">
                    <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>Este usuario tendrá acceso total al sistema. Solo asigna esto a personas de máxima confianza.</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancelar</Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Modal */}
      <Dialog open={showPermissionsModal} onOpenChange={setShowPermissionsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Permisos de {selectedUser?.fullName}
            </DialogTitle>
            <DialogDescription>
              Controla exactamente qué módulos puede ver y usar este usuario. Al activar el control total, los permisos del <strong>rol base</strong> se precargan y puedes quitar los que no necesite.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Info del rol base */}
            <div className="flex items-center gap-3 p-3 bg-neutral-50 border rounded-lg">
              <div className="flex-1">
                <span className="text-sm font-medium text-neutral-700">Rol base: </span>
                <Badge className={`${roleColors[formData.role || selectedUser?.role || 'VIEWER']} border ml-1`}>
                  {roleNames[formData.role || selectedUser?.role || 'VIEWER']}
                </Badge>
                {formData.role !== selectedUser?.role && (
                  <span className="text-xs text-amber-600 ml-2 font-medium">⚠️ Cambiado (aún no guardado)</span>
                )}
                <span className="text-xs text-neutral-500 ml-2">
                  ({permissionsData?.defaultRolePermissions[formData.role || selectedUser?.role || 'VIEWER']?.length || 0} permisos incluidos automáticamente)
                </span>
              </div>
            </div>

            {/* Toggle custom */}
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Checkbox
                id="useCustom"
                checked={formData.useCustomPermissions}
                onCheckedChange={(checked: boolean | 'indeterminate') => {
                  const enable = !!checked
                  if (enable) {
                    // Pre-poblar con permisos del rol base para que el superusuario
                    // solo quite los que no necesita
                    const basePerms = permissionsData?.defaultRolePermissions[selectedUser?.role || 'VIEWER'] || []
                    setFormData(prev => ({ ...prev, useCustomPermissions: true, permissions: [...basePerms] }))
                  } else {
                    setFormData(prev => ({ ...prev, useCustomPermissions: false, permissions: [] }))
                  }
                }}
              />
              <div>
                <label htmlFor="useCustom" className="text-sm font-semibold cursor-pointer text-blue-800">
                  Control total de permisos
                </label>
                <p className="text-xs text-blue-600">
                  Define exactamente qué puede ver y hacer este usuario. Puedes quitar permisos del rol base.
                </p>
              </div>
            </div>
            
            {formData.useCustomPermissions && permissionsData && (
              <div className="space-y-4">
                {/* Selector Rápido de Rol + Rol Efectivo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Elevar Rol Rápido */}
                  <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg">
                    <Label className="text-xs font-bold text-purple-700 mb-2 block">
                      ⚡ Elevar Permisos Rápido
                    </Label>
                    <Select onValueChange={assignRolePermissions}>
                      <SelectTrigger className="bg-white border-purple-300">
                        <SelectValue placeholder="Seleccionar nivel..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(roleNames)
                          .filter(([k]) => isSuperAdmin() || k !== 'SUPER_ADMIN')
                          .map(([key, name]) => (
                            <SelectItem key={key} value={key}>
                              {name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-purple-600 mt-1.5">
                      Aplica exactamente los permisos del nivel seleccionado
                    </p>
                  </div>

                  {/* Nivel efectivo */}
                  <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg">
                    <Label className="text-xs font-bold text-green-700 mb-2 block">
                      ✅ Nivel Efectivo
                    </Label>
                    <div className="flex items-center gap-2 min-h-[40px]">
                      {detectedRole ? (
                        <Badge className={`${roleColors[detectedRole]} text-sm py-1.5 px-3 border-2 font-semibold`}>
                          {roleNames[detectedRole]}
                        </Badge>
                      ) : (
                        <span className="text-sm text-green-700 font-medium">
                          Personalizado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-green-600 mt-1.5">
                      Nivel equivalente a los permisos seleccionados
                    </p>
                  </div>
                </div>

                {/* Contador + acciones rápidas */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-neutral-50 border rounded-lg">
                  <span className="text-sm text-neutral-600">
                    <strong className={formData.permissions.length === 0 ? 'text-red-600' : ''}>
                      {formData.permissions.length}
                    </strong>
                    {' '}/ {permissionsData.permissions.length} permisos seleccionados
                    {formData.permissions.length === 0 && (
                      <span className="ml-2 text-red-600 font-semibold text-xs">⚠ Sin acceso a ningún módulo</span>
                    )}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-amber-600 border-amber-200 hover:bg-amber-50"
                      onClick={() => {
                        const basePerms = permissionsData.defaultRolePermissions[selectedUser?.role || 'VIEWER'] || []
                        setFormData(prev => ({ ...prev, permissions: [...basePerms] }))
                        toast.info('Permisos restaurados al rol base')
                      }}
                    >
                      Restaurar rol base
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, permissions: [] }))
                        toast.warning('Todos los permisos quitados')
                      }}
                    >
                      Quitar todos
                    </Button>
                  </div>
                </div>
                
                {/* Permisos por categoría */}
                {permissionsData.categories.map(category => {
                  const baseRolePerms = permissionsData.defaultRolePermissions[selectedUser?.role || 'VIEWER'] || []
                  const categoryPerms = permissionsData.grouped[category] || []
                  if (categoryPerms.length === 0) return null

                  const selectedInCategory = categoryPerms.filter(p => formData.permissions.includes(p.value))

                  return (
                    <div key={category} className="border rounded-lg overflow-hidden">
                      <div className="px-3 py-2 bg-neutral-50 border-b flex items-center justify-between">
                        <h4 className="font-semibold text-sm text-neutral-700">{category}</h4>
                        <span className="text-xs text-neutral-400">{selectedInCategory.length}/{categoryPerms.length} seleccionados</span>
                      </div>
                      <div className="p-3 grid grid-cols-2 gap-2">
                        {categoryPerms.map(perm => {
                          const isFromBaseRole = baseRolePerms.includes(perm.value)
                          const isSelected = formData.permissions.includes(perm.value)
                          const isRemoved = isFromBaseRole && !isSelected
                          return (
                            <label 
                              key={perm.value}
                              className={`flex items-start gap-2 text-sm p-2 rounded cursor-pointer transition-colors
                                ${isRemoved
                                  ? 'bg-red-50 hover:bg-red-100 border border-red-100'
                                  : isSelected
                                    ? isFromBaseRole
                                      ? 'bg-neutral-50 hover:bg-neutral-100'
                                      : 'bg-blue-50 hover:bg-blue-100'
                                    : 'hover:bg-neutral-50'
                                }`}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => togglePermission(perm.value)}
                              />
                              <div>
                                <span className="font-medium">{perm.label}</span>
                                {isFromBaseRole && isSelected && (
                                  <span className="text-xs text-neutral-400 ml-1">(del rol)</span>
                                )}
                                {isRemoved && (
                                  <span className="text-xs text-red-500 ml-1 font-semibold">⊘ quitado</span>
                                )}
                                {!isFromBaseRole && isSelected && (
                                  <span className="text-xs text-blue-600 ml-1">(extra)</span>
                                )}
                                <p className="text-xs text-neutral-500">{perm.description}</p>
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            
            {!formData.useCustomPermissions && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                <p className="font-semibold mb-1">Permisos del rol base</p>
                <p>El usuario tendrá los <strong>{permissionsData?.defaultRolePermissions[selectedUser?.role || 'VIEWER']?.length || 0} permisos</strong> del rol <strong>{roleNames[selectedUser?.role || 'VIEWER']}</strong>.</p>
                <p className="mt-1 text-blue-600">
                  Activa "Control total" para personalizar exactamente qué puede ver y hacer este usuario (incluso quitar secciones del rol base).
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermissionsModal(false)}>Cancelar</Button>
            <Button onClick={handleUpdatePermissions} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Guardar Permisos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Cambiar Contraseña
            </DialogTitle>
            <DialogDescription>
              Cambiando contraseña de: {selectedUser?.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nueva contraseña</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label>Confirmar contraseña</Label>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="••••••••"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordModal(false)}>Cancelar</Button>
            <Button onClick={handleResetPassword} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Cambiar Contraseña
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal (Soft Delete / Deactivate) */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <UserX className="w-5 h-5" />
              Desactivar Usuario
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-neutral-600">
              ¿Está seguro que desea desactivar al usuario <strong>{selectedUser?.fullName}</strong>?
            </p>
            <p className="text-sm text-neutral-500 mt-2">
              La cuenta será desactivada pero no eliminada. Puede reactivarla posteriormente.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
            <Button 
              variant="default"
              className="bg-amber-600 hover:bg-amber-700"
              onClick={handleDelete} 
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Desactivar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hard Delete Confirmation Modal */}
      <Dialog open={showHardDeleteModal} onOpenChange={setShowHardDeleteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Eliminar Permanentemente
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-medium text-sm">
                ⚠️ Esta acción es irreversible
              </p>
            </div>
            <p className="text-neutral-600">
              ¿Está seguro que desea eliminar permanentemente al usuario <strong>{selectedUser?.fullName}</strong>?
            </p>
            <p className="text-sm text-neutral-500">
              Se eliminará toda la información del usuario y no podrá ser recuperada. Si solo desea inhabilitar el acceso, use la opción "Desactivar".
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHardDeleteModal(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleHardDelete} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Eliminar Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default UsersManagementPage
