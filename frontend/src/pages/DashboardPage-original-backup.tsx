import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Calendar, FileText, TrendingUp, Loader2, Wand2, ChevronRight, AlertCircle, CheckCircle2, Clock, Download } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { programsApi } from '../lib/api'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'

const DAYS: Record<number, string> = { 0:'Domingo',1:'Lunes',2:'Martes',3:'Miércoles',4:'Jueves',5:'Viernes',6:'Sábado' }
const STATUS_STYLE: Record<string, string> = {
  DRAFT:'bg-amber-50 text-amber-700 border-amber-200',
  PUBLISHED:'bg-green-50 text-green-700 border-green-200',
  COMPLETED:'bg-blue-50 text-blue-700 border-blue-200',
  CANCELLED:'bg-red-50 text-red-700 border-red-200',
}
const STATUS_LABEL: Record<string, string> = { DRAFT:'Borrador', PUBLISHED:'Publicado', COMPLETED:'Completado', CANCELLED:'Cancelado' }
const STATUS_ICON: Record<string, any> = {
  DRAFT: Clock,
  PUBLISHED: CheckCircle2,
  COMPLETED: CheckCircle2,
  CANCELLED: AlertCircle,
}

const DashboardPage = () => {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null)

  useEffect(() => {
    programsApi.getStats()
      .then(r => setStats(r.data.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  const handleDownloadPdf = async (programId: string, programName: string) => {
    setDownloadingPdf(programId)
    try {
      const res = await programsApi.downloadPdf(programId)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `${programName}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('PDF descargado')
    } catch {
      toast.error('Error al generar el PDF')
    } finally {
      setDownloadingPdf(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? '¡Buenos días' : hour < 18 ? '¡Buenas tardes' : '¡Buenas noches'

  const statCards = [
    {
      name: 'Personas Activas',
      value: stats?.totalPersons ?? 0,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      sub: 'Miembros registrados',
      href: '/persons',
    },
    {
      name: 'Actividades',
      value: stats?.totalActivities ?? 0,
      icon: Calendar,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      sub: 'Tipos configurados',
      href: '/activities',
    },
    {
      name: 'Programas',
      value: stats?.totalPrograms ?? 0,
      icon: FileText,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      sub: `${stats?.programsThisMonth ?? 0} este mes`,
      href: '/programs',
    },
    {
      name: 'Participación',
      value: `${stats?.participationRate ?? 0}%`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      sub: 'Últimos 30 días',
      href: null,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting}, {user?.fullName?.split(' ')[0]}!
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
          </p>
        </div>
        <Link
          to="/programs/generate"
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Wand2 className="w-4 h-4" />
          Generar Programa
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => {
          const Icon = card.icon
          const Wrapper = card.href ? Link : 'div'
          return (
            <Wrapper
              key={card.name}
              to={card.href ?? ''}
              className={`card group ${card.href ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">{card.name}</p>
                  <p className="text-3xl font-extrabold text-gray-900 mt-2 tracking-tight">{card.value}</p>
                  <p className="text-xs text-gray-400 mt-2">{card.sub}</p>
                </div>
                <div className={`${card.bg} p-2.5 rounded-xl`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
            </Wrapper>
          )
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Programs — 2/3 width */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-gray-900">Programas Recientes</h3>
            <Link to="/programs" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              Ver todos <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {stats?.recentPrograms?.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {stats.recentPrograms.map((prog: any) => {
                const StatusIcon = STATUS_ICON[prog.status] || Clock
                const date = new Date(prog.programDate)
                return (
                  <div key={prog._id} className="flex items-center justify-between py-3 group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{prog.activityType?.name}</p>
                        <p className="text-xs text-gray-500">
                          {DAYS[date.getDay()]}, {format(date, "d MMM yyyy", { locale: es })}
                          <span className="mx-1.5 text-gray-300">·</span>
                          {prog.assignments?.length || 0} asignados
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      <span className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${STATUS_STYLE[prog.status] || ''}`}>
                        <StatusIcon className="w-3 h-3" />
                        {STATUS_LABEL[prog.status] || prog.status}
                      </span>
                      {/* Botón descarga PDF */}
                      <button
                        onClick={() => handleDownloadPdf(prog._id, `${prog.activityType?.name}-${format(date, 'yyyy-MM-dd')}`)}
                        disabled={downloadingPdf === prog._id}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors opacity-0 group-hover:opacity-100"
                        title="Descargar PDF"
                      >
                        {downloadingPdf === prog._id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Download className="w-4 h-4" />
                        }
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="text-gray-500 text-sm">No hay programas generados aún</p>
              <Link to="/programs/generate" className="inline-flex items-center gap-1 text-primary-600 text-sm mt-3 font-medium hover:underline">
                <Wand2 className="w-4 h-4" /> Generar primer programa
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions — 1/3 width */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
            <div className="space-y-2">
              {[
                { href: '/programs/generate', icon: Wand2, label: 'Generar Programa', sub: 'Crear nuevo programa automático', color: 'text-primary-600', bg: 'bg-primary-50 hover:bg-primary-100' },
                { href: '/persons', icon: Users, label: 'Gestionar Personas', sub: 'Agregar o editar miembros', color: 'text-blue-600', bg: 'bg-blue-50 hover:bg-blue-100' },
                { href: '/activities', icon: Calendar, label: 'Configurar Actividades', sub: 'Definir servicios y roles', color: 'text-emerald-600', bg: 'bg-emerald-50 hover:bg-emerald-100' },
                { href: '/programs', icon: FileText, label: 'Ver Programas', sub: 'Historial y gestión', color: 'text-violet-600', bg: 'bg-violet-50 hover:bg-violet-100' },
              ].map(item => {
                const Icon = item.icon
                return (
                  <Link key={item.href} to={item.href}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${item.bg}`}>
                    <Icon className={`w-5 h-5 flex-shrink-0 ${item.color}`} />
                    <div className="min-w-0">
                      <p className={`font-medium text-sm ${item.color}`}>{item.label}</p>
                      <p className="text-xs text-gray-500 truncate">{item.sub}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Participation meter */}
          {stats && (
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Participación del Mes</h3>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-3xl font-extrabold text-gray-900">{stats.participationRate}%</span>
                <span className="text-xs text-gray-400 pb-1">de {stats.totalPersons} miembros</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${stats.participationRate}%`,
                    background: stats.participationRate >= 70
                      ? '#10b981'
                      : stats.participationRate >= 40
                      ? '#f59e0b'
                      : '#ef4444'
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {stats.participationRate >= 70
                  ? '✅ Excelente participación'
                  : stats.participationRate >= 40
                  ? '⚠️ Participación moderada'
                  : '❗ Baja participación — revisa disponibilidad'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
