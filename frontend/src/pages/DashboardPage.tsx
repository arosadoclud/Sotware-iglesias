import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Calendar,
  FileText,
  TrendingUp,
  Download,
  Loader2,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import api from '@/lib/api'

interface StatCardProps {
  title: string
  value: string | number
  icon: any
  trend?: {
    value: number
    isPositive: boolean
  }
  color: string
}

const StatCard = ({ title, value, icon: Icon, trend, color }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.3 }}
  >
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-neutral-600">{title}</p>
            <p className="text-3xl font-bold text-neutral-900">{value}</p>
            {trend && (
              <div
                className={`flex items-center gap-1 text-sm font-medium ${
                  trend.isPositive ? 'text-success-600' : 'text-danger-600'
                }`}
              >
                <TrendingUp
                  className={`w-4 h-4 ${!trend.isPositive && 'rotate-180'}`}
                />
                <span>{trend.value}%</span>
                <span className="text-neutral-500 font-normal">vs mes anterior</span>
              </div>
            )}
          </div>
          <div
            className={`w-14 h-14 rounded-xl flex items-center justify-center ${color}`}
          >
            <Icon className="w-7 h-7 text-white" />
          </div>
        </div>
      </CardContent>
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${color}`} />
    </Card>
  </motion.div>
)

const DashboardPage = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPersons: 0,
    totalPrograms: 0,
    upcomingPrograms: 0,
    activeMinistries: 0,
  })

  // Datos de ejemplo para gráficos
  const participationData = [
    { month: 'Ene', participations: 45 },
    { month: 'Feb', participations: 52 },
    { month: 'Mar', participations: 48 },
    { month: 'Abr', participations: 61 },
    { month: 'May', participations: 55 },
    { month: 'Jun', participations: 67 },
  ]

  const ministryData = [
    { name: 'Adoración', value: 35, color: '#3b82f6' },
    { name: 'Niños', value: 28, color: '#22c55e' },
    { name: 'Jóvenes', value: 22, color: '#f59e0b' },
    { name: 'Ujieres', value: 15, color: '#ef4444' },
  ]

  const topParticipants = [
    { name: 'María García', participations: 12 },
    { name: 'Juan Pérez', participations: 10 },
    { name: 'Ana López', participations: 9 },
    { name: 'Carlos Ruiz', participations: 8 },
    { name: 'Sofía Martín', participations: 7 },
  ]

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true)
      try {
        const [personsRes, programsRes] = await Promise.all([
          api.get('/persons'),
          api.get('/programs'),
        ])

        const persons = personsRes.data.data
        const programs = programsRes.data.data

        setStats({
          totalPersons: persons.length,
          totalPrograms: programs.length,
          upcomingPrograms: programs.filter(
            (p: any) => new Date(p.programDate) > new Date()
          ).length,
          activeMinistries: new Set(
            persons.map((p: any) => p.ministry).filter(Boolean)
          ).size,
        })
      } catch (error) {
        console.error('Error loading stats:', error)
      }
      setLoading(false)
    }

    loadStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-neutral-600 mt-1">
            Resumen general de actividades y participantes
          </p>
        </div>
        <Button variant="outline" size="lg">
          <Download className="w-4 h-4 mr-2" />
          Exportar Reporte
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Personas"
          value={stats.totalPersons}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
          color="bg-primary-600"
        />
        <StatCard
          title="Programas"
          value={stats.totalPrograms}
          icon={FileText}
          trend={{ value: 8, isPositive: true }}
          color="bg-success-600"
        />
        <StatCard
          title="Próximos Programas"
          value={stats.upcomingPrograms}
          icon={Calendar}
          color="bg-warning-600"
        />
        <StatCard
          title="Ministerios Activos"
          value={stats.activeMinistries}
          icon={TrendingUp}
          trend={{ value: 5, isPositive: true }}
          color="bg-danger-600"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Participation Trend */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Participación Mensual</CardTitle>
              <CardDescription>
                Tendencia de participaciones en los últimos 6 meses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={participationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="participations"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ fill: '#2563eb', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Ministry Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Distribución por Ministerio</CardTitle>
              <CardDescription>
                Porcentaje de personas por ministerio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ministryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {ministryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Participants */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Top Participantes</CardTitle>
            <CardDescription>
              Personas con más participaciones este mes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topParticipants} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" />
                <YAxis dataKey="name" type="category" stroke="#6b7280" width={120} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px',
                  }}
                />
                <Bar
                  dataKey="participations"
                  fill="#22c55e"
                  radius={[0, 8, 8, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimas acciones en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  action: 'Programa creado',
                  description: 'Culto Domingo - 14 Enero 2024',
                  time: 'Hace 2 horas',
                },
                {
                  action: 'Nueva persona registrada',
                  description: 'María González - Ministerio de Adoración',
                  time: 'Hace 5 horas',
                },
                {
                  action: 'Programa publicado',
                  description: 'Reunión de Jóvenes - 12 Enero 2024',
                  time: 'Hace 1 día',
                },
              ].map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 pb-4 border-b border-neutral-200 last:border-0 last:pb-0"
                >
                  <div className="w-2 h-2 mt-2 rounded-full bg-primary-600" />
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900">
                      {activity.action}
                    </p>
                    <p className="text-sm text-neutral-600">
                      {activity.description}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

export default DashboardPage