import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Baby, Heart, Droplets, Star, ClipboardList, Mic,
  Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, X,
  Calendar, MapPin, User, Phone, Mail, LayoutGrid, TableIcon,
  Users, FileText, CheckCircle2, Clock, Eye,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { P } from '../../constants/permissions'
import { secretaryApi } from '../../lib/api'

// ── Tipos ─────────────────────────────────────────────────────────────────
type TabKey = 'child-presentations' | 'weddings' | 'baptisms' | 'conversions' | 'board-minutes' | 'preachers'

interface Tab {
  key: TabKey
  label: string
  newLabel: string
  icon: React.ElementType
  color: string
  bg: string
  border: string
  accent: string
  badge: string
}

const TABS: Tab[] = [
  { key: 'child-presentations', label: 'Niños',       newLabel: 'Nuevo niño',        icon: Baby,          color: 'text-pink-600',    bg: 'bg-pink-50',    border: 'border-pink-200',   accent: 'bg-pink-100',   badge: 'bg-pink-100 text-pink-700' },
  { key: 'weddings',            label: 'Bodas',        newLabel: 'Nueva boda',        icon: Heart,         color: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-200',   accent: 'bg-rose-100',   badge: 'bg-rose-100 text-rose-700' },
  { key: 'baptisms',            label: 'Bautizos',     newLabel: 'Nuevo bautizo',     icon: Droplets,      color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',   accent: 'bg-blue-100',   badge: 'bg-blue-100 text-blue-700' },
  { key: 'conversions',         label: 'Conversiones', newLabel: 'Nuevo convertido',  icon: Star,          color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',  accent: 'bg-amber-100',  badge: 'bg-amber-100 text-amber-700' },
  { key: 'board-minutes',       label: 'Actas',        newLabel: 'Nueva acta',        icon: ClipboardList, color: 'text-indigo-600',  bg: 'bg-indigo-50',  border: 'border-indigo-200', accent: 'bg-indigo-100', badge: 'bg-indigo-100 text-indigo-700' },
  { key: 'preachers',           label: 'Predicadores', newLabel: 'Nuevo predicador',  icon: Mic,           color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200',accent: 'bg-emerald-100',badge: 'bg-emerald-100 text-emerald-700' },
]

// ── Campos de cada recurso ────────────────────────────────────────────────────
const FIELD_DEFS: Record<TabKey, { key: string; label: string; type?: string; required?: boolean; textarea?: boolean; options?: string[] }[]> = {
  'child-presentations': [
    { key: 'childName',         label: 'Nombre del niño/a',   required: true  },
    { key: 'sexo',              label: 'Sexo',                required: true,  options: ['Niño', 'Niña'] },
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

// ── Helpers ───────────────────────────────────────────────────────────────
const fmtDate = (v?: string) => {
  if (!v) return null
  return new Date(v).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
}

const initials = (name?: string) => {
  if (!name) return '?'
  return name.split(' ').filter(Boolean).slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
}

// ── Sub-componentes utilitarios ────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, truncate }: { icon: any; label: string; value: any; truncate?: boolean }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <span className="text-xs text-gray-400">{label}: </span>
        <span className={`text-xs text-gray-700 font-medium ${truncate ? 'truncate block' : ''}`}>{value}</span>
      </div>
    </div>
  )
}

function ActionMenu({ onEdit, onDelete, canEdit, canDelete, color }: any) {
  if (!canEdit && !canDelete) return null
  return (
    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0">
      {canEdit && (
        <button
          onClick={e => { e.stopPropagation(); onEdit() }}
          className={`p-1.5 rounded-lg hover:bg-white/70 ${color} transition-colors`}
          title="Editar"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
      {canDelete && (
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          className="p-1.5 rounded-lg hover:bg-white/70 text-red-400 hover:text-red-600 transition-colors"
          title="Eliminar"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

// ── Colores dinámicos por género ──────────────────────────────────────────
const GENDER_THEME = {
  'Niña': { bg: 'bg-pink-50',  border: 'border-pink-200',  accent: 'bg-pink-100',  color: 'text-pink-600',  badge: 'bg-pink-100 text-pink-600'  },
  'Niño': { bg: 'bg-blue-50',  border: 'border-blue-200',  accent: 'bg-blue-100',  color: 'text-blue-600',  badge: 'bg-blue-100 text-blue-600'  },
  '_':    { bg: 'bg-green-50', border: 'border-green-200', accent: 'bg-green-100', color: 'text-green-600', badge: 'bg-green-100 text-green-600' },
}

// ── Tarjetas especializadas ────────────────────────────────────────────────
function ChildCard({ r, tab, onEdit, onDelete, onView, canEdit, canDelete }: any) {
  const theme = GENDER_THEME[r.sexo as keyof typeof GENDER_THEME] ?? GENDER_THEME['_']
  return (
    <div onClick={onView} className={`bg-white rounded-2xl border ${theme.border} shadow-sm hover:shadow-md transition-all overflow-hidden group cursor-pointer`}>
      <div className={`${theme.bg} px-4 pt-4 pb-3 flex items-start justify-between`}>
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl ${theme.accent} flex items-center justify-center`}>
            <span className={`text-sm font-bold ${theme.color}`}>{initials(r.childName)}</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 leading-tight">{r.childName}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {r.sexo && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${theme.badge}`}>{r.sexo}</span>
              )}
              {r.birthDate && <p className="text-xs text-gray-500">Nac. {fmtDate(r.birthDate)}</p>}
            </div>
          </div>
        </div>
        <ActionMenu onEdit={onEdit} onDelete={onDelete} canEdit={canEdit} canDelete={canDelete} color={theme.color} />
      </div>
      <div className="px-4 py-3 space-y-2">
        <InfoRow icon={Calendar} label="Presentación" value={fmtDate(r.presentationDate)} />
        {(r.fatherName || r.motherName) && (
          <InfoRow icon={Users} label="Padres" value={[r.fatherName, r.motherName].filter(Boolean).join(' & ')} />
        )}
        {r.officiant && <InfoRow icon={User} label="Oficial" value={r.officiant} />}
      </div>
    </div>
  )
}

function WeddingCard({ r, tab, onEdit, onDelete, onView, canEdit, canDelete }: any) {
  return (
    <div onClick={onView} className={`bg-white rounded-2xl border ${tab.border} shadow-sm hover:shadow-md transition-all overflow-hidden group cursor-pointer`}>
      <div className={`${tab.bg} px-4 pt-4 pb-3 flex items-start justify-between`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900">{r.groomName}</span>
            <Heart className={`h-4 w-4 ${tab.color} flex-shrink-0`} />
            <span className="font-semibold text-gray-900">{r.brideName}</span>
          </div>
          {r.weddingDate && (
            <span className={`inline-flex items-center gap-1 mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${tab.badge}`}>
              <Calendar className="h-3 w-3" /> {fmtDate(r.weddingDate)}
            </span>
          )}
        </div>
        <ActionMenu onEdit={onEdit} onDelete={onDelete} canEdit={canEdit} canDelete={canDelete} color={tab.color} />
      </div>
      <div className="px-4 py-3 space-y-2">
        {r.location && <InfoRow icon={MapPin} label="Lugar" value={r.location} />}
        {r.officiant && <InfoRow icon={User} label="Oficial" value={r.officiant} />}
        {r.certificateNumber && <InfoRow icon={FileText} label="Acta N°" value={r.certificateNumber} />}
      </div>
    </div>
  )
}

function BaptismCard({ r, tab, onEdit, onDelete, onView, canEdit, canDelete }: any) {
  return (
    <div onClick={onView} className={`bg-white rounded-2xl border ${tab.border} shadow-sm hover:shadow-md transition-all overflow-hidden group cursor-pointer`}>
      <div className={`${tab.bg} px-4 pt-4 pb-3 flex items-start justify-between`}>
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl ${tab.accent} flex items-center justify-center`}>
            <Droplets className={`h-5 w-5 ${tab.color}`} />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{r.personName}</p>
            {r.baptismDate && (
              <span className={`inline-flex items-center gap-1 mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${tab.badge}`}>
                <Calendar className="h-3 w-3" /> {fmtDate(r.baptismDate)}
              </span>
            )}
          </div>
        </div>
        <ActionMenu onEdit={onEdit} onDelete={onDelete} canEdit={canEdit} canDelete={canDelete} color={tab.color} />
      </div>
      <div className="px-4 py-3 space-y-2">
        {r.birthDate && <InfoRow icon={Calendar} label="Nacimiento" value={fmtDate(r.birthDate)} />}
        {r.officiant && <InfoRow icon={User} label="Oficial" value={r.officiant} />}
        {r.location && <InfoRow icon={MapPin} label="Lugar" value={r.location} />}
      </div>
    </div>
  )
}

const CONTEXT_COLORS: Record<string, string> = {
  'Culto': 'bg-blue-100 text-blue-700',
  'Actividad especial': 'bg-green-100 text-green-700',
  'Visita pastoral': 'bg-purple-100 text-purple-700',
  'Otro': 'bg-gray-100 text-gray-600',
}

function ConversionCard({ r, tab, onEdit, onDelete, onView, canEdit, canDelete }: any) {
  return (
    <div onClick={onView} className={`bg-white rounded-2xl border ${tab.border} shadow-sm hover:shadow-md transition-all overflow-hidden group cursor-pointer`}>
      <div className={`${tab.bg} px-4 pt-4 pb-3 flex items-start justify-between`}>
        <div>
          <p className="font-semibold text-gray-900">{r.personName}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {r.conversionDate && (
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${tab.badge}`}>
                <Calendar className="h-3 w-3" /> {fmtDate(r.conversionDate)}
              </span>
            )}
            {r.context && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CONTEXT_COLORS[r.context] ?? 'bg-gray-100 text-gray-600'}`}>
                {r.context}
              </span>
            )}
          </div>
        </div>
        <ActionMenu onEdit={onEdit} onDelete={onDelete} canEdit={canEdit} canDelete={canDelete} color={tab.color} />
      </div>
      <div className="px-4 py-3 space-y-2">
        {r.officiant && <InfoRow icon={User} label="Oficial" value={r.officiant} />}
        {r.followUpPerson && <InfoRow icon={CheckCircle2} label="Seguimiento" value={r.followUpPerson} />}
      </div>
    </div>
  )
}

function BoardMinutesCard({ r, tab, onEdit, onDelete, onView, canEdit, canDelete }: any) {
  return (
    <div onClick={onView} className={`bg-white rounded-2xl border ${tab.border} shadow-sm hover:shadow-md transition-all overflow-hidden group cursor-pointer`}>
      <div className={`${tab.bg} px-4 pt-4 pb-3 flex items-start justify-between`}>
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className={`h-4 w-4 ${tab.color}`} />
            <span className="font-semibold text-gray-900">{r.meetingDate ? fmtDate(r.meetingDate) : 'Sin fecha'}</span>
          </div>
          {r.recordedBy && <p className="text-xs text-gray-500 mt-0.5">Sec: {r.recordedBy}</p>}
        </div>
        <ActionMenu onEdit={onEdit} onDelete={onDelete} canEdit={canEdit} canDelete={canDelete} color={tab.color} />
      </div>
      <div className="px-4 py-3 space-y-2">
        {r.topics && (
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Temas</p>
            <p className="text-sm text-gray-700 line-clamp-2">{r.topics}</p>
          </div>
        )}
        {r.nextMeetingDate && <InfoRow icon={Clock} label="Próxima reunión" value={fmtDate(r.nextMeetingDate)} />}
      </div>
    </div>
  )
}

function PreacherCard({ r, tab, onEdit, onDelete, onView, canEdit, canDelete }: any) {
  return (
    <div onClick={onView} className={`bg-white rounded-2xl border ${tab.border} shadow-sm hover:shadow-md transition-all overflow-hidden group cursor-pointer`}>
      <div className={`${tab.bg} px-4 pt-4 pb-3 flex items-start justify-between`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${tab.accent} flex items-center justify-center`}>
            <span className={`text-sm font-bold ${tab.color}`}>{initials(r.fullName)}</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">{r.fullName}</p>
            {r.ministry && <p className="text-xs text-gray-500 mt-0.5">{r.ministry}</p>}
          </div>
        </div>
        <ActionMenu onEdit={onEdit} onDelete={onDelete} canEdit={canEdit} canDelete={canDelete} color={tab.color} />
      </div>
      <div className="px-4 py-3 space-y-2">
        {r.phone && <InfoRow icon={Phone} label="Teléfono" value={r.phone} />}
        {r.email && <InfoRow icon={Mail} label="Correo" value={r.email} truncate />}
        {r.topics && <InfoRow icon={FileText} label="Especialidad" value={r.topics} />}
        {r.lastVisit && <InfoRow icon={Calendar} label="Última visita" value={fmtDate(r.lastVisit)} />}
      </div>
    </div>
  )
}

const CARD_RENDERERS: Record<TabKey, React.FC<any>> = {
  'child-presentations': ChildCard,
  'weddings': WeddingCard,
  'baptisms': BaptismCard,
  'conversions': ConversionCard,
  'board-minutes': BoardMinutesCard,
  'preachers': PreacherCard,
}

// ── Tabla genérica (vista secundaria) ─────────────────────────────────────
const TABLE_COLS: Record<TabKey, { key: string; label: string }[]> = {
  'child-presentations': [
    { key: 'childName', label: 'Nombre' }, { key: 'birthDate', label: 'Nacimiento' },
    { key: 'presentationDate', label: 'Presentación' }, { key: 'fatherName', label: 'Padre' }, { key: 'motherName', label: 'Madre' },
  ],
  'weddings': [
    { key: 'groomName', label: 'Novio' }, { key: 'brideName', label: 'Novia' },
    { key: 'weddingDate', label: 'Fecha' }, { key: 'location', label: 'Lugar' },
  ],
  'baptisms': [
    { key: 'personName', label: 'Nombre' }, { key: 'baptismDate', label: 'Fecha bautismo' },
    { key: 'officiant', label: 'Oficial' }, { key: 'location', label: 'Lugar' },
  ],
  'conversions': [
    { key: 'personName', label: 'Nombre' }, { key: 'conversionDate', label: 'Fecha' },
    { key: 'context', label: 'Contexto' }, { key: 'followUpPerson', label: 'Seguimiento' },
  ],
  'board-minutes': [
    { key: 'meetingDate', label: 'Fecha' }, { key: 'topics', label: 'Temas' },
    { key: 'recordedBy', label: 'Secretario/a' }, { key: 'nextMeetingDate', label: 'Próxima reunión' },
  ],
  'preachers': [
    { key: 'fullName', label: 'Nombre' }, { key: 'ministry', label: 'Ministerio' },
    { key: 'phone', label: 'Teléfono' }, { key: 'email', label: 'Correo' }, { key: 'lastVisit', label: 'Última visita' },
  ],
}

function TableView({ tab, records, canEdit, canDelete, onEdit, onDelete, onView }: any) {
  const cols = TABLE_COLS[tab.key as TabKey]
  const fmtCell = (col: string, v: any) => {
    if (!v && v !== 0) return '—'
    if (col.toLowerCase().includes('date')) { const d = new Date(v); if (!isNaN(d.getTime())) return fmtDate(v) ?? '—' }
    if (typeof v === 'string' && v.length > 60) return v.substring(0, 60) + '…'
    return String(v)
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className={`${tab.bg} border-b ${tab.border}`}>
          <tr>
            {cols.map((c: any) => (
              <th key={c.key} className={`text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide ${tab.color}`}>{c.label}</th>
            ))}
            <th className={`px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide ${tab.color}`}>Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {records.map((record: any) => (
            <tr
              key={record._id}
              onClick={() => onView(record)}
              className="hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {cols.map((c: any) => (
                <td key={c.key} className="px-4 py-3 text-gray-700">{fmtCell(c.key, record[c.key])}</td>
              ))}
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={e => { e.stopPropagation(); onView(record) }}
                    className={`p-1.5 text-gray-400 hover:${tab.color.replace('text-', 'text-')} hover:bg-gray-100 rounded-lg transition-colors`}
                    title="Ver detalle"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {canEdit && (
                    <button onClick={e => { e.stopPropagation(); onEdit(record) }} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Editar"><Pencil className="h-4 w-4" /></button>
                  )}
                  {canDelete && (
                    <button onClick={e => { e.stopPropagation(); onDelete(record._id) }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar"><Trash2 className="h-4 w-4" /></button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Pagination({ page, total, count, perPage, onChange }: { page: number; total: number; count: number; perPage: number; onChange: (p: number) => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
      <span className="text-xs text-gray-400">
        {(page - 1) * perPage + 1}–{Math.min(page * perPage, count)} de {count} registros
      </span>
      <div className="flex items-center gap-1">
        <button disabled={page === 1} onClick={() => onChange(page - 1)} className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {Array.from({ length: Math.min(total, 5) }, (_, i) => {
          const p = total <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, total - 4)) + i
          return (
            <button key={p} onClick={() => onChange(p)} className={`w-7 h-7 text-xs rounded-lg transition-colors ${p === page ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
              {p}
            </button>
          )
        })}
        <button disabled={page === total} onClick={() => onChange(page + 1)} className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ── Modal de detalle ─────────────────────────────────────────────────────────
function DetailModal({ record, tab, onClose, onEdit, canEdit }: { record: any; tab: typeof TABS[number]; onClose: () => void; onEdit: () => void; canEdit: boolean }) {
  const Icon = tab.icon
  const fields = FIELD_DEFS[tab.key as TabKey]

  const displayValue = (f: typeof fields[number]) => {
    const v = record[f.key]
    if (!v && v !== 0) return null
    if (f.type === 'date') return fmtDate(v)
    return String(v)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className={`${tab.bg} px-6 py-4 border-b ${tab.border} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${tab.accent} flex items-center justify-center`}>
              <Icon className={`h-5 w-5 ${tab.color}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{tab.label}</p>
              <h2 className="text-base font-semibold text-gray-900">Detalle del registro</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-black/5 rounded-xl transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="overflow-y-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map(f => {
              const val = displayValue(f)
              if (!val) return null
              return (
                <div key={f.key} className={`${f.textarea ? 'sm:col-span-2' : ''}`}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{f.label}</p>
                  <p className={`text-sm text-gray-800 font-medium ${f.textarea ? 'whitespace-pre-wrap' : ''}`}>{val}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
          {canEdit && (
            <button
              onClick={onEdit}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-xl transition-colors shadow-sm
                ${tab.color === 'text-pink-600' ? 'bg-pink-500 hover:bg-pink-600' :
                  tab.color === 'text-rose-600' ? 'bg-rose-500 hover:bg-rose-600' :
                  tab.color === 'text-blue-600' ? 'bg-blue-500 hover:bg-blue-600' :
                  tab.color === 'text-amber-600' ? 'bg-amber-500 hover:bg-amber-600' :
                  tab.color === 'text-indigo-600' ? 'bg-indigo-500 hover:bg-indigo-600' :
                  'bg-emerald-500 hover:bg-emerald-600'}`}
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// ── Modal de formulario ───────────────────────────────────────────────────────
interface RecordModalProps {
  tab: typeof TABS[number]
  initial?: Record<string, any> | null
  onClose: () => void
  onSaved: () => void
}

function RecordModal({ tab, initial, onClose, onSaved }: RecordModalProps) {
  const isEdit = !!initial
  const fields = FIELD_DEFS[tab.key as TabKey]
  const Icon = tab.icon

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
        await secretaryApi.update(tab.key, initial!._id, form)
        toast.success('Registro actualizado')
      } else {
        await secretaryApi.create(tab.key, form)
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header coloreado */}
        <div className={`${tab.bg} px-6 py-4 border-b ${tab.border} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${tab.accent} flex items-center justify-center`}>
              <Icon className={`h-5 w-5 ${tab.color}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{tab.label}</p>
              <h2 className="text-base font-semibold text-gray-900 leading-tight">
                {isEdit ? 'Editar registro' : `Nuevo registro`}
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-black/5 rounded-xl transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form id="record-form" onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map(f => (
              <div key={f.key} className={f.textarea ? 'sm:col-span-2' : ''}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {f.label} {f.required && <span className="text-red-500">*</span>}
                </label>
                {f.options ? (
                  <select
                    value={form[f.key] ?? ''}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className={`w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors`}
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
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 resize-none transition-colors"
                  />
                ) : (
                  <input
                    type={f.type || 'text'}
                    value={form[f.key] ?? ''}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    required={f.required}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
                  />
                )}
              </div>
            ))}
          </div>
        </form>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="record-form"
            disabled={saving}
            className={`px-5 py-2 text-sm font-medium text-white rounded-xl transition-colors disabled:opacity-50 shadow-sm
              ${tab.color === 'text-pink-600' ? 'bg-pink-500 hover:bg-pink-600' :
                tab.color === 'text-rose-600' ? 'bg-rose-500 hover:bg-rose-600' :
                tab.color === 'text-blue-600' ? 'bg-blue-500 hover:bg-blue-600' :
                tab.color === 'text-amber-600' ? 'bg-amber-500 hover:bg-amber-600' :
                tab.color === 'text-indigo-600' ? 'bg-indigo-500 hover:bg-indigo-600' :
                'bg-emerald-500 hover:bg-emerald-600'}`}
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

  const [activeTab, setActiveTab]     = useState<TabKey>('child-presentations')
  const [records, setRecords]         = useState<any[]>([])
  const [loading, setLoading]         = useState(false)
  const [search, setSearch]           = useState('')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [page, setPage]               = useState(1)
  const [viewMode, setViewMode]       = useState<'cards' | 'table'>('cards')
  const [stats, setStats]             = useState<Record<string, number>>({})
  const [showModal, setShowModal]     = useState(false)
  const [editRecord, setEditRecord]   = useState<any | null>(null)
  const [viewRecord, setViewRecord]   = useState<any | null>(null)

  const PER_PAGE = viewMode === 'cards' ? 12 : 15

  const STATS_KEY: Record<TabKey, string> = {
    'child-presentations': 'childPresentations',
    'weddings': 'weddings',
    'baptisms': 'baptisms',
    'conversions': 'conversions',
    'board-minutes': 'boardMinutes',
    'preachers': 'preachers',
  }

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

  const fetchStats = useCallback(async () => {
    try {
      const res = await secretaryApi.getStats(selectedYear)
      setStats(res.data ?? {})
    } catch { /* silencioso */ }
  }, [selectedYear])

  useEffect(() => { fetchRecords(); fetchStats() }, [fetchRecords, fetchStats])

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este registro?')) return
    try {
      await secretaryApi.delete(activeTab, id)
      toast.success('Registro eliminado')
      fetchRecords(); fetchStats()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i)

  const totalPages = Math.ceil(records.length / PER_PAGE)
  const paginated  = records.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const tab = TABS.find(t => t.key === activeTab)!
  const CardRenderer = CARD_RENDERERS[activeTab]

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
            className="flex items-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-xl shadow-sm transition-colors bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            {tab.newLabel}
          </button>
        )}
      </div>

      {/* Stats banner */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {TABS.map(t => {
          const TIcon = t.icon
          const isActive = t.key === activeTab
          const count = stats[STATS_KEY[t.key as TabKey]] ?? '—'
          return (
            <button
              key={t.key}
              onClick={() => { setActiveTab(t.key); setPage(1) }}
              className={`flex flex-col items-center gap-1 p-3 rounded-2xl border transition-all text-center
                ${isActive
                  ? `${t.bg} ${t.border} shadow-sm scale-105`
                  : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
                }`}
            >
              <TIcon className={`h-5 w-5 ${isActive ? t.color : 'text-gray-400'}`} />
              <span className={`text-lg font-bold leading-none ${isActive ? t.color : 'text-gray-700'}`}>{count}</span>
              <span className={`text-[10px] font-medium leading-tight ${isActive ? t.color : 'text-gray-400'}`}>{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* Filtros + toggle de vista */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={`Buscar en ${tab.label.toLowerCase()}…`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 bg-gray-50 focus:bg-white transition-colors"
          />
        </div>
        {activeTab !== 'preachers' && (
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-colors"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
        {/* View mode toggle */}
        <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('cards')}
            title="Vista tarjetas"
            className={`p-2 rounded-lg transition-all ${viewMode === 'cards' ? `bg-white shadow-sm ${tab.color}` : 'text-gray-400 hover:text-gray-600'}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            title="Vista tabla"
            className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? `bg-white shadow-sm ${tab.color}` : 'text-gray-400 hover:text-gray-600'}`}
          >
            <TableIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className={`bg-white rounded-2xl border ${tab.border} shadow-sm overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 gap-3">
            <div className={`animate-spin h-6 w-6 border-2 border-t-transparent rounded-full ${tab.color.replace('text-', 'border-')}`} />
            <span className="text-sm">Cargando {tab.label.toLowerCase()}…</span>
          </div>
        ) : records.length === 0 ? (
          <div className={`m-4 rounded-2xl border-2 border-dashed ${tab.border} ${tab.bg} flex flex-col items-center justify-center py-16 gap-4`}>
            <div className={`w-16 h-16 rounded-2xl ${tab.accent} flex items-center justify-center`}>
              <tab.icon className={`h-8 w-8 ${tab.color} opacity-60`} />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-gray-700">Sin registros de {tab.label.toLowerCase()}</p>
              <p className="text-sm text-gray-400 mt-1">
                {activeTab !== 'preachers' ? `No hay registros en el año ${selectedYear}.` : 'No hay predicadores registrados.'}
              </p>
            </div>
            {canCreate && (
              <button
                onClick={() => { setEditRecord(null); setShowModal(true) }}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border ${tab.border} ${tab.color} ${tab.bg} hover:shadow-sm transition-all`}
              >
                <Plus className="h-4 w-4" />
                Crear primer registro
              </button>
            )}
          </div>
        ) : viewMode === 'table' ? (
          <>
            <TableView
              tab={tab}
              records={paginated}
              canEdit={canEdit}
              canDelete={canDelete}
              onEdit={(r: any) => { setEditRecord(r); setShowModal(true) }}
              onDelete={handleDelete}
              onView={(r: any) => setViewRecord(r)}
            />
            {totalPages > 1 && (
              <Pagination page={page} total={totalPages} count={records.length} perPage={PER_PAGE} onChange={setPage} />
            )}
          </>
        ) : (
          <div className="p-4">
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {paginated.map((record, i) => (
                  <motion.div
                    key={record._id}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04, duration: 0.2 }}
                    className="group"
                  >
                    <CardRenderer
                      r={record}
                      tab={tab}
                      canEdit={canEdit}
                      canDelete={canDelete}
                      onView={() => setViewRecord(record)}
                      onEdit={() => { setEditRecord(record); setShowModal(true) }}
                      onDelete={() => handleDelete(record._id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
            {totalPages > 1 && (
              <div className="mt-4">
                <Pagination page={page} total={totalPages} count={records.length} perPage={PER_PAGE} onChange={setPage} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal detalle */}
      <AnimatePresence>
        {viewRecord && (
          <DetailModal
            record={viewRecord}
            tab={tab}
            onClose={() => setViewRecord(null)}
            canEdit={canEdit}
            onEdit={() => { setEditRecord(viewRecord); setViewRecord(null); setShowModal(true) }}
          />
        )}
      </AnimatePresence>

      {/* Modal formulario */}
      <AnimatePresence>
        {showModal && (
          <RecordModal
            tab={tab}
            initial={editRecord}
            onClose={() => { setShowModal(false); setEditRecord(null) }}
            onSaved={() => { setShowModal(false); setEditRecord(null); fetchRecords(); fetchStats() }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
