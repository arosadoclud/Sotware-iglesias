import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  Users, Plus, Search, Shield, Edit2, Trash2, Key, MoreVertical, 
  UserCheck, UserX, Loader2, Eye, EyeOff, AlertTriangle, Lock, Unlock
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
    
    setSaving(true)
    try {
      await adminApi.updateUserPermissions(selectedUser._id, {
        permissions: formData.permissions,
        useCustomPermissions: formData.useCustomPermissions,
      })
      toast.success('Permisos actualizados')
      setShowPermissionsModal(false)
      loadUsers()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al actualizar permisos')
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
    })
    setShowEditModal(true)
  }

  const openPermissionsModal = (user: User) => {
    setSelectedUser(user)
    setFormData({
      ...formData,
      permissions: user.permissions || [],
      useCustomPermissions: user.useCustomPermissions,
    })
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
                      {user.useCustomPermissions ? (
                        <span className="text-amber-600">Personalizados</span>
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
            {isSuperAdmin() && selectedUser?.role !== 'SUPER_ADMIN' && (
              <div>
                <Label>Rol</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleNames).filter(([k]) => k !== 'SUPER_ADMIN').map(([key, name]) => (
                      <SelectItem key={key} value={key}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              Configure los permisos del usuario. Si desmarca "Usar permisos personalizados", 
              se aplicarán los permisos por defecto del rol.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Toggle custom */}
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
              <Checkbox
                id="useCustom"
                checked={formData.useCustomPermissions}
                onCheckedChange={(checked: boolean | 'indeterminate') => setFormData({ ...formData, useCustomPermissions: !!checked })}
              />
              <label htmlFor="useCustom" className="text-sm font-medium cursor-pointer">
                Usar permisos personalizados
              </label>
            </div>
            
            {formData.useCustomPermissions && permissionsData && (
              <div className="space-y-4">
                {/* Seleccionar todos */}
                <div className="flex items-center gap-3 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
                  <Checkbox
                    id="selectAll"
                    checked={permissionsData.permissions.every(p => formData.permissions.includes(p.value))}
                    onCheckedChange={toggleAllPermissions}
                  />
                  <label htmlFor="selectAll" className="text-sm font-bold cursor-pointer text-blue-700">
                    Seleccionar Todos los Permisos ({permissionsData.permissions.length})
                  </label>
                </div>
                
                {permissionsData.categories.map(category => (
                  <div key={category} className="border rounded-lg p-3">
                    <h4 className="font-semibold text-sm mb-2 text-neutral-700">{category}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {permissionsData.grouped[category]?.map(perm => (
                        <label 
                          key={perm.value}
                          className="flex items-start gap-2 text-sm p-2 rounded hover:bg-neutral-50 cursor-pointer"
                        >
                          <Checkbox
                            checked={formData.permissions.includes(perm.value)}
                            onCheckedChange={() => togglePermission(perm.value)}
                          />
                          <div>
                            <span className="font-medium">{perm.label}</span>
                            <p className="text-xs text-neutral-500">{perm.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {!formData.useCustomPermissions && (
              <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
                <p>Se aplicarán los permisos por defecto del rol <strong>{roleNames[selectedUser?.role || 'VIEWER']}</strong>.</p>
                <p className="mt-1 text-blue-600">
                  ({permissionsData?.defaultRolePermissions[selectedUser?.role || 'VIEWER']?.length || 0} permisos)
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
