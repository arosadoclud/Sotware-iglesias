import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Baby, Heart, Droplets, Star, ClipboardList, Mic,
  Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, X
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { P } from '../../constants/permissions'
import { secretaryApi } from '../../lib/api'
import type {
  ChildPresentation, Wedding, Baptism, Conversion, BoardMinutes, Preacher
} from '../../types/secretary'

// ── Tipos ────────────────────────────────────────────────────────────────────
type TabKey = 'child-presentations' | 'weddings' | 'baptisms' | 'conversions' | 'board-minutes' | 'preachers'

interface Tab {
  key: TabKey
  label: string
  icon: React.ElementType
  color: string
}

const TABS: Tab[] = [
  { key: 'child-presentations', label: 'Niños',        icon: Baby,          color: 'text-pink-500' },
  { key: 'weddings',            label: 'Bodas',         icon: Heart,         color: 'text-rose-500' },
  { key: 'baptisms',            label: 'Bautizos',      icon: Droplets,      color: 'text-blue-500' },
  { key: 'conversions',         label: 'Conversiones',  icon: Star,          color: 'text-amber-500' },
  { key: 'board-minutes',       label: 'Actas',         icon: ClipboardList, color: 'text-indigo-500' },
  { key: 'preachers',           label: 'Predicadores',  icon: Mic,           color: 'text-emerald-500' },
]

// ── Campos de cada recurso ────────────────────────────────────────────────────
const FIELD_DEFS: Record<TabKey, { key: string; label: string; type?: string; required?: boolean; textarea?: boolean; options?: string[] }[]> = {
  'child-presentations': [
    { key: 'childName',         label: 'Nombre del niño/a',   required: true  },
    { key: 'birthDate',         label: 'Fecha de nacimiento', required: true,  type: 'date' },
    { key: 'presentationDate',  label: 'Fecha de presentación', required: true, type: 'date' },
    { key: 'fatherName',        label: 'Nombre del padre'     },
    { key: 'motherName',        label: 'Nombre de la madre'   },
    { key: 'address',           label: 'Dirección'            },
    { key: 'officiant',         label: 'Oficial que presentó' },
    { key: 'notes',             label: 'Notas', textarea: true },
  ],
  'weddings': [
    { key: 'groomName',        label: 'Nombre del novio',    required: true  },
    { key: 'brideName',        label: 'Nombre de la novia',  required: true  },
    { key: 'weddingDate',      label: 'Fecha de boda',       required: true, type: 'date' },
    { key: 'location',         label: 'Lugar'                },
    { key: 'officiant',        label: 'Oficial'              },
    { key: 'certificateNumber',label: 'Número de acta'       },
    { key: 'notes',            label: 'Notas', textarea: true },
  ],
  'baptisms': [
    { key: 'personName',   label: 'Nombre bautizado/a', required: true  },
    { key: 'baptismDate',  label: 'Fecha de bautismo',  required: true, type: 'date' },
    { key: 'birthDate',    label: 'Fecha de nacimiento',type: 'date'    },
    { key: 'officiant',    label: 'Oficial'             },
    { key: 'location',     label: 'Lugar'               },
    { key: 'notes',        label: 'Notas', textarea: true },
  ],
  'conversions': [
    { key: 'personName',     label: 'Nombre',          required: true },
    { key: 'conversionDate', label: 'Fecha',           required: true, type: 'date' },
    { key: 'context',        label: 'Contexto', options: ['Culto', 'Actividad especial', 'Visita pastoral', 'Otro'] },
    { key: 'officiant',      label: 'Oficial'          },
    { key: 'followUpPerson', label: 'Responsable seguimiento' },
    { key: 'notes',          label: 'Notas', textarea: true },
  ],
  'board-minutes': [
    { key: 'meetingDate',    label: 'Fecha de reunión', required: true, type: 'date' },
    { key: 'topics',         label: 'Temas tratados',   required: true, textarea: true },
    { key: 'agreements',     label: 'Acuerdos',         textarea: true },
    { key: 'recordedBy',     label: 'Secretario/a'      },
    { key: 'nextMeetingDate',label: 'Próxima reunión',  type: 'date'   },
    { key: 'notes',          label: 'Notas', textarea: true },
  ],
  'preachers': [
    { key: 'fullName',  label: 'Nombre completo',  required: true },
    { key: 'phone',     label: 'Teléfono'          },
    { key: 'email',     label: 'Correo', type: 'email' },
    { key: 'ministry',  label: 'Iglesia / Ministerio' },
    { key: 'topics',    label: 'Especialidad / Temas' },
    { key: 'lastVisit', label: 'Última visita', type: 'date' },
    { key: 'bio',       label: 'Biografía',    textarea: true },
    { key: 'notes',     label: 'Notas',        textarea: true },
  ],
}

// Columnas a mostrar en la tabla de cada recurso
const TABLE_COLS: Record<TabKey, { key: string; label: string }[]> = {
  'child-presentations': [
    { key: 'childName', label: 'Nombre' },
    { key: 'birthDate', label: 'Nacimiento' },
    { key: 'presentationDate', label: 'Presentación' },
    { key: 'fatherName', label: 'Padre' },
    { key: 'motherName', label: 'Madre' },
  ],
  'weddings': [
    { key: 'groomName', label: 'Novio' },
    { key: 'brideName', label: 'Novia' },
    { key: 'weddingDate', label: 'Fecha' },
    { key: 'location', label: 'Lugar' },
  ],
  'baptisms': [
    { key: 'personName', label: 'Nombre' },
    { key: 'baptismDate', label: 'Fecha bautismo' },
    { key: 'officiant', label: 'Oficial' },
    { key: 'location', label: 'Lugar' },
  ],
  'conversions': [
    { key: 'personName', label: 'Nombre' },
    { key: 'conversionDate', label: 'Fecha' },
    { key: 'context', label: 'Contexto' },
    { key: 'followUpPerson', label: 'Seguimiento' },
  ],
  'board-minutes': [
    { key: 'meetingDate', label: 'Fecha' },
    { key: 'topics', label: 'Temas' },
    { key: 'recordedBy', label: 'Secretario/a' },
    { key: 'nextMeetingDate', label: 'Próxima reunión' },
  ],
  'preachers': [
    { key: 'fullName', label: 'Nombre' },
    { key: 'ministry', label: 'Ministerio' },
    { key: 'phone', label: 'Teléfono' },
    { key: 'email', label: 'Correo' },
    { key: 'lastVisit', label: 'Última visita' },
  ],
}

const formatDate = (v?: string) => {
  if (!v) return '—'
  return new Date(v).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
}

const formatCell = (col: string, value: any) => {
  if (!value && value !== 0) return '—'
  if (col.toLowerCase().includes('date') || col.toLowerCase().includes('date')) {
    const d = new Date(value)
    if (!isNaN(d.getTime()) && col !== 'attendees') return formatDate(value)
  }
  if (typeof value === 'string' && value.length > 50) return value.substring(0, 50) + '…'
  return String(value)
}

// ── Componente Modal de formulario ────────────────────────────────────────────
interface RecordModalProps {
  tabKey: TabKey
  initial?: Record<string, any> | null
  onClose: () => void
  onSaved: () => void
}

function RecordModal({ tabKey, initial, onClose, onSaved }: RecordModalProps) {
  const isEdit = !!initial
  const fields = FIELD_DEFS[tabKey]

  const buildEmpty = () => fields.reduce((acc, f) => ({ ...acc, [f.key]: '' }), {} as Record<string, string>)
  const [form, setForm] = useState<Record<string, string>>(
    isEdit ? { ...buildEmpty(), ...initial } : buildEmpty()
  )
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (isEdit) {
        await secretaryApi.update(tabKey, initial!._id, form)
        toast.success('Registro actualizado')
      } else {
        await secretaryApi.create(tabKey, form)
        toast.success('Registro guardado')
      }
      onSaved()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col mx-4"
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? 'Editar registro' : 'Nuevo registro'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map(f => (
              <div key={f.key} className={f.textarea ? 'sm:col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {f.label} {f.required && <span className="text-red-500">*</span>}
                </label>
                {f.options ? (
                  <select
                    value={form[f.key] ?? ''}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                  >
                    <option value="">— Seleccionar —</option>
                    {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.textarea ? (
                  <textarea
                    rows={3}
                    value={form[f.key] ?? ''}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    required={f.required}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 resize-none"
                  />
                ) : (
                  <input
                    type={f.type || 'text'}
                    value={form[f.key] ?? ''}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    required={f.required}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                  />
                )}
              </div>
            ))}
          </div>
        </form>

        <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            onClick={e => { e.preventDefault(); document.querySelector<HTMLFormElement>('form')?.requestSubmit() }}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear registro'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function SecretaryPage() {
  const { hasPermission } = useAuthStore()
  const canCreate = hasPermission(P.SECRETARY_CREATE)
  const canEdit   = hasPermission(P.SECRETARY_EDIT)
  const canDelete = hasPermission(P.SECRETARY_DELETE)

  const [activeTab, setActiveTab] = useState<TabKey>('child-presentations')
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [page, setPage] = useState(1)
  const PER_PAGE = 15

  const [showModal, setShowModal] = useState(false)
  const [editRecord, setEditRecord] = useState<any | null>(null)

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { sort: '-createdAt', limit: 200 }
      if (search.trim()) params.search = search.trim()
      if (activeTab !== 'preachers') params.year = selectedYear
      const res = await secretaryApi.getAll(activeTab, params)
      setRecords(res.data?.data ?? [])
      setPage(1)
    } catch {
      toast.error('Error al cargar los registros')
    } finally {
      setLoading(false)
    }
  }, [activeTab, search, selectedYear])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este registro?')) return
    try {
      await secretaryApi.delete(activeTab, id)
      toast.success('Registro eliminado')
      fetchRecords()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i)
  const cols = TABLE_COLS[activeTab]

  const totalPages = Math.ceil(records.length / PER_PAGE)
  const paginated = records.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const tab = TABS.find(t => t.key === activeTab)!

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Secretaría</h1>
          <p className="text-sm text-gray-500 mt-1">Registros oficiales de la congregación</p>
        </div>
        {canCreate && (
          <button
            onClick={() => { setEditRecord(null); setShowModal(true) }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Nuevo registro
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(t => {
          const Icon = t.icon
          const isActive = t.key === activeTab
          return (
            <button
              key={t.key}
              onClick={() => { setActiveTab(t.key); setPage(1) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-white' : t.color}`} />
              {t.label}
              {!loading && isActive && (
                <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>
                  {records.length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
          />
        </div>
        {activeTab !== 'preachers' && (
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-white"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full mr-3" />
            Cargando…
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
            <tab.icon className={`h-12 w-12 ${tab.color} opacity-30`} />
            <p className="text-sm">No hay registros para {tab.label.toLowerCase()}</p>
            {canCreate && (
              <button
                onClick={() => { setEditRecord(null); setShowModal(true) }}
                className="mt-1 text-sm text-indigo-600 hover:underline font-medium"
              >
                + Crear primer registro
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {cols.map(c => (
                      <th key={c.key} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {c.label}
                      </th>
                    ))}
                    {(canEdit || canDelete) && (
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Acciones
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginated.map(record => (
                    <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                      {cols.map(c => (
                        <td key={c.key} className="px-4 py-3 text-gray-700">
                          {formatCell(c.key, record[c.key])}
                        </td>
                      ))}
                      {(canEdit || canDelete) && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {canEdit && (
                              <button
                                onClick={() => { setEditRecord(record); setShowModal(true) }}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(record._id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  Mostrando {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, records.length)} de {records.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-gray-700 px-2">{page}/{totalPages}</span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <RecordModal
            tabKey={activeTab}
            initial={editRecord}
            onClose={() => { setShowModal(false); setEditRecord(null) }}
            onSaved={() => { setShowModal(false); setEditRecord(null); fetchRecords() }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
