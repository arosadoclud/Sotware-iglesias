import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Loader2, MoreHorizontal, Users, Settings, UserPlus, Search } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { personsApi, rolesApi, ministriesApi, personStatusesApi } from '../../lib/api'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { DataTable } from '../../components/ui/data-table'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { Card, CardContent } from '../../components/ui/card'
import { EmptyState } from '../../components/ui/empty-state'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'

// Mapeo de colores para badges
const COLOR_VARIANTS: Record<string, 'success' | 'secondary' | 'default' | 'warning' | 'destructive'> = {
  green: 'success',
  gray: 'secondary',
  blue: 'default',
  red: 'destructive',
  yellow: 'warning',
  purple: 'warning',
  pink: 'warning',
  orange: 'warning',
  teal: 'success',
  indigo: 'default',
}

interface PersonStatus {
  _id: string
  name: string
  code: string
  color: string
  isDefault: boolean
}

interface Ministry {
  _id: string
  name: string
  description?: string
  color?: string
}

interface Person {
  _id: string
  fullName: string
  phone?: string
  email?: string
  ministry?: string
  status: string
  priority: number
  roles: Array<{ roleId: string; roleName: string }>
}

const PersonsPage = () => {
  const [persons, setPersons] = useState<Person[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [statuses, setStatuses] = useState<PersonStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showMinistryModal, setShowMinistryModal] = useState(false)
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    ministry: '',
    status: 'ACTIVE',
    priority: 5,
    roleIds: [] as string[],
  })
  const [newStatusForm, setNewStatusForm] = useState({
    name: '',
    color: 'gray' as string,
  })
  const [newMinistryForm, setNewMinistryForm] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
  })

  // Helper para obtener el nombre y variante de un status
  const getStatusConfig = (statusCode: string) => {
    const found = statuses.find((s) => s.code === statusCode)
    if (found) {
      return { label: found.name, variant: COLOR_VARIANTS[found.color] || 'secondary' }
    }
    return { label: statusCode, variant: 'secondary' as const }
  }

  const columns: ColumnDef<Person>[] = [
    {
      accessorKey: 'fullName',
      header: 'Nombre',
      cell: ({ row }) => {
        const person = row.original
        return (
          <div className="flex items-center gap-3 py-1">
            <Avatar className="h-10 w-10 ring-2 ring-white shadow-md">
              <AvatarFallback className="bg-gradient-to-br from-primary-400 to-primary-600 text-white font-semibold">
                {person.fullName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="font-medium text-neutral-900 hover:text-primary-600 transition-colors cursor-pointer">
                {person.fullName}
              </span>
              {person.email && (
                <p className="text-xs text-neutral-500 font-normal">{person.email}</p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'phone',
      header: 'Teléfono',
      cell: ({ row }) => (
        <span className="text-neutral-600 font-medium">
          {row.original.phone || <span className="text-neutral-300">—</span>}
        </span>
      ),
    },
    {
      accessorKey: 'ministry',
      header: 'Ministerio',
      cell: ({ row }) => {
        const ministry = row.original.ministry
        return ministry ? (
          <Badge variant="outline" className="font-medium bg-neutral-50 hover:bg-neutral-100 transition-colors">
            {ministry}
          </Badge>
        ) : (
          <span className="text-neutral-300">—</span>
        )
      },
    },
    {
      accessorKey: 'roles',
      header: 'Roles',
      cell: ({ row }) => {
        const personRoles = row.original.roles
        if (!personRoles.length) return <span className="text-neutral-300">—</span>
        return (
          <div className="flex flex-wrap gap-1.5">
            {personRoles.slice(0, 2).map((role, i) => (
              <Badge 
                key={i} 
                variant="secondary" 
                className="text-xs bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors"
              >
                {role.roleName}
              </Badge>
            ))}
            {personRoles.length > 2 && (
              <Badge variant="outline" className="text-xs font-medium">
                +{personRoles.length - 2} más
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const status = row.original.status
        const config = getStatusConfig(status)
        return (
          <Badge variant={config?.variant === 'destructive' ? 'danger' : config?.variant} className="font-medium shadow-sm">
            {config?.label || status}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const person = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-neutral-100 transition-colors">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => openEdit(person)} className="cursor-pointer">
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(person._id, person.fullName)}
                className="text-danger-600 cursor-pointer focus:text-danger-600 focus:bg-danger-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const load = async (pageArg = page, pageSizeArg = pageSize) => {
    setLoading(true)
    try {
      const [pRes, rRes, mRes, sRes] = await Promise.all([
        personsApi.getAll({ page: pageArg, limit: pageSizeArg }),
        rolesApi.getAll(),
        ministriesApi.getAll(),
        personStatusesApi.getAll(),
      ])
      setPersons(pRes.data.data)
      setTotal(pRes.data.total || 0)
      setRoles(rRes.data.data)
      setMinistries(mRes.data.data)
      setStatuses(sRes.data.data)
      
      // Si no hay ministerios, inicializar los predeterminados
      if (!mRes.data.data || mRes.data.data.length === 0) {
        try {
          const seedMinRes = await ministriesApi.seed()
          setMinistries(seedMinRes.data.data)
        } catch {
          console.warn('No se pudieron crear ministerios predeterminados')
        }
      }
      
      // Si no hay estados, inicializar los predeterminados
      if (!sRes.data.data || sRes.data.data.length === 0) {
        try {
          const seedRes = await personStatusesApi.seed()
          setStatuses(seedRes.data.data)
        } catch {
          console.warn('No se pudieron crear estados predeterminados')
        }
      }
    } catch {
      toast.error('Error cargando datos')
    }
    setLoading(false)
  }

  useEffect(() => {
    load(page, pageSize)
  }, [page, pageSize])

  const openNew = () => {
    setEditingPerson(null)
    setForm({
      fullName: '',
      phone: '',
      email: '',
      ministry: '',
      status: 'ACTIVE',
      priority: 5,
      roleIds: [],
    })
    setShowModal(true)
  }

  const openEdit = (p: Person) => {
    setEditingPerson(p)
    setForm({
      fullName: p.fullName,
      phone: p.phone || '',
      email: p.email || '',
      ministry: p.ministry || '',
      status: p.status,
      priority: p.priority,
      roleIds: p.roles.map((r) => r.roleId),
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.fullName.trim()) return toast.error('El nombre es requerido')
    if (!form.ministry.trim()) return toast.error('El ministerio es obligatorio')
    if (!form.roleIds.length) return toast.error('Debe seleccionar al menos un rol')

    setSaving(true)
    try {
      const validRoles = form.roleIds
        .map((rid) => {
          const r = roles.find((rl: any) => rl._id === rid)
          return r && r._id && r.name ? { roleId: r._id, roleName: r.name } : null
        })
        .filter(Boolean)
      const body = { ...form, roles: validRoles }

      if (editingPerson) {
        await personsApi.update(editingPerson._id, body)
        toast.success('Persona actualizada correctamente')
      } else {
        await personsApi.create(body)
        toast.success('Persona creada correctamente')
      }
      setShowModal(false)
      load(page, pageSize)
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al guardar')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar a ${name}?`)) return
    try {
      await personsApi.delete(id)
      toast.success('Persona eliminada')
      load(page, pageSize)
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const toggleRole = (roleId: string) =>
    setForm((f) => ({
      ...f,
      roleIds: f.roleIds.includes(roleId)
        ? f.roleIds.filter((r) => r !== roleId)
        : [...f.roleIds, roleId],
    }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header mejorado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl rotate-3 opacity-20" />
            <div className="relative p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg shadow-primary-500/25">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Personas</h1>
            <p className="text-neutral-600">
              Gestiona los participantes y sus roles
              {total > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-primary-100 text-primary-700">
                  {total} registrados
                </span>
              )}
            </p>
          </div>
        </div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button onClick={openNew} size="lg" className="shadow-lg hover:shadow-xl transition-shadow">
            <UserPlus className="w-5 h-5 mr-2" />
            Nueva Persona
          </Button>
        </motion.div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary-200/50 rounded-full animate-ping" />
            <div className="relative p-4 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          </div>
          <p className="text-neutral-500 animate-pulse">Cargando personas...</p>
        </div>
      ) : persons.length === 0 && page === 1 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-dashed border-2 border-neutral-200 bg-neutral-50/50">
            <CardContent className="p-0">
              <EmptyState
                icon={Users}
                title="No hay personas registradas"
                description="Agrega participantes para empezar a gestionar roles y programas de oportunidades."
                action={{
                  label: 'Nueva Persona',
                  onClick: openNew,
                  icon: Plus,
                }}
              />
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", bounce: 0.2 }}
        >
          <Card className="shadow-lg border-neutral-200/50 overflow-hidden">
            <CardContent className="p-0">
              <DataTable
                columns={columns}
                data={persons}
                searchKey="fullName"
                searchPlaceholder="Buscar por nombre..."
                pageSize={pageSize}
                serverPagination
                page={page}
                total={total}
                onPageChange={(newPage) => { if (newPage !== page) setPage(newPage) }}
                onPageSizeChange={(newSize) => { if (newSize !== pageSize) { setPageSize(newSize); setPage(1) } }}
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPerson ? 'Editar' : 'Nueva'} Persona
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre Completo *</Label>
              <Input
                id="fullName"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="María González"
              />
            </div>

            {/* Teléfono y Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </div>

            {/* Ministerio y Estado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Ministerio *</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMinistryModal(true)}
                    className="h-6 px-2 text-xs text-primary-600 hover:text-primary-700"
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    Nuevo Ministerio
                  </Button>
                </div>
                <Select
                  value={form.ministry}
                  onValueChange={(value) => setForm({ ...form, ministry: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar ministerio" />
                  </SelectTrigger>
                  <SelectContent>
                    {ministries.map((m) => (
                      <SelectItem key={m._id} value={m.name}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Estado</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowStatusModal(true)}
                    className="h-6 px-2 text-xs text-primary-600 hover:text-primary-700"
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    Nuevo Estado
                  </Button>
                </div>
                <Select
                  value={form.status}
                  onValueChange={(value) => setForm({ ...form, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s._id} value={s.code}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Prioridad */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Prioridad</Label>
                <span className="text-sm font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">
                  {form.priority}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: Number(e.target.value) })
                }
                className="w-full accent-primary-600"
              />
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Baja</span>
                <span>Alta</span>
              </div>
            </div>

            {/* Roles */}
            <div className="space-y-2">
              <Label>Roles Habilitados *</Label>
              <div className="flex flex-wrap gap-2 p-3 border border-neutral-200 rounded-lg bg-neutral-50/50">
                {roles.map((r) => (
                  <Button
                    key={r._id}
                    type="button"
                    variant={form.roleIds.includes(r._id) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleRole(r._id)}
                    className="transition-all"
                  >
                    {r.name}
                  </Button>
                ))}
                {roles.length === 0 && (
                  <p className="text-sm text-neutral-400 py-2">
                    No hay roles disponibles. Crea roles en Configuración.
                  </p>
                )}
              </div>
              <p className="text-xs text-neutral-500">
                Selecciona al menos un rol
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingPerson ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para crear nuevo estado */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Estado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="statusName">Nombre del Estado *</Label>
              <Input
                id="statusName"
                value={newStatusForm.name}
                onChange={(e) => setNewStatusForm({ ...newStatusForm, name: e.target.value })}
                placeholder="Ej: Líder de Música"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {['gray', 'green', 'blue', 'red', 'yellow', 'purple', 'pink', 'orange', 'teal', 'indigo'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewStatusForm({ ...newStatusForm, color })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      newStatusForm.color === color
                        ? 'ring-2 ring-offset-2 ring-primary-500'
                        : 'border-neutral-200'
                    }`}
                    style={{ backgroundColor: color === 'gray' ? '#9ca3af' : color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (!newStatusForm.name.trim()) {
                  return toast.error('El nombre es requerido')
                }
                setSaving(true)
                try {
                  // Auto-generate code from name
                  const code = newStatusForm.name
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '') // Remove accents
                    .toUpperCase()
                    .replace(/\s+/g, '_')
                    .replace(/[^A-Z0-9_]/g, '')
                  await personStatusesApi.create(newStatusForm)
                  toast.success('Estado creado correctamente')
                  setShowStatusModal(false)
                  setNewStatusForm({ name: '', color: 'gray' })
                  // Recargar los estados
                  const sRes = await personStatusesApi.getAll()
                  setStatuses(sRes.data.data)
                } catch (e: any) {
                  toast.error(e.response?.data?.message || 'Error al crear estado')
                }
                setSaving(false)
              }}
              disabled={saving}
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear Estado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para crear nuevo ministerio */}
      <Dialog open={showMinistryModal} onOpenChange={setShowMinistryModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Ministerio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ministryName">Nombre del Ministerio *</Label>
              <Input
                id="ministryName"
                value={newMinistryForm.name}
                onChange={(e) => setNewMinistryForm({ ...newMinistryForm, name: e.target.value })}
                placeholder="Ej: Jóvenes, Adoración, Damas..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ministryDescription">Descripción</Label>
              <Input
                id="ministryDescription"
                value={newMinistryForm.description}
                onChange={(e) => setNewMinistryForm({ ...newMinistryForm, description: e.target.value })}
                placeholder="Descripción opcional del ministerio"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newMinistryForm.color}
                  onChange={(e) => setNewMinistryForm({ ...newMinistryForm, color: e.target.value })}
                  className="w-10 h-10 rounded border border-neutral-200 cursor-pointer"
                />
                <span className="text-sm text-neutral-500">{newMinistryForm.color}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMinistryModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                if (!newMinistryForm.name.trim()) {
                  return toast.error('El nombre es requerido')
                }
                setSaving(true)
                try {
                  await ministriesApi.create(newMinistryForm)
                  toast.success('Ministerio creado correctamente')
                  setShowMinistryModal(false)
                  setNewMinistryForm({ name: '', description: '', color: '#3b82f6' })
                  // Recargar los ministerios
                  const mRes = await ministriesApi.getAll()
                  setMinistries(mRes.data.data)
                } catch (e: any) {
                  toast.error(e.response?.data?.message || 'Error al crear ministerio')
                }
                setSaving(false)
              }}
              disabled={saving}
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear Ministerio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

export default PersonsPage
