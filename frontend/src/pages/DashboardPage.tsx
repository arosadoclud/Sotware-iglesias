import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Calendar,
  FileText,
  TrendingUp,
  Activity,
  Loader2,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  PieChartIcon,
} from 'lucide-react'
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { programsApi } from '@/lib/api'
import ProgramsSlider from '@/components/dashboard/ProgramsSlider'
import ImageSlider from '@/components/dashboard/ImageSlider'
import ProgramScreenshotsGallery from '@/components/dashboard/ProgramScreenshotsGallery'

interface DashboardStats {
  totalPersons: number
  totalActivities: number
  totalPrograms: number
  upcomingPrograms: number
  activeMinistries: number
  participationRate: number
  programsThisMonth: number
  ministryDistribution: { name: string; value: number; color: string }[]
  topParticipants: { name: string; participations: number }[]
  monthlyTrend: { month: string; participations: number; programs: number }[]
  recentActivity: { action: string; description: string; time: string; status: string }[]
}

interface StatCardProps {
  title: string
  value: string | number
  icon: any
  subtitle?: string
  color: string
  bgColor: string
  delay?: number
}

const StatCard = ({ title, value, icon: Icon, subtitle, color, bgColor, delay = 0 }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.4, delay }}
    whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.2 } }}
  >
    <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 group h-full">
      <div className={`absolute top-0 right-0 w-32 h-32 lg:w-40 lg:h-40 ${bgColor} rounded-full -translate-y-1/2 translate-x-1/2 opacity-30 group-hover:opacity-50 transition-opacity duration-300`} />
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <CardContent className="p-4 sm:p-5 lg:p-6 relative">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5 sm:space-y-2 flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-neutral-500 uppercase tracking-wide truncate">{title}</p>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.2 }}
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 tracking-tight"
            >
              {value}
            </motion.p>
            {subtitle && (
              <p className="text-[10px] sm:text-xs lg:text-sm text-neutral-500 line-clamp-2 font-medium">{subtitle}</p>
            )}
          </div>
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", bounce: 0.5, delay: delay + 0.1 }}
            whileHover={{ rotate: 10, scale: 1.1 }}
            className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${bgColor} shadow-md group-hover:shadow-lg transition-all duration-300`}
          >
            <Icon className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 ${color}`} />
          </motion.div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
)

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'PUBLISHED':
      return <CheckCircle2 className="w-4 h-4 text-success-600" />
    case 'DRAFT':
      return <Clock className="w-4 h-4 text-warning-600" />
    case 'COMPLETED':
      return <CheckCircle2 className="w-4 h-4 text-primary-600" />
    case 'CANCELLED':
      return <XCircle className="w-4 h-4 text-danger-600" />
    default:
      return <AlertCircle className="w-4 h-4 text-neutral-400" />
  }
}

const DashboardPage = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true)
      try {
        const res = await programsApi.getStats()
        setStats(res.data.data)
      } catch (error) {
        console.error('Error loading stats:', error)
      }
      setLoading(false)
    }
    loadStats()
  }, [])

  if (loading || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-10 h-10 text-primary-600" />
        </motion.div>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-neutral-500 font-medium"
        >
          Cargando estadísticas...
        </motion.p>
      </div>
    )
  }

  const hasMonthlyData = stats.monthlyTrend?.some(m => m.participations > 0)
  const hasMinistryData = stats.ministryDistribution?.length > 0
  const hasTopParticipants = stats.topParticipants?.length > 0
  const hasRecentActivity = stats.recentActivity?.length > 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-5 lg:space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="flex-1 min-w-0">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg sm:text-2xl lg:text-3xl font-bold text-neutral-900 tracking-tight"
            >
              Dashboard
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="text-xs sm:text-sm lg:text-base text-neutral-500 mt-0.5"
            >
              Resumen general de tu iglesia
            </motion.p>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
            className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30 flex-shrink-0"
          >
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="hidden lg:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl shadow-sm"
        >
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-sm font-semibold text-emerald-700">Sistema activo</span>
        </motion.div>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="dashboard-stats grid gap-3 sm:gap-4 lg:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Personas"
          value={stats.totalPersons}
          icon={Users}
          subtitle={`${stats.activeMinistries} ministerio${stats.activeMinistries !== 1 ? 's' : ''} activo${stats.activeMinistries !== 1 ? 's' : ''}`}
          color="text-primary-600"
          bgColor="bg-primary-50"
          delay={0}
        />
        <StatCard
          title="Programas"
          value={stats.totalPrograms}
          icon={FileText}
          subtitle={`${stats.programsThisMonth} este mes`}
          color="text-success-600"
          bgColor="bg-success-50"
          delay={0.05}
        />
        <StatCard
          title="Próximos"
          value={stats.upcomingPrograms}
          icon={Calendar}
          subtitle="Programas pendientes"
          color="text-warning-600"
          bgColor="bg-warning-50"
          delay={0.1}
        />
        <StatCard
          title="Participación"
          value={`${stats.participationRate}%`}
          icon={TrendingUp}
          subtitle="Tasa de participación mensual"
          color="text-purple-600"
          bgColor="bg-purple-50"
          delay={0.15}
        />
      </div>

      {/* ── Slider de Programas Publicados ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
      >
        <ProgramsSlider />
      </motion.div>

      {/* ── Slider de Imágenes de Eventos ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
      >
        <ImageSlider />
      </motion.div>

      {/* ── Galería de Capturas de Programas Publicados ─────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.26 }}
      >
        <ProgramScreenshotsGallery />
      </motion.div>

      {/* Gráficos: Tendencia + Distribución */}
      <div className="grid gap-4 sm:gap-5 lg:gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Tendencia Mensual - Ocupa 2 columnas en desktop */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3 lg:pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <CardTitle className="text-base lg:text-lg">Participación Mensual</CardTitle>
                  <CardDescription className="mt-0.5">
                    Tendencia de asignaciones en los últimos 6 meses
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {hasMonthlyData ? (
                <div className="h-[220px] sm:h-[260px] lg:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.monthlyTrend}>
                    <defs>
                      <linearGradient id="colorPart" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
                      }}
                      formatter={(value: number, name: string) => [
                        value,
                        name === 'participations' ? 'Participaciones' : 'Programas',
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="participations"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      fill="url(#colorPart)"
                      dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="programs"
                      stroke="#22c55e"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[220px] sm:h-[260px] lg:h-[280px] text-neutral-400">
                  <BarChart3 className="w-10 h-10 mb-2 opacity-40" />
                  <p className="text-sm">No hay datos de participación aún</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Distribución por Ministerio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 h-full">
            <CardHeader className="pb-3 lg:pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-success-50 rounded-lg flex items-center justify-center">
                  <PieChartIcon className="w-5 h-5 text-success-600" />
                </div>
                <div>
                  <CardTitle className="text-base lg:text-lg">Ministerios</CardTitle>
                  <CardDescription className="mt-0.5">Distribución de personas</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {hasMinistryData ? (
                <div>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={stats.ministryDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {stats.ministryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        formatter={(value: number) => [`${value} personas`, '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {stats.ministryDistribution.slice(0, 5).map((m, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: m.color }}
                          />
                          <span className="text-neutral-600 truncate max-w-[100px] sm:max-w-[140px] lg:max-w-[120px]">{m.name}</span>
                        </div>
                        <span className="font-medium text-neutral-900">{m.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[280px] text-neutral-400">
                  <Users className="w-10 h-10 mb-2 opacity-40" />
                  <p className="text-sm">No hay ministerios registrados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Participantes + Actividad Reciente */}
      <div className="grid gap-4 sm:gap-5 lg:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Top Participantes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3 lg:pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-warning-50 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-warning-600" />
                </div>
                <div>
                  <CardTitle className="text-base lg:text-lg">Top Participantes</CardTitle>
                  <CardDescription className="mt-0.5">
                    Personas con más asignaciones (últimos 6 meses)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {hasTopParticipants ? (
                <div className="space-y-4 lg:space-y-5">
                  {stats.topParticipants.map((p, i) => {
                    const maxVal = stats.topParticipants[0]?.participations || 1
                    const pct = Math.round((p.participations / maxVal) * 100)
                    const colors = [
                      'from-amber-400 to-amber-600',
                      'from-primary-400 to-primary-600',
                      'from-emerald-400 to-emerald-600',
                      'from-violet-400 to-violet-600',
                      'from-rose-400 to-rose-600'
                    ]
                    return (
                      <motion.div 
                        key={i} 
                        className="space-y-2"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * i }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <motion.span 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.1 * i, type: "spring", bounce: 0.5 }}
                              className={`flex items-center justify-center w-7 h-7 lg:w-8 lg:h-8 rounded-full ${i === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md' : 'bg-neutral-100 text-neutral-600'} text-xs lg:text-sm font-bold`}
                            >
                              {i + 1}
                            </motion.span>
                            <span className="text-sm lg:text-base font-semibold text-neutral-800 truncate max-w-[140px] sm:max-w-[200px] lg:max-w-[250px]">
                              {p.name}
                            </span>
                          </div>
                          <Badge 
                            variant="secondary" 
                            className="text-xs lg:text-sm font-bold px-2.5 lg:px-3 py-1 bg-neutral-100 text-neutral-700 shadow-sm"
                          >
                            {p.participations}
                          </Badge>
                        </div>
                        <div className="w-full bg-neutral-100 rounded-full h-2 lg:h-2.5 shadow-inner">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, delay: 0.1 * i, ease: "easeOut" }}
                            className={`bg-gradient-to-r ${colors[i % colors.length]} h-2 lg:h-2.5 rounded-full shadow-sm relative overflow-hidden`}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                          </motion.div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-neutral-400">
                  <Users className="w-10 h-10 mb-2 opacity-40" />
                  <p className="text-sm">No hay participaciones registradas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Actividad Reciente */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-3 lg:pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-base lg:text-lg">Actividad Reciente</CardTitle>
                  <CardDescription className="mt-0.5">Últimas acciones en el sistema</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {hasRecentActivity ? (
                <div className="space-y-5 lg:space-y-6">
                  {stats.recentActivity.map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index }}
                      className="flex items-start gap-4 relative group"
                    >
                      {/* Timeline line */}
                      {index < stats.recentActivity.length - 1 && (
                        <div className="absolute left-[13px] top-8 w-0.5 h-12 bg-gradient-to-b from-neutral-200 to-transparent" />
                      )}
                      
                      <motion.div 
                        className="mt-1 relative z-10 flex-shrink-0"
                        whileHover={{ scale: 1.2, rotate: 10 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <div className="w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center ring-2 ring-neutral-100 group-hover:ring-primary-200 transition-all">
                          <StatusIcon status={activity.status} />
                        </div>
                      </motion.div>
                      
                      <div className="flex-1 min-w-0 pb-2">
                        <p className="font-semibold text-sm lg:text-base text-neutral-900 mb-1">
                          {activity.action}
                        </p>
                        <p className="text-sm text-neutral-600 truncate mb-1.5">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-neutral-400" />
                          <p className="text-xs lg:text-sm text-neutral-500 font-medium">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-neutral-400">
                  <Clock className="w-10 h-10 mb-2 opacity-40" />
                  <p className="text-sm">No hay actividad reciente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default DashboardPage
