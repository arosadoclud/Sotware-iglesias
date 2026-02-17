import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { programsApi, churchesApi } from '../../lib/api'
import { shareMultiplePdfsViaWhatsApp } from '../../lib/shareWhatsApp'
import { toDateStr, safeDateParse } from '../../lib/utils'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Loader2, ArrowLeft, Download, FileText, ChevronLeft, ChevronRight,
  CheckCircle, Calendar, Clock, Users, MessageCircle
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'

// ── Types ────────────────────────────────────────────────────────────────────

interface ProgramData {
  _id: string
  activityType: { id: string; name: string }
  programDate: string
  programTime?: string
  ampm?: string
  defaultTime?: string
  verse?: string
  status: string
  church?: { name: string; subTitle?: string; location?: string; logoUrl?: string }
  churchName?: string
  churchSub?: string
  location?: string
  logoUrl?: string
  assignments: Array<{
    sectionOrder: number
    sectionName: string
    roleName: string
    person?: { id: string; name: string; phone?: string }
  }>
  // Cleaning groups fields
  generationType?: 'standard' | 'cleaning_groups'
  assignedGroupNumber?: number
  totalGroups?: number
  cleaningMembers?: Array<{
    id: string
    name: string
    phone?: string
  }>
}

// ── Constants ────────────────────────────────────────────────────────────────

const C = {
  navy: '#1B2D5B',
  navyMid: '#2A4080',
  gold: '#C8A84B',
  goldLight: '#E8C96A',
  goldPale: '#FBF4E2',
  gray900: '#111827',
  gray700: '#374151',
  gray500: '#6B7280',
  gray300: '#D1D5DB',
  gray100: '#F3F4F6',
  white: '#FFFFFF',
}

const F = {
  body: "'DM Sans', sans-serif",
  display: "'Cormorant Garamond', serif",
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function toLocalDateStr(dateVal: string): string {
  if (!dateVal) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) return dateVal
  if (dateVal.includes('T')) return dateVal.slice(0, 10)
  const d = new Date(dateVal + 'T12:00:00')
  if (isNaN(d.getTime())) return dateVal
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDateES(dateStr: string): string {
  if (!dateStr) return ''
  // Usar fecha LOCAL para evitar desfase de timezone (UTC vs local)
  const dateOnly = dateStr.length > 10 ? toLocalDateStr(dateStr) : dateStr
  const d = new Date(dateOnly + 'T12:00:00')
  if (isNaN(d.getTime())) return dateStr // fallback si es inválida
  
  // Usar date-fns es-ES para consistencia con el resto de la app
  const formatted = format(d, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function formatTimeDisplay(prog: ProgramData): string {
  const time = prog.programTime || prog.defaultTime || ''
  if (!time) return ''
  if (time.includes('AM') || time.includes('PM')) return time
  const parts = time.split(':')
  const h = parseInt(parts[0])
  const m = parts[1] || '00'
  const ampm = prog.ampm || (h >= 12 ? 'PM' : 'AM')
  const h12 = h % 12 || 12
  return `${h12}:${m.padStart(2, '0')} ${ampm}`
}

// ── Flyer Preview Component ─────────────────────────────────────────────────

const FlyerMiniPreview = ({ prog, churchInfo }: { prog: ProgramData; churchInfo?: any }) => {
  const churchName = prog.church?.name || prog.churchName || churchInfo?.name || 'Iglesia'
  const logoUrl = prog.logoUrl || prog.church?.logoUrl || churchInfo?.logoUrl || ''
  // logoUrl puede venir como "/uploads/file.png" o solo "file.png"
  const logoSrc = logoUrl
    ? (logoUrl.startsWith('/') ? logoUrl : `/uploads/${logoUrl}`)
    : '/uploads/logo.png'

  return (
    <div style={{
      background: C.white, borderRadius: 12, overflow: 'hidden', width: '100%',
      boxShadow: '0 10px 40px rgba(0,0,0,0.14)',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1B2D5B 0%, #2A4080 60%, #1B2D5B 100%)',
        padding: '1.8rem 1.5rem 1.2rem', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, background: 'rgba(200,168,75,0.08)', borderRadius: '50%' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative', zIndex: 1 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: F.display, fontSize: '1.1rem', fontWeight: 700, color: 'white', lineHeight: 1.1 }}>{churchName}</div>
          </div>
          <img src={logoSrc} alt="" style={{ width: 45, height: 45, borderRadius: 8, objectFit: 'contain', border: '2px solid rgba(200,168,75,0.4)', background: 'rgba(255,255,255,0.1)' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        </div>
      </div>

      {/* Gold band */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${C.gold} 0%, ${C.goldLight} 50%, ${C.gold} 100%)` }} />

      {/* Badge & Date */}
      <div style={{ textAlign: 'center', padding: '0.8rem 1rem 0.3rem' }}>
        <div style={{ display: 'inline-block', background: C.gold, color: C.navy, fontFamily: F.display, fontSize: '0.85rem', fontWeight: 700, padding: '4px 16px', borderRadius: 20, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {prog.activityType?.name || 'Culto'}
        </div>
        <div style={{ fontFamily: F.display, fontSize: '0.85rem', color: C.navy, fontWeight: 600, marginTop: 4 }}>
          {formatDateES(prog.programDate)}
        </div>
        <div style={{ fontSize: '0.7rem', color: C.gray500, marginTop: 1 }}>
          {formatTimeDisplay(prog)}
        </div>
      </div>

      {/* Ornament */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.3rem 1.5rem' }}>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${C.gray300}, transparent)` }} />
        {[0.7, 1, 0.7].map((op, i) => (
          <span key={i} style={{ display: 'block', width: 4, height: 4, background: C.gold, transform: 'rotate(45deg)', opacity: op }} />
        ))}
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${C.gray300}, transparent)` }} />
      </div>

      {/* Section title */}
      <div style={{ textAlign: 'center', fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.navy, paddingBottom: '0.4rem' }}>
        {prog.generationType === 'cleaning_groups' ? `Grupo ${prog.assignedGroupNumber} de ${prog.totalGroups}` : 'Orden del Culto'}
      </div>

      {/* Assignments/Members table */}
      <div style={{ padding: '0 1rem 0.8rem' }}>
        {prog.generationType === 'cleaning_groups' ? (
          // Cleaning group members
          (prog.cleaningMembers || []).map((m, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', padding: '6px 8px', borderRadius: 6, marginBottom: 2, minHeight: 32,
              background: i % 2 === 0 ? C.gray100 : C.white,
              border: i % 2 === 1 ? `1px solid ${C.gray100}` : 'none',
            }}>
              <div style={{ flexShrink: 0, width: 18, height: 18, background: '#f59e0b', color: C.white, borderRadius: 4, fontSize: '0.55rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <div style={{ flex: 1, fontFamily: F.display, fontSize: '0.8rem', fontWeight: 600, color: C.gray900 }}>
                {m.name}
              </div>
              {m.phone && (
                <div style={{ fontSize: '0.6rem', color: C.gray500 }}>
                  {m.phone}
                </div>
              )}
            </div>
          ))
        ) : (
          // Standard assignments
          (prog.assignments || []).map((a, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', padding: '6px 8px', borderRadius: 6, marginBottom: 2, minHeight: 32,
              background: i % 2 === 0 ? C.gray100 : C.white,
              border: i % 2 === 1 ? `1px solid ${C.gray100}` : 'none',
            }}>
              <div style={{ flexShrink: 0, width: 18, height: 18, background: C.navy, color: C.goldLight, borderRadius: 4, fontSize: '0.55rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
                {String(a.sectionOrder).padStart(2, '0')}
              </div>
              <div style={{ flexShrink: 0, width: 100, fontSize: '0.7rem', fontWeight: 600, color: C.navy }}>
                {a.roleName || a.sectionName}
              </div>
              {a.person?.name ? (
                <div style={{ flex: 1, fontFamily: F.display, fontSize: '0.8rem', fontWeight: 600, color: C.gray900, fontStyle: 'italic' }}>
                  {a.person.name}
                </div>
              ) : (
                <div style={{ flex: 1, color: C.gray300, fontSize: '0.65rem' }}>
                  - - - - - - -
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Verse */}
      {prog.verse && (
        <div style={{ textAlign: 'center', padding: '0.5rem 1.5rem 0.3rem', borderTop: `1px solid ${C.gray100}`, margin: '0 1rem' }}>
          <p style={{ fontFamily: F.display, fontSize: '0.72rem', fontStyle: 'italic', color: C.gray500, lineHeight: 1.4, margin: 0 }}>
            {prog.verse}
          </p>
        </div>
      )}

      {/* Footer */}
      <div style={{ background: C.navy, padding: '8px 1.5rem', textAlign: 'center', marginTop: '0.5rem' }}>
        <span style={{ fontSize: '0.6rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {churchName.toUpperCase()}
        </span>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

const BatchReviewPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const ids = searchParams.get('ids')?.split(',').filter(Boolean) || []

  const [programs, setPrograms] = useState<ProgramData[]>([])
  const [churchInfo, setChurchInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [downloadingAll, setDownloadingAll] = useState(false)
  const [sharingWhatsApp, setSharingWhatsApp] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    if (ids.length === 0) {
      setLoading(false)
      return
    }
    Promise.all([
      // Cargar todos los programas
      Promise.all(ids.map(id => programsApi.get(id).then(r => r.data.data).catch(() => null))),
      // Cargar info de la iglesia como fallback
      churchesApi.getMine().then(r => r.data.data).catch(() => null),
    ])
      .then(([programResults, church]) => {
        setPrograms(programResults.filter(Boolean) as ProgramData[])
        if (church) setChurchInfo(church)
      })
      .finally(() => setLoading(false))
  }, [])

  // Google fonts
  useEffect(() => {
    const id = 'batch-google-fonts'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap'
    document.head.appendChild(link)
  }, [])

  const handleDownloadPdf = useCallback(async (progId: string) => {
    setDownloadingId(progId)
    try {
      const res = await programsApi.downloadPdf(progId)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      const prog = programs.find(p => p._id === progId)
      const dateStr = prog ? toDateStr(prog.programDate) : progId
      const actName = prog?.activityType?.name?.replace(/\s+/g, '-') || 'programa'
      a.download = `${actName}-${dateStr}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('PDF descargado')
    } catch {
      toast.error('Error al generar PDF')
    }
    setDownloadingId(null)
  }, [programs])

  const handleDownloadAll = useCallback(async () => {
    setDownloadingAll(true)
    let success = 0
    for (const prog of programs) {
      try {
        const res = await programsApi.downloadPdf(prog._id)
        const url = window.URL.createObjectURL(new Blob([res.data]))
        const a = document.createElement('a')
        a.href = url
        const dateStr = toDateStr(prog.programDate)
        const actName = prog.activityType?.name?.replace(/\s+/g, '-') || 'programa'
        a.download = `${actName}-${dateStr}.pdf`
        a.click()
        window.URL.revokeObjectURL(url)
        success++
        // Small delay between downloads
        await new Promise(r => setTimeout(r, 500))
      } catch {
        toast.error(`Error con programa del ${format(safeDateParse(prog.programDate), "d MMM", { locale: es })}`)
      }
    }
    toast.success(`${success} PDF${success !== 1 ? 's' : ''} descargado${success !== 1 ? 's' : ''}`)
    setDownloadingAll(false)
  }, [programs])

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
    </div>
  )

  if (programs.length === 0) return (
    <div className="flex flex-col items-center py-20 gap-4">
      <p className="text-neutral-500">No se encontraron programas</p>
      <Button onClick={() => navigate('/programs/generate')} variant="outline">
        <ArrowLeft className="w-4 h-4 mr-2" /> Volver a generar
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Button variant="ghost" onClick={() => navigate('/programs')} className="mb-4 gap-2">
            <ArrowLeft className="w-4 h-4" /> Volver a Programas
          </Button>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">
                  Programas Generados por Lote
                </h1>
                <p className="text-neutral-500 text-sm">
                  {programs.length} programa{programs.length !== 1 ? 's' : ''} - {programs[0]?.activityType?.name}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={async () => {
                  setSharingWhatsApp(true)
                  try {
                    const cName = programs[0]?.church?.name || programs[0]?.churchName || churchInfo?.name
                    await shareMultiplePdfsViaWhatsApp(
                      programs.map(p => ({
                        _id: p._id,
                        activityType: p.activityType,
                        programDate: p.programDate,
                        churchName: p.church?.name || p.churchName || churchInfo?.name,
                      })),
                      cName
                    )
                  } finally {
                    setSharingWhatsApp(false)
                  }
                }}
                disabled={sharingWhatsApp}
                variant="outline"
                className="gap-2 text-green-600 border-green-200 hover:bg-green-50 disabled:opacity-50"
              >
                {sharingWhatsApp
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <MessageCircle className="w-4 h-4" />
                }
                Compartir PDFs por WhatsApp
              </Button>
              <Button
                onClick={handleDownloadAll}
                disabled={downloadingAll}
                className="gap-2"
              >
                {downloadingAll ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {downloadingAll ? 'Descargando...' : `Descargar Todos (${programs.length} PDFs)`}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Grid de flyers */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {programs.map((prog, i) => (
            <motion.div
              key={prog._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex flex-col gap-3"
            >
              {/* Flyer preview */}
              <FlyerMiniPreview prog={prog} churchInfo={churchInfo} />

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/programs/${prog._id}/flyer`)}
                  className="flex-1 gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleDownloadPdf(prog._id)}
                  disabled={downloadingId === prog._id}
                  className="flex-1 gap-2"
                >
                  {downloadingId === prog._id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  PDF
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex justify-center gap-4"
        >
          <Button variant="outline" onClick={() => navigate('/programs/generate')} className="gap-2">
            Generar M&aacute;s Programas
          </Button>
          <Button onClick={() => navigate('/programs')} className="gap-2">
            Ver Todos los Programas
          </Button>
        </motion.div>
      </div>
    </div>
  )
}

export default BatchReviewPage
