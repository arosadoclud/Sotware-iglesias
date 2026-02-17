import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion'
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
  MapPin,
  Play,
  Pause,
  Star,
  Zap,
} from 'lucide-react'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { toast } from 'sonner'
import { Card } from '../ui/card'

const DAYS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']

const STATUS_STYLES: Record<string, { 
  bg: string
  text: string
  border: string
  label: string
  gradient: string
  icon: any
}> = {
  PUBLISHED: { 
    bg:'bg-emerald-50', 
    text:'text-emerald-700', 
    border:'border-emerald-200', 
    label:'Publicado',
    gradient: 'from-emerald-500 to-teal-500',
    icon: CheckCircle2
  },
  COMPLETED: { 
    bg:'bg-blue-50',
    text:'text-blue-700',
    border:'border-blue-200',
    label:'Completado',
    gradient: 'from-blue-500 to-cyan-500',
    icon: Star
  },
  DRAFT: { 
    bg:'bg-amber-50',
    text:'text-amber-700',
    border:'border-amber-200',
    label:'Borrador',
    gradient: 'from-amber-500 to-orange-500',
    icon: Clock
  },
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
  const [isAutoPlay, setIsAutoPlay] = useState(true)
  const [direction, setDirection] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const x = useMotionValue(0)
  const dragProgress = useTransform(x, [-200, 0, 200], [1, 0, -1])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await programsApi.getAll({ status: 'PUBLISHED', limit: 20, sort: '-programDate' })
        const list = res.data.data || res.data || []
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

  // Auto-play slider con mejorado
  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (isAutoPlay && programs.length > 1) {
      timerRef.current = setInterval(() => {
        setDirection(1)
        setCurrent(prev => (prev + 1) % programs.length)
      }, 5000)
    }
  }, [isAutoPlay, programs.length])

  useEffect(() => {
    if (programs.length > 1) resetTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [programs.length, resetTimer])

  const goTo = (idx: number) => {
    setDirection(idx > current ? 1 : -1)
    setCurrent(idx)
    resetTimer()
  }

  const prev = () => {
    setDirection(-1)
    setCurrent((current - 1 + programs.length) % programs.length)
    resetTimer()
  }

  const next = () => {
    setDirection(1)
    setCurrent((current + 1) % programs.length)
    resetTimer()
  }

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 50
    if (info.offset.x > threshold) {
      prev()
    } else if (info.offset.x < -threshold) {
      next()
    }
  }

  const handleDownloadPdf = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
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
      <Card className="relative overflow-hidden border-0 shadow-xl">
        <div className="h-[420px] flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-indigo-50">
          <div className="flex flex-col items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="w-8 h-8 text-primary-600" />
            </motion.div>
            <span className="text-neutral-500 font-medium">Cargando programas...</span>
          </div>
        </div>
      </Card>
    )
  }

  if (programs.length === 0) {
    return (
      <Card className="relative overflow-hidden border-0 shadow-xl">
        <div className="h-[420px] flex items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-neutral-50">
          <div className="flex flex-col items-center gap-4 text-neutral-400">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-neutral-100 flex items-center justify-center">
                <FileText className="w-10 h-10 opacity-40" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-primary-600" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-neutral-600">No hay programas publicados</p>
              <p className="text-sm text-neutral-400 mt-1">Los programas aparecerán aquí cuando sean publicados</p>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  const prog = programs[current]
  const date = safeDateParse(prog.programDate)
  const st = STATUS_STYLES[prog.status] || STATUS_STYLES.DRAFT
  const StatusIcon = st.icon
  const assignedCount = prog.assignments?.length || 0

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
      rotateY: direction > 0 ? 45 : -45,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
      rotateY: direction < 0 ? 45 : -45,
    }),
  }

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setIsAutoPlay(false)}
      onMouseLeave={() => setIsAutoPlay(true)}
    >
      <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white via-primary-50/30 to-indigo-50/50">
        {/* Efectos decorativos de fondo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-primary-200/20 via-transparent to-indigo-200/20 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              rotate: [0, -90, 0],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-purple-200/20 via-transparent to-pink-200/20 rounded-full blur-3xl"
          />
        </div>

        {/* Header con controles */}
        <div className="relative px-6 py-5 border-b border-white/50 backdrop-blur-sm bg-white/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.5 }}
                className={`w-11 h-11 bg-gradient-to-br ${st.gradient} rounded-xl flex items-center justify-center shadow-lg`}
              >
                <Sparkles className="w-6 h-6 text-white drop-shadow-lg" />
              </motion.div>
              <div>
                <h3 className="font-bold text-neutral-900 text-lg flex items-center gap-2">
                  Programas Destacados
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Zap className="w-4 h-4 text-amber-500" />
                  </motion.div>
                </h3>
                <p className="text-sm text-neutral-500">
                  {programs.length} programa{programs.length !== 1 ? 's' : ''} disponible{programs.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Play/Pause */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsAutoPlay(!isAutoPlay)}
                className="p-2 rounded-lg bg-white/60 hover:bg-white/80 backdrop-blur-sm border border-neutral-200/50 transition-all shadow-sm"
              >
                {isAutoPlay ? (
                  <Pause className="w-4 h-4 text-neutral-600" />
                ) : (
                  <Play className="w-4 h-4 text-neutral-600" />
                )}
              </motion.button>

              {/* Navigation arrows */}
              {programs.length > 1 && (
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1, x: -2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={prev}
                    className="p-2 rounded-lg bg-white/60 hover:bg-white/80 backdrop-blur-sm border border-neutral-200/50 transition-all shadow-sm"
                  >
                    <ChevronLeft className="w-5 h-5 text-neutral-700" />
                  </motion.button>
                  <span className="text-sm font-bold text-neutral-700 min-w-[3.5rem] text-center tabular-nums">
                    {current + 1} / {programs.length}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.1, x: 2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={next}
                    className="p-2 rounded-lg bg-white/60 hover:bg-white/80 backdrop-blur-sm border border-neutral-200/50 transition-all shadow-sm"
                  >
                    <ChevronRight className="w-5 h-5 text-neutral-700" />
                  </motion.button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Slider content con 3D effect */}
        <div className="relative px-6 py-6 min-h-[320px]" style={{ perspective: '1000px' }}>
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={prog._id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.3 },
                scale: { duration: 0.3 },
                rotateY: { duration: 0.3 },
              }}
              drag={programs.length > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              style={{ x }}
              className="cursor-grab active:cursor-grabbing"
            >
            >
              {/* Card principal del programa */}
              <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl border border-white/50 shadow-2xl overflow-hidden">
                {/* Barra de estado superior con gradiente */}
                <div className={`h-2 bg-gradient-to-r ${st.gradient}`} />
                
                <div className="p-6">
                  {/* Header del programa */}
                  <div className="flex items-start gap-4 mb-5">
                    {/* Icono de fecha grande */}
                    <motion.div 
                      whileHover={{ scale: 1.05, rotate: 5 }}
                      className="relative flex-shrink-0"
                    >
                      <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${st.gradient} flex flex-col items-center justify-center text-white shadow-lg`}>
                        <span className="text-2xl font-bold leading-none">{date.getDate()}</span>
                        <span className="text-xs font-medium uppercase mt-0.5">
                          {format(date, 'MMM', { locale: es })}
                        </span>
                      </div>
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md"
                      >
                        <StatusIcon className={`w-3.5 h-3.5 ${st.text}`} />
                      </motion.div>
                    </motion.div>

                    {/* Información principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-neutral-900 text-xl leading-tight mb-1 truncate">
                            {prog.activityType?.name}
                          </h4>
                          <p className="text-sm text-neutral-600 flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span>{DAYS[date.getDay()]}, {format(date, "d 'de' MMMM yyyy", { locale: es })}</span>
                          </p>
                        </div>
                        
                        {/* Botón de descarga */}
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            size="sm"
                            className={`bg-gradient-to-r ${st.gradient} text-white border-0 shadow-lg hover:shadow-xl transition-all`}
                            onClick={(e) => handleDownloadPdf(prog._id, e)}
                            disabled={downloadingPdf === prog._id}
                          >
                            {downloadingPdf === prog._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Download className="w-4 h-4 mr-1.5" />
                                PDF
                              </>
                            )}
                          </Button>
                        </motion.div>
                      </div>

                      {/* Badges de información */}
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <Badge className={`${st.bg} ${st.text} border ${st.border} text-xs font-semibold px-3 py-1`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {st.label}
                        </Badge>
                        {prog.programTime && (
                          <Badge variant="secondary" className="text-xs font-semibold px-3 py-1 gap-1.5 bg-neutral-100">
                            <Clock className="w-3 h-3" />
                            {prog.programTime} {prog.ampm || ''}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs font-semibold px-3 py-1 gap-1.5 bg-primary-50 text-primary-700">
                          <Users className="w-3 h-3" />
                          {assignedCount} asignado{assignedCount !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Versículo bíblico con diseño mejorado */}
                  {(prog.verse || prog.verseText) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="relative mb-5 p-4 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 rounded-xl border-l-4 border-amber-400 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          {prog.verseText && (
                            <p className="text-sm font-medium text-amber-900 italic leading-relaxed mb-1">
                              "{prog.verseText}"
                            </p>
                          )}
                          {prog.verse && (
                            <p className="text-xs font-bold text-amber-700">
                              — {prog.verse}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Asignaciones con diseño grid mejorado */}
                  {assignedCount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="pt-4 border-t border-neutral-100"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Asignaciones del Programa
                        </p>
                        {assignedCount > 6 && (
                          <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
                            +{assignedCount - 6} más
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {prog.assignments.slice(0, 6).map((a: any, i: number) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + i * 0.05 }}
                            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-neutral-50 to-neutral-100/50 rounded-lg border border-neutral-200/50 hover:border-primary-200 hover:shadow-sm transition-all group"
                          >
                            <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-200 transition-colors">
                              <span className="text-xs font-bold text-primary-700">
                                {(a.person?.name || a.name || '?')[0].toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-neutral-500 truncate">
                                {a.roleName || a.sectionName}
                              </p>
                              <p className="text-sm font-semibold text-neutral-800 truncate">
                                {a.person?.name || a.name || '—'}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots indicadores modernos con progreso */}
        {programs.length > 1 && (
          <div className="relative px-6 pb-5">
            <div className="flex justify-center items-center gap-2">
              {programs.map((_, i) => (
                <motion.button
                  key={i}
                  onClick={() => goTo(i)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  className="relative group"
                >
                  <div className={`transition-all duration-300 rounded-full ${
                    i === current
                      ? 'w-10 h-2.5'
                      : 'w-2.5 h-2.5 hover:w-4'
                  }`}>
                    <div className={`w-full h-full rounded-full transition-all ${
                      i === current
                        ? `bg-gradient-to-r ${st.gradient} shadow-lg`
                        : 'bg-neutral-300 group-hover:bg-neutral-400'
                    }`} />
                  </div>
                  {i === current && isAutoPlay && (
                    <motion.div
                      className={`absolute inset-0 rounded-full bg-gradient-to-r ${st.gradient}`}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 5, ease: "linear" }}
                      style={{ transformOrigin: 'left' }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Thumbnails preview para navegación rápida */}
        {programs.length > 3 && (
          <div className="hidden lg:block relative px-6 pb-6">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent">
              {programs.map((p, i) => {
                const d = safeDateParse(p.programDate)
                const s = STATUS_STYLES[p.status] || STATUS_STYLES.DRAFT
                return (
                  <motion.button
                    key={p._id}
                    onClick={() => goTo(i)}
                    whileHover={{ scale: 1.05, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex-shrink-0 w-48 p-3 rounded-xl border-2 transition-all ${
                      i === current
                        ? `border-primary-400 bg-primary-50/50 shadow-lg`
                        : 'border-transparent bg-white/50 hover:bg-white/80 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white text-xs font-bold`}>
                        {d.getDate()}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-xs font-semibold text-neutral-900 truncate">
                          {p.activityType?.name}
                        </p>
                        <p className="text-[10px] text-neutral-500 truncate">
                          {format(d, 'MMM d', { locale: es })}
                        </p>
                      </div>
                    </div>
                    <Badge className={`${s.bg} ${s.text} text-[10px] w-full justify-center`}>
                      {s.label}
                    </Badge>
                  </motion.button>
                )
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
