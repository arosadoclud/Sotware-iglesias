import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Loader2, Calendar, Clock, Users, X } from 'lucide-react'
import { activitiesApi, rolesApi } from '../../lib/api'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { EmptyState } from '../../components/ui/empty-state'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const DAY_COLORS: Record<number, { bg: string; border: string; badge: string }> = {
  0: { bg: 'bg-red-50/50', border: 'border-red-200', badge: 'bg-red-100 text-red-700' },
  1: { bg: 'bg-neutral-50/50', border: 'border-neutral-200', badge: 'bg-neutral-100 text-neutral-700' },
  2: { bg: 'bg-blue-50/50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
  3: { bg: 'bg-green-50/50', border: 'border-green-200', badge: 'bg-green-100 text-green-700' },
  4: { bg: 'bg-yellow-50/50', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-700' },
  5: { bg: 'bg-pink-50/50', border: 'border-pink-200', badge: 'bg-pink-100 text-pink-700' },
  6: { bg: 'bg-purple-50/50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700' },
}

const ActivityTypesPage = () => {
  const [activities, setActivities] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    daysOfWeek: [] as number[],
    defaultTime: '10:00',
    schedule: [] as { day: number; time: string }[],
    roleConfig: [] as any[],
  })

  const load = async () => {
    setLoading(true)
    try {
      const [aRes, rRes] = await Promise.all([activitiesApi.getAll(), rolesApi.getAll()])
      setActivities(aRes.data.data)
      setRoles(rRes.data.data)
    } catch {
      toast.error('Error cargando datos')
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const openNew = () => {
    setEditing(null)
    setForm({ name: '', description: '', daysOfWeek: [], defaultTime: '10:00', schedule: [], roleConfig: [] })
    setShowModal(true)
  }

  const openEdit = (a: any) => {
    setEditing(a)
    // Compatibilidad: si viene dayOfWeek (legacy) convertir a daysOfWeek
    const days = a.daysOfWeek && a.daysOfWeek.length > 0
      ? [...a.daysOfWeek]
      : (a.dayOfWeek !== undefined ? [a.dayOfWeek] : [])
    setForm({
      name: a.name,
      description: a.description || '',
      daysOfWeek: days,
      defaultTime: a.defaultTime,
      schedule: a.schedule || [],
      roleConfig: a.roleConfig.map((rc: any) => ({ ...rc })),
    })
    setShowModal(true)
  }

  const addRoleConfig = () => {
    if (roles.length === 0) return toast.error('Primero crea roles en Configuración')
    setForm((f) => ({
      ...f,
      roleConfig: [
        ...f.roleConfig,
        {
          sectionName: '',
          sectionOrder: f.roleConfig.length + 1,
          role: { id: roles[0]._id, name: roles[0].name },
          peopleNeeded: 1,
          isRequired: true,
        },
      ],
    }))
  }

  const removeRoleConfig = (idx: number) =>
    setForm((f) => ({
      ...f,
      roleConfig: f.roleConfig
        .filter((_, i) => i !== idx)
        .map((rc, i) => ({ ...rc, sectionOrder: i + 1 })),
    }))

  const updateRoleConfig = (idx: number, field: string, value: any) => {
    setForm((f) => {
      const updated = [...f.roleConfig]
      if (field === 'roleId') {
        const r = roles.find((rl: any) => rl._id === value)
        updated[idx] = { ...updated[idx], role: { id: value, name: r?.name || '' } }
      } else {
        updated[idx] = { ...updated[idx], [field]: value }
      }
      return { ...f, roleConfig: updated }
    })
  }

  const toggleDay = (day: number) => {
    setForm((f) => {
      const has = f.daysOfWeek.includes(day)
      const newDays = has ? f.daysOfWeek.filter((d) => d !== day) : [...f.daysOfWeek, day].sort((a, b) => a - b)
      // Actualizar schedule: agregar entrada para días nuevos, quitar las de días eliminados
      const newSchedule = newDays.map((d) => {
        const existing = f.schedule.find((s) => s.day === d)
        return existing || { day: d, time: f.defaultTime }
      })
      return { ...f, daysOfWeek: newDays, schedule: newSchedule }
    })
  }

  const updateScheduleTime = (day: number, time: string) => {
    setForm((f) => ({
      ...f,
      schedule: f.schedule.map((s) => s.day === day ? { ...s, time } : s),
    }))
  }

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('El nombre es requerido')
    if (form.daysOfWeek.length === 0) return toast.error('Selecciona al menos un día')
    if (form.roleConfig.length === 0) return toast.error('Agrega al menos una sección')
    if (form.roleConfig.some((rc) => !rc.sectionName.trim()))
      return toast.error('Cada sección necesita un nombre')

    setSaving(true)
    try {
      if (editing) {
        await activitiesApi.update(editing._id, form)
        toast.success('Actividad actualizada')
      } else {
        await activitiesApi.create(form)
        toast.success('Actividad creada')
      }
      setShowModal(false)
      load()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al guardar')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"?`)) return
    try {
      await activitiesApi.delete(id)
      toast.success('Actividad eliminada')
      load()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Tipos de Actividades</h1>
          <p className="text-neutral-600 mt-1">
            Configura los servicios semanales y sus roles de oportunidades
            {activities.length > 0 && (
              <span className="ml-1 text-neutral-500">({activities.length})</span>
            )}
          </p>
        </div>
        <Button onClick={openNew} size="lg">
          <Plus className="w-5 h-5 mr-2" />
          Nueva Actividad
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : activities.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={Calendar}
              title="No hay actividades configuradas"
              description="Crea tipos de actividades como cultos, estudios bíblicos o reuniones para organizar los programas semanales."
              action={{
                label: 'Crear primera actividad',
                onClick: openNew,
                icon: Plus,
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {activities.map((a, index) => {
              const days: number[] = a.daysOfWeek?.length > 0 ? a.daysOfWeek : (a.dayOfWeek !== undefined ? [a.dayOfWeek] : [])
              const primaryColor = DAY_COLORS[days[0]] || DAY_COLORS[1]
              const totalPeople = a.roleConfig.reduce((sum: number, rc: any) => sum + (rc.peopleNeeded || 1), 0)

              return (
                <motion.div
                  key={a._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`border-2 ${primaryColor.border} ${primaryColor.bg} hover:shadow-md transition-shadow`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-lg">{a.name}</CardTitle>
                          <div className="flex items-center gap-3 text-sm text-neutral-600 flex-wrap">
                            <div className="flex items-center gap-1 flex-wrap">
                              {days.map((d: number) => (
                                <span key={d} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${DAY_COLORS[d]?.badge || ''}`}>
                                  {DAYS[d]}
                                </span>
                              ))}
                            </div>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {a.defaultTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              {totalPeople} persona{totalPeople !== 1 ? 's' : ''}
                            </span>
                          </div>
                          {a.description && (
                            <p className="text-sm text-neutral-500 mt-1">{a.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(a)}
                            className="h-8 w-8 p-0 text-neutral-500 hover:text-primary-600"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(a._id, a.name)}
                            className="h-8 w-8 p-0 text-neutral-500 hover:text-danger-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="border-t border-neutral-200/60 pt-3">
                        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
                          Formato del Programa
                        </p>
                        <div className="space-y-1.5">
                          {a.roleConfig.map((rc: any, i: number) => (
                            <div
                              key={i}
                              className="flex items-center justify-between text-sm py-1 px-2 rounded-md hover:bg-white/60 transition-colors"
                            >
                              <span className="text-neutral-700">
                                <span className="font-medium text-neutral-400 mr-1.5">{rc.sectionOrder}.</span>
                                {rc.sectionName}
                              </span>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs font-normal">
                                  {rc.role.name}
                                </Badge>
                                <span className="text-xs text-neutral-400">
                                  {rc.peopleNeeded}p
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar' : 'Nueva'} Actividad</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="actName">Nombre *</Label>
              <Input
                id="actName"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Culto Dominical, Estudio Bíblico..."
              />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="actDesc">Descripción</Label>
              <Input
                id="actDesc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Breve descripción de la actividad"
              />
            </div>

            {/* Días de la Semana */}
            <div className="space-y-3">
              <Label>Días de la Semana *</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((d, i) => {
                  const selected = form.daysOfWeek.includes(i)
                  const colors = DAY_COLORS[i]
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleDay(i)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                        selected
                          ? `${colors.badge} border-current shadow-sm`
                          : 'bg-neutral-50 text-neutral-400 border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      {d.slice(0, 3)}
                    </button>
                  )
                })}
              </div>

              {/* Hora por día */}
              {form.daysOfWeek.length > 0 && (
                <div className="space-y-2 mt-2">
                  <Label className="text-xs text-neutral-500">Hora por día</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {form.schedule
                      .sort((a, b) => a.day - b.day)
                      .map((s) => (
                        <div key={s.day} className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg border border-neutral-200">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${DAY_COLORS[s.day]?.badge || ''}`}>
                            {DAYS[s.day]?.slice(0, 3)}
                          </span>
                          <Input
                            type="time"
                            value={s.time}
                            onChange={(e) => updateScheduleTime(s.day, e.target.value)}
                            className="h-8 text-sm flex-1"
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Hora por defecto (fallback) */}
            <div className="space-y-2">
              <Label htmlFor="actTime">Hora por defecto</Label>
              <Input
                id="actTime"
                type="time"
                value={form.defaultTime}
                onChange={(e) => setForm({ ...form, defaultTime: e.target.value })}
              />
              <p className="text-xs text-neutral-400">Se usa si no hay horario específico por día</p>
            </div>

            {/* Secciones del Programa */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Secciones del Programa</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addRoleConfig}
                  className="text-primary-600 hover:text-primary-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar Sección
                </Button>
              </div>

              {form.roleConfig.length === 0 && (
                <div className="text-center py-6 border border-dashed border-neutral-300 rounded-lg bg-neutral-50/50">
                  <p className="text-sm text-neutral-400">
                    Agrega las secciones del programa
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    (Dirección, Adoración, Devocional, etc.)
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {form.roleConfig.map((rc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-3 bg-neutral-50 border border-neutral-200 rounded-lg"
                  >
                    <span className="text-sm font-bold text-neutral-400 w-6 text-center shrink-0">
                      {idx + 1}.
                    </span>
                    <Input
                      placeholder="Nombre de sección"
                      value={rc.sectionName}
                      onChange={(e) => updateRoleConfig(idx, 'sectionName', e.target.value)}
                      className="flex-1"
                    />
                    <Select
                      value={rc.role.id}
                      onValueChange={(value) => updateRoleConfig(idx, 'roleId', value)}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((r: any) => (
                          <SelectItem key={r._id} value={r._id}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      value={rc.peopleNeeded}
                      onChange={(e) => updateRoleConfig(idx, 'peopleNeeded', Number(e.target.value))}
                      className="w-16 text-center"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRoleConfig(idx)}
                      className="h-8 w-8 p-0 text-neutral-400 hover:text-danger-600 shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editing ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

export default ActivityTypesPage
