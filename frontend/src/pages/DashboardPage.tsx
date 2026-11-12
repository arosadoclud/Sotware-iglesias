import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowRight, BookOpen, CalendarDays, FileText, RefreshCw, TrendingUp, Users, Clock3 } from 'lucide-react'
import { programsApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { P } from '@/constants/permissions'
import ProgramsSlider from '@/components/dashboard/ProgramsSlider'
import ImageSlider from '@/components/dashboard/ImageSlider'
import BibleStudiesWidget from '@/components/dashboard/BibleStudiesWidget'
import ProgramScreenshotsGallery from '@/components/dashboard/ProgramScreenshotsGallery'
import './dashboard.css'

type Program = { _id: string; programDate: string; programTime?: string; ampm?: string; activityType?: { name: string } }
type DashboardStats = {
  totalPersons: number; totalPrograms: number; upcomingPrograms: number; publishedPrograms?: number
  activeMinistries: number; participationRate: number; programsThisMonth: number
  nextPrograms?: Program[]
  monthlyTrend?: { month: string; participations: number; programs: number }[]
  ministryDistribution?: { name: string; value: number; color: string }[]
  topParticipants?: { name: string; participations: number }[]
  recentActivity?: { action: string; description: string; time: string }[]
}

const dateLabel = (value: string) => new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', timeZone: 'America/La_Paz' }).format(new Date(value))

export default function DashboardPage() {
  const { user, hasPermission } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const response = await programsApi.getStats()
      setStats(response.data.data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  const links = [
    { label: 'Personas', description: 'Consulta el directorio', to: '/persons', icon: Users, visible: hasPermission(P.PERSONS_VIEW) },
    { label: 'Programas', description: 'Revisa la planificación', to: '/programs', icon: FileText, visible: hasPermission(P.PROGRAMS_VIEW) },
    { label: 'Calendario', description: 'Fechas de la iglesia', to: '/calendar', icon: CalendarDays, visible: hasPermission(P.CALENDAR_VIEW) },
    { label: 'Estudios bíblicos', description: 'Material para aprender', to: '/estudios-biblicos', icon: BookOpen, visible: hasPermission(P.BIBLE_STUDIES_VIEW) },
  ].filter(link => link.visible)

  if (loading && !stats) return <div className="dashboard-loading" role="status"><RefreshCw className="animate-spin" /> Cargando el inicio de tu iglesia…</div>
  if (error && !stats) return <div className="dashboard-error"><h1>No pudimos cargar el inicio</h1><p>Comprueba la conexión e inténtalo de nuevo.</p><button onClick={load}>Reintentar</button></div>
  if (!stats) return null

  const cards = [
    { label: 'Personas', value: stats.totalPersons, note: `${stats.activeMinistries} ministerios representados`, icon: Users, to: '/persons', visible: hasPermission(P.PERSONS_VIEW) },
    { label: 'Programas', value: stats.totalPrograms, note: `${stats.programsThisMonth} en los últimos 30 días`, icon: FileText, to: '/programs', visible: hasPermission(P.PROGRAMS_VIEW) },
    { label: 'Próximos', value: stats.upcomingPrograms, note: 'Programas publicados por venir', icon: CalendarDays, to: '/calendar', visible: hasPermission(P.CALENDAR_VIEW) },
    { label: 'Participación', value: `${stats.participationRate}%`, note: 'Personas asignadas en los últimos 30 días', icon: TrendingUp, to: '/programs', visible: hasPermission(P.PROGRAMS_VIEW) },
  ].filter(card => card.visible)
  const hasTrend = stats.monthlyTrend?.some(item => item.participations || item.programs)
  const upcoming = stats.nextPrograms || []

  return <main className="dashboard-home">
    <header className="dashboard-hero">
      <div>
        <span className="dashboard-kicker">INICIO · TU COMUNIDAD</span>
        <h1>Hola, {user?.fullName?.split(' ')[0] || 'bienvenido'}.</h1>
        <p>Lo más importante de tu iglesia, en un solo lugar.</p>
      </div>
      <button className="dashboard-refresh" onClick={load} disabled={loading} aria-label="Actualizar información"><RefreshCw className={loading ? 'animate-spin' : ''} size={17} /> Actualizar</button>
    </header>

    <section className="dashboard-stats dashboard-metrics" aria-label="Resumen de la iglesia">
      {cards.map(({ label, value, note, icon: Icon, to }) => <Link className="dashboard-metric" to={to} key={label}>
        <span className="dashboard-metric-top"><span>{label}</span><Icon size={20} /></span>
        <strong>{value}</strong><small>{note}</small>
      </Link>)}
    </section>

    <div className="dashboard-primary-grid">
      <section className="dashboard-panel dashboard-upcoming">
        <div className="dashboard-section-heading"><div><span className="dashboard-kicker">PRÓXIMAMENTE</span><h2>Lo que viene</h2><p>Programas publicados para las próximas fechas.</p></div><Link to="/calendar">Ver calendario <ArrowRight size={16} /></Link></div>
        {upcoming.length ? <div className="dashboard-upcoming-list">{upcoming.map(program => <Link to="/programs" className="dashboard-upcoming-item" key={program._id}>
          <span className="dashboard-date"><CalendarDays size={18} /></span>
          <span className="dashboard-upcoming-copy"><strong>{program.activityType?.name || 'Programa de la iglesia'}</strong><small>{dateLabel(program.programDate)}{program.programTime ? ` · ${program.programTime} ${program.ampm || ''}` : ''}</small></span>
          <ArrowRight size={17} />
        </Link>)}</div> : <div className="dashboard-empty"><CalendarDays size={26} /><strong>Aún no hay programas próximos</strong><span>Cuando se publique uno, podrás verlo aquí.</span>{hasPermission(P.PROGRAMS_VIEW) && <Link to="/programs">Explorar programas <ArrowRight size={15} /></Link>}</div>}
      </section>
      <section className="dashboard-panel dashboard-shortcuts">
        <div className="dashboard-section-heading"><div><span className="dashboard-kicker">ACCESOS RÁPIDOS</span><h2>¿Qué quieres hacer?</h2><p>Entra directamente a cada sección.</p></div></div>
        <div className="dashboard-shortcut-grid">{links.map(({ label, description, to, icon: Icon }) => <Link key={to} to={to} className="dashboard-shortcut"><Icon size={19} /><span><strong>{label}</strong><small>{description}</small></span><ArrowRight size={15} /></Link>)}</div>
      </section>
    </div>

    <section className="dashboard-panel dashboard-featured">
      <div className="dashboard-section-heading"><div><span className="dashboard-kicker">PARA TU COMUNIDAD</span><h2>Programas publicados</h2><p>Consulta los programas que ya están disponibles.</p></div><Link to="/programs">Todos los programas <ArrowRight size={16} /></Link></div>
      {(stats.publishedPrograms ?? stats.totalPrograms) > 0 ? <ProgramsSlider /> : <div className="dashboard-empty dashboard-empty-compact"><FileText size={25} /><strong>Todavía no hay programas publicados</strong><span>Los nuevos programas aparecerán aquí cuando se publiquen.</span>{hasPermission(P.PROGRAMS_VIEW) && <Link to="/programs">Ir a programas <ArrowRight size={15} /></Link>}</div>}
    </section>

    <div className="dashboard-insights">
      <section className="dashboard-panel"><div className="dashboard-section-heading"><div><span className="dashboard-kicker">ÚLTIMOS SEIS MESES</span><h2>Participación</h2><p>Asignaciones y programas por mes.</p></div></div>
        {hasTrend ? <div className="dashboard-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={stats.monthlyTrend}><CartesianGrid stroke="#e9edf2" strokeDasharray="4 4" /><XAxis dataKey="month" /><YAxis allowDecimals={false} /><Tooltip /><Area type="monotone" dataKey="participations" name="Asignaciones" stroke="#183355" fill="#eaf0f7" strokeWidth={2} /><Area type="monotone" dataKey="programs" name="Programas" stroke="#b2873e" fill="transparent" strokeWidth={2} /></AreaChart></ResponsiveContainer></div> : <div className="dashboard-empty dashboard-empty-compact"><TrendingUp size={25} /><strong>La tendencia aparecerá aquí</strong><span>Necesitamos programas con asignaciones para mostrar el gráfico.</span></div>}
      </section>
      <section className="dashboard-panel"><div className="dashboard-section-heading"><div><span className="dashboard-kicker">COMUNIDAD</span><h2>Ministerios</h2><p>Personas por ministerio.</p></div></div>
        {stats.ministryDistribution?.length ? <div className="dashboard-ministry-list">{stats.ministryDistribution.slice(0, 6).map(ministry => <div key={ministry.name}><span><i style={{ background: ministry.color }} />{ministry.name}</span><strong>{ministry.value}</strong></div>)}</div> : <div className="dashboard-empty dashboard-empty-compact"><Users size={25} /><strong>Sin ministerios registrados</strong><span>Asigna un ministerio a las personas para ver el resumen.</span></div>}
      </section>
    </div>

    {(stats.recentActivity?.length || stats.topParticipants?.length) ? <div className="dashboard-insights">
      {!!stats.recentActivity?.length && <section className="dashboard-panel"><div className="dashboard-section-heading"><div><span className="dashboard-kicker">MOVIMIENTO RECIENTE</span><h2>Actividad</h2><p>Últimos cambios en los programas.</p></div></div><div className="dashboard-activity-list">{stats.recentActivity.slice(0, 4).map((item, index) => <div key={`${item.action}-${index}`}><Clock3 size={17} /><span><strong>{item.action}</strong><small>{item.description} · {item.time}</small></span></div>)}</div></section>}
      {!!stats.topParticipants?.length && <section className="dashboard-panel"><div className="dashboard-section-heading"><div><span className="dashboard-kicker">ÚLTIMOS SEIS MESES</span><h2>Participantes frecuentes</h2><p>Personas con más asignaciones.</p></div></div><div className="dashboard-participants">{stats.topParticipants.slice(0, 5).map((person, index) => <div key={`${person.name}-${index}`}><span>{index + 1}. {person.name}</span><strong>{person.participations}</strong></div>)}</div></section>}
    </div> : null}

    {(stats.publishedPrograms ?? 0) > 0 && <ProgramScreenshotsGallery />}

    <section className="dashboard-discover" aria-label="Galería de eventos"><ImageSlider /></section>
    <BibleStudiesWidget />
  </main>
}
