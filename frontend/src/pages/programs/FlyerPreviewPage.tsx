import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useDebounce } from 'use-debounce'
import { useParams, useNavigate } from 'react-router-dom'
import { programsApi, personsApi } from '../../lib/api'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, Download, Trash2, Shuffle, Dice5, Save } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Assignment {
  id: number
  name: string
  sectionName: string
  person: string
  personId: string
}

interface PersonOption {
  id: string
  fullName: string
}

interface FlyerForm {
  churchName: string
  churchSub: string
  location: string
  worshipType: string
  worshipTypeId: string
  dateInput: string
  timeInput: string
  verse: string
  logoUrl: string
}

const INITIAL_FORM: FlyerForm = {
  churchName: 'IGLESIA ARCA EVANGELICA DIOS FUERTE',
  churchSub: '',
  location: '',
  worshipType: '',
  worshipTypeId: '',
  dateInput: '',
  timeInput: '',
  verse: '',
  logoUrl: '',
}

// Regex para validar nombres (letras latinas, espacios, tildes)
const NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/
const NAME_MAX_LENGTH = 50
const NAME_MIN_LENGTH = 3

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Construye el payload de actualización del programa */
function buildUpdatePayload(form: FlyerForm, assignments: Assignment[]) {
  return {
    activityType: { id: form.worshipTypeId, name: form.worshipType },
    programDate: form.dateInput,
    defaultTime: form.timeInput,
    verse: form.verse,
    assignments: assignments.map((a) => ({
      sectionOrder: a.id,
      roleName: a.name,
      sectionName: a.sectionName || a.name,
      person: a.personId ? { id: a.personId, name: a.person } : undefined,
    })),
    church: {
      name: form.churchName,
      subTitle: form.churchSub,
      location: form.location,
    },
  }
}

/** Extrae la cita bíblica resumida para el footer */
function extractVerseSummary(verse: string): string {
  if (!verse || verse.length < 40) return verse || ''
  const citaMatch = verse.match(/([A-Za-záéíóúÁÉÍÓÚñÑ ]+\d+[:.,]\d+)/)
  return citaMatch ? citaMatch[0] : verse.slice(0, 40) + '...'
}

// ─── Componentes auxiliares ──────────────────────────────────────────────────

interface FormFieldProps {
  label: string
  id: string
  type?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
}

const FormField = ({ label, id, type = 'text', value, onChange, placeholder }: FormFieldProps) => (
  <div>
    <label htmlFor={id} className="block text-[13px] font-bold text-gray-600 mb-1 tracking-wide">
      {label}
    </label>
    <input
      type={type}
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-[16px] font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
    />
  </div>
)

// ─── Componente principal ────────────────────────────────────────────────────

const FlyerPreviewPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Estado principal
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState<FlyerForm>(INITIAL_FORM)
  const [footerSummary, setFooterSummary] = useState('')
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [peoplePool, setPeoplePool] = useState<PersonOption[]>([])
  const [saving, setSaving] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  // Sugerencias por índice (cada campo tiene las suyas)
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState<number | null>(null)
  const [suggestions, setSuggestions] = useState<PersonOption[]>([])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const suggestionsRef = useRef<HTMLDivElement | null>(null)

  // Ref para acceder a assignments actualizado en closures
  const assignmentsRef = useRef<Assignment[]>(assignments)
  useEffect(() => {
    assignmentsRef.current = assignments
  }, [assignments])

  const [debouncedVerse] = useDebounce(form.verse, 600)

  // ─── Data fetching ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return

    let cancelled = false

    async function fetchData() {
      setLoading(true)
      setError('')
      try {
        const [progRes, peopleRes, flyerRes] = await Promise.all([
          programsApi.get(id as string),
          personsApi.getAll({ status: 'active' }),
          programsApi.getFlyerHtml(id as string),
        ])

        if (cancelled) return

        const prog = progRes.data.data

        setForm({
          churchName: prog.church?.name || INITIAL_FORM.churchName,
          churchSub: prog.church?.subTitle || '',
          location: prog.church?.location || '',
          worshipType: prog.activityType?.name || '',
          worshipTypeId: prog.activityType?.id || '',
          dateInput: prog.programDate ? prog.programDate.slice(0, 10) : '',
          timeInput: prog.defaultTime || '',
          verse: prog.verse || '',
          logoUrl: prog.church?.logoUrl || '',
        })

        // Mapear asignaciones
        let asigs: Assignment[] = (prog.assignments || []).map((a: any, idx: number) => ({
          id: a.sectionOrder || a.id || idx + 1,
          name: a.roleName || a.sectionName || a.name || '',
          sectionName: a.sectionName || a.name || '',
          person: a.person?.name || (typeof a.person === 'string' ? a.person : '') || '',
          personId: a.person?.id || a.person?._id || '',
        }))

        // Si NO es grupo de adoración y falta 'Mensaje', agregarlo
        const isGrupoAdoracion = (prog.activityType?.name || '')
          .toUpperCase()
          .includes('GRUPO DE ADORACION')

        if (
          !isGrupoAdoracion &&
          !asigs.some((a) => a.name.toLowerCase().includes('mensaje'))
        ) {
          asigs.push({
            id: asigs.length + 1,
            name: 'Mensaje',
            sectionName: 'Mensaje',
            person: '',
            personId: '',
          })
        }

        setAssignments(asigs)
        setPeoplePool(
          (peopleRes.data.data || []).map((p: any) => ({
            id: p._id || p.id,
            fullName: p.fullName,
          }))
        )
        setHtml(flyerRes.data)
      } catch (err) {
        if (!cancelled) {
          console.error('Error cargando datos del flyer:', err)
          setError('No se pudo cargar el flyer o el programa.')
        }
      }
      if (!cancelled) setLoading(false)
    }

    fetchData()
    return () => {
      cancelled = true
    }
  }, [id])

  // ─── Actualizar preview HTML cuando cambian form/assignments ─────────────

  useEffect(() => {
    if (!id || loading || error) return

    let cancelled = false

    async function updateHtml() {
      try {
        const res = await programsApi.getFlyerHtml(id as string, footerSummary)
        if (!cancelled) setHtml(res.data)
      } catch (err) {
        console.error('Error actualizando preview:', err)
      }
    }

    updateHtml()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, form, assignments, footerSummary])

  // ─── Resumir versículo para el footer ────────────────────────────────────

  useEffect(() => {
    setFooterSummary(extractVerseSummary(debouncedVerse || ''))
  }, [debouncedVerse])

  // ─── Cerrar sugerencias al hacer clic fuera ─────────────────────────────

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      const clickedInsideInput = inputRefs.current.some(
        (ref) => ref && ref.contains(target)
      )
      const clickedInsideSuggestions =
        suggestionsRef.current && suggestionsRef.current.contains(target)

      if (!clickedInsideInput && !clickedInsideSuggestions) {
        setSuggestions([])
        setActiveSuggestionIdx(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ─── Handlers ────────────────────────────────────────────────────────────

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { id: fieldId, value } = e.target
    setForm((prev) => ({ ...prev, [fieldId]: value }))
  }, [])

  const handleAssignmentInput = useCallback(
    async (idx: number, value: string) => {
      setAssignments((prev) =>
        prev.map((row, i) => (i === idx ? { ...row, person: value, personId: '' } : row))
      )
      setActiveSuggestionIdx(idx)

      if (!value?.trim()) {
        setSuggestions([])
        setActiveSuggestionIdx(null)
        return
      }

      try {
        const res = await personsApi.getAll({ search: value })
        const currentAssignments = assignmentsRef.current
        const assignedIds = new Set(
          currentAssignments
            .filter((_, i) => i !== idx)
            .map((a) => a.personId)
            .filter(Boolean)
        )

        const seenNames = new Set<string>()
        const filtered: PersonOption[] = []

        for (const p of res.data.data || []) {
          const personId = p._id || p.id
          if (assignedIds.has(personId)) continue
          if (seenNames.has(p.fullName)) continue
          seenNames.add(p.fullName)
          filtered.push({ id: personId, fullName: p.fullName })
        }

        setSuggestions(filtered)
      } catch {
        setSuggestions([])
      }
    },
    []
  )

  const selectSuggestion = useCallback((idx: number, person: PersonOption) => {
    setAssignments((prev) =>
      prev.map((row, i) =>
        i === idx ? { ...row, person: person.fullName, personId: person.id } : row
      )
    )
    setSuggestions([])
    setActiveSuggestionIdx(null)
    // Devolver foco para mejor UX
    setTimeout(() => inputRefs.current[idx]?.blur(), 0)
  }, [])

  const confirmAssignment = useCallback(
    async (idx: number) => {
      const current = assignmentsRef.current[idx]
      if (!current) return

      const value = current.person?.trim()

      // Si ya tiene personId confirmado, no hacer nada
      if (current.personId) {
        setSuggestions([])
        setActiveSuggestionIdx(null)
        return
      }

      // Si está vacío, simplemente limpiar
      if (!value) {
        setSuggestions([])
        setActiveSuggestionIdx(null)
        return
      }

      // Validaciones
      if (value.length < NAME_MIN_LENGTH) {
        toast.error(`El nombre debe tener al menos ${NAME_MIN_LENGTH} caracteres`)
        return
      }
      if (!NAME_REGEX.test(value)) {
        toast.error('Solo se permiten letras y espacios en el nombre')
        return
      }
      if (value.length > NAME_MAX_LENGTH) {
        toast.error(`El nombre no puede exceder ${NAME_MAX_LENGTH} caracteres`)
        return
      }

      // Verificar duplicados
      const alreadyAssigned = assignmentsRef.current.some(
        (row, i) => i !== idx && row.person.trim().toLowerCase() === value.toLowerCase()
      )
      if (alreadyAssigned) {
        toast.error('Esta persona ya está asignada en otra sección')
        setAssignments((prev) =>
          prev.map((row, i) => (i === idx ? { ...row, person: '', personId: '' } : row))
        )
        setSuggestions([])
        setActiveSuggestionIdx(null)
        return
      }

      // Buscar en pool local
      let found = peoplePool.find(
        (p) => p.fullName.toLowerCase() === value.toLowerCase()
      )

      // Buscar en backend si no está en pool
      if (!found) {
        try {
          const res = await personsApi.getAll({ search: value })
          const match = (res.data.data || []).find(
            (p: any) => p.fullName.toLowerCase() === value.toLowerCase()
          )
          if (match) {
            found = { id: match._id || match.id, fullName: match.fullName }
          }
        } catch {
          // Silenciar error de búsqueda
        }
      }

      if (found) {
        setAssignments((prev) =>
          prev.map((row, i) =>
            i === idx ? { ...row, person: found!.fullName, personId: found!.id } : row
          )
        )
        setSuggestions([])
        setActiveSuggestionIdx(null)
        toast.success('Persona asignada')
        return
      }

      // Crear persona nueva si no existe
      try {
        const res = await personsApi.create({
          fullName: value,
          ministry: 'Jóvenes',
          status: 'ACTIVE',
        })
        const newPerson: PersonOption = {
          id: res.data.data._id || res.data.data.id,
          fullName: res.data.data.fullName,
        }
        setPeoplePool((prev) => [...prev, newPerson])
        setAssignments((prev) =>
          prev.map((row, i) =>
            i === idx
              ? { ...row, person: newPerson.fullName, personId: newPerson.id }
              : row
          )
        )
        setSuggestions([])
        setActiveSuggestionIdx(null)
        toast.success('Persona creada y asignada')
      } catch {
        toast.error('Error al crear persona')
      }
    },
    [peoplePool]
  )

  const clearAssignment = useCallback((idx: number) => {
    setAssignments((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, person: '', personId: '' } : row))
    )
    setSuggestions([])
    setActiveSuggestionIdx(null)
    toast.success('Asignación eliminada')
  }, [])

  const clearAll = useCallback(() => {
    setAssignments((prev) => prev.map((row) => ({ ...row, person: '', personId: '' })))
    toast.success('Todas las asignaciones borradas')
  }, [])

  const randomizeAll = useCallback(() => {
    if (peoplePool.length === 0) {
      toast.error('No hay personas disponibles para asignar')
      return
    }

    // Shuffle sin repetir (Fisher-Yates)
    const shuffled = [...peoplePool]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    setAssignments((prev) =>
      prev.map((row, i) => {
        if (i < shuffled.length) {
          return { ...row, person: shuffled[i].fullName, personId: shuffled[i].id }
        }
        // Si hay más roles que personas, dejar vacío
        return { ...row, person: '', personId: '' }
      })
    )

    if (peoplePool.length < assignments.length) {
      toast.warning(
        `Solo hay ${peoplePool.length} personas para ${assignments.length} roles. Algunos quedarán vacíos.`
      )
    } else {
      toast.success('Personas asignadas al azar')
    }
  }, [peoplePool, assignments.length])

  // ─── Validación ──────────────────────────────────────────────────────────

  const validateRequired = useCallback((): boolean => {
    if (!form.churchName?.trim()) {
      toast.error('El nombre de la iglesia es obligatorio')
      return false
    }
    if (!form.worshipType?.trim()) {
      toast.error('El tipo de culto es obligatorio')
      return false
    }
    if (!form.dateInput?.trim()) {
      toast.error('La fecha es obligatoria')
      return false
    }
    if (!form.timeInput?.trim()) {
      toast.error('La hora es obligatoria')
      return false
    }

    for (const a of assignments) {
      if (!a.sectionName?.trim()) {
        toast.error('Falta el nombre de una sección en las asignaciones.')
        return false
      }
      // 'Mensaje' puede quedar vacío
      if (a.sectionName.toLowerCase() === 'mensaje') continue
      if (!a.personId?.trim()) {
        toast.error(`Falta asignar persona en la sección "${a.sectionName || a.name}".`)
        return false
      }
    }

    return true
  }, [form, assignments])

  // ─── Guardar ─────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!validateRequired()) return
    setSaving(true)
    try {
      await programsApi.update(id as string, buildUpdatePayload(form, assignments))
      toast.success('Programa actualizado')
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }, [id, form, assignments, validateRequired])

  // ─── Descargar PDF ───────────────────────────────────────────────────────

  const handleDownloadPdf = useCallback(async () => {
    if (!validateRequired()) return
    setDownloadingPdf(true)
    try {
      // 1. Guardar cambios primero
      await programsApi.update(id as string, buildUpdatePayload(form, assignments))

      // 2. Descargar PDF
      const res = await programsApi.downloadPdf(id as string, footerSummary)
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
      toast.error('Error al guardar o generar el PDF')
    } finally {
      setDownloadingPdf(false)
    }
  }, [id, form, assignments, footerSummary, validateRequired])

  // ─── Logo URL ────────────────────────────────────────────────────────────

  const logoSrc = useMemo(
    () => (form.logoUrl ? `/uploads/${form.logoUrl}` : '/logo-arca.png'),
    [form.logoUrl]
  )

  // ─── Render ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <p className="text-red-600 text-lg font-semibold">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Barra superior */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#1a2956] hover:bg-[#243775] text-white font-bold transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-bold transition-colors disabled:opacity-50"
          >
            {downloadingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Descargar PDF
          </button>
        </div>
      </div>

      {/* Layout principal: formulario + preview */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* ─── Panel izquierdo: formulario ─── */}
        <div className="w-full lg:w-[430px] bg-white rounded-2xl shadow-xl border border-gray-200 flex flex-col overflow-hidden flex-shrink-0">
          {/* Header del panel */}
          <div className="bg-[#1a2956] px-5 py-5 flex flex-col items-center justify-center">
            <img
              src={logoSrc}
              alt="Logo Iglesia"
              className="h-14 w-14 rounded-full border-2 border-white shadow-lg object-cover mb-2"
              style={{ background: '#fff' }}
            />
            <span className="text-white font-extrabold tracking-wide text-xl uppercase text-center leading-tight">
              {form.churchName || INITIAL_FORM.churchName}
            </span>
            {form.churchSub && (
              <span className="text-white text-base font-medium mt-1 text-center opacity-85">
                {form.churchSub}
              </span>
            )}
            {form.location && (
              <span className="text-white text-sm mt-1 text-center opacity-70">
                {form.location}
              </span>
            )}
          </div>

          {/* Campos del formulario */}
          <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-250px)]">
            <div className="grid grid-cols-1 gap-3">
              <FormField
                label="NOMBRE DE LA IGLESIA"
                id="churchName"
                value={form.churchName}
                onChange={handleInput}
              />
              <FormField
                label="SUBTÍTULO"
                id="churchSub"
                value={form.churchSub}
                onChange={handleInput}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="TIPO DE CULTO"
                id="worshipType"
                value={form.worshipType}
                onChange={handleInput}
              />
              <FormField
                label="UBICACIÓN"
                id="location"
                value={form.location}
                onChange={handleInput}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="FECHA"
                id="dateInput"
                type="date"
                value={form.dateInput}
                onChange={handleInput}
              />
              <FormField
                label="HORA"
                id="timeInput"
                type="time"
                value={form.timeInput}
                onChange={handleInput}
              />
            </div>

            <FormField
              label="VERSÍCULO (FOOTER)"
              id="verse"
              value={form.verse}
              onChange={handleInput}
            />

            {/* Asignaciones */}
            <div className="flex items-center justify-between mt-2 mb-1">
              <span className="text-[13px] font-bold text-gray-700 uppercase tracking-wider">
                ASIGNACIONES DEL PROGRAMA
              </span>
              <button
                type="button"
                onClick={randomizeAll}
                className="text-xs font-semibold flex items-center gap-1 px-3 py-1 rounded transition-colors bg-yellow-200 border border-yellow-300 text-yellow-900 hover:bg-yellow-300"
              >
                <Dice5 className="w-3.5 h-3.5" />
                Asignar al azar
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {assignments.map((a, i) => (
                <div className="flex items-center gap-2 group" key={`assignment-${a.id}-${i}`}>
                  <span className="w-9 h-9 rounded bg-[#1a2956] text-white text-base flex items-center justify-center font-bold flex-shrink-0 border border-[#1a2956] shadow-sm">
                    {String(a.id).padStart(2, '0')}
                  </span>
                  <span className="text-gray-900 w-40 font-bold text-[16px] truncate" title={a.name}>
                    {a.name}
                  </span>
                  <div className="relative flex-1">
                    <input
                      ref={(el) => {
                        inputRefs.current[i] = el
                      }}
                      type="text"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-[#f5f6fa] text-[16px] font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition group-hover:border-yellow-400"
                      placeholder="Sin asignar"
                      value={a.person}
                      onChange={(e) => handleAssignmentInput(i, e.target.value)}
                      onBlur={() => {
                        // Delay para permitir clic en sugerencias
                        setTimeout(() => confirmAssignment(i), 150)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          confirmAssignment(i)
                        }
                        if (e.key === 'Escape') {
                          setSuggestions([])
                          setActiveSuggestionIdx(null)
                        }
                      }}
                      autoComplete="off"
                    />
                    {/* Dropdown de sugerencias - solo para el campo activo */}
                    {activeSuggestionIdx === i && suggestions.length > 0 && (
                      <div
                        ref={suggestionsRef}
                        className="absolute z-20 bg-white border border-gray-300 rounded-lg shadow-lg mt-1 w-full max-h-48 overflow-y-auto"
                      >
                        {suggestions.map((s) => (
                          <div
                            key={s.id}
                            className="px-3 py-2 cursor-pointer hover:bg-yellow-100 text-[15px] font-medium transition-colors"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              selectSuggestion(i, s)
                            }}
                          >
                            {s.fullName}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => clearAssignment(i)}
                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                    title="Eliminar asignación"
                    aria-label={`Eliminar asignación de ${a.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Botones de acción inferiores */}
            <div className="flex flex-col gap-2 mt-4">
              <button
                className="w-full py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-bold transition-colors flex items-center justify-center gap-2 text-[15px] disabled:opacity-50"
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
              >
                {downloadingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Descargar PDF
              </button>
              <button
                className="w-full py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold transition-colors flex items-center justify-center gap-2 text-[15px] border border-blue-200"
                type="button"
                onClick={randomizeAll}
              >
                <Shuffle className="w-4 h-4" />
                Reasignar personas
              </button>
              <button
                className="w-full py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold transition-colors flex items-center justify-center gap-2 text-[15px] border border-gray-200"
                type="button"
                onClick={clearAll}
              >
                <Trash2 className="w-4 h-4" />
                Limpiar todas las asignaciones
              </button>
            </div>
          </div>
        </div>

        {/* ─── Panel derecho: preview del flyer ─── */}
        <div className="flex-1 flex items-start justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-6 min-h-[700px] flex flex-col items-center border border-gray-200 w-full">
            {/* Header del flyer */}
            <div className="flex items-center justify-center mb-6 w-full">
              <img
                src={logoSrc}
                alt="Logo Iglesia"
                className="h-20 w-20 rounded-full border-2 border-[#1a2956] shadow-lg object-cover mr-6 flex-shrink-0"
                style={{ background: '#fff' }}
              />
              <div className="flex flex-col items-center flex-1">
                <span className="text-[#1a2956] font-extrabold tracking-wide text-3xl uppercase text-center leading-tight">
                  {form.churchName || INITIAL_FORM.churchName}
                </span>
                {form.churchSub && (
                  <span className="text-[#1a2956] text-lg font-medium mt-1 text-center opacity-85">
                    {form.churchSub}
                  </span>
                )}
                {form.location && (
                  <span className="text-[#1a2956] text-base mt-1 text-center opacity-70">
                    {form.location}
                  </span>
                )}
              </div>
            </div>

            {/* Contenido HTML del flyer */}
            <div
              className="w-full"
              style={{ minWidth: 350, minHeight: 650 }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default FlyerPreviewPage
