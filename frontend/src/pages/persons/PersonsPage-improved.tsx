import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Loader2, MoreHorizontal } from 'lucide-react'
import { ColumnDef } from '@tanstack/react-table'
import { personsApi, rolesApi, ministriesApi } from '../../lib/api'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'

import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { DataTable } from '../../components/ui/data-table'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
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

const STATUS_MAP: Record<string, { label: string; variant: 'success' | 'secondary' | 'default' | 'warning' }> = {
  ACTIVE: { label: 'Activo', variant: 'success' },
  INACTIVE: { label: 'Inactivo', variant: 'secondary' },
  NEW: { label: 'Nuevo', variant: 'default' },
  LEADER: { label: 'Líder', variant: 'warning' },
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

const PersonsPageImproved = () => {
  const [persons, setPersons] = useState<Person[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [ministries, setMinistries] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    ministry: '',
    status: 'ACTIVE',
    priority: 5,
    roleIds: [] as string[],
  })

  const columns: ColumnDef<Person>[] = [
    {
      accessorKey: 'fullName',
      header: 'Nombre',
      cell: ({ row }) => {
        const person = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary-100 text-primary-700">
                {person.fullName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-neutral-900">{person.fullName}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'phone',
      header: 'Teléfono',
      cell: ({ row }) => (
        <span className="text-neutral-600">{row.original.phone || '—'}</span>
      ),
    },
    {
      accessorKey: 'ministry',
      header: 'Ministerio',
      cell: ({ row }) => (
        <span className="text-neutral-600">{row.original.ministry || '—'}</span>
      ),
    },
    {
      accessorKey: 'roles',
      header: 'Roles',
      cell: ({ row }) => {
        const roles = row.original.roles
        return (
          <div className="flex flex-wrap gap-1">
            {roles.slice(0, 2).map((role, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {role.roleName}
              </Badge>
            ))}
            {roles.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{roles.length - 2}
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
        const config = STATUS_MAP[status]
        return (
          <Badge variant={config?.variant}>
            {config?.label || status}
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const person = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEdit(person)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleDelete(person._id, person.fullName)}
                className="text-danger-600"
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

  const load = async () => {
    setLoading(true)
    try {
      const [pRes, rRes, mRes] = await Promise.all([
        personsApi.getAll({}),
        rolesApi.getAll(),
        ministriesApi.getAll(),
      ])
      setPersons(pRes.data.data)
      setRoles(rRes.data.data)
      setMinistries(mRes.data.data.map((m: any) => m.name))
    } catch {
      toast.error('Error cargando datos')
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

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
      load()
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
      load()
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
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Personas</h1>
          <p className="text-neutral-600 mt-1">
            Gestiona los participantes y sus roles ({persons.length})
          </p>
        </div>
        <Button onClick={openNew} size="lg">
          <Plus className="w-5 h-5 mr-2" />
          Nueva Persona
        </Button>
      </div>

      {/* DataTable */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={persons}
          searchKey="fullName"
          searchPlaceholder="Buscar por nombre..."
          pageSize={10}
        />
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            {/* Ministerio y Estado */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ministerio *</Label>
                <Select
                  value={form.ministry}
                  onValueChange={(value) => setForm({ ...form, ministry: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar ministerio" />
                  </SelectTrigger>
                  <SelectContent>
                    {ministries.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => setForm({ ...form, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_MAP).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Prioridad */}
            <div className="space-y-2">
              <Label>Prioridad: {form.priority}</Label>
              <input
                type="range"
                min="1"
                max="10"
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: Number(e.target.value) })
                }
                className="w-full"
              />
            </div>

            {/* Roles */}
            <div className="space-y-2">
              <Label>Roles Habilitados *</Label>
              <div className="flex flex-wrap gap-2 p-3 border border-neutral-200 rounded-lg">
                {roles.map((r) => (
                  <Button
                    key={r._id}
                    type="button"
                    variant={form.roleIds.includes(r._id) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleRole(r._id)}
                  >
                    {r.name}
                  </Button>
                ))}
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
    </motion.div>
  )
}

export default PersonsPageImproved
