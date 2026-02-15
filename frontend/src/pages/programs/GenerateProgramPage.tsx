import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { activitiesApi, programsApi } from '../../lib/api'
import { toast } from 'react-hot-toast'
import {
  Loader2, Wand2, Calendar, ArrowLeft, CheckCircle,
  AlertTriangle, Download, Eye, Info, Users, BarChart2,
  ChevronDown, ChevronUp, Sparkles, Clock, MapPin, FileText
} from 'lucide-react'
import { format, eachDayOfInterval, getDay } from 'date-fns'
import { es } from 'date-fns/locale'

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'

const DAYS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']

// ── FAIRNESS BAR ──────────────────────────────────────────────────────────────
const FairnessBar = ({ score }: { score: number }) => {
  const pct = Math.round(((score + 1.35) / 2.7) * 100)
  const color = pct >= 65 ? 'bg-success-500' : pct >= 40 ? 'bg-warning-400' : 'bg-danger-400'
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 bg-neutral-100 rounded-full h-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-2 rounded-full transition-all ${color}`}
        />
      </div>
      <span className="text-xs font-medium text-neutral-600 w-10 text-right">{pct}%</span>
    </div>
  )
}

// ── PROGRAM PREVIEW CARD ──────────────────────────────────────────────────────
const ProgramPreviewCard = ({
  program, meta, onDownloadPdf, onEditFlyer
}: {
  program: any
  meta?: any
  onDownloadPdf: (id: string) => void
  onEditFlyer?: (id: string) => void
}) => {
  const [showScoring, setShowScoring] = useState(false)
  const date = new Date(program.programDate)

  const sections: Record<string, any[]> = {}
  ;(program.assignments || []).forEach((a: any) => {
    if (!sections[a.sectionName]) sections[a.sectionName] = []
    sections[a.sectionName].push(a)
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-primary-50 to-primary-100/50 border-b border-primary-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-neutral-900 text-lg mb-1">
              {program.activityType?.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Calendar className="w-4 h-4" />
              <span>{DAYS[date.getDay()]}, {format(date, "d 'de' MMMM yyyy", { locale: es })}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {meta?.stats && (
              <Badge
                variant={
                  meta.stats.coveragePercent >= 80 ? 'success' :
                  meta.stats.coveragePercent >= 50 ? 'warning' : 'danger'
                }
              >
                {meta.stats.coveragePercent}% cobertura
              </Badge>
            )}
            <Badge variant="secondary">Borrador</Badge>
          </div>
        </div>
      </div>

      {/* Warnings */}
      <AnimatePresence>
        {meta?.warnings?.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-warning-50 border-b border-warning-200"
          >
            <div className="px-5 py-3 space-y-2">
              {meta.warnings.map((w: any, i: number) => (
                <div key={i} className="flex items-start gap-2 text-sm text-warning-800">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{w.message}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assignments by section */}
      <div className="p-5 space-y-5">
        {Object.entries(sections).map(([sectionName, assignments]) => (
          <motion.div
            key={sectionName}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-neutral-200" />
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                {sectionName}
              </h4>
              <div className="h-px flex-1 bg-neutral-200" />
            </div>
            
            <div className="space-y-2">
              {assignments.map((a: any, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {i + 1}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium text-neutral-900">
                        {a.person?.name || <span className="text-neutral-400 italic">Sin asignar</span>}
                      </span>
                      <span className="text-xs text-neutral-500">• {a.roleName}</span>
                    </div>
                    {a.backup?.name && (
                      <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Users className="w-3 h-3 text-neutral-400" />
                        <span className="text-xs text-neutral-500">Suplente: {a.backup.name}</span>
                      </div>
                    )}
                  </div>

                  {a.fairnessScore !== undefined && (
                    <div className="w-24 opacity-0 group-hover:opacity-100 transition-opacity">
                      <FairnessBar score={a.fairnessScore} />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
        
        {(!program.assignments || program.assignments.length === 0) && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-neutral-200 mb-3" />
            <p className="text-sm text-neutral-500">
              No se pudieron asignar personas
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              Verifica que los miembros tengan los roles configurados
            </p>
          </div>
        )}
      </div>

      {/* Stats footer */}
      {meta?.stats && (
        <div className="px-5 py-4 bg-neutral-50 border-t border-neutral-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-neutral-600">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span className="font-medium">{meta.stats.personsUsed}</span> personas
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-success-500" />
                <span className="font-medium">{meta.stats.totalAssigned}/{meta.stats.totalNeeded}</span> roles
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {program._id && onEditFlyer && (
                <Button
                  onClick={() => onEditFlyer(program._id)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Editar
                </Button>
              )}
              {program._id && (
                <Button
                  onClick={() => onDownloadPdf(program._id)}
                  size="sm"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowScoring(!showScoring)}
                className="gap-2"
              >
                <BarChart2 className="w-4 h-4" />
                {showScoring ? 'Ocultar' : 'Ver'} scoring
                {showScoring ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Scoring breakdown */}
      <AnimatePresence>
        {showScoring && meta?.stats?.scoringBreakdowns && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-neutral-200 bg-white"
          >
            <div className="px-5 py-4">
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">
                Puntuaciones de Equidad
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {meta.stats.scoringBreakdowns.slice(0, 20).map((b: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 text-xs p-2 rounded hover:bg-neutral-50">
                    <span className="w-32 truncate font-medium text-neutral-700">{b.personName}</span>
                    <div className="flex-1">
                      <FairnessBar score={b.totalScore} />
                    </div>
                    <span className="text-neutral-500 w-12 text-right font-mono">
                      {b.totalScore.toFixed(2)}
                    </span>
                    <span className="text-neutral-400 w-20 text-right text-xs">
                      {b.breakdown.neverHadRole ? '🆕 nuevo' : `${Math.round(b.breakdown.weeksSinceLastRole ?? 0)}sem`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
const GenerateProgramPage = () => {
  const navigate = useNavigate()
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [mode, setMode] = useState<'single' | 'batch'>('single')
  const [selectedActivity, setSelectedActivity] = useState('')
  const [singleDate, setSingleDate] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [result, setResult] = useState<any>(null)
  const [preview, setPreview] = useState<any>(null)
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null)
  const [numberOfGroups, setNumberOfGroups] = useState(4) // For cleaning groups

  useEffect(() => {
    activitiesApi.getAll()
      .then(r => {
        setActivities(r.data.data)
        if (r.data.data.length > 0) setSelectedActivity(r.data.data[0]._id)
      })
      .finally(() => setLoading(false))
  }, [])

  const selectedAct = activities.find(a => a._id === selectedActivity)

  // Compute matching dates for batch mode preview (multi-day support)
  const batchDates = (() => {
    if (mode !== 'batch' || !startDate || !endDate || !selectedAct) return []
    try {
      const start = new Date(startDate + 'T12:00:00')
      const end = new Date(endDate + 'T12:00:00')
      if (end < start) return []
      const allDays = eachDayOfInterval({ start, end })
      const daysSet = new Set<number>(
        selectedAct.daysOfWeek?.length > 0
          ? selectedAct.daysOfWeek
          : [selectedAct.dayOfWeek ?? 0]
      )
      return allDays.filter(d => daysSet.has(getDay(d)))
    } catch { return [] }
  })()

  const handlePreview = async () => {
    if (!selectedActivity || !singleDate) return toast.error('Selecciona actividad y fecha')
    setPreviewing(true)
    setPreview(null)
    try {
      const res = await programsApi.previewScoring({ activityTypeId: selectedActivity, programDate: singleDate })
      setPreview(res.data.data)
      toast.success('Vista previa generada')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al previsualizar')
    }
    setPreviewing(false)
  }

  const handleGenerate = async () => {
    if (!selectedActivity) return toast.error('Selecciona una actividad')
    setGenerating(true)
    setResult(null)
    try {
      if (mode === 'single') {
        if (!singleDate) {
          setGenerating(false)
          return toast.error('Selecciona una fecha')
        }
        const res = await programsApi.generate({ activityTypeId: selectedActivity, programDate: singleDate })
        setResult({ type: 'single', program: res.data.data, meta: res.data.meta })
        toast.success('✅ Programa generado exitosamente')
        setTimeout(() => navigate(`/programs/${res.data.data._id}/flyer`), 600)
      } else {
        if (!startDate || !endDate) {
          setGenerating(false)
          return toast.error('Selecciona las fechas')
        }
        const isCleaningActivity = selectedAct?.generationType === 'cleaning_groups'
        console.log('📤 Enviando petición batch:', { activityTypeId: selectedActivity, startDate, endDate })
        const res = await programsApi.generateBatch({ 
          activityTypeId: selectedActivity, 
          startDate, 
          endDate,
          ...(isCleaningActivity && { numberOfGroups })
        })
        console.log('📥 Respuesta batch:', res.data)
        console.log('📥 Respuesta batch data completa:', JSON.stringify(res.data.data, null, 2))
        const batchData = res.data.data
        const gen = batchData.generated
        const errors = batchData.errors || 0
        console.log('📊 Generated:', gen, 'Errors:', errors, 'Results:', batchData.results)
        
        if (gen > 0) {
          toast.success(`✅ ${gen} programa${gen !== 1 ? 's' : ''} generado${gen !== 1 ? 's' : ''}`)
        }
        
        // Mostrar errores si hubo fallos
        if (errors > 0) {
          const errorMessages = batchData.results
            ?.filter((r: any) => !r.success && r.error)
            .map((r: any) => r.error)
            .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i) // Unique
            .slice(0, 3) || []
          
          if (errorMessages.length > 0) {
            toast.error(`❌ ${errors} error${errors !== 1 ? 'es' : ''}: ${errorMessages.join(', ')}`)
          } else {
            toast.error(`❌ ${errors} programa${errors !== 1 ? 's' : ''} no se pudieron generar`)
          }
        }

        // Redirigir a la vista de revision de lote con todos los IDs
        const programIds = batchData.results
          ?.filter((r: any) => r.success && r.programId)
          .map((r: any) => r.programId) || []
        console.log('🔗 Program IDs para redirección:', programIds)
        if (programIds.length > 0) {
          setTimeout(() => navigate(`/programs/batch-review?ids=${programIds.join(',')}`), 600)
        } else if (gen === 0 && errors > 0) {
          toast('No se generaron programas. Revisa la configuración de la actividad.')
        }
      }
    } catch (e: any) {
      console.error('❌ Error en generación:', e)
      toast.error(e.response?.data?.message || 'Error al generar programa')
    }
    setGenerating(false)
  }

  const handleDownloadPdf = async (programId: string) => {
    setDownloadingPdf(programId)
    try {
      const res = await programsApi.downloadPdf(programId)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `programa-${programId}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('PDF descargado')
    } catch {
      toast.error('Error al generar el PDF')
    } finally {
      setDownloadingPdf(null)
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/programs')}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Programas
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Generar Programa de Oportunidades</h1>
              <p className="text-neutral-600 mt-1">
                Asignación automática usando algoritmo de equidad
              </p>
            </div>
          </div>
        </motion.div>

        {activities.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-neutral-200" />
              <p className="text-neutral-600 font-medium mb-2">No hay actividades configuradas</p>
              <Button onClick={() => navigate('/activities')} className="mt-4">
                Configurar actividades →
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Panel - Configuration */}
            <div className="lg:col-span-2 space-y-6">
              {/* Mode Selection */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary-600" />
                      Modo de Generación
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { id: 'single', label: 'Individual', sub: 'Una fecha específica', icon: Calendar },
                        { id: 'batch', label: 'Por Lote', sub: 'Rango de fechas', icon: FileText },
                      ].map((m) => (
                        <button
                          key={m.id}
                          onClick={() => { setMode(m.id as any); setResult(null); setPreview(null) }}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            mode === m.id
                              ? 'border-primary-500 bg-primary-50 shadow-sm'
                              : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          <m.icon className={`w-6 h-6 mb-2 ${mode === m.id ? 'text-primary-600' : 'text-neutral-400'}`} />
                          <p className="font-semibold text-neutral-900">{m.label}</p>
                          <p className="text-xs text-neutral-500 mt-1">{m.sub}</p>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Activity Selection */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary-600" />
                      Tipo de Actividad
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activities.map((a) => (
                        <button
                          key={a._id}
                          onClick={() => { setSelectedActivity(a._id); setPreview(null); setResult(null) }}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            selectedActivity === a._id
                              ? 'border-primary-500 bg-primary-50 shadow-sm'
                              : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          <p className="font-semibold text-neutral-900 text-sm sm:text-base mb-1 line-clamp-1">{a.name}</p>
                          <div className="flex flex-col gap-1 text-xs text-neutral-500">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">
                                {(a.daysOfWeek?.length > 0 ? a.daysOfWeek : [a.dayOfWeek ?? 0])
                                  .map((d: number) => DAYS[d]?.slice(0, 3))
                                  .join(', ')} · {a.defaultTime}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-3 h-3 flex-shrink-0" />
                              <span>{a.roleConfig?.length || 0} secciones</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Date Selection */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary-600" />
                      Fecha{mode === 'batch' ? 's' : ''}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {mode === 'single' ? (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-neutral-700">Fecha del Programa</label>
                        <input
                          type="date"
                          value={singleDate}
                          onChange={(e) => { setSingleDate(e.target.value); setPreview(null); setResult(null) }}
                          className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-neutral-700">Fecha Inicio</label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-neutral-700">Fecha Fin</label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* Batch date preview */}
                    {mode === 'batch' && startDate && endDate && selectedAct && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4"
                      >
                        <div className="p-4 rounded-xl bg-primary-50 border border-primary-200">
                          <div className="flex items-center gap-2 mb-3">
                            <Calendar className="w-4 h-4 text-primary-600" />
                            <p className="text-sm font-semibold text-primary-900">
                              {(() => {
                                const dayNames = (selectedAct.daysOfWeek?.length > 0 ? selectedAct.daysOfWeek : [selectedAct.dayOfWeek ?? 0])
                                  .map((d: number) => DAYS[d])
                                  .join(', ')
                                return batchDates.length > 0
                                  ? `Se generarán ${batchDates.length} programa${batchDates.length !== 1 ? 's' : ''} (${dayNames})`
                                  : `No hay fechas que coincidan con ${dayNames} en el rango seleccionado`
                              })()}
                            </p>
                          </div>
                          {batchDates.length > 0 && (
                            <div className="grid grid-cols-2 gap-2">
                              {batchDates.map((d, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-primary-700 bg-white/60 rounded-lg px-3 py-2">
                                  <div className="w-5 h-5 rounded-full bg-primary-200 text-primary-800 flex items-center justify-center text-xs font-bold">
                                    {i + 1}
                                  </div>
                                  <span>{format(d, "EEE d 'de' MMM", { locale: es })}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Cleaning Groups Configuration - only shown for cleaning activities */}
              {selectedAct?.generationType === 'cleaning_groups' && mode === 'batch' && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                  <Card className="border-amber-200 bg-amber-50/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-amber-800">
                        <Users className="w-5 h-5 text-amber-600" />
                        Configuración de Grupos de Limpieza
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-amber-700">
                          Esta actividad divide a todos los miembros activos de la iglesia en grupos para rotación de limpieza.
                        </p>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-amber-800">Número de Grupos</label>
                          <input
                            type="number"
                            min={2}
                            max={20}
                            value={numberOfGroups}
                            onChange={(e) => setNumberOfGroups(Math.max(2, Math.min(20, parseInt(e.target.value) || 4)))}
                            className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                          />
                          <p className="text-xs text-amber-600">
                            Los miembros activos se dividirán equitativamente en {numberOfGroups} grupos.
                            Cada fecha recibirá un grupo diferente en rotación.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex gap-3"
              >
                {mode === 'single' && singleDate && (
                  <Button
                    variant="outline"
                    onClick={handlePreview}
                    disabled={previewing}
                    className="gap-2"
                  >
                    {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                    Vista Previa
                  </Button>
                )}
                <Button
                  onClick={handleGenerate}
                  disabled={generating || (mode === 'batch' && batchDates.length === 0)}
                  className="flex-1 gap-2 h-11"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      {mode === 'batch'
                        ? `Generar ${batchDates.length > 0 ? batchDates.length + ' ' : ''}Programa${batchDates.length !== 1 ? 's' : ''}`
                        : 'Generar Programa'}
                    </>
                  )}
                </Button>
              </motion.div>
            </div>

            {/* Right Panel - Preview/Results */}
            <div className="space-y-6">
              {/* Activity Format Info */}
              {selectedAct && !preview && !result && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Info className="w-4 h-4 text-primary-600" />
                        Formato del Programa
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedAct.roleConfig?.map((rc: any, i: number) => (
                          <div key={i} className="flex items-center gap-3 text-sm">
                            <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs flex items-center justify-center font-bold">
                              {rc.sectionOrder}
                            </div>
                            <span className="text-neutral-600">{rc.sectionName}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Preview */}
              <AnimatePresence>
                {preview && !result && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <div className="mb-3">
                      <Badge variant="secondary">Vista Previa (sin guardar)</Badge>
                    </div>
                    <ProgramPreviewCard
                      program={{ activityType: selectedAct, programDate: singleDate, assignments: preview.assignments }}
                      meta={{ warnings: preview.warnings, stats: preview.stats }}
                      onDownloadPdf={() => {}}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Results */}
              <AnimatePresence>
                {result && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2 px-4 py-3 bg-success-50 border border-success-200 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-success-600" />
                      <p className="font-semibold text-success-900">
                        {result.type === 'single' 
                          ? 'Programa generado' 
                          : `${result.data?.generated} programas generados`}
                      </p>
                    </div>

                    {result.type === 'single' && (
                      <ProgramPreviewCard
                        program={result.program}
                        meta={result.meta}
                        onDownloadPdf={handleDownloadPdf}
                        onEditFlyer={(id) => navigate(`/programs/${id}/flyer`)}
                      />
                    )}

                    {result.type === 'batch' && (
                      <div className="text-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-primary-600 mx-auto mb-2" />
                        <p className="text-sm text-neutral-500">Redirigiendo a la vista de programas...</p>
                      </div>
                    )}

                    <Button
                      onClick={() => navigate('/programs')}
                      className="w-full gap-2"
                    >
                      Ver Todos los Programas →
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GenerateProgramPage