import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose, SheetBody, SheetFooter } from '../ui/sheet'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { programsApi, personsApi } from '../../lib/api'
import { toast } from 'sonner'
import { Loader2, Save, ExternalLink, Calendar, Clock, User, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface QuickEditDrawerProps {
  programId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

interface Assignment {
  sectionOrder: number
  roleName: string
  person?: { id: string; name: string }
}

export const QuickEditDrawer: React.FC<QuickEditDrawerProps> = ({
  programId,
  open,
  onOpenChange,
  onSaved,
}) => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<any>(null)
  const [form, setForm] = useState({
    date: '',
    time: '',
    timePeriod: 'PM' as 'AM' | 'PM',
    activityType: '',
    verse: '',
  })
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [searchQueries, setSearchQueries] = useState<Record<number, string>>({})
  const [suggestions, setSuggestions] = useState<Record<number, any[]>>({})

  useEffect(() => {
    if (open && programId) {
      loadProgram()
    }
  }, [open, programId])

  const loadProgram = async () => {
    if (!programId) return
    setLoading(true)
    try {
      const res = await programsApi.get(programId)
      const prog = res.data.data
      setData(prog)
      // Parsear hora a 12h
      let time12 = ''
      let period: 'AM' | 'PM' = 'PM'
      const rawTime = prog.defaultTime || prog.programTime || ''
      if (rawTime) {
        const hasPM = /PM/i.test(rawTime)
        const hasAM = /AM/i.test(rawTime)
        if (hasPM || hasAM) {
          time12 = rawTime.replace(/\s*(AM|PM)\s*/gi, '').trim()
          period = hasPM ? 'PM' : 'AM'
        } else {
          const parts = rawTime.split(':')
          const h = parseInt(parts[0])
          const m = parts[1] || '00'
          period = h >= 12 ? 'PM' : 'AM'
          const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
          time12 = `${h12}:${m}`
        }
      }
      setForm({
        date: prog.programDate ? prog.programDate.slice(0, 10) : '',
        time: time12,
        timePeriod: period,
        activityType: prog.activityType?.name || '',
        verse: prog.verse || '',
      })
      setAssignments(prog.assignments || [])
      
      // Inicializar queries de búsqueda con nombres actuales
      const queries: Record<number, string> = {}
      prog.assignments?.forEach((a: Assignment) => {
        if (a.person?.name) {
          queries[a.sectionOrder] = a.person.name
        }
      })
      setSearchQueries(queries)
    } catch (err) {
      toast.error('Error cargando programa')
      console.error(err)
    }
    setLoading(false)
  }

  const handlePersonSearch = async (sectionOrder: number, query: string) => {
    setSearchQueries(prev => ({ ...prev, [sectionOrder]: query }))
    
    if (!query.trim()) {
      setSuggestions(prev => ({ ...prev, [sectionOrder]: [] }))
      return
    }

    try {
      const res = await personsApi.getAll({ search: query })
      setSuggestions(prev => ({
        ...prev,
        [sectionOrder]: res.data.data || []
      }))
    } catch {
      setSuggestions(prev => ({ ...prev, [sectionOrder]: [] }))
    }
  }

  const selectPerson = (sectionOrder: number, person: any) => {
    setAssignments(prev =>
      prev.map(a =>
        a.sectionOrder === sectionOrder
          ? { ...a, person: { id: person._id || person.id, name: person.fullName } }
          : a
      )
    )
    setSearchQueries(prev => ({ ...prev, [sectionOrder]: person.fullName }))
    setSuggestions(prev => ({ ...prev, [sectionOrder]: [] }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await programsApi.update(programId!, {
        programDate: form.date ? `${form.date.slice(0, 10)}T12:00:00` : form.date,
        defaultTime: `${form.time} ${form.timePeriod}`,
        programTime: `${form.time} ${form.timePeriod}`,
        verse: form.verse,
        assignments: assignments.map(a => ({
          sectionOrder: a.sectionOrder,
          roleName: a.roleName,
          person: a.person,
        })),
      })
      toast.success('Programa actualizado')
      onSaved?.()
      onOpenChange(false)
    } catch (err) {
      toast.error('Error guardando cambios')
      console.error(err)
    }
    setSaving(false)
  }

  const goToFullEditor = () => {
    onOpenChange(false)
    navigate(`/programs/flyer/${programId}`)
  }

  // Top 5 asignaciones principales
  const topAssignments = assignments.slice(0, 5)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            Edición Rápida
          </SheetTitle>
          <SheetClose onClose={() => onOpenChange(false)} />
        </SheetHeader>

        <SheetBody>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Información del programa */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">
                  Información Básica
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="quick-date" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Fecha
                    </Label>
                    <Input
                      id="quick-date"
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="quick-time" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Hora
                    </Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="quick-time"
                        type="text"
                        value={form.time}
                        onChange={(e) => {
                          let cleaned = e.target.value.replace(/[^0-9]/g, '')
                          if (cleaned.length >= 2) cleaned = cleaned.slice(0, 2) + ':' + cleaned.slice(2, 4)
                          if (cleaned.length > 5) cleaned = cleaned.slice(0, 5)
                          setForm(prev => ({ ...prev, time: cleaned }))
                        }}
                        placeholder="7:00"
                        className="flex-1"
                      />
                      <select
                        value={form.timePeriod}
                        onChange={(e) => setForm(prev => ({ ...prev, timePeriod: e.target.value as 'AM' | 'PM' }))}
                        className="w-20 px-2 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-sm"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="quick-activity">Tipo de Culto</Label>
                    <Input
                      id="quick-activity"
                      value={form.activityType}
                      disabled
                      className="mt-1 bg-slate-50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="quick-verse">Versículo (Opcional)</Label>
                    <Input
                      id="quick-verse"
                      value={form.verse}
                      onChange={(e) => setForm(prev => ({ ...prev, verse: e.target.value }))}
                      placeholder="Ej: Juan 3:16"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Top 5 Asignaciones */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Asignaciones Principales
                </h3>
                <div className="space-y-3">
                  {topAssignments.map((assignment) => (
                    <div key={assignment.sectionOrder} className="relative">
                      <Label className="text-xs text-slate-600">
                        {assignment.roleName}
                      </Label>
                      <Input
                        value={searchQueries[assignment.sectionOrder] || ''}
                        onChange={(e) => handlePersonSearch(assignment.sectionOrder, e.target.value)}
                        placeholder="Buscar persona..."
                        className="mt-1"
                      />
                      
                      {/* Suggestions dropdown */}
                      {suggestions[assignment.sectionOrder]?.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {suggestions[assignment.sectionOrder].map((person) => (
                            <button
                              key={person._id || person.id}
                              type="button"
                              onClick={() => selectPerson(assignment.sectionOrder, person)}
                              className="w-full px-3 py-2 text-left hover:bg-slate-50 text-sm"
                            >
                              {person.fullName}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {assignments.length > 5 && (
                  <p className="text-xs text-slate-500 mt-3">
                    + {assignments.length - 5} asignaciones más. 
                    <button
                      type="button"
                      onClick={goToFullEditor}
                      className="text-indigo-600 hover:text-indigo-700 ml-1"
                    >
                      Ver todas
                    </button>
                  </p>
                )}
              </div>

              {/* Preview Thumbnail */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Vista Previa</h3>
                <div className="bg-slate-100 rounded-lg p-4 text-center text-sm text-slate-600">
                  <p>
                    {data?.activityType?.name || 'Culto'}
                  </p>
                  <p className="font-medium text-slate-900 mt-1">
                    {form.date ? new Date(form.date + 'T12:00:00').toLocaleDateString('es', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }) : 'Sin fecha'}
                  </p>
                  <p className="text-xs mt-2">
                    {topAssignments.length} asignaciones configuradas
                  </p>
                </div>
              </div>
            </div>
          )}
        </SheetBody>

        <SheetFooter>
          <Button
            variant="outline"
            onClick={goToFullEditor}
            disabled={!programId}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Editor Completo
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
