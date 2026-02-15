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

/**
 * Convierte hora de formato 24h (HH:mm) a formato 12h con AM/PM
 */
const formatTime12h = (time24: string): string => {
  if (!time24) return ''
  const [hoursStr, minutes] = time24.split(':')
  let hours = parseInt(hoursStr, 10)
  const suffix = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  return `${hours}:${minutes} ${suffix}`
}

/**
 * Parsea hora 24h a componentes { hour12, minute, period }
 */
const parseTime24h = (time24: string): { hour12: number; minute: string; period: 'AM' | 'PM' } => {
  if (!time24) return { hour12: 10, minute: '00', period: 'AM' }
  const [hoursStr, minutes] = time24.split(':')
  let hours = parseInt(hoursStr, 10)
  const period: 'AM' | 'PM' = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return { hour12, minute: minutes || '00', period }
}

/**
 * Convierte componentes 12h a formato 24h (HH:mm)
 */
const toTime24h = (hour12: number, minute: string, period: 'AM' | 'PM'): string => {
  let hour24 = hour12
  if (period === 'AM' && hour12 === 12) hour24 = 0
  else if (period === 'PM' && hour12 !== 12) hour24 = hour12 + 12
  return `${hour24.toString().padStart(2, '0')}:${minute}`
}

/**
 * Componente selector de hora en formato 12h
 */
const Time12hPicker = ({ 
  value, 
  onChange,
  className = ''
}: { 
  value: string; 
  onChange: (time24: string) => void;
  className?: string;
}) => {
  const { hour12, minute, period } = parseTime24h(value)
  
  const handleChange = (newHour: number, newMinute: string, newPeriod: 'AM' | 'PM') => {
    onChange(toTime24h(newHour, newMinute, newPeriod))
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <select
        value={hour12}
        onChange={(e) => handleChange(parseInt(e.target.value), minute, period)}
        className="h-8 px-2 text-sm border border-neutral-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span className="text-neutral-400">:</span>
      <select
        value={minute}
        onChange={(e) => handleChange(hour12, e.target.value, period)}
        className="h-8 px-2 text-sm border border-neutral-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        {['00', '15', '30', '45'].map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <select
        value={period}
        onChange={(e) => handleChange(hour12, minute, e.target.value as 'AM' | 'PM')}
        className="h-8 px-2 text-sm border border-neutral-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  )
}

const DAY_COLORS: Record<number, { bg: string; border: string; badge: string; pillBorder: string }> = {
  0: { bg: 'bg-red-50/50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', pillBorder: 'border-red-400' },
  1: { bg: 'bg-neutral-50/50', border: 'border-neutral-200', badge: 'bg-neutral-100 text-neutral-700', pillBorder: 'border-neutral-400' },
  2: { bg: 'bg-blue-50/50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', pillBorder: 'border-blue-400' },
  3: { bg: 'bg-green-50/50', border: 'border-green-200', badge: 'bg-green-100 text-green-700', pillBorder: 'border-green-400' },
  4: { bg: 'bg-yellow-50/50', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-700', pillBorder: 'border-yellow-400' },
  5: { bg: 'bg-pink-50/50', border: 'border-pink-200', badge: 'bg-pink-100 text-pink-700', pillBorder: 'border-pink-400' },
  6: { bg: 'bg-purple-50/50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700', pillBorder: 'border-purple-400' },
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
    color: '#3b82f6',
    daysOfWeek: [] as number[],
    defaultTime: '10:00',
    schedule: [] as { day: number; time: string }[],
    roleConfig: [] as any[],
    generationType: 'standard' as 'standard' | 'cleaning_groups',
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
    setForm({ name: '', description: '', color: '#3b82f6', daysOfWeek: [], defaultTime: '10:00', schedule: [], roleConfig: [], generationType: 'standard' })
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
      color: a.color || '#3b82f6',
      daysOfWeek: days,
      defaultTime: a.defaultTime,
      schedule: a.schedule || [],
      roleConfig: a.roleConfig.map((rc: any) => ({ ...rc })),
      generationType: a.generationType || 'standard',
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
    // Solo requerir secciones para actividades estándar
    if (form.generationType !== 'cleaning_groups') {
      if (form.roleConfig.length === 0) return toast.error('Agrega al menos una sección')
      if (form.roleConfig.some((rc) => !rc.sectionName.trim()))
        return toast.error('Cada sección necesita un nombre')
    }

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-neutral-900 truncate">Tipos de Actividades</h1>
          <p className="text-xs sm:text-sm md:text-base text-neutral-600 mt-1">
            Configura los servicios semanales y sus roles de oportunidades
            {activities.length > 0 && (
              <span className="ml-1 text-neutral-500">({activities.length})</span>
            )}
          </p>
        </div>
        <Button onClick={openNew} size="lg" className="w-full sm:w-auto">
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          <span className="hidden sm:inline">Nueva Actividad</span>
          <span className="sm:hidden">Nueva</span>
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
              const totalPeople = a.roleConfig.reduce((sum: number, rc: any) => sum + (rc.peopleNeeded || 1), 0)
              const activityColor = a.color || '#3b82f6'

              return (
                <motion.div
                  key={a._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-2 hover:shadow-md transition-shadow overflow-hidden" style={{ borderLeftColor: activityColor, borderLeftWidth: '4px' }}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: activityColor }} />
                            <CardTitle className="text-lg">{a.name}</CardTitle>
                            {a.generationType === 'cleaning_groups' && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                Limpieza
                              </span>
                            )}
                          </div>
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
                              {formatTime12h(a.defaultTime)}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
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

            {/* Tipo de Generación */}
            <div className="space-y-2">
              <Label htmlFor="genType">Tipo de Generación</Label>
              <select
                id="genType"
                value={form.generationType}
                onChange={(e) => setForm({ ...form, generationType: e.target.value as any })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="standard">Estándar (roles y secciones)</option>
                <option value="cleaning_groups">Grupos de Limpieza (divide miembros)</option>
              </select>
              {form.generationType === 'cleaning_groups' && (
                <p className="text-xs text-amber-600 mt-1">
                  Esta actividad dividirá automáticamente a todos los miembros activos en grupos rotativos para limpieza.
                </p>
              )}
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>Color de la Actividad</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { hex: '#3b82f6', name: 'Azul' },
                  { hex: '#22c55e', name: 'Verde' },
                  { hex: '#ef4444', name: 'Rojo' },
                  { hex: '#f59e0b', name: 'Naranja' },
                  { hex: '#8b5cf6', name: 'Violeta' },
                  { hex: '#ec4899', name: 'Rosa' },
                  { hex: '#14b8a6', name: 'Turquesa' },
                  { hex: '#6366f1', name: 'Índigo' },
                  { hex: '#84cc16', name: 'Lima' },
                  { hex: '#f97316', name: 'Naranja Fuerte' },
                ].map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setForm({ ...form, color: c.hex })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      form.color === c.hex
                        ? 'ring-2 ring-offset-2 ring-primary-500 border-white'
                        : 'border-transparent hover:scale-110'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
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
                          ? `${colors.badge} ${colors.pillBorder} shadow-sm`
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[...form.schedule]
                      .sort((a, b) => a.day - b.day)
                      .map((s) => (
                        <div key={s.day} className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg border border-neutral-200">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${DAY_COLORS[s.day]?.badge || ''}`}>
                            {DAYS[s.day]?.slice(0, 3)}
                          </span>
                          <Time12hPicker
                            value={s.time}
                            onChange={(time) => updateScheduleTime(s.day, time)}
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
              <Time12hPicker
                value={form.defaultTime}
                onChange={(time) => setForm({ ...form, defaultTime: time })}
              />
              <p className="text-xs text-neutral-400">Se usa si no hay horario específico por día</p>
            </div>

            {/* Secciones del Programa - Solo para actividades estándar */}
            {form.generationType !== 'cleaning_groups' && (
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
            )}
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
