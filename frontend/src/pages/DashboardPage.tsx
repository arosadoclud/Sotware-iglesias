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
    whileHover={{ y: -4, transition: { duration: 0.2 } }}
  >
    <Card className="relative overflow-hidden border-0 shadow-lg shadow-neutral-200/50 hover:shadow-xl transition-all duration-300 group">
      <div className={`absolute top-0 right-0 w-32 h-32 ${bgColor} rounded-full -translate-y-1/2 translate-x-1/2 opacity-40 group-hover:opacity-60 transition-opacity`} />
      <CardContent className="p-4 sm:p-5 relative">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-neutral-500 truncate">{title}</p>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.2 }}
              className="text-2xl sm:text-3xl font-bold text-neutral-900"
            >
              {value}
            </motion.p>
            {subtitle && (
              <p className="text-[10px] sm:text-xs text-neutral-400 line-clamp-2">{subtitle}</p>
            )}
          </div>
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5, delay: delay + 0.1 }}
            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${bgColor} shadow-sm`}
          >
            <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color}`} />
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
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
            className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30 flex-shrink-0"
          >
            <BarChart3 className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg sm:text-2xl font-bold text-neutral-900"
            >
              Dashboard
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="text-xs sm:text-sm text-neutral-500"
            >
              Resumen de tu iglesia
            </motion.p>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl"
        >
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-emerald-700">Sistema activo</span>
        </motion.div>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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

      {/* Gráficos: Tendencia + Distribución */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3">
        {/* Tendencia Mensual - Ocupa 2 columnas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="md:col-span-2"
        >
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary-600" />
                <CardTitle className="text-base">Participación Mensual</CardTitle>
              </div>
              <CardDescription>
                Tendencia de asignaciones en los últimos 6 meses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hasMonthlyData ? (
                <ResponsiveContainer width="100%" height={250} className="sm:h-[280px]">
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
              ) : (
                <div className="flex flex-col items-center justify-center h-[280px] text-neutral-400">
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
          <Card className="border-0 shadow-sm h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-success-600" />
                <CardTitle className="text-base">Ministerios</CardTitle>
              </div>
              <CardDescription>Distribución de personas</CardDescription>
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
                          <span className="text-neutral-600 truncate max-w-[120px]">{m.name}</span>
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
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
        {/* Top Participantes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-warning-600" />
                <CardTitle className="text-base">Top Participantes</CardTitle>
              </div>
              <CardDescription>
                Personas con más asignaciones (últimos 6 meses)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hasTopParticipants ? (
                <div className="space-y-3">
                  {stats.topParticipants.map((p, i) => {
                    const maxVal = stats.topParticipants[0]?.participations || 1
                    const pct = Math.round((p.participations / maxVal) * 100)
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-neutral-100 text-xs font-bold text-neutral-600">
                              {i + 1}
                            </span>
                            <span className="text-sm font-medium text-neutral-800 truncate max-w-[200px]">
                              {p.name}
                            </span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {p.participations}
                          </Badge>
                        </div>
                        <div className="w-full bg-neutral-100 rounded-full h-1.5 ml-8">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, delay: 0.1 * i }}
                            className="bg-gradient-to-r from-primary-400 to-primary-600 h-1.5 rounded-full"
                          />
                        </div>
                      </div>
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
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <CardTitle className="text-base">Actividad Reciente</CardTitle>
              </div>
              <CardDescription>Últimas acciones en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              {hasRecentActivity ? (
                <div className="space-y-4">
                  {stats.recentActivity.map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index }}
                      className="flex items-start gap-3"
                    >
                      <div className="mt-0.5">
                        <StatusIcon status={activity.status} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-neutral-900">
                          {activity.action}
                        </p>
                        <p className="text-sm text-neutral-500 truncate">
                          {activity.description}
                        </p>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {activity.time}
                        </p>
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
