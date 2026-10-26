import { ChurchModuleHeader } from '../../components/layout/ChurchModuleHeader'
import { useDebounce } from 'use-debounce'
import './bible-studies.css'
import { useEffect, useState, useRef } from 'react'
import { bibleStudiesApi } from '../../lib/api'
import { toast } from 'sonner'
import {
  Download,
  Calendar,
  BookOpen,
  FileText,
  Search,
  Filter,
  X,
  Settings,
  UserRound,
  Library,
  Loader2,
  ArrowUpRight
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { Link } from 'react-router-dom'
import { P } from '../../constants/permissions'

interface BibleStudy {
  _id: string
  title: string
  studyDate: string
  theme: string
  verse?: string
  description: string
  teacher?: string
  series?: string
  pdfUrl: string
  fileSize?: number
  downloadCount: number
  thumbnailUrl?: string
  createdAt: string
}

export default function BibleStudiesPage() {
  const { user, hasPermission } = useAuthStore()
  const [studies, setStudies] = useState<BibleStudy[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  )
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const [selectedSeries, setSelectedSeries] = useState<string>('')
  const [series, setSeries] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [debouncedSearch] = useDebounce(search, 300)
  const requestId = useRef(0)
  const [loadError, setLoadError] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    loadStudies()
  }, [
    selectedYear,
    selectedMonth,
    selectedSeries,
    debouncedSearch,
    user?.churchId
  ])
  useEffect(() => {
    loadSeries()
  }, [user?.churchId])
  useEffect(
    () => () => {
      requestId.current++
    },
    []
  )

  const loadStudies = async () => {
    const current = ++requestId.current
    setLoadError(false)
    try {
      setLoading(true)
      const params: any = {
        year: selectedYear,
        isActive: 'true',
        sort: '-studyDate'
      }
      if (selectedMonth) params.month = selectedMonth
      if (selectedSeries) params.series = selectedSeries
      if (debouncedSearch) params.search = debouncedSearch
      if (user?.churchId) params.church = user.churchId

      const res = await bibleStudiesApi.getAll(params)
      if (current === requestId.current) setStudies(res.data.data || [])
    } catch (error) {
      if (current === requestId.current) {
        setLoadError(true)
        toast.error('Error al cargar estudios bíblicos')
      }
    } finally {
      if (current === requestId.current) setLoading(false)
    }
  }

  const loadSeries = async () => {
    try {
      const params: any = {}
      if (user?.churchId) params.church = user.churchId
      const res = await bibleStudiesApi.getSeries(params)
      setSeries(res.data.data || [])
    } catch (error) {
      console.error('Error loading series:', error)
    }
  }

  const handleDownload = async (study: BibleStudy) => {
    if (downloading) return
    setDownloading(study._id)
    try {
      // Track download
      await bibleStudiesApi.trackDownload(study._id)

      // Download PDF with proper filename
      const link = document.createElement('a')
      link.href = study.pdfUrl
      link.download = `${study.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`
      link.target = '_blank'
      link.rel = 'noopener noreferrer'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Descargando estudio bíblico')
    } catch (error) {
      toast.error('Error al descargar')
    } finally {
      setDownloading(null)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    return bytes < 1024 * 1024
      ? `${Math.max(1, Math.round(bytes / 1024))} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const clearFilters = () => {
    setSelectedYear(new Date().getFullYear())
    setSelectedMonth(null)
    setSelectedSeries('')
    setSearch('')
  }

  const months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ]

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  )

  return (
    <main className="church-module-workspace bible-library">
      <ChurchModuleHeader
        eyebrow="Una fe que crece en la Palabra"
        title="Estudios Bíblicos"
        description="Aprende, profundiza y comparte. Recursos para acompañar tu camino espiritual."
      >
        {hasPermission(P.BIBLE_STUDIES_CREATE) && (
          <Link to="/estudios-biblicos/admin">
            <Settings size={16} />
            Administrar
          </Link>
        )}
      </ChurchModuleHeader>
      <section className="bible-library-intro">
        <div>
          <BookOpen size={22} />
          <span>
            Un tiempo para escuchar,
            <br />
            <strong>una Palabra para vivir.</strong>
          </span>
        </div>
        <span>
          Biblioteca de la iglesia{' '}
          <span className="bible-year">{selectedYear}</span>
        </span>
      </section>
      <section
        className="bible-library-toolbar"
        aria-label="Buscar y filtrar estudios"
      >
        <div className="bible-search">
          <Search size={18} />
          <input
            aria-label="Buscar estudios"
            placeholder="Busca un título, tema o maestro"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button aria-label="Borrar búsqueda" onClick={() => setSearch('')}>
              <X size={16} />
            </button>
          )}
        </div>
        <button
          className="bible-filter-button"
          onClick={() => setShowFilters(!showFilters)}
          aria-expanded={showFilters}
          aria-controls="bible-filters"
        >
          <Filter size={16} />
          Filtros
          {(selectedMonth || selectedSeries) && (
            <span>{(selectedMonth ? 1 : 0) + (selectedSeries ? 1 : 0)}</span>
          )}
        </button>
        {showFilters && (
          <div className="bible-filter-fields" id="bible-filters">
            <label htmlFor="study-filter-year">
              Año
              <select
                id="study-filter-year"
                aria-label="Año"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="study-filter-month">
              Mes
              <select
                id="study-filter-month"
                aria-label="Mes"
                value={selectedMonth || ''}
                onChange={(e) =>
                  setSelectedMonth(
                    e.target.value ? Number(e.target.value) : null
                  )
                }
              >
                <option value="">Todos los meses</option>
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </label>
            {series.length > 0 && (
              <label htmlFor="study-filter-series">
                Serie
                <select
                  id="study-filter-series"
                  aria-label="Serie"
                  value={selectedSeries}
                  onChange={(e) => setSelectedSeries(e.target.value)}
                >
                  <option value="">Todas las series</option>
                  {series.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
            )}
            <button onClick={clearFilters}>
              <X size={14} />
              Restablecer
            </button>
          </div>
        )}
      </section>
      <div className="bible-results-line">
        <h2>Para tu crecimiento espiritual</h2>
        <span role="status">
          {loading
            ? 'Buscando recursos…'
            : studies.length +
              (studies.length === 1
                ? ' recurso disponible'
                : ' recursos disponibles')}
        </span>
      </div>
      {loadError ? (
        <div className="bible-library-empty" role="alert">
          <FileText />
          <h3>No pudimos cargar la biblioteca</h3>
          <p>Inténtalo de nuevo en un momento.</p>
          <button onClick={loadStudies}>Reintentar</button>
        </div>
      ) : loading ? (
        <div className="bible-library-empty" aria-busy="true">
          <Loader2 className="animate-spin" />
          <p>Cargando estudios de nuestra iglesia…</p>
        </div>
      ) : !studies.length ? (
        <div className="bible-library-empty">
          <Library />
          <h3>
            {search || selectedMonth || selectedSeries
              ? 'No encontramos ese recurso'
              : 'Una biblioteca para seguir creciendo'}
          </h3>
          <p>
            {search || selectedMonth || selectedSeries
              ? 'Prueba otro término o ajusta los filtros.'
              : 'Los estudios publicados por la iglesia aparecerán aquí.'}
          </p>
          {(search || selectedMonth || selectedSeries) && (
            <button onClick={clearFilters}>Ver todos los estudios</button>
          )}
        </div>
      ) : (
        <section className="bible-study-grid" aria-label="Recursos bíblicos">
          {studies.map((study) => (
            <article className="bible-study-card" key={study._id}>
              <header>
                <span className="bible-study-symbol">
                  <BookOpen size={22} />
                </span>
                <span className="bible-study-date">
                  <Calendar size={13} />
                  {formatDate(study.studyDate)}
                </span>
                <h3>{study.title}</h3>
              </header>
              <div className="bible-study-content">
                <div className="bible-study-verse">
                  <span>PARA MEDITAR</span>
                  <strong>{study.theme}</strong>
                  {study.verse && <p>“{study.verse}”</p>}
                </div>
                <p className="bible-study-description">{study.description}</p>
                <div className="bible-study-meta">
                  {study.teacher && (
                    <span>
                      <UserRound size={13} />
                      {study.teacher}
                    </span>
                  )}
                  {study.series && (
                    <span>
                      <Library size={13} />
                      {study.series}
                    </span>
                  )}
                  {!!study.fileSize && (
                    <span>
                      <FileText size={13} />
                      {formatFileSize(study.fileSize)}
                    </span>
                  )}
                </div>
                <button
                  className="bible-study-download"
                  disabled={!!downloading}
                  onClick={() => handleDownload(study)}
                >
                  {downloading === study._id ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Download size={17} />
                  )}
                  <span>
                    {downloading === study._id
                      ? 'Preparando descarga…'
                      : 'Descargar estudio'}
                  </span>
                  <ArrowUpRight size={15} />
                </button>
                <small>
                  {study.downloadCount > 0
                    ? study.downloadCount + ' descargas'
                    : 'Disponible en PDF'}
                </small>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}
