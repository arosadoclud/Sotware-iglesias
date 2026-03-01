import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import {
  Cake, Phone, Search, Edit2, Check, X, MessageCircle,
  ChevronUp, ChevronDown, AlertCircle, Users, Plus, Trash2,
} from 'lucide-react'
import { birthdaysApi } from '../../lib/api'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface BirthdayPerson {
  _id: string
  fullName: string
  phone?: string
  birthDate?: string
  daysUntil: number | null
  ministry?: string
  status: string
}

type SortField = 'name' | 'days' | 'ministry'
type SortDir   = 'asc' | 'desc'

interface FormState {
  fullName: string
  phone: string
  ministry: string
  birthDate: string
}
const emptyForm = (): FormState => ({ fullName: '', phone: '', ministry: '', birthDate: '' })

function getBadge(days: number | null) {
  if (days === null) return null
  if (days === 0) return { label: '🎂 ¡Hoy!', color: '#7c2d12', bg: '#fef2f2', border: '#fca5a5' }
  if (days <= 3)  return { label: `${days}d`,  color: '#92400e', bg: '#fffbeb', border: '#fcd34d' }
  if (days <= 7)  return { label: `${days}d`,  color: '#1e40af', bg: '#eff6ff', border: '#93c5fd' }
  return null
}

function formatBirthDate(iso: string): string {
  try {
    const [y, m, d] = iso.split('T')[0].split('-').map(Number)
    return format(new Date(y, m - 1, d), "d 'de' MMMM", { locale: es })
  } catch { return iso }
}

function buildWaMsg(person: BirthdayPerson): string {
  const dateStr  = person.birthDate ? formatBirthDate(person.birthDate) : ''
  const daysText =
    person.daysUntil === 0   ? 'hoy'
    : person.daysUntil === 1 ? 'mañana'
    : `en ${person.daysUntil} días`
  return encodeURIComponent(
    `Hola, te recuerdo que ${person.fullName} cumple años ${daysText}${dateStr ? ` (${dateStr})` : ''}. 🎂 ¡No olvides felicitarle!`
  )
}

// ── Modal crear / editar ──────────────────────────────────────────────────
function PersonModal({ title, initial, saving, onSave, onClose }: {
  title: string; initial: FormState; saving: boolean
  onSave: (f: FormState) => void; onClose: () => void
}) {
  const [form, setForm] = useState<FormState>(initial)
  const set = (k: keyof FormState, v: string) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Cake className="w-5 h-5 text-pink-500" />
            <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre completo *</label>
            <input type="text" value={form.fullName} onChange={e => set('fullName', e.target.value)}
              placeholder="Ej: Juan Pérez García"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
              <Phone className="w-3 h-3" /> Teléfono (WhatsApp)
            </label>
            <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
              placeholder="Ej: 50688887777"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Ministerio / Área</label>
            <input type="text" value={form.ministry} onChange={e => set('ministry', e.target.value)}
              placeholder="Ej: Alabanza, Jóvenes..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Fecha de cumpleaños</label>
            <input type="date" value={form.birthDate} onChange={e => set('birthDate', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} disabled={saving} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
            Cancelar
          </button>
          <button onClick={() => onSave(form)} disabled={saving || !form.fullName.trim()}
            className="px-5 py-2 rounded-lg bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold shadow-sm disabled:opacity-50 transition-colors flex items-center gap-2">
            {saving
              ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <Check className="w-4 h-4" />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Confirmar eliminación ─────────────────────────────────────────────────
function DeleteConfirm({ name, loading, onConfirm, onCancel }: {
  name: string; loading: boolean; onConfirm: () => void; onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-red-100"><Trash2 className="w-5 h-5 text-red-500" /></div>
          <h2 className="text-base font-bold text-gray-800">Eliminar persona</h2>
        </div>
        <p className="text-sm text-gray-600">
          ¿Eliminar a <span className="font-semibold">{name}</span>? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} disabled={loading} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">Cancelar</button>
          <button onClick={onConfirm} disabled={loading}
            className="px-5 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold flex items-center gap-2 transition-colors disabled:opacity-50">
            {loading
              ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <Trash2 className="w-4 h-4" />}
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────
export default function BirthdaysPage() {
  const [persons, setPersons]           = useState<BirthdayPerson[]>([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [sortField, setSortField]       = useState<SortField>('days')
  const [sortDir, setSortDir]           = useState<SortDir>('asc')
  const [showCreate, setShowCreate]     = useState(false)
  const [editTarget, setEditTarget]     = useState<BirthdayPerson | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BirthdayPerson | null>(null)
  const [saving, setSaving]             = useState(false)
  const [deleting, setDeleting]         = useState(false)

  useEffect(() => { fetchBirthdays() }, [])

  const fetchBirthdays = async () => {
    setLoading(true)
    try {
      const res = await birthdaysApi.getAll()
      setPersons(res.data.data)
    } catch {
      toast.error('Error al cargar los cumpleaños')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (form: FormState) => {
    setSaving(true)
    try {
      await birthdaysApi.create({
        fullName:  form.fullName,
        phone:     form.phone    || undefined,
        ministry:  form.ministry || undefined,
        birthDate: form.birthDate || null,
      })
      toast.success('Persona añadida correctamente')
      setShowCreate(false)
      await fetchBirthdays()
    } catch {
      toast.error('Error al añadir la persona')
    } finally { setSaving(false) }
  }

  const handleEdit = async (form: FormState) => {
    if (!editTarget) return
    setSaving(true)
    try {
      await birthdaysApi.updateFull(editTarget._id, {
        fullName:  form.fullName,
        phone:     form.phone    || undefined,
        ministry:  form.ministry || undefined,
        birthDate: form.birthDate || null,
      })
      toast.success('Datos actualizados')
      setEditTarget(null)
      await fetchBirthdays()
    } catch {
      toast.error('Error al actualizar')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await birthdaysApi.remove(deleteTarget._id)
      toast.success(`${deleteTarget.fullName} eliminado`)
      setDeleteTarget(null)
      await fetchBirthdays()
    } catch {
      toast.error('Error al eliminar')
    } finally { setDeleting(false) }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const upcoming7      = persons.filter(p => p.daysUntil !== null && p.daysUntil <= 7).length
  const upcoming3      = persons.filter(p => p.daysUntil !== null && p.daysUntil <= 3).length
  const todayBirthdays = persons.filter(p => p.daysUntil === 0)
  const withBirthDate  = persons.filter(p => p.birthDate).length

  const filtered = useMemo(() => {
    let list = [...persons]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.fullName.toLowerCase().includes(q) ||
        p.ministry?.toLowerCase().includes(q) ||
        p.phone?.includes(q)
      )
    }
    list.sort((a, b) => {
      let cmp = 0
      if (sortField === 'name')          cmp = a.fullName.localeCompare(b.fullName)
      else if (sortField === 'ministry') cmp = (a.ministry || '').localeCompare(b.ministry || '')
      else {
        if (a.daysUntil === null && b.daysUntil === null) cmp = 0
        else if (a.daysUntil === null) cmp = 1
        else if (b.daysUntil === null) cmp = -1
        else cmp = a.daysUntil - b.daysUntil
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [persons, search, sortField, sortDir])

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 opacity-30" />
    return sortDir === 'asc'
      ? <ChevronUp   className="w-3 h-3 text-blue-500" />
      : <ChevronDown className="w-3 h-3 text-blue-500" />
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-pink-100">
            <Cake className="w-6 h-6 text-pink-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cumpleaños</h1>
            <p className="text-sm text-gray-500">Gestiona y recuerda los cumpleaños de la congregación</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Nuevo miembro
        </button>
      </div>

      {/* Alerta de cumpleaños hoy */}
      {todayBirthdays.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 text-sm">🎂 ¡Cumpleaños hoy!</p>
            <p className="text-red-700 text-sm mt-0.5">{todayBirthdays.map(p => p.fullName).join(', ')}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total miembros',       value: persons.length, icon: Users, color: 'text-gray-600',  bg: 'bg-gray-50'  },
          { label: 'Con fecha registrada', value: withBirthDate,  icon: Cake,  color: 'text-pink-600',  bg: 'bg-pink-50'  },
          { label: 'Próximos 7 días',      value: upcoming7,      icon: Cake,  color: 'text-blue-600',  bg: 'bg-blue-50'  },
          { label: 'Próximos 3 días',      value: upcoming3,      icon: Cake,  color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 flex items-center gap-3`}>
            <s.icon className={`w-5 h-5 ${s.color} flex-shrink-0`} />
            <div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, ministerio o teléfono..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">
                  <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                    Nombre <SortIcon field="name" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">
                  <button onClick={() => handleSort('ministry')} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                    Ministerio <SortIcon field="ministry" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Teléfono</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">
                  <button onClick={() => handleSort('days')} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                    Cumpleaños <SortIcon field="days" />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Faltan</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-pink-300 border-t-pink-600 rounded-full animate-spin" />
                      Cargando...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    {search ? 'No se encontraron resultados.' : (
                      <div className="flex flex-col items-center gap-3">
                        <Cake className="w-10 h-10 text-gray-200" />
                        <p>No hay miembros registrados.</p>
                        <button
                          onClick={() => setShowCreate(true)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" /> Añadir primer miembro
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : filtered.map(person => {
                const badge = getBadge(person.daysUntil)
                const phone = person.phone?.replace(/\D/g, '')
                const waMsg = buildWaMsg(person)

                return (
                  <tr key={person._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-pink-600">
                            {person.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        {person.fullName}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-gray-500">
                      {person.ministry || <span className="text-gray-300">—</span>}
                    </td>

                    <td className="px-4 py-3 text-gray-500">
                      {person.phone || <span className="text-gray-300">—</span>}
                    </td>

                    <td className="px-4 py-3 text-gray-700">
                      {person.birthDate
                        ? formatBirthDate(person.birthDate)
                        : <span className="text-gray-300 italic">Sin fecha</span>}
                    </td>

                    <td className="px-4 py-3">
                      {badge ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold"
                          style={{ color: badge.color, background: badge.bg, border: `1px solid ${badge.border}` }}>
                          {badge.label}
                        </span>
                      ) : person.daysUntil !== null ? (
                        <span className="text-gray-400 text-xs">{person.daysUntil}d</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {phone && person.daysUntil !== null && person.daysUntil <= 7 && (
                          <a href={`https://wa.me/${phone}?text=${waMsg}`}
                            target="_blank" rel="noopener noreferrer"
                            title="Enviar recordatorio por WhatsApp"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#25D366] hover:bg-[#1ebe5d] transition-colors">
                            <MessageCircle className="w-3.5 h-3.5" /> Recordar
                          </a>
                        )}
                        <button onClick={() => setEditTarget(person)} title="Editar"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(person)} title="Eliminar"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-red-200" /> Hoy</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-amber-200" /> 1–3 días</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-blue-200" /> 4–7 días</span>
        <span className="flex items-center gap-1.5"><MessageCircle className="w-3 h-3 text-[#25D366]" /> WhatsApp aparece cuando faltan ≤ 7 días</span>
      </div>

      {/* Modales */}
      {showCreate && (
        <PersonModal title="Nuevo miembro" initial={emptyForm()} saving={saving}
          onSave={handleCreate} onClose={() => setShowCreate(false)} />
      )}
      {editTarget && (
        <PersonModal title="Editar miembro"
          initial={{
            fullName:  editTarget.fullName,
            phone:     editTarget.phone    ?? '',
            ministry:  editTarget.ministry ?? '',
            birthDate: editTarget.birthDate ? editTarget.birthDate.split('T')[0] : '',
          }}
          saving={saving} onSave={handleEdit} onClose={() => setEditTarget(null)} />
      )}
      {deleteTarget && (
        <DeleteConfirm name={deleteTarget.fullName} loading={deleting}
          onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  )
}