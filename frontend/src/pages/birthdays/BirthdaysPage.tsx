import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Cake, Phone, Search, Edit2, Check, X, MessageCircle, ChevronUp, ChevronDown, AlertCircle, Users } from 'lucide-react'
import { birthdaysApi } from '../../lib/api'
import { format, parseISO } from 'date-fns'
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
type SortDir = 'asc' | 'desc'

function getBadge(days: number | null): { label: string; color: string; bg: string; border: string } | null {
  if (days === null) return null
  if (days === 0) return { label: '🎂 ¡Hoy!', color: '#7c2d12', bg: '#fef2f2', border: '#fca5a5' }
  if (days <= 3) return { label: `${days}d`, color: '#92400e', bg: '#fffbeb', border: '#fcd34d' }
  if (days <= 7) return { label: `${days}d`, color: '#1e40af', bg: '#eff6ff', border: '#93c5fd' }
  return null
}

function formatBirthDate(iso: string): string {
  try {
    // Parse as local date to avoid timezone shift
    const [y, m, d] = iso.split('T')[0].split('-').map(Number)
    const date = new Date(y, m - 1, d)
    return format(date, "d 'de' MMMM", { locale: es })
  } catch {
    return iso
  }
}

function buildWhatsAppMessage(person: BirthdayPerson): string {
  const dateStr = person.birthDate ? formatBirthDate(person.birthDate) : ''
  const daysText =
    person.daysUntil === 0
      ? 'hoy'
      : person.daysUntil === 1
      ? 'mañana'
      : `en ${person.daysUntil} días`

  return encodeURIComponent(
    `Hola, te recuerdo que ${person.fullName} cumple años ${daysText}${dateStr ? ` (${dateStr})` : ''}. 🎂 ¡No olvides felicitarle!`
  )
}

export default function BirthdaysPage() {
  const [persons, setPersons] = useState<BirthdayPerson[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('days')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchBirthdays()
  }, [])

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

  const handleEdit = (p: BirthdayPerson) => {
    setEditingId(p._id)
    setEditValue(p.birthDate ? p.birthDate.split('T')[0] : '')
  }

  const handleSave = async (personId: string) => {
    setSaving(true)
    try {
      await birthdaysApi.update(personId, editValue || null)
      toast.success('Fecha de cumpleaños actualizada')
      setEditingId(null)
      await fetchBirthdays()
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditValue('')
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  // Stats
  const upcoming7 = persons.filter(p => p.daysUntil !== null && p.daysUntil <= 7).length
  const upcoming3 = persons.filter(p => p.daysUntil !== null && p.daysUntil <= 3).length
  const todayBirthdays = persons.filter(p => p.daysUntil === 0)
  const withBirthDate = persons.filter(p => p.birthDate).length

  const filtered = useMemo(() => {
    let list = [...persons]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.fullName.toLowerCase().includes(q) ||
        (p.ministry?.toLowerCase().includes(q)) ||
        (p.phone?.includes(q))
      )
    }
    list.sort((a, b) => {
      let cmp = 0
      if (sortField === 'name') cmp = a.fullName.localeCompare(b.fullName)
      else if (sortField === 'ministry') cmp = (a.ministry || '').localeCompare(b.ministry || '')
      else if (sortField === 'days') {
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
      ? <ChevronUp className="w-3 h-3 text-blue-500" />
      : <ChevronDown className="w-3 h-3 text-blue-500" />
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-pink-100">
          <Cake className="w-6 h-6 text-pink-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cumpleaños</h1>
          <p className="text-sm text-gray-500">Gestiona y recuerda los cumpleaños de los miembros</p>
        </div>
      </div>

      {/* Alert: birthdays today */}
      {todayBirthdays.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 text-sm">
              🎂 ¡Cumpleaños hoy!
            </p>
            <p className="text-red-700 text-sm mt-0.5">
              {todayBirthdays.map(p => p.fullName).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total miembros', value: persons.length, icon: Users, color: 'text-gray-600', bg: 'bg-gray-50' },
          { label: 'Con fecha registrada', value: withBirthDate, icon: Cake, color: 'text-pink-600', bg: 'bg-pink-50' },
          { label: 'Próximos 7 días', value: upcoming7, icon: Cake, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Próximos 3 días', value: upcoming3, icon: Cake, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} rounded-xl p-4 flex items-center gap-3`}>
            <stat.icon className={`w-5 h-5 ${stat.color} flex-shrink-0`} />
            <div>
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
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

      {/* Table */}
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
                    {search ? 'No se encontraron resultados.' : 'No hay miembros registrados.'}
                  </td>
                </tr>
              ) : (
                filtered.map(person => {
                  const badge = getBadge(person.daysUntil)
                  const isEditing = editingId === person._id
                  const phone = person.phone?.replace(/\D/g, '')
                  const waMsg = buildWhatsAppMessage(person)

                  return (
                    <tr key={person._id} className="hover:bg-gray-50 transition-colors">
                      {/* Name */}
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

                      {/* Ministry */}
                      <td className="px-4 py-3 text-gray-500">
                        {person.ministry || <span className="text-gray-300">—</span>}
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3 text-gray-500">
                        {person.phone || <span className="text-gray-300">—</span>}
                      </td>

                      {/* BirthDate */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="date"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => handleSave(person._id)}
                              disabled={saving}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Guardar"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancel}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                              title="Cancelar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-700">
                            {person.birthDate
                              ? formatBirthDate(person.birthDate)
                              : <span className="text-gray-300 italic">Sin fecha</span>}
                          </span>
                        )}
                      </td>

                      {/* Days until */}
                      <td className="px-4 py-3">
                        {badge ? (
                          <span
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold"
                            style={{ color: badge.color, background: badge.bg, border: `1px solid ${badge.border}` }}
                          >
                            {badge.label}
                          </span>
                        ) : person.daysUntil !== null ? (
                          <span className="text-gray-400 text-xs">{person.daysUntil}d</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {/* WhatsApp button — only if phone exists and daysUntil <= 7 */}
                          {phone && person.daysUntil !== null && person.daysUntil <= 7 && (
                            <a
                              href={`https://wa.me/${phone}?text=${waMsg}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Enviar recordatorio por WhatsApp"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#25D366] hover:bg-[#1ebe5d] transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              Recordar
                            </a>
                          )}
                          {/* Edit */}
                          {!isEditing && (
                            <button
                              onClick={() => handleEdit(person)}
                              title="Editar fecha de cumpleaños"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-red-200"></span> Hoy
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-amber-200"></span> 1–3 días
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-200"></span> 4–7 días
        </span>
        <span className="flex items-center gap-1.5">
          <MessageCircle className="w-3 h-3 text-[#25D366]" /> Botón WhatsApp aparece cuando faltan ≤ 7 días
        </span>
      </div>
    </div>
  )
}
