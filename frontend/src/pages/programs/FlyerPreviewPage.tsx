import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useDebounce } from 'use-debounce'
import { useParams, useNavigate } from 'react-router-dom'
import { programsApi, personsApi } from '../../lib/api'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

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
  ampm?: string
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
  ampm: 'AM',
  verse: '',
  logoUrl: '',
}

const NAME_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/
const NAME_MAX_LENGTH = 50
const NAME_MIN_LENGTH = 3

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildUpdatePayload(form: FlyerForm, assignments: Assignment[]) {
  return {
    activityType: { id: form.worshipTypeId, name: form.worshipType },
    programDate: form.dateInput,
    defaultTime: form.timeInput,
    ampm: form.ampm,
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

function formatDateES(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T12:00:00')
  const opts: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }
  const formatted = d.toLocaleDateString('es-DO', opts)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function formatTimeES(timeStr: string, ampm?: string): string {
  if (!timeStr) return ''
  // Soporta HH:mm o HH:mm:ss
  const parts = timeStr.split(':')
  let h = parseInt(parts[0])
  let m = parts[1] || '00'
  const displayAmpm = ampm || 'AM'
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${h12}:${m.padStart(2, '0')} ${displayAmpm}`
}

// ─── Inject Google Fonts ─────────────────────────────────────────────────────

function useGoogleFonts() {
  useEffect(() => {
    const id = 'flyer-google-fonts'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href =
      'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap'
    document.head.appendChild(link)
  }, [])
}

// ─── Componente principal ────────────────────────────────────────────────────

const FlyerPreviewPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  useGoogleFonts()

  // State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState<FlyerForm>(INITIAL_FORM)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [peoplePool, setPeoplePool] = useState<PersonOption[]>([])
  const [saving, setSaving] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('preview')

  // Suggestions
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState<number | null>(null)
  const [suggestions, setSuggestions] = useState<PersonOption[]>([])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const suggestionsRef = useRef<HTMLDivElement | null>(null)
  const assignmentsRef = useRef<Assignment[]>(assignments)

  useEffect(() => {
    assignmentsRef.current = assignments
  }, [assignments])

  const [debouncedVerse] = useDebounce(form.verse, 600)

  const footerSummary = useMemo(() => {
    const v = debouncedVerse || ''
    if (!v || v.length < 40) return v
    const citaMatch = v.match(/([A-Za-záéíóúÁÉÍÓÚñÑ ]+\d+[:.,]\d+)/)
    return citaMatch ? citaMatch[0] : v.slice(0, 40) + '...'
  }, [debouncedVerse])

  // ─── Data fetching ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function fetchData() {
      setLoading(true)
      setError('')
      try {
        const [progRes, peopleRes] = await Promise.all([
          programsApi.get(id as string),
          personsApi.getAll({ status: 'active' }),
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
          ampm: prog.ampm || 'AM',
          verse: prog.verse || '',
          logoUrl: prog.church?.logoUrl || '',
        })

        let asigs: Assignment[] = (prog.assignments || []).map((a: any, idx: number) => ({
          id: a.sectionOrder || a.id || idx + 1,
          name: a.roleName || a.sectionName || a.name || '',
          sectionName: a.sectionName || a.name || '',
          person: a.person?.name || (typeof a.person === 'string' ? a.person : '') || '',
          personId: a.person?.id || a.person?._id || '',
        }))

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

  // ─── Click outside to close suggestions ──────────────────────────────────

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      const clickedInsideInput = inputRefs.current.some((ref) => ref && ref.contains(target))
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

  const handleAssignmentInput = useCallback(async (idx: number, value: string) => {
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
  }, [])

  const selectSuggestion = useCallback((idx: number, person: PersonOption) => {
    setAssignments((prev) =>
      prev.map((row, i) =>
        i === idx ? { ...row, person: person.fullName, personId: person.id } : row
      )
    )
    setSuggestions([])
    setActiveSuggestionIdx(null)
    setTimeout(() => inputRefs.current[idx]?.blur(), 0)
  }, [])

  const confirmAssignment = useCallback(
    async (idx: number) => {
      const current = assignmentsRef.current[idx]
      if (!current) return
      const value = current.person?.trim()

      if (current.personId) {
        setSuggestions([])
        setActiveSuggestionIdx(null)
        return
      }
      if (!value) {
        setSuggestions([])
        setActiveSuggestionIdx(null)
        return
      }
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

      let found = peoplePool.find((p) => p.fullName.toLowerCase() === value.toLowerCase())
      if (!found) {
        try {
          const res = await personsApi.getAll({ search: value })
          const match = (res.data.data || []).find(
            (p: any) => p.fullName.toLowerCase() === value.toLowerCase()
          )
          if (match) found = { id: match._id || match.id, fullName: match.fullName }
        } catch {}
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
            i === idx ? { ...row, person: newPerson.fullName, personId: newPerson.id } : row
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
        return { ...row, person: '', personId: '' }
      })
    )
    if (peoplePool.length < assignments.length) {
      toast.warning(
        `Solo hay ${peoplePool.length} personas para ${assignments.length} roles.`
      )
    } else {
      toast.success('Personas asignadas al azar')
    }
  }, [peoplePool, assignments.length])

  // ─── Validation ──────────────────────────────────────────────────────────

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
      if (a.sectionName.toLowerCase() === 'mensaje') continue
      if (!a.personId?.trim()) {
        toast.error(`Falta asignar persona en la sección "${a.sectionName || a.name}".`)
        return false
      }
    }
    return true
  }, [form, assignments])

  // ─── Save ────────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!validateRequired()) return
    setSaving(true)
    try {
      const res = await programsApi.update(id as string, buildUpdatePayload(form, assignments))
      // Actualizar el preview con los datos guardados
      const prog = res.data.data
      setForm({
        churchName: prog.churchName || form.churchName,
        churchSub: prog.churchSub || form.churchSub,
        location: prog.location || form.location,
        worshipType: prog.activityType?.name || form.worshipType,
        worshipTypeId: prog.activityType?.id || form.worshipTypeId,
        dateInput: prog.programDate ? prog.programDate.slice(0, 10) : form.dateInput,
        timeInput: prog.defaultTime || form.timeInput,
        ampm: prog.ampm || form.ampm,
        verse: prog.verse || form.verse,
        logoUrl: prog.logoUrl || form.logoUrl,
      })
      setAssignments(
        Array.isArray(prog.assignments)
          ? prog.assignments.map((a: any) => ({
              id: a.sectionOrder || a.id,
              name: a.roleName || a.sectionName || a.name,
              sectionName: a.sectionName || a.name,
              person: a.person?.name || '',
              personId: a.person?.id || '',
            }))
          : assignments
      )
      toast.success('¡Programa guardado exitosamente!', {
        style: { background: '#22C55E', color: 'white', fontWeight: 700, fontSize: '1.1rem', textAlign: 'center' },
        duration: 3500,
      })
    } catch {
      toast.error('Error al guardar el programa', {
        style: { background: '#EF4444', color: 'white', fontWeight: 700, fontSize: '1.1rem', textAlign: 'center' },
        duration: 3500,
      })
    } finally {
      setSaving(false)
    }
  }, [id, form, assignments, validateRequired])

  // ─── Download PDF (Descarga directa sin guardar cambios) ────────────────

  const handleDirectDownloadPdf = useCallback(async () => {
    setDownloadingPdf(true)
    try {
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
      toast.success('PDF descargado', {
        style: { background: '#22C55E', color: 'white', fontWeight: 700, fontSize: '1.1rem', textAlign: 'center' },
        duration: 2500,
      })
    } catch {
      toast.error('Error al generar el PDF', {
        style: { background: '#EF4444', color: 'white', fontWeight: 700, fontSize: '1.1rem', textAlign: 'center' },
        duration: 3500,
      })
    } finally {
      setDownloadingPdf(false)
    }
  }, [id, footerSummary])

  // ─── Download PDF (Guardar cambios y descargar desde configuración) ──────

  const handleDownloadPdf = useCallback(async () => {
    if (!validateRequired()) return
    setDownloadingPdf(true)
    try {
      await programsApi.update(id as string, buildUpdatePayload(form, assignments))
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
      toast.success('Cambios guardados y PDF descargado', {
        style: { background: '#22C55E', color: 'white', fontWeight: 700, fontSize: '1.1rem', textAlign: 'center' },
        duration: 3500,
      })
    } catch {
      toast.error('Error al guardar o generar el PDF', {
        style: { background: '#EF4444', color: 'white', fontWeight: 700, fontSize: '1.1rem', textAlign: 'center' },
        duration: 3500,
      })
    } finally {
      setDownloadingPdf(false)
    }
  }, [id, form, assignments, footerSummary, validateRequired])

  // Usar logo real de la iglesia si existe
  const logoSrc = useMemo(
    () => {
      // Si hay logoUrl en el form, úsalo (puede venir como "/uploads/file.png" o solo "file.png")
      if (form.logoUrl) return form.logoUrl.startsWith('/') ? form.logoUrl : `/uploads/${form.logoUrl}`
      // Si existe logo.png en uploads, úsalo
      return '/uploads/logo.png'
    },
    [form.logoUrl]
  )

  // ─── Loading / Error ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Loader2 style={{ width: 32, height: 32, animation: 'spin 1s linear infinite', color: C.navy }} />
        <span style={{ fontSize: 14, color: C.gray500, fontFamily: F.body }}>Cargando programa...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <p style={{ color: C.red, fontSize: 16, fontWeight: 600, fontFamily: F.body }}>{error}</p>
        <button onClick={() => navigate(-1)} style={styles.errorBtn}>← Volver</button>
      </div>
    )
  }

  // ─── Main Render ─────────────────────────────────────────────────────────

  return (
    <>
      <style>{SCOPED_CSS}</style>

      <div className="fe-page">
        {/* ══════════════════════ TOP BAR ══════════════════════ */}
        <div style={styles.topbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate(-1)} className="fe-topbar-btn" style={styles.topbarBackBtn}>
              ← Volver
            </button>
            <span style={styles.topbarBrand}>
              ✝ IGLESIA DIOS FUERTE <span style={{ color: C.goldLight }}>ARCA EVANGELICA</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={styles.liveBadge}>
              <div className="fe-live-dot" />
              Vista en tiempo real
            </div>
            <span style={styles.topbarBadge}>Editor de Programa</span>
            <button 
              onClick={() => navigate(`/programs/share-whatsapp?ids=${id}`)} 
              className="fe-btn-whatsapp" 
              style={{
                ...styles.topbarSaveBtn, 
                background: 'linear-gradient(135deg, #25D366, #128C7E)',
              }}
            >
              📱 WhatsApp
            </button>
            <button 
              onClick={handleDirectDownloadPdf} 
              disabled={downloadingPdf} 
              className="fe-btn-gold" 
              style={{
                ...styles.topbarSaveBtn,
                background: downloadingPdf ? '#999' : 'linear-gradient(135deg, #D4AF37, #B8941E)',
                opacity: downloadingPdf ? 0.6 : 1,
              }}
              title="Descargar PDF del programa guardado"
            >
              {downloadingPdf ? '⏳' : '⬇️'} Descargar PDF
            </button>
            <button onClick={handleSave} disabled={saving} className="fe-btn-primary" style={{
              ...styles.topbarSaveBtn, opacity: saving ? 0.6 : 1,
            }}>
              {saving ? '⏳' : '💾'} Guardar
            </button>
          </div>
        </div>

        {/* ══════════════════════ MOBILE TABS ══════════════════════ */}
        <div className="fe-mobile-tabs" style={styles.mobileTabs}>
          <button 
            className={`fe-tab ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
            style={{
              ...styles.mobileTab,
              ...(activeTab === 'preview' ? styles.mobileTabActive : {})
            }}
          >
            👁️ Vista Previa
          </button>
          <button 
            className={`fe-tab ${activeTab === 'edit' ? 'active' : ''}`}
            onClick={() => setActiveTab('edit')}
            style={{
              ...styles.mobileTab,
              ...(activeTab === 'edit' ? styles.mobileTabActive : {})
            }}
          >
            ⚙️ Configuración
          </button>
        </div>

        {/* ══════════════════════ WORKSPACE ══════════════════════ */}
        <div className="fe-workspace" style={styles.workspace}>

          {/* ─── LEFT PANEL: EDITOR ─── */}
          <div 
            className="fe-panel" 
            style={{
              ...styles.panel,
              display: activeTab === 'edit' ? 'block' : 'none'
            }}
          >
            <div style={styles.panelHeader}>
              <h2 style={styles.panelHeaderTitle}>⚙️ Configuración</h2>
            </div>

            <div style={styles.panelBody}>
              {/* Iglesia */}
              <FormGroup label="Nombre de la iglesia" id="churchName" value={form.churchName} onChange={handleInput} />

              <div style={styles.formRow}>
                <FormGroup label="Subtítulo" id="churchSub" value={form.churchSub} onChange={handleInput} />
                <FormGroup label="Tipo de culto" id="worshipType" value={form.worshipType} onChange={handleInput} />
              </div>

              <FormGroup label="Ubicación" id="location" value={form.location} onChange={handleInput} />

              <div style={styles.formRow}>
                <FormGroup label="Fecha" id="dateInput" type="date" value={form.dateInput} onChange={handleInput} />
                <div style={{ marginBottom: '1rem', flex: 1 }}>
                  <label htmlFor="timeInput" style={styles.formLabel}>Hora</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="time"
                      id="timeInput"
                      step="60"
                      value={form.timeInput}
                      onChange={handleInput}
                      style={{ ...styles.formInput, flex: 1, marginBottom: 0 }}
                    />
                    <select
                      value={form.ampm || 'AM'}
                      onChange={e => setForm(prev => ({ ...prev, ampm: e.target.value }))}
                      style={{
                        ...styles.formInput,
                        width: 62,
                        padding: '9px 6px',
                        marginBottom: 0,
                        fontWeight: 600,
                        color: C.navy,
                        textAlign: 'center' as const,
                        cursor: 'pointer',
                      }}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </div>
              </div>

              <FormGroup label="Versículo (footer)" id="verse" value={form.verse} onChange={handleInput} />

              {/* Sección Asignaciones */}
              <div style={styles.sectionTitle}>
                <span>Asignaciones del programa</span>
                <button className="fe-btn-randomize" onClick={randomizeAll} style={styles.randomizeBtn}>
                  🎲 Asignar al azar
                </button>
              </div>

              {/* Rows */}
              <div>
                {assignments.map((a, i) => (
                  <div
                    key={`a-${a.id}-${i}`}
                    className="fe-assignment-row"
                    style={{
                      ...styles.assignmentRow,
                      borderBottom: i < assignments.length - 1 ? `1px solid ${C.gray100}` : 'none',
                    }}
                  >
                    <div style={styles.roleBadge}>
                      {String(a.id).padStart(2, '0')}
                    </div>
                    <div style={styles.roleLabel} title={a.name}>{a.name}</div>
                    <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
                      <input
                        ref={(el) => { inputRefs.current[i] = el }}
                        type="text"
                        className={`fe-name-input${a.personId ? ' assigned' : ''}`}
                        placeholder="Sin asignar"
                        value={a.person}
                        onChange={(e) => handleAssignmentInput(i, e.target.value)}
                        onBlur={() => setTimeout(() => confirmAssignment(i), 150)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); confirmAssignment(i) }
                          if (e.key === 'Escape') { setSuggestions([]); setActiveSuggestionIdx(null) }
                        }}
                        autoComplete="off"
                        style={styles.nameInput}
                      />
                      {activeSuggestionIdx === i && suggestions.length > 0 && (
                        <div ref={suggestionsRef} style={styles.suggestionsDropdown}>
                          {suggestions.map((s) => (
                            <div
                              key={s.id}
                              className="fe-suggestion-item"
                              style={styles.suggestionItem}
                              onMouseDown={(e) => { e.preventDefault(); selectSuggestion(i, s) }}
                            >
                              {s.fullName}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      className="fe-btn-clear"
                      onClick={() => clearAssignment(i)}
                      title="Limpiar"
                      style={styles.clearBtn}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={styles.actions}>
                <button className="fe-btn-gold" onClick={handleDownloadPdf} disabled={downloadingPdf || saving} style={{
                  ...styles.btn, ...styles.btnGold, opacity: (downloadingPdf || saving) ? 0.6 : 1,
                }} title="Guardar cambios y descargar PDF">
                  {downloadingPdf ? '⏳' : '💾⬇️'} Guardar y Descargar PDF
                </button>
                <button className="fe-btn-outline" onClick={randomizeAll} style={{ ...styles.btn, ...styles.btnOutline }}>
                  🔀 Reasignar personas
                </button>
                <button className="fe-btn-outline" onClick={clearAll} style={{ ...styles.btn, ...styles.btnOutline }}>
                  🗑️ Limpiar todas las asignaciones
                </button>
              </div>
            </div>
          </div>

          {/* ─── RIGHT PANEL: FLYER PREVIEW ─── */}
          <div 
            style={{
              ...styles.previewWrapper,
              display: activeTab === 'preview' ? 'block' : 'none'
            }}
          >
            {/* Label */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={styles.previewLabel}>
                Vista previa del flyer
                <span style={styles.previewLabelLine} />
              </span>
              <div style={styles.liveBadge}>
                <div className="fe-live-dot" />
                Se actualiza en tiempo real
              </div>
            </div>

            {/* ══════════ FLYER ══════════ */}
            <div style={styles.flyerContainer}>

              {/* ── HEADER ── */}
              <div style={styles.flyerHeader}>
                <div style={styles.flyerHeaderCircle1} />
                <div style={styles.flyerHeaderCircle2} />

                <div style={styles.headerInner}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ ...styles.flyerChurchName, textAlign: 'center', marginBottom: 6 }}>{form.churchName || 'Iglesia'}</div>
                    {form.churchSub && <div style={{ ...styles.flyerChurchSub, textAlign: 'center' }}>{form.churchSub}</div>}
                    {form.location && <div style={{ ...styles.flyerChurchLoc, textAlign: 'center' }}>{form.location}</div>}
                  </div>
                  <div style={{ position: 'relative', flexShrink: 0, width: 60, height: 60 }}>
                    <img
                      src={logoSrc}
                      alt="Logo Iglesia"
                      style={styles.logoImg}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                        const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement
                        if (fallback) fallback.style.display = 'flex'
                      }}
                    />
                    {/* Fallback icon when logo fails to load */}
                    <div style={{
                      display: 'none', width: 60, height: 60, background: 'rgba(255,255,255,0.1)',
                      border: '2px solid rgba(200,168,75,0.5)', borderRadius: 12,
                      alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem',
                      backdropFilter: 'blur(4px)', position: 'absolute', top: 0, left: 0,
                    }}>
                      ✝
                    </div>
                  </div>
                </div>
              </div>

              {/* Gold band */}
              <div style={styles.goldBand} />

              {/* Badge */}
              <div style={styles.badgeRow}>
                <div style={styles.flyerBadge}>{form.worshipType || 'Culto'}</div>
              </div>

              {/* Date & Time */}
              <div style={styles.dateRow}>
                <div style={styles.flyerDate}>{formatDateES(form.dateInput)}</div>
                <div style={styles.flyerTime}>{formatTimeES(form.timeInput, form.ampm)}</div>
              </div>

              {/* Ornament */}
              <div style={styles.ornament}>
                <div style={styles.ornamentLine} />
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0.7, 1, 0.7].map((op, idx) => (
                    <span key={idx} style={{ ...styles.diamond, opacity: op }} />
                  ))}
                </div>
                <div style={styles.ornamentLine} />
              </div>

              {/* Section title */}
              <div style={styles.flyerSectionTitle}>Orden del Culto</div>

              {/* Program table */}
              <div style={styles.flyerTable}>
                {assignments.map((a, i) => (
                  <div key={`prev-${a.id}-${i}`} style={{
                    ...styles.flyerRow,
                    background: i % 2 === 0 ? C.gray100 : C.white,
                    border: i % 2 === 1 ? `1px solid ${C.gray100}` : 'none',
                  }}>
                    <div style={styles.flyerRowNum}>{String(a.id).padStart(2, '0')}</div>
                    <div style={styles.flyerRowRole}>{a.name}</div>
                    {a.person ? (
                      <div style={styles.flyerRowPerson}>{a.person}</div>
                    ) : (
                      <div style={styles.flyerRowEmpty}>— — — — — — —</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Verse */}
              {form.verse && (
                <div style={styles.flyerVerse}>
                  <p style={styles.flyerVerseText}>{form.verse}</p>
                </div>
              )}

              {/* Footer */}
              <div style={styles.flyerFooter}>
                <span style={styles.flyerFooterText}>
                  {(form.churchName || 'Iglesia').toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── FormGroup ───────────────────────────────────────────────────────────────

function FormGroup({
  label, id, type = 'text', value, onChange,
}: {
  label: string; id: string; type?: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label htmlFor={id} style={styles.formLabel}>{label}</label>
      <input
        type={type} id={id} value={value} onChange={onChange}
        style={styles.formInput}
      />
    </div>
  )
}

// ─── Constants ───────────────────────────────────────────────────────────────

const C = {
  navy: '#1B2D5B',
  navyMid: '#2A4080',
  navyLight: '#3B5BA8',
  gold: '#C8A84B',
  goldLight: '#E8C96A',
  goldPale: '#FBF4E2',
  gray900: '#111827',
  gray700: '#374151',
  gray500: '#6B7280',
  gray300: '#D1D5DB',
  gray100: '#F3F4F6',
  bg: '#F7F8FC',
  white: '#FFFFFF',
  red: '#EF4444',
  green: '#22C55E',
} as const

const F = {
  body: "'DM Sans', sans-serif",
  display: "'Cormorant Garamond', serif",
}

// ─── Scoped CSS ──────────────────────────────────────────────────────────────

const SCOPED_CSS = `
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes slideIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.3); } }

  .fe-page * { box-sizing: border-box; }
  .fe-page { font-family: ${F.body}; background: ${C.bg}; color: ${C.gray900}; min-height: 100vh; }

  .fe-page input:focus {
    border-color: ${C.navyLight} !important;
    box-shadow: 0 0 0 3px rgba(59,91,168,0.12) !important;
    outline: none;
  }

  .fe-assignment-row { animation: slideIn 0.2s ease; }
  .fe-name-input.assigned { background: #f0f4ff !important; border-color: rgba(27,45,91,0.25) !important; }

  .fe-btn-clear:hover { background: #FEE2E2 !important; border-color: ${C.red} !important; color: ${C.red} !important; }
  .fe-btn-randomize:hover { background: ${C.gold} !important; color: ${C.navy} !important; }
  .fe-btn-primary:hover { background: ${C.navyMid} !important; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(27,45,91,0.3); }
  .fe-btn-gold:hover { background: ${C.goldLight} !important; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(200,168,75,0.35); }
  .fe-btn-outline:hover { border-color: ${C.navy} !important; background: ${C.gray100} !important; }
  .fe-topbar-btn:hover { background: rgba(255,255,255,0.18) !important; }
  .fe-suggestion-item:hover { background: ${C.goldPale} !important; }

  .fe-live-dot {
    width: 6px; height: 6px; background: ${C.green}; border-radius: 50%;
    animation: pulse 1.5s infinite; flex-shrink: 0;
  }

  /* Mobile Tab Styles */
  .fe-mobile-tabs { display: none; }
  
  .fe-tab {
    background: transparent;
    border: none;
    cursor: pointer;
    font-family: ${F.body};
    font-weight: 600;
    transition: all 0.2s;
  }
  
  .fe-tab:hover {
    background: rgba(255,255,255,0.1) !important;
  }

  /* Responsive Styles */
  @media (max-width: 1280px) {
    .fe-workspace { grid-template-columns: 360px 1fr !important; gap: 1.5rem !important; }
  }

  @media (max-width: 1024px) {
    .fe-workspace { grid-template-columns: 320px 1fr !important; gap: 1rem !important; padding: 1.5rem 1rem !important; }
    .fe-topbar-brand { font-size: 1rem !important; }
  }

  @media (max-width: 900px) {
    .fe-mobile-tabs { display: flex !important; }
    .fe-workspace { grid-template-columns: 1fr !important; gap: 0 !important; padding: 0 !important; }
    .fe-panel { 
      position: static !important; 
      border-radius: 0 !important;
      box-shadow: none !important;
      border-top: 1px solid #e5e7eb !important;
    }
    .fe-topbar-brand { display: none !important; }
    .fe-flyer-container { max-width: none !important; }
    .fe-preview-wrapper { padding: 1rem !important; }
  }

  @media (max-width: 640px) {
    .fe-page { font-size: 14px; }
    .fe-topbar { padding: 0 1rem !important; }
    .fe-topbar-back-btn { font-size: 0.75rem !important; padding: 5px 10px !important; }
    .fe-topbar-badge { font-size: 0.6rem !important; padding: 2px 8px !important; }
    .fe-topbar-save-btn { font-size: 0.7rem !important; padding: 6px 12px !important; }
    .fe-live-badge { font-size: 0.6rem !important; }
    .fe-panel-body { padding: 1rem !important; }
    
    /* Táctil-friendly inputs */
    .fe-form-input { min-height: 44px !important; font-size: 16px !important; }
    .fe-name-input { min-height: 44px !important; font-size: 16px !important; }
    .fe-btn { min-height: 48px !important; font-size: 1rem !important; }
    .fe-assignment-row { padding: 12px 0 !important; }
    .fe-role-badge { width: 32px !important; height: 32px !important; }
    .fe-clear-btn { width: 32px !important; height: 32px !important; }
    
    /* Preview optimizado */
    .fe-flyer-container { 
      margin: 0 -1rem !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      border: 1px solid #e5e7eb !important;
    }
  }
`

// ─── Styles object ───────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  loadingContainer: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '6rem 0', gap: 12,
  },
  errorContainer: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '6rem 0', gap: 20,
  },
  errorBtn: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
    borderRadius: 10, background: C.gray100, border: 'none', cursor: 'pointer',
    color: C.gray700, fontWeight: 500, fontFamily: F.body, fontSize: 14,
  },

  // Topbar
  topbar: {
    background: C.navy, padding: '0 2rem', height: 56, display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100,
    boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
  },
  topbarBackBtn: {
    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
    color: 'white', borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
    fontFamily: F.body, fontSize: '0.8rem', fontWeight: 500,
    display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
  },
  topbarBrand: {
    color: 'white', fontFamily: F.display, fontSize: '1.25rem', fontWeight: 700,
    letterSpacing: '0.03em',
  },
  topbarBadge: {
    background: 'rgba(200,168,75,0.18)', color: C.goldLight,
    border: '1px solid rgba(200,168,75,0.3)', fontSize: '0.7rem', fontWeight: 600,
    padding: '2px 10px', borderRadius: 20, letterSpacing: '0.08em', textTransform: 'uppercase',
  },
  topbarSaveBtn: {
    background: C.navyMid, color: 'white', border: 'none', borderRadius: 8,
    padding: '7px 16px', cursor: 'pointer', fontFamily: F.body,
    fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center',
    gap: 6, transition: 'all 0.18s',
  },
  liveBadge: {
    display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.68rem',
    color: C.green, fontWeight: 600,
  },

  // Mobile tabs
  mobileTabs: {
    background: C.navy, display: 'none', borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  mobileTab: {
    flex: 1, padding: '12px 16px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)',
    borderBottom: '2px solid transparent', background: 'transparent', border: 'none',
    cursor: 'pointer', fontFamily: F.body, fontWeight: 600, transition: 'all 0.2s',
  },
  mobileTabActive: {
    color: 'white', borderBottomColor: C.goldLight, background: 'rgba(255,255,255,0.05)',
  },

  // Workspace
  workspace: {
    display: 'grid', gridTemplateColumns: '380px 1fr', gap: '2rem',
    maxWidth: 1280, margin: '0 auto', padding: '2rem 1.5rem', alignItems: 'start',
  },

  // Panel
  panel: {
    background: C.white, borderRadius: 12,
    boxShadow: '0 4px 16px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)',
    overflow: 'hidden', position: 'sticky', top: 72,
  },
  panelHeader: {
    background: C.navy, padding: '1.25rem 1.5rem', display: 'flex',
    alignItems: 'center', justifyContent: 'space-between',
  },
  panelHeaderTitle: {
    color: 'white', fontSize: '0.95rem', fontWeight: 600,
    letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0,
  },
  panelBody: { padding: '1.5rem' },

  // Form
  formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' },
  formLabel: {
    display: 'block', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: C.gray500, marginBottom: 5,
  },
  formInput: {
    width: '100%', padding: '10px 14px', border: `1.5px solid ${C.gray300}`, borderRadius: 8,
    fontFamily: F.body, fontSize: '0.875rem', color: C.gray900, background: C.white,
    transition: 'border-color 0.15s, box-shadow 0.15s', outline: 'none', minHeight: 40,
  },

  // Assignments section
  sectionTitle: {
    fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
    color: C.gray500, margin: '1.25rem 0 0.75rem', paddingBottom: 6,
    borderBottom: `1px solid ${C.gray100}`, display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
  },
  randomizeBtn: {
    display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
    background: C.goldPale, color: C.navy, border: `1px solid ${C.gold}`,
    borderRadius: 6, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.15s', fontFamily: F.body, textTransform: 'none', letterSpacing: 0,
  },
  assignmentRow: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0',
  },
  roleBadge: {
    flexShrink: 0, width: 28, height: 28, background: C.navy, color: C.goldLight,
    borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.7rem', fontWeight: 700,
  },
  roleLabel: {
    flexShrink: 0, width: 110, fontSize: '0.8rem', fontWeight: 600, color: C.navy,
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  nameInput: {
    width: '100%', padding: '8px 12px', border: `1.5px solid ${C.gray300}`,
    borderRadius: 7, fontSize: '0.875rem', fontFamily: F.body,
    outline: 'none', transition: 'all 0.15s', color: C.gray900, minWidth: 0, minHeight: 40,
  },
  clearBtn: {
    flexShrink: 0, width: 28, height: 28, background: 'none',
    border: `1.5px solid ${C.gray300}`, borderRadius: 6, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: C.gray500, transition: 'all 0.15s', fontSize: '0.85rem',
  },
  suggestionsDropdown: {
    position: 'absolute', zIndex: 20, background: C.white,
    border: `1px solid ${C.gray300}`, borderRadius: 10,
    boxShadow: '0 10px 40px rgba(0,0,0,0.14)', marginTop: 4,
    width: '100%', maxHeight: 192, overflowY: 'auto',
  },
  suggestionItem: {
    padding: '8px 12px', cursor: 'pointer', fontSize: '0.83rem',
    fontWeight: 500, transition: 'background 0.15s',
  },

  // Actions
  actions: { marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  btn: {
    width: '100%', padding: '11px 16px', borderRadius: 9, fontFamily: F.body,
    fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s',
    border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
  },
  btnGold: { background: C.gold, color: C.navy },
  btnOutline: { background: 'transparent', color: C.navy, border: `1.5px solid ${C.gray300}` },

  // Preview wrapper
  previewWrapper: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  previewLabel: {
    fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
    color: C.gray500, display: 'flex', alignItems: 'center', gap: 8,
  },
  previewLabelLine: {
    flex: 1, height: 1, background: C.gray300, display: 'inline-block', minWidth: 40,
  },

  // ═══ FLYER ═══
  flyerContainer: {
    background: C.white, borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.14)',
    overflow: 'hidden', width: '100%', maxWidth: 540, margin: '0 auto',
  },
  flyerHeader: {
    background: 'linear-gradient(135deg, #1B2D5B 0%, #2A4080 60%, #1B2D5B 100%)',
    padding: '2.6rem 2rem 1.5rem', position: 'relative', overflow: 'hidden',
  },
  flyerHeaderCircle1: {
    position: 'absolute', top: -40, right: -40, width: 160, height: 160,
    background: 'rgba(200,168,75,0.08)', borderRadius: '50%',
  },
  flyerHeaderCircle2: {
    position: 'absolute', bottom: -20, left: -30, width: 120, height: 120,
    background: 'rgba(200,168,75,0.05)', borderRadius: '50%',
  },
  headerInner: {
    display: 'flex', alignItems: 'center', gap: '1.1rem', position: 'relative', zIndex: 1,
  },
  logoImg: {
    width: 60, height: 60, borderRadius: 10, objectFit: 'contain',
    border: '2px solid rgba(200,168,75,0.4)', background: 'rgba(255,255,255,0.1)', flexShrink: 0,
  },
  flyerChurchName: {
    fontFamily: F.display, fontSize: '1.35rem', fontWeight: 700,
    color: 'white', lineHeight: 1.1, letterSpacing: '0.02em',
  },
  flyerChurchSub: {
    fontSize: '0.75rem', color: C.goldLight, marginTop: 2, letterSpacing: '0.05em',
  },
  flyerChurchLoc: {
    fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', marginTop: 3,
  },
  goldBand: {
    height: 4, background: `linear-gradient(90deg, ${C.gold} 0%, ${C.goldLight} 50%, ${C.gold} 100%)`,
  },
  badgeRow: { display: 'flex', justifyContent: 'center', padding: '1.1rem 2rem 0.4rem' },
  flyerBadge: {
    background: C.gold, color: C.navy, fontFamily: F.display,
    fontSize: '1.1rem', fontWeight: 700, padding: '6px 24px', borderRadius: 30,
    letterSpacing: '0.06em', textTransform: 'uppercase',
  },
  dateRow: { textAlign: 'center', padding: '0.4rem 2rem 0.2rem' },
  flyerDate: {
    fontFamily: F.display, fontSize: '1.05rem', color: C.navy, fontWeight: 600,
  },
  flyerTime: { fontSize: '0.8rem', color: C.gray500, marginTop: 2 },

  // Ornament
  ornament: { display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem 2rem' },
  ornamentLine: {
    flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${C.gray300}, transparent)`,
  },
  diamond: {
    display: 'block', width: 5, height: 5, background: C.gold, transform: 'rotate(45deg)',
  },

  flyerSectionTitle: {
    textAlign: 'center', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em',
    textTransform: 'uppercase', color: C.navy, paddingBottom: '0.5rem',
  },

  // Table
  flyerTable: { padding: '0 1.5rem 1rem' },
  flyerRow: {
    display: 'flex', alignItems: 'center', padding: '10px 12px',
    borderRadius: 8, marginBottom: 4, minHeight: 44,
  },
  flyerRowNum: {
    flexShrink: 0, width: 22, height: 22, background: C.navy, color: C.goldLight,
    borderRadius: 5, fontSize: '0.65rem', fontWeight: 700, display: 'flex',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  flyerRowRole: {
    flexShrink: 0, width: 140, fontSize: '0.82rem', fontWeight: 600, color: C.navy,
  },
  flyerRowPerson: {
    flex: 1, fontFamily: F.display, fontSize: '1rem', fontWeight: 600,
    color: C.gray900, fontStyle: 'italic',
  },
  flyerRowEmpty: {
    flex: 1, color: C.gray300, fontStyle: 'normal', fontFamily: F.body,
    fontSize: '0.78rem', fontWeight: 400, letterSpacing: '0.03em',
  },

  // Verse
  flyerVerse: {
    textAlign: 'center', padding: '0.8rem 2rem 0.5rem',
    borderTop: `1px solid ${C.gray100}`, margin: '0 1.5rem',
  },
  flyerVerseText: {
    fontFamily: F.display, fontSize: '0.88rem', fontStyle: 'italic',
    color: C.gray500, lineHeight: 1.5, margin: 0,
  },

  // Footer
  flyerFooter: {
    background: C.navy, padding: '10px 2rem', display: 'flex',
    alignItems: 'center', justifyContent: 'center', marginTop: '0.8rem',
  },
  flyerFooterText: {
    fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)',
    letterSpacing: '0.08em', textTransform: 'uppercase',
  },
}

export default FlyerPreviewPage