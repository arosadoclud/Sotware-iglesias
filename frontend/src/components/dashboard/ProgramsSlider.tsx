import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { programsApi } from '../../lib/api'
import { safeDateParse } from '../../lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  Download,
  Loader2,
  FileText,
  Sparkles,
  Eye,
} from 'lucide-react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { toast } from 'sonner'

const DAYS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  PUBLISHED: { bg:'bg-emerald-50', text:'text-emerald-700', border:'border-emerald-200', label:'Publicado' },
  COMPLETED: { bg:'bg-blue-50',    text:'text-blue-700',    border:'border-blue-200',    label:'Completado' },
  DRAFT:     { bg:'bg-amber-50',   text:'text-amber-700',   border:'border-amber-200',   label:'Borrador' },
}

interface ProgramSlide {
  _id: string
  activityType: { name: string }
  programDate: string
  programTime?: string
  ampm?: string
  status: string
  churchName?: string
  subtitle?: string
  verse?: string
  verseText?: string
  assignments: any[]
}

export default function ProgramsSlider() {
  const [programs, setPrograms] = useState<ProgramSlide[]>([])
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await programsApi.getAll({ status: 'PUBLISHED', limit: 20, sort: '-programDate' })
        const list = res.data.data || res.data || []
        // También traer los completados recientes
        const res2 = await programsApi.getAll({ status: 'COMPLETED', limit: 5, sort: '-programDate' })
        const list2 = res2.data.data || res2.data || []
        setPrograms([...list, ...list2])
      } catch {
        // silenciar
      }
      setLoading(false)
    }
    load()
  }, [])

  // Auto-play slider
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % (programs.length || 1))
    }, 6000)
  }, [programs.length])

  useEffect(() => {
    if (programs.length > 1) resetTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [programs.length, resetTimer])

  const goTo = (idx: number) => {
    setCurrent(idx)
    resetTimer()
  }
  const prev = () => goTo((current - 1 + programs.length) % programs.length)
  const next = () => goTo((current + 1) % programs.length)

  const handleDownloadPdf = async (id: string) => {
    setDownloadingPdf(id)
    try {
      const res = await programsApi.downloadPdf(id)
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `programa-${id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('PDF descargado')
    } catch {
      toast.error('Error al descargar PDF')
    }
    setDownloadingPdf(null)
  }

  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-50 via-white to-primary-50 border border-primary-100 p-8">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          <span className="text-neutral-500">Cargando programas...</span>
        </div>
      </div>
    )
  }

  if (programs.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-50 via-white to-primary-50 border border-primary-100 p-8">
        <div className="flex flex-col items-center justify-center gap-3 text-neutral-400">
          <FileText className="w-10 h-10 opacity-40" />
          <p className="text-sm">No hay programas publicados aún</p>
        </div>
      </div>
    )
  }

  const prog = programs[current]
  const date = safeDateParse(prog.programDate)
  const st = STATUS_STYLES[prog.status] || STATUS_STYLES.DRAFT
  const assignedCount = prog.assignments?.length || 0

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-50/60 via-white to-indigo-50/40 border border-primary-100/60 shadow-lg">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary-100/30 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-indigo-100/20 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />

      {/* Header */}
      <div className="relative px-5 sm:px-6 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-neutral-900 text-sm sm:text-base">Programas de la Iglesia</h3>
            <p className="text-[11px] text-neutral-500">{programs.length} programa{programs.length !== 1 ? 's' : ''} disponible{programs.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        {programs.length > 1 && (
          <div className="flex items-center gap-1">
            <button onClick={prev} className="p-1.5 rounded-lg hover:bg-white/80 hover:shadow-sm transition-all text-neutral-400 hover:text-neutral-700">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-semibold text-neutral-500 min-w-[3rem] text-center tabular-nums">{current + 1} / {programs.length}</span>
            <button onClick={next} className="p-1.5 rounded-lg hover:bg-white/80 hover:shadow-sm transition-all text-neutral-400 hover:text-neutral-700">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Slide content */}
      <div className="relative px-5 sm:px-6 pb-5 min-h-[180px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={prog._id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-neutral-100 shadow-sm p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                {/* Left info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-neutral-900 text-lg leading-tight">{prog.activityType?.name}</h4>
                      <p className="text-sm text-neutral-500 mt-0.5">
                        {DAYS[date.getDay()]}, {format(date, "d 'de' MMMM yyyy", { locale: es })}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={`${st.bg} ${st.text} border ${st.border} text-xs`}>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {st.label}
                    </Badge>
                    {prog.programTime && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Clock className="w-3 h-3" />
                        {prog.programTime} {prog.ampm || ''}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Users className="w-3 h-3" />
                      {assignedCount} asignado{assignedCount !== 1 ? 's' : ''}
                    </Badge>
                  </div>

                  {/* Versículo */}
                  {(prog.verse || prog.verseText) && (
                    <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/50 rounded-lg p-3 border border-amber-100/60">
                      <p className="text-xs font-medium text-amber-800 italic leading-relaxed">
                        {prog.verseText ? `"${prog.verseText}"` : ''}
                        {prog.verse && <span className="not-italic font-semibold ml-1">— {prog.verse}</span>}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right actions */}
                <div className="flex sm:flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs gap-1.5 border-primary-200 text-primary-700 hover:bg-primary-50"
                    onClick={() => handleDownloadPdf(prog._id)}
                    disabled={downloadingPdf === prog._id}
                  >
                    {downloadingPdf === prog._id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Download className="w-3.5 h-3.5" />
                    }
                    PDF
                  </Button>
                </div>
              </div>

              {/* Assignments preview */}
              {assignedCount > 0 && (
                <div className="mt-3 pt-3 border-t border-neutral-100">
                  <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide mb-2">Asignaciones</p>
                  <div className="flex flex-wrap gap-1.5">
                    {prog.assignments.slice(0, 8).map((a: any, i: number) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-50 rounded-md text-xs text-neutral-600 border border-neutral-100">
                        <span className="font-medium">{a.roleName || a.sectionName}:</span>
                        <span className="text-neutral-800">{a.person?.name || a.name || '—'}</span>
                      </span>
                    ))}
                    {assignedCount > 8 && (
                      <span className="inline-flex items-center px-2 py-1 bg-primary-50 rounded-md text-xs text-primary-600 font-medium">
                        +{assignedCount - 8} más
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots indicator */}
      {programs.length > 1 && (
        <div className="flex justify-center gap-1.5 pb-4">
          {programs.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`transition-all duration-300 rounded-full ${
                i === current
                  ? 'w-6 h-2 bg-gradient-to-r from-primary-500 to-indigo-500'
                  : 'w-2 h-2 bg-neutral-200 hover:bg-neutral-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
