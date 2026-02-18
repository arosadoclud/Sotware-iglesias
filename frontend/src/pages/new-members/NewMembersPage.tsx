import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { newMembersApi } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import { P } from '../../constants/permissions'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Loader2, Plus, Search, Users, UserPlus, Phone, Mail, MapPin, Calendar,
  MessageCircle, Send, ChevronRight, Trash2, Edit, Eye, ArrowRight,
  Bell, Clock, CheckCircle2, AlertCircle, X, Filter, BarChart3,
  Heart, Star, Globe, Sparkles, TrendingUp, UserCheck,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '../../components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../components/ui/select'

// ── Constants ─────────────────────────────────────────────────────────────────
const PHASES = {
  FIRST_VISIT:  { label: 'Primera Visita',  color: 'bg-blue-50 text-blue-700 border-blue-200',   icon: Star },
  CONTACTED:    { label: 'Contactado',       color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Phone },
  IN_FOLLOW_UP: { label: 'En Seguimiento',  color: 'bg-amber-50 text-amber-700 border-amber-200',   icon: Clock },
  INTEGRATED:   { label: 'Integrado',       color: 'bg-green-50 text-green-700 border-green-200',    icon: CheckCircle2 },
  INACTIVE:     { label: 'Inactivo',        color: 'bg-red-50 text-red-700 border-red-200',          icon: AlertCircle },
}

const SOURCES = {
  VISIT:        'Visita Espontánea',
  INVITATION:   'Invitado',
  EVENT:        'Evento Especial',
  SOCIAL_MEDIA: 'Redes Sociales',
  TRANSFER:     'Transferencia',
  OTHER:        'Otro',
}

const FOLLOWUP_TYPES = {
  CALL:     { label: 'Llamada',  icon: Phone,          color: 'text-blue-600' },
  WHATSAPP: { label: 'WhatsApp', icon: MessageCircle,  color: 'text-green-600' },
  VISIT:    { label: 'Visita',   icon: MapPin,         color: 'text-purple-600' },
  NOTE:     { label: 'Nota',     icon: Edit,           color: 'text-neutral-600' },
}

const INTERESTS = ['Alabanza', 'Jóvenes', 'Damas', 'Caballeros', 'Niños', 'Intercesión', 'Enseñanza', 'Servicio Social']

// ── Whatsapp Message Templates ────────────────────────────────────────────────
const WA_TEMPLATES = [
  {
    label: 'Bienvenida',
    message: (name: string, church: string) =>
      `¡Hola ${name}! 🙏 Te saludamos con mucho cariño de parte de ${church}. Fue una bendición tenerte con nosotros. ¡Esperamos verte pronto! 🏠✨`,
  },
  {
    label: 'Invitación al culto',
    message: (name: string, church: string) =>
      `¡Hola ${name}! 🌟 Te invitamos este domingo a nuestro servicio en ${church}. ¡Te esperamos con los brazos abiertos! 🙌`,
  },
  {
    label: 'Seguimiento',
    message: (name: string, church: string) =>
      `¡Hola ${name}! 😊 ¿Cómo estás? Desde ${church} queremos saber de ti y recordarte que eres importante para nosotros. ¿Nos acompañas este fin de semana? 🙏`,
  },
  {
    label: 'Agradecimiento',
    message: (name: string, church: string) =>
      `¡Hola ${name}! Queremos agradecerte por visitarnos en ${church}. Tu presencia fue una bendición. ¡Que Dios te siga bendiciendo! 🙏❤️`,
  },
]

const NewMembersPage = () => {
  const { hasPermission } = useAuthStore()
  const canCreate = hasPermission(P.PERSONS_CREATE)
  const canEdit   = hasPermission(P.PERSONS_EDIT)
  const canDelete = hasPermission(P.PERSONS_DELETE)

  // State
  const [members, setMembers] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterPhase, setFilterPhase] = useState('')
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [showWhatsApp, setShowWhatsApp] = useState(false)
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form state
  const [form, setForm] = useState({
    fullName: '', phone: '', email: '', address: '', age: '',
    gender: '', source: 'VISIT', invitedBy: '', notes: '',
    firstVisitDate: format(new Date(), 'yyyy-MM-dd'),
    interests: [] as string[], assignedTo: '',
  })

  // Follow-up form
  const [followUpForm, setFollowUpForm] = useState({ type: 'NOTE', note: '', madeBy: '' })

  // WhatsApp form
  const [waMessage, setWaMessage] = useState('')

  const churchName = 'nuestra iglesia' // fallback

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadData = async () => {
    setLoading(true)
    try {
      const params: any = { limit: 100 }
      if (search) params.search = search
      if (filterPhase) params.phase = filterPhase
      const [membersRes, statsRes] = await Promise.all([
        newMembersApi.getAll(params),
        newMembersApi.getStats(),
      ])
      setMembers(membersRes.data.data || [])
      setStats(statsRes.data.data || null)
    } catch (err) {
      toast.error('Error al cargar datos')
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [search, filterPhase])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const resetForm = () => {
    setForm({
      fullName: '', phone: '', email: '', address: '', age: '',
      gender: '', source: 'VISIT', invitedBy: '', notes: '',
      firstVisitDate: format(new Date(), 'yyyy-MM-dd'),
      interests: [], assignedTo: '',
    })
    setEditingId(null)
  }

  const openForm = (member?: any) => {
    if (member) {
      setEditingId(member._id)
      setForm({
        fullName: member.fullName || '',
        phone: member.phone || '',
        email: member.email || '',
        address: member.address || '',
        age: member.age?.toString() || '',
        gender: member.gender || '',
        source: member.source || 'VISIT',
        invitedBy: member.invitedBy || '',
        notes: member.notes || '',
        firstVisitDate: member.firstVisitDate
          ? format(new Date(member.firstVisitDate), 'yyyy-MM-dd')
          : format(new Date(), 'yyyy-MM-dd'),
        interests: member.interests || [],
        assignedTo: member.assignedTo || '',
      })
    } else {
      resetForm()
    }
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.fullName.trim()) return toast.error('El nombre es requerido')
    setSaving(true)
    try {
      const payload = {
        ...form,
        age: form.age ? Number(form.age) : undefined,
        gender: form.gender || undefined,
      }
      if (editingId) {
        await newMembersApi.update(editingId, payload)
        toast.success('Miembro actualizado')
      } else {
        await newMembersApi.create(payload)
        toast.success('Nuevo miembro registrado')
      }
      setShowForm(false)
      resetForm()
      loadData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al guardar')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este registro?')) return
    try {
      await newMembersApi.delete(id)
      toast.success('Eliminado')
      loadData()
      if (showDetail) setShowDetail(false)
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const handlePhaseChange = async (id: string, phase: string) => {
    try {
      await newMembersApi.updatePhase(id, phase)
      toast.success('Fase actualizada')
      loadData()
      if (selectedMember?._id === id) {
        setSelectedMember((prev: any) => prev ? { ...prev, phase } : null)
      }
    } catch {
      toast.error('Error al actualizar fase')
    }
  }

  const handleAddFollowUp = async () => {
    if (!followUpForm.note.trim()) return toast.error('La nota es requerida')
    if (!followUpForm.madeBy.trim()) return toast.error('Indica quién hizo el seguimiento')
    try {
      const res = await newMembersApi.addFollowUp(selectedMember._id, followUpForm)
      setSelectedMember(res.data.data)
      setFollowUpForm({ type: 'NOTE', note: '', madeBy: '' })
      setShowFollowUp(false)
      toast.success('Seguimiento registrado')
      loadData()
    } catch {
      toast.error('Error al registrar')
    }
  }

  const handleSendWhatsApp = async () => {
    if (!waMessage.trim()) return toast.error('Escribe un mensaje')
    try {
      const res = await newMembersApi.sendWhatsApp(selectedMember._id, waMessage)
      const { whatsappUrl } = res.data.data
      window.open(whatsappUrl, '_blank')
      toast.success('Abriendo WhatsApp...')
      setShowWhatsApp(false)
      setWaMessage('')
      // Reload to see the follow-up entry
      const updated = await newMembersApi.get(selectedMember._id)
      setSelectedMember(updated.data.data)
      loadData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al enviar')
    }
  }

  const handleConvert = async (id: string) => {
    if (!confirm('¿Convertir a miembro completo del sistema?')) return
    try {
      await newMembersApi.convertToPerson(id)
      toast.success('¡Convertido a miembro completo!')
      loadData()
      setShowDetail(false)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error')
    }
  }

  const toggleInterest = (interest: string) => {
    setForm(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }))
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/25">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-neutral-900">Nuevos Miembros</h1>
            <p className="text-sm text-neutral-500">Seguimiento y bienvenida a visitantes</p>
          </div>
        </div>
        {canCreate && (
          <Button onClick={() => openForm()} className="gap-2 bg-rose-600 hover:bg-rose-700 w-full sm:w-auto">
            <Plus className="w-5 h-5" />
            Registrar Visitante
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Este mes', value: stats.thisMonth || 0, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'En seguimiento', value: stats.byPhase?.IN_FOLLOW_UP || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Alertas pendientes', value: stats.pendingAlerts || 0, icon: Bell, color: 'text-red-600', bg: 'bg-red-50' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                    <s.icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-neutral-900">{s.value}</p>
                    <p className="text-xs text-neutral-500">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            placeholder="Buscar por nombre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterPhase} onValueChange={v => setFilterPhase(v === 'ALL' ? '' : v)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Todas las fases" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas las fases</SelectItem>
            {Object.entries(PHASES).map(([key, val]) => (
              <SelectItem key={key} value={key}>{val.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Members List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
        </div>
      ) : members.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserPlus className="w-12 h-12 text-neutral-300 mb-3" />
            <h3 className="font-semibold text-neutral-700 mb-1">No hay visitantes registrados</h3>
            <p className="text-sm text-neutral-500 mb-4">Comienza registrando nuevos visitantes</p>
            {canCreate && (
              <Button onClick={() => openForm()} variant="outline" className="gap-2">
                <Plus className="w-4 h-4" /> Registrar primer visitante
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence>
            {members.map((member, i) => {
              const phase = PHASES[member.phase as keyof typeof PHASES] || PHASES.FIRST_VISIT
              const PhaseIcon = phase.icon
              return (
                <motion.div
                  key={member._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card className="border-0 shadow-sm hover:shadow-md transition-all group cursor-pointer"
                    onClick={() => { setSelectedMember(member); setShowDetail(true) }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Avatar */}
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-rose-100 to-pink-200 flex items-center justify-center text-rose-700 font-bold text-lg flex-shrink-0">
                          {member.fullName.charAt(0)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="font-semibold text-neutral-900 truncate">{member.fullName}</h4>
                            {member.convertedToPersonId && (
                              <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]">Integrado</Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
                            {member.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {member.phone}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(member.firstVisitDate), "d MMM yyyy", { locale: es })}
                            </span>
                            <span className="text-neutral-400">{SOURCES[member.source as keyof typeof SOURCES] || member.source}</span>
                          </div>
                        </div>

                        {/* Phase badge */}
                        <Badge className={`${phase.color} border text-xs gap-1 flex-shrink-0`}>
                          <PhaseIcon className="w-3 h-3" />
                          {phase.label}
                        </Badge>

                        {/* Actions - visible on mobile, hover on desktop */}
                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                          {canEdit && member.phone && (
                            <button
                              onClick={() => { setSelectedMember(member); setShowWhatsApp(true) }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Enviar WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => openForm(member)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(member._id)}
                              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <ChevronRight className="w-4 h-4 text-neutral-300 flex-shrink-0" />
                      </div>

                      {/* Follow-up timeline short */}
                      {member.followUpHistory?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-neutral-50 flex items-center gap-2">
                          <span className="text-[10px] font-semibold text-neutral-400 uppercase">Último seguimiento:</span>
                          <span className="text-xs text-neutral-600">
                            {member.followUpHistory[member.followUpHistory.length - 1]?.note?.slice(0, 60)}
                            {member.followUpHistory[member.followUpHistory.length - 1]?.note?.length > 60 ? '...' : ''}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ═══════════════ MODAL: Create/Edit Form ═══════════════ */}
      <Dialog open={showForm} onOpenChange={v => { if (!v) { setShowForm(false); resetForm() } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Visitante' : 'Registrar Nuevo Visitante'}</DialogTitle>
            <DialogDescription>Ingresa los datos del visitante para dar seguimiento</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label>Nombre Completo *</Label>
                <Input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="Nombre completo" />
              </div>
              <div>
                <Label>Teléfono</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 809..." />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="correo@email.com" />
              </div>
              <div>
                <Label>Edad</Label>
                <Input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} placeholder="25" />
              </div>
              <div>
                <Label>Género</Label>
                <Select value={form.gender} onValueChange={v => setForm(f => ({ ...f, gender: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Femenino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fecha Primera Visita</Label>
                <Input type="date" value={form.firstVisitDate} onChange={e => setForm(f => ({ ...f, firstVisitDate: e.target.value }))} />
              </div>
              <div>
                <Label>¿Cómo llegó?</Label>
                <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SOURCES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.source === 'INVITATION' && (
                <div>
                  <Label>¿Quién lo invitó?</Label>
                  <Input value={form.invitedBy} onChange={e => setForm(f => ({ ...f, invitedBy: e.target.value }))} placeholder="Nombre" />
                </div>
              )}
              <div className="sm:col-span-2">
                <Label>Dirección</Label>
                <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Dirección" />
              </div>
              <div className="sm:col-span-2">
                <Label>Responsable del seguimiento</Label>
                <Input value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))} placeholder="Nombre del encargado" />
              </div>
            </div>

            {/* Interests */}
            <div>
              <Label className="mb-2 block">Intereses</Label>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map(interest => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      form.interests.includes(interest)
                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Notas</Label>
              <textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm min-h-[80px] focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all"
                placeholder="Observaciones adicionales..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); resetForm() }}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-rose-600 hover:bg-rose-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {editingId ? 'Guardar' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════ MODAL: Member Detail ═══════════════ */}
      <Dialog open={showDetail} onOpenChange={v => { if (!v) setShowDetail(false) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedMember && (() => {
            const phase = PHASES[selectedMember.phase as keyof typeof PHASES] || PHASES.FIRST_VISIT
            const PhaseIcon = phase.icon
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-100 to-pink-200 flex items-center justify-center text-rose-700 font-bold text-2xl">
                        {selectedMember.fullName.charAt(0)}
                      </div>
                      <div>
                        <DialogTitle className="text-xl">{selectedMember.fullName}</DialogTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`${phase.color} border text-xs gap-1`}>
                            <PhaseIcon className="w-3 h-3" />
                            {phase.label}
                          </Badge>
                          <span className="text-xs text-neutral-500">
                            Desde {format(new Date(selectedMember.firstVisitDate), "d MMM yyyy", { locale: es })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogHeader>

                {/* Contact info */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {selectedMember.phone && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <Phone className="w-4 h-4 text-neutral-400" /> {selectedMember.phone}
                    </div>
                  )}
                  {selectedMember.email && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <Mail className="w-4 h-4 text-neutral-400" /> {selectedMember.email}
                    </div>
                  )}
                  {selectedMember.address && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600 col-span-2">
                      <MapPin className="w-4 h-4 text-neutral-400" /> {selectedMember.address}
                    </div>
                  )}
                  {selectedMember.assignedTo && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <UserCheck className="w-4 h-4 text-neutral-400" /> Seguimiento: {selectedMember.assignedTo}
                    </div>
                  )}
                </div>

                {/* Interests */}
                {selectedMember.interests?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-neutral-500 uppercase mb-1.5">Intereses</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMember.interests.map((i: string) => (
                        <Badge key={i} variant="secondary" className="text-xs">{i}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Phase selector */}
                {canEdit && (
                  <div className="mt-4 p-3 bg-neutral-50 rounded-xl">
                    <p className="text-xs font-semibold text-neutral-500 uppercase mb-2">Cambiar fase</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(PHASES).map(([key, val]) => {
                        const Icon = val.icon
                        return (
                          <button
                            key={key}
                            onClick={() => handlePhaseChange(selectedMember._id, key)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                              selectedMember.phase === key
                                ? `${val.color} border-current`
                                : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                            }`}
                          >
                            <Icon className="w-3 h-3" />
                            {val.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {canEdit && selectedMember.phone && (
                    <Button size="sm" className="gap-1.5 bg-green-600 hover:bg-green-700"
                      onClick={() => setShowWhatsApp(true)}>
                      <MessageCircle className="w-4 h-4" /> WhatsApp
                    </Button>
                  )}
                  {canEdit && (
                    <Button size="sm" variant="outline" className="gap-1.5"
                      onClick={() => setShowFollowUp(true)}>
                      <Plus className="w-4 h-4" /> Registrar Seguimiento
                    </Button>
                  )}
                  {canEdit && !selectedMember.convertedToPersonId && selectedMember.phase !== 'INACTIVE' && (
                    <Button size="sm" variant="outline" className="gap-1.5 border-green-200 text-green-700 hover:bg-green-50"
                      onClick={() => handleConvert(selectedMember._id)}>
                      <UserCheck className="w-4 h-4" /> Convertir a Miembro
                    </Button>
                  )}
                </div>

                {/* Follow-up History */}
                <div className="mt-5">
                  <h4 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-neutral-500" />
                    Historial de Seguimiento
                    <Badge variant="secondary">{selectedMember.followUpHistory?.length || 0}</Badge>
                  </h4>
                  {(!selectedMember.followUpHistory || selectedMember.followUpHistory.length === 0) ? (
                    <p className="text-sm text-neutral-400 py-4 text-center">Sin registros de seguimiento</p>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {[...selectedMember.followUpHistory].reverse().map((entry: any, idx: number) => {
                        const ft = FOLLOWUP_TYPES[entry.type as keyof typeof FOLLOWUP_TYPES] || FOLLOWUP_TYPES.NOTE
                        const FTIcon = ft.icon
                        return (
                          <div key={entry._id || idx} className="flex items-start gap-3 p-3 rounded-lg bg-neutral-50/70 hover:bg-neutral-50 transition-colors">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${entry.type === 'WHATSAPP' ? 'bg-green-50' : 'bg-neutral-100'}`}>
                              <FTIcon className={`w-4 h-4 ${ft.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xs font-medium text-neutral-700">{ft.label}</span>
                                {entry.whatsappSent && <Badge className="bg-green-50 text-green-700 text-[9px] px-1.5">WA enviado</Badge>}
                              </div>
                              <p className="text-sm text-neutral-600">{entry.note}</p>
                              <div className="flex items-center gap-3 mt-1 text-[11px] text-neutral-400">
                                <span>{format(new Date(entry.date), "d MMM yyyy, h:mm a", { locale: es })}</span>
                                <span>por {entry.madeBy}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* ═══════════════ MODAL: WhatsApp ═══════════════ */}
      <Dialog open={showWhatsApp} onOpenChange={v => { if (!v) { setShowWhatsApp(false); setWaMessage('') } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              Enviar WhatsApp a {selectedMember?.fullName}
            </DialogTitle>
            <DialogDescription>
              Teléfono: {selectedMember?.phone}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Quick Templates */}
            <div>
              <Label className="mb-2 block text-xs font-semibold text-neutral-500 uppercase">Plantillas rápidas</Label>
              <div className="grid grid-cols-2 gap-2">
                {WA_TEMPLATES.map((tmpl, i) => (
                  <button
                    key={i}
                    onClick={() => setWaMessage(tmpl.message(selectedMember?.fullName || '', churchName))}
                    className="px-3 py-2 text-xs font-medium bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-100 transition-colors text-left"
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Mensaje</Label>
              <textarea
                value={waMessage}
                onChange={e => setWaMessage(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm min-h-[120px] focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all"
                placeholder="Escribe tu mensaje..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowWhatsApp(false); setWaMessage('') }}>Cancelar</Button>
            <Button onClick={handleSendWhatsApp} className="bg-green-600 hover:bg-green-700 gap-2">
              <Send className="w-4 h-4" />
              Enviar por WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════ MODAL: Add Follow-Up Entry ═══════════════ */}
      <Dialog open={showFollowUp} onOpenChange={v => { if (!v) setShowFollowUp(false) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Seguimiento</DialogTitle>
            <DialogDescription>Para: {selectedMember?.fullName}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <Label>Tipo de contacto</Label>
              <div className="flex gap-2 mt-1.5">
                {Object.entries(FOLLOWUP_TYPES).map(([key, val]) => {
                  const Icon = val.icon
                  return (
                    <button
                      key={key}
                      onClick={() => setFollowUpForm(f => ({ ...f, type: key }))}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                        followUpForm.type === key
                          ? `${val.color} bg-neutral-50 border-current`
                          : 'text-neutral-600 border-neutral-200 hover:bg-neutral-50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {val.label}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <Label>Nota / Detalle *</Label>
              <textarea
                value={followUpForm.note}
                onChange={e => setFollowUpForm(f => ({ ...f, note: e.target.value }))}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm min-h-[80px] focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all"
                placeholder="Describe el contacto realizado..."
              />
            </div>
            <div>
              <Label>¿Quién hizo el seguimiento? *</Label>
              <Input
                value={followUpForm.madeBy}
                onChange={e => setFollowUpForm(f => ({ ...f, madeBy: e.target.value }))}
                placeholder="Tu nombre"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFollowUp(false)}>Cancelar</Button>
            <Button onClick={handleAddFollowUp} className="bg-rose-600 hover:bg-rose-700 gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

export default NewMembersPage
