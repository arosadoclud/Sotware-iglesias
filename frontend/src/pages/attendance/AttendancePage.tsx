import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { attendanceApi } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import { P } from '../../constants/permissions'
import { toast } from 'sonner'
import { format, parseISO, startOfWeek, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Loader2, Save, Users, CheckCircle2, XCircle, Calendar,
  BarChart3, ChevronLeft, ChevronRight, UserCheck, UserX,
  Trash2, Search, RefreshCw, Book, Heart, Star, Music, Globe,
  TrendingUp, ClipboardCheck,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '../../components/ui/dialog'
import { Textarea } from '../../components/ui/textarea'

// ── Tipos de culto ────────────────────────────────────────────────────────────
const SERVICES = [
  {
    key: 'MARTES_ESTUDIO',
    label: 'Estudio Bíblico',
    day: 'Martes',
    dayShort: 'Mar',
    color: 'blue',
    icon: Book,
    description: 'Estudio de la Palabra de Dios',
    bgClass: 'bg-blue-50 border-blue-200',
    activeClass: 'bg-blue-600 text-white shadow-blue-200',
    badgeClass: 'bg-blue-100 text-blue-700',
    dotClass: 'bg-blue-500',
  },
  {
    key: 'MIERCOLES_CULTO',
    label: 'Culto Damas y Caballeros',
    day: 'Miércoles',
    dayShort: 'Mié',
    color: 'purple',
    icon: Heart,
    description: 'Culto de Damas y Caballeros',
    bgClass: 'bg-purple-50 border-purple-200',
    activeClass: 'bg-purple-600 text-white shadow-purple-200',
    badgeClass: 'bg-purple-100 text-purple-700',
    dotClass: 'bg-purple-500',
  },
  {
    key: 'SABADO_JOVENES',
    label: 'Culto de Jóvenes',
    day: 'Sábado',
    dayShort: 'Sáb',
    color: 'amber',
    icon: Star,
    description: 'Culto dedicado a la juventud',
    bgClass: 'bg-amber-50 border-amber-200',
    activeClass: 'bg-amber-500 text-white shadow-amber-200',
    badgeClass: 'bg-amber-100 text-amber-700',
    dotClass: 'bg-amber-500',
  },
  {
    key: 'DOMINGO_EVANGELISTICO',
    label: 'Culto Evangelístico',
    day: 'Domingo',
    dayShort: 'Dom',
    color: 'green',
    icon: Globe,
    description: 'Culto Evangelístico General',
    bgClass: 'bg-green-50 border-green-200',
    activeClass: 'bg-green-600 text-white shadow-green-200',
    badgeClass: 'bg-green-100 text-green-700',
    dotClass: 'bg-green-500',
  },
]

interface Attendee {
  personId?: string
  personName: string
  ministry?: string
  present: boolean | null  // null = sin marcar; true = presente; false = ausente
  notes?: string
}

interface AttendanceRecord {
  _id: string
  serviceType: string
  date: string
  attendees: Attendee[]
  guestCount: number
  notes?: string
  totalPresent: number
  totalAbsent: number
  totalMembers: number
}

const AttendancePage = () => {
  const { hasPermission } = useAuthStore()
  const canCreate = hasPermission(P.ATTENDANCE_CREATE)
  const canEdit   = hasPermission(P.ATTENDANCE_EDIT)
  const canDelete = hasPermission(P.ATTENDANCE_DELETE)

  // Estado principal
  const [activeService, setActiveService]   = useState(SERVICES[0].key)
  const [selectedDate, setSelectedDate]     = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [view, setView]                     = useState<'register' | 'history' | 'stats'>('register')

  // Registro de asistencia
  const [attendees, setAttendees]           = useState<Attendee[]>([])
  const [guestCount, setGuestCount]         = useState(0)
  const [notes, setNotes]                   = useState('')
  const [existingId, setExistingId]         = useState<string | null>(null)
  const [searchTerm, setSearchTerm]         = useState('')
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [saving, setSaving]                 = useState(false)

  // Historial
  const [history, setHistory]               = useState<AttendanceRecord[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyTotal, setHistoryTotal]     = useState(0)
  const [historyPage, setHistoryPage]       = useState(1)

  // Stats
  const [stats, setStats]                   = useState<any>(null)
  const [loadingStats, setLoadingStats]     = useState(false)

  // Dialogs
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingId, setDeletingId]             = useState<string | null>(null)

  const activeServiceInfo = SERVICES.find(s => s.key === activeService)!

  // ── Cargar miembros al cambiar culto o fecha ────────────────────────────
  const loadMembers = useCallback(async () => {
    setLoadingMembers(true)
    setSearchTerm('')
    try {
      const res = await attendanceApi.getMembers({
        serviceType: activeService,
        date: selectedDate,
      })
      const { data, existingRecordId, guestCount: gc, recordNotes } = res.data
      setAttendees(data)
      setExistingId(existingRecordId)
      setGuestCount(gc || 0)
      setNotes(recordNotes || '')
    } catch {
      toast.error('Error al cargar los miembros')
    } finally {
      setLoadingMembers(false)
    }
  }, [activeService, selectedDate])

  useEffect(() => {
    if (view === 'register') loadMembers()
  }, [activeService, selectedDate, view, loadMembers])

  // ── Cargar historial ──────────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    setLoadingHistory(true)
    try {
      const res = await attendanceApi.getAll({
        serviceType: activeService,
        page: historyPage,
        limit: 10,
      })
      setHistory(res.data.data)
      setHistoryTotal(res.data.total)
    } catch {
      toast.error('Error al cargar el historial')
    } finally {
      setLoadingHistory(false)
    }
  }, [activeService, historyPage])

  useEffect(() => {
    if (view === 'history') loadHistory()
  }, [view, loadHistory])

  // ── Cargar stats ──────────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    setLoadingStats(true)
    try {
      const res = await attendanceApi.getStats()
      setStats(res.data.data)
    } catch {
      toast.error('Error al cargar estadísticas')
    } finally {
      setLoadingStats(false)
    }
  }, [])

  useEffect(() => {
    if (view === 'stats') loadStats()
  }, [view, loadStats])

  // ── Toggle asistencia de una persona (ciclo: null → true → false → null) ─
  const toggleAttendee = (personName: string) => {
    setAttendees(prev =>
      prev.map(a => {
        if (a.personName !== personName) return a
        const next = a.present === null ? true : a.present === true ? false : null
        return { ...a, present: next }
      })
    )
  }

  // ── Marcar todos presentes / limpiar marcas ───────────────────────────────
  const markAll = (present: boolean | null) => {
    const names = new Set(filtered_attendees.map(a => a.personName))
    setAttendees(prev => prev.map(a => names.has(a.personName) ? { ...a, present } : a))
  }

  // ── Guardar asistencia ────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true)
    try {
      // Solo enviar miembros explícitamente marcados (excluir los null = sin marcar)
      const markedAttendees = attendees.filter(a => a.present !== null)
      if (existingId) {
        await attendanceApi.update(existingId, { attendees: markedAttendees, guestCount, notes })
        toast.success('Asistencia actualizada correctamente')
      } else {
        const res = await attendanceApi.create({
          serviceType: activeService,
          date: selectedDate,
          attendees: markedAttendees,
          guestCount,
          notes,
        })
        setExistingId(res.data.data._id)
        toast.success('Asistencia registrada correctamente')
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error al guardar'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  // ── Eliminar registro ─────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await attendanceApi.delete(deletingId)
      toast.success('Registro eliminado')
      setShowDeleteDialog(false)
      setDeletingId(null)
      if (view === 'history') loadHistory()
      if (deletingId === existingId) {
        setExistingId(null)
        setAttendees(prev => prev.map(a => ({ ...a, present: null })))
        setGuestCount(0)
        setNotes('')
      }
    } catch {
      toast.error('Error al eliminar el registro')
    }
  }

  // ── Navegar entre fechas ──────────────────────────────────────────────────
  const navigateDate = (days: number) => {
    const d = new Date(selectedDate + 'T00:00:00')
    d.setDate(d.getDate() + days)
    setSelectedDate(format(d, 'yyyy-MM-dd'))
  }

  // ── Filtrar attendees por búsqueda ────────────────────────────────────────
  const filtered_attendees = attendees.filter(a =>
    a.personName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.ministry || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const presentCount   = attendees.filter(a => a.present === true).length
  const absentCount    = attendees.filter(a => a.present === false).length
  const totalCount     = attendees.length
  const attendance_pct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-neutral-50 p-4 lg:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <ClipboardCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Control de Asistencias</h1>
            <p className="text-sm text-neutral-500">Registro de asistencia por culto semanal</p>
          </div>
        </div>
      </motion.div>

      {/* Pestañas de vista */}
      <div className="flex gap-2 mb-5">
        {[
          { key: 'register', label: 'Registrar', icon: CheckCircle2 },
          { key: 'history',  label: 'Historial',  icon: Calendar },
          { key: 'stats',    label: 'Estadísticas', icon: BarChart3 },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === tab.key
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Selector de culto */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {SERVICES.map(service => {
          const Icon = service.icon
          const isActive = activeService === service.key
          return (
            <motion.button
              key={service.key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setActiveService(service.key)
                setHistoryPage(1)
              }}
              className={`p-4 rounded-xl border-2 text-left transition-all shadow-sm ${
                isActive
                  ? `border-transparent ${service.activeClass} shadow-lg`
                  : `bg-white ${service.bgClass} hover:shadow-md`
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} />
                <span className={`text-xs font-semibold uppercase tracking-wide ${isActive ? 'text-white/80' : 'text-neutral-500'}`}>
                  {service.dayShort}
                </span>
              </div>
              <p className={`text-sm font-bold leading-tight ${isActive ? 'text-white' : 'text-neutral-800'}`}>
                {service.label}
              </p>
            </motion.button>
          )
        })}
      </div>

      {/* ── VISTA: REGISTRAR ── */}
      {view === 'register' && (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Panel izquierdo: selector fecha + stats rápidas */}
          <div className="space-y-4">
            {/* Selector de fecha */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Fecha del Culto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => navigateDate(-7)} className="h-8 w-8">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="flex-1 text-sm border border-neutral-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Button variant="outline" size="icon" onClick={() => navigateDate(7)} className="h-8 w-8">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-neutral-500 text-center">
                  {format(new Date(selectedDate + 'T00:00:00'), "EEEE, d 'de' MMMM yyyy", { locale: es })}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
                >
                  Hoy
                </Button>
              </CardContent>
            </Card>

            {/* Resumen rápido */}
            {!loadingMembers && (
              <Card className="shadow-sm">
                <CardContent className="pt-5 space-y-3">
                  {existingId && (
                    <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      Asistencia ya registrada
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-700">{presentCount}</p>
                      <p className="text-xs text-green-600">Presentes</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <p className="text-2xl font-bold text-red-600">{absentCount}</p>
                      <p className="text-xs text-red-500">Ausentes</p>
                    </div>
                  </div>
                  {totalCount > 0 && (
                    <div>
                      <div className="flex justify-between text-xs text-neutral-500 mb-1">
                        <span>Asistencia</span>
                        <span>{attendance_pct}%</span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2">
                        <motion.div
                          className="bg-green-500 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${attendance_pct}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs text-neutral-600">Visitas sin registro</Label>
                    <Input
                      type="number"
                      min={0}
                      value={guestCount}
                      onChange={e => setGuestCount(Number(e.target.value))}
                      className="mt-1 h-8 text-sm"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-neutral-600">Observaciones del culto</Label>
                    <Textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="mt-1 text-sm resize-none"
                      rows={2}
                      placeholder="Ej: Predicó el pastor, 3 decisiones..."
                      maxLength={500}
                    />
                  </div>
                  {(canCreate || canEdit) && (
                    <Button
                      onClick={handleSave}
                      disabled={saving || totalCount === 0}
                      className="w-full bg-indigo-600 hover:bg-indigo-700"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {existingId ? 'Actualizar' : 'Guardar'} Asistencia
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Panel derecho: lista de miembros */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm h-full">
              <CardHeader className="pb-3 border-b border-neutral-100">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Lista de Miembros
                    {totalCount > 0 && (
                      <Badge variant="secondary" className="text-xs">{totalCount}</Badge>
                    )}
                  </CardTitle>
                  {totalCount > 0 && (canCreate || canEdit) && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-green-700 border-green-200"
                        onClick={() => markAll(true)}
                      >
                        <UserCheck className="w-3 h-3 mr-1" /> Todos presentes
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs text-neutral-500 border-neutral-200"
                        onClick={() => markAll(null)}
                      >
                        <UserX className="w-3 h-3 mr-1" /> Limpiar
                      </Button>
                    </div>
                  )}
                </div>
                {totalCount > 0 && (
                  <div className="relative mt-2">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                    <Input
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      placeholder="Buscar miembro..."
                      className="pl-8 h-8 text-sm"
                    />
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {loadingMembers ? (
                  <div className="flex items-center justify-center h-48">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                  </div>
                ) : filtered_attendees.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-neutral-400">
                    <Users className="w-10 h-10 mb-2 opacity-40" />
                    <p className="text-sm">
                      {attendees.length === 0
                        ? 'No hay miembros activos registrados'
                        : 'Sin resultados para la búsqueda'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-100 max-h-[520px] overflow-y-auto">
                    <AnimatePresence initial={false}>
                      {filtered_attendees.map((attendee, idx) => (
                        <motion.div
                          key={attendee.personName}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.02 }}
                          className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                            attendee.present === true
                              ? 'bg-green-50/60 hover:bg-green-50'
                              : attendee.present === false
                              ? 'bg-red-50/50 hover:bg-red-50'
                              : 'hover:bg-neutral-50'
                          }`}
                          onClick={() => (canCreate || canEdit) && toggleAttendee(attendee.personName)}
                        >
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${
                            attendee.present === true
                              ? 'bg-green-500 text-white'
                              : attendee.present === false
                              ? 'bg-red-400 text-white'
                              : 'bg-neutral-200 text-neutral-500'
                          }`}>
                            {attendee.personName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              attendee.present === true ? 'text-green-800' : attendee.present === false ? 'text-red-700' : 'text-neutral-700'
                            }`}>
                              {attendee.personName}
                            </p>
                            {attendee.ministry && (
                              <p className="text-xs text-neutral-400 truncate">{attendee.ministry}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {attendee.present === true ? (
                              <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                <CheckCircle2 className="w-4 h-4" /> Presente
                              </span>
                            ) : attendee.present === false ? (
                              <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                                <XCircle className="w-4 h-4" /> Ausente
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-neutral-300">
                                <XCircle className="w-4 h-4" /> Sin marcar
                              </span>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── VISTA: HISTORIAL ── */}
      {view === 'history' && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3 border-b border-neutral-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Historial — {activeServiceInfo.label}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={loadHistory} className="h-8">
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Actualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loadingHistory ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-neutral-400">
                <Calendar className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-sm">Sin registros para este culto</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {history.map(record => {
                  const pct = record.totalMembers > 0
                    ? Math.round((record.totalPresent / record.totalMembers) * 100)
                    : 0
                  return (
                    <div key={record._id} className="flex items-center gap-4 px-5 py-4 hover:bg-neutral-50">
                      <div className="flex-shrink-0 w-12 text-center">
                        <p className="text-lg font-bold text-neutral-800">
                          {format(parseISO(record.date), 'd')}
                        </p>
                        <p className="text-xs text-neutral-500 uppercase">
                          {format(parseISO(record.date), 'MMM', { locale: es })}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-700">
                          {format(parseISO(record.date), "EEEE, d 'de' MMMM yyyy", { locale: es })}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-green-600">
                            <CheckCircle2 className="inline w-3 h-3 mr-0.5" />
                            {record.totalPresent} presentes
                          </span>
                          <span className="text-xs text-neutral-400">
                            <XCircle className="inline w-3 h-3 mr-0.5" />
                            {record.totalAbsent} ausentes
                          </span>
                          {record.guestCount > 0 && (
                            <span className="text-xs text-blue-500">
                              +{record.guestCount} visitas
                            </span>
                          )}
                        </div>
                        <div className="w-full bg-neutral-200 rounded-full h-1.5 mt-2 max-w-xs">
                          <div
                            className="bg-green-500 h-1.5 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xl font-bold text-neutral-800">{pct}%</p>
                        <p className="text-xs text-neutral-400">{record.totalMembers} total</p>
                      </div>
                      {canDelete && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="flex-shrink-0 h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => {
                            setDeletingId(record._id)
                            setShowDeleteDialog(true)
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            {/* Paginación */}
            {historyTotal > 10 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-100">
                <p className="text-xs text-neutral-500">{historyTotal} registros en total</p>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={historyPage === 1}
                    onClick={() => setHistoryPage(p => p - 1)}
                    className="h-7"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <span className="px-3 py-1 text-xs text-neutral-600">
                    Pág {historyPage}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={history.length < 10}
                    onClick={() => setHistoryPage(p => p + 1)}
                    className="h-7"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── VISTA: ESTADÍSTICAS ── */}
      {view === 'stats' && (
        <div className="space-y-5">
          {loadingStats ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : !stats ? null : (
            <>
              {/* Tarjetas por culto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {SERVICES.map(service => {
                  const Icon = service.icon
                  const s = stats.byService?.[service.key]
                  if (!s) return null
                  return (
                    <Card key={service.key} className={`shadow-sm border-2 ${service.bgClass}`}>
                      <CardContent className="pt-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Icon className="w-5 h-5 text-neutral-600" />
                          <div>
                            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">{service.day}</p>
                            <p className="text-xs text-neutral-700 font-medium leading-tight">{service.label}</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-neutral-500">Cultos realizados</span>
                            <span className="font-bold">{s.totalServices}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-neutral-500">Promedio asistencia</span>
                            <span className="font-bold text-green-700">{s.avgAttendance}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-neutral-500">Total acumulado</span>
                            <span className="font-bold">{s.totalPresent}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Últimos registros */}
              {stats.recentRecords?.length > 0 && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Últimos 10 registros
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-neutral-100">
                      {stats.recentRecords.map((rec: any) => {
                        const sInfo = SERVICES.find(s => s.key === rec.serviceType)
                        const Icon = sInfo?.icon || Calendar
                        const present = rec.attendees.filter((a: any) => a.present).length
                        const total   = rec.attendees.length
                        const pct     = total > 0 ? Math.round((present / total) * 100) : 0
                        return (
                          <div key={rec._id} className="flex items-center gap-3 px-5 py-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${sInfo?.bgClass || 'bg-neutral-100'}`}>
                              <Icon className="w-4 h-4 text-neutral-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-neutral-700 truncate">
                                {sInfo?.label || rec.serviceType}
                              </p>
                              <p className="text-xs text-neutral-400">
                                {format(parseISO(rec.date), "d MMM yyyy", { locale: es })}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-bold text-neutral-800">{present}/{total}</p>
                              <p className="text-xs text-neutral-400">{pct}%</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* Dialog: Confirmar eliminación */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>¿Eliminar registro?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se perderán todos los datos de asistencia de este culto.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-1" /> Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AttendancePage
