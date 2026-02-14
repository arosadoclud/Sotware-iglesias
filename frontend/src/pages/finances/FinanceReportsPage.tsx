import { useState, useEffect, useRef } from 'react'
import {
  FileText,
  Download,
  Printer,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Heart,
  Gift,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Filter,
  Church,
} from 'lucide-react'
import { financesApi } from '../../lib/api'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { format, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'

import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'

// Tipos de reportes disponibles
const REPORT_TYPES = [
  { 
    id: 'monthly', 
    name: 'Resumen Mensual', 
    description: 'Reporte del mes para el concilio',
    icon: Calendar 
  },
  { 
    id: 'tithing', 
    name: 'Diezmos', 
    description: 'Registro de diezmos por persona',
    icon: Heart 
  },
  { 
    id: 'offerings', 
    name: 'Ofrendas por Culto', 
    description: 'Ofrendas según el día de servicio',
    icon: Gift 
  },
  { 
    id: 'comparison', 
    name: 'Comparativo Mensual', 
    description: 'Comparación de los últimos meses',
    icon: BarChart3 
  },
  { 
    id: 'annual', 
    name: 'Reporte Anual', 
    description: 'Balance completo del año',
    icon: PieChart 
  },
]

const FinanceReportsPage = () => {
  const [loading, setLoading] = useState(false)
  const [activeReport, setActiveReport] = useState('monthly')
  const printRef = useRef<HTMLDivElement>(null)
  
  // Filtros
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [dateRange, setDateRange] = useState({
    start: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  })
  
  // Datos de reportes
  const [councilReport, setCouncilReport] = useState<any>(null)
  const [tithingReport, setTithingReport] = useState<any>(null)
  const [offeringsReport, setOfferingsReport] = useState<any>(null)
  const [comparisonReport, setComparisonReport] = useState<any>(null)
  const [annualReport, setAnnualReport] = useState<any>(null)

  // Generar años para selector
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)
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
    { value: 12, label: 'Diciembre' },
  ]

  // Cargar reporte según tipo activo
  const loadReport = async () => {
    setLoading(true)
    try {
      switch (activeReport) {
        case 'monthly':
          const councilRes = await financesApi.getCouncilReport({ month, year })
          setCouncilReport(councilRes.data.data)
          break
        case 'tithing':
          const tithingRes = await financesApi.getTithingReport({ year })
          setTithingReport(tithingRes.data.data)
          break
        case 'offerings':
          const offeringsRes = await financesApi.getOfferingsReport({
            startDate: dateRange.start,
            endDate: dateRange.end,
          })
          setOfferingsReport(offeringsRes.data.data)
          break
        case 'comparison':
          const compRes = await financesApi.getMonthlyComparison({ months: 12 })
          setComparisonReport(compRes.data.data)
          break
        case 'annual':
          const annualRes = await financesApi.getAnnualReport({ year })
          setAnnualReport(annualRes.data.data)
          break
      }
    } catch (error) {
      toast.error('Error al cargar el reporte')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadReport()
  }, [activeReport, year, month, dateRange])

  // Imprimir reporte
  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('No se pudo abrir la ventana de impresión')
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reporte Financiero</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .header { text-align: center; margin-bottom: 30px; }
            .totals { font-weight: bold; background-color: #f0f0f0; }
            .income { color: #16a34a; }
            .expense { color: #dc2626; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  // Exportar a CSV
  const exportToCSV = () => {
    let csvContent = ''
    let filename = ''

    switch (activeReport) {
      case 'monthly':
        if (!councilReport) return
        filename = `reporte-mensual-${councilReport.period.label}.csv`
        csvContent = 'Categoría,Tipo,Monto\n'
        councilReport.income.forEach((i: any) => {
          csvContent += `${i.categoryName},Ingreso,${i.total}\n`
        })
        councilReport.expenses.forEach((e: any) => {
          csvContent += `${e.categoryName},Gasto,${e.total}\n`
        })
        csvContent += `\nTotal Ingresos,,${councilReport.totals.income}\n`
        csvContent += `Total Gastos,,${councilReport.totals.expenses}\n`
        csvContent += `Balance,,${councilReport.totals.balance}\n`
        break

      case 'tithing':
        if (!tithingReport) return
        filename = `diezmos-${year}.csv`
        csvContent = 'Diezmador,Cantidad de Diezmos,Total\n'
        tithingReport.tithings.forEach((t: any) => {
          csvContent += `${t.personName},${t.count},${t.total}\n`
        })
        csvContent += `\nTotal General,,${tithingReport.grandTotal}\n`
        break

      case 'offerings':
        if (!offeringsReport) return
        filename = `ofrendas-${dateRange.start}-${dateRange.end}.csv`
        csvContent = 'Tipo de Culto,Cantidad,Total\n'
        offeringsReport.byServiceType.forEach((s: any) => {
          csvContent += `${s.serviceType},${s.count},${s.total}\n`
        })
        csvContent += `\nTotal General,,${offeringsReport.grandTotal}\n`
        break

      case 'comparison':
        if (!comparisonReport) return
        filename = `comparativo-mensual.csv`
        csvContent = 'Mes,Ingresos,Gastos,Balance\n'
        comparisonReport.months.forEach((m: any) => {
          csvContent += `${m.label},${m.income},${m.expense},${m.balance}\n`
        })
        break

      case 'annual':
        if (!annualReport) return
        filename = `reporte-anual-${year}.csv`
        csvContent = 'Mes,Ingresos,Gastos,Balance\n'
        annualReport.months.forEach((m: any) => {
          csvContent += `${m.month},${m.income},${m.expense},${m.balance}\n`
        })
        csvContent += `\n\nIngresos por Categoría,Total\n`
        annualReport.incomeByCategory.forEach((c: any) => {
          csvContent += `${c.name},${c.total}\n`
        })
        csvContent += `\nGastos por Categoría,Total\n`
        annualReport.expenseByCategory.forEach((c: any) => {
          csvContent += `${c.name},${c.total}\n`
        })
        break
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    toast.success('Archivo descargado')
  }

  // Formatear moneda
  const formatCurrency = (amount: number) => {
    return `RD$ ${amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-primary-600" />
            Reportes Financieros
          </h1>
          <p className="text-gray-500 mt-1">
            Genera reportes detallados para el concilio y control interno
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} disabled={loading}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
          <Button onClick={exportToCSV} disabled={loading}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Selector de tipo de reporte */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {REPORT_TYPES.map((report) => {
          const Icon = report.icon
          return (
            <motion.button
              key={report.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveReport(report.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                activeReport === report.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <Icon className={`w-6 h-6 mb-2 ${
                activeReport === report.id ? 'text-primary-600' : 'text-gray-400'
              }`} />
              <h3 className={`font-semibold text-sm ${
                activeReport === report.id ? 'text-primary-700' : 'text-gray-700'
              }`}>
                {report.name}
              </h3>
              <p className="text-xs text-gray-500 mt-1">{report.description}</p>
            </motion.button>
          )
        })}
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <Filter className="w-5 h-5 text-gray-400" />
            
            {(activeReport === 'monthly' || activeReport === 'tithing' || activeReport === 'annual') && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">Año</Label>
                  <Select 
                    value={year.toString()} 
                    onValueChange={(v) => setYear(parseInt(v))}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(y => (
                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {activeReport === 'monthly' && (
                  <div className="space-y-1">
                    <Label className="text-xs">Mes</Label>
                    <Select 
                      value={month.toString()} 
                      onValueChange={(v) => setMonth(parseInt(v))}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map(m => (
                          <SelectItem key={m.value} value={m.value.toString()}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}

            {activeReport === 'offerings' && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">Desde</Label>
                  <Input 
                    type="date" 
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-40"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Hasta</Label>
                  <Input 
                    type="date" 
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-40"
                  />
                </div>
              </>
            )}

            <Button variant="outline" onClick={loadReport} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Actualizar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contenido del reporte */}
      <div ref={printRef}>
        {loading ? (
          <Card className="py-20">
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              <p className="text-gray-500">Generando reporte...</p>
            </div>
          </Card>
        ) : (
          <>
            {/* Reporte Mensual para Concilio */}
            {activeReport === 'monthly' && councilReport && (
              <Card>
                <CardHeader className="text-center border-b">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Church className="w-6 h-6 text-primary-600" />
                  </div>
                  <CardTitle>Reporte Financiero Mensual</CardTitle>
                  <CardDescription className="text-lg font-medium capitalize">
                    {councilReport.period.label}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Ingresos */}
                    <div>
                      <h3 className="font-semibold text-green-700 flex items-center gap-2 mb-4">
                        <ArrowUpRight className="w-5 h-5" />
                        Ingresos
                      </h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Categoría</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {councilReport.income.map((item: any) => (
                            <TableRow key={item.categoryCode}>
                              <TableCell>{item.categoryName}</TableCell>
                              <TableCell className="text-right text-green-600 font-medium">
                                {formatCurrency(item.total)}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-green-50 font-bold">
                            <TableCell>Total Ingresos</TableCell>
                            <TableCell className="text-right text-green-700">
                              {formatCurrency(councilReport.totals.income)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    {/* Gastos */}
                    <div>
                      <h3 className="font-semibold text-red-700 flex items-center gap-2 mb-4">
                        <ArrowDownRight className="w-5 h-5" />
                        Gastos
                      </h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Categoría</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {councilReport.expenses.map((item: any) => (
                            <TableRow key={item.categoryCode}>
                              <TableCell>{item.categoryName}</TableCell>
                              <TableCell className="text-right text-red-600 font-medium">
                                {formatCurrency(item.total)}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-red-50 font-bold">
                            <TableCell>Total Gastos</TableCell>
                            <TableCell className="text-right text-red-700">
                              {formatCurrency(councilReport.totals.expenses)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Balance */}
                  <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-1">Balance del Mes</p>
                      <p className={`text-3xl font-bold ${
                        councilReport.totals.balance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(councilReport.totals.balance)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reporte de Diezmos */}
            {activeReport === 'tithing' && tithingReport && (
              <Card>
                <CardHeader className="text-center border-b">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Heart className="w-5 h-5 text-pink-500" />
                    Registro de Diezmos
                  </CardTitle>
                  <CardDescription>Año {tithingReport.year}</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Diezmador</TableHead>
                        <TableHead className="text-center">Cantidad</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tithingReport.tithings.map((member: any) => (
                        <TableRow key={member._id || 'unknown'}>
                          <TableCell className="font-medium">{member.personName}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{member.count} diezmos</Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            {formatCurrency(member.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="mt-6 p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">Total General</span>
                      <span className="text-2xl font-bold text-pink-600">
                        {formatCurrency(tithingReport.grandTotal)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reporte de Ofrendas por Culto */}
            {activeReport === 'offerings' && offeringsReport && (
              <Card>
                <CardHeader className="text-center border-b">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Gift className="w-5 h-5 text-amber-500" />
                    Ofrendas por Tipo de Culto
                  </CardTitle>
                  <CardDescription>
                    {format(new Date(offeringsReport.period.start), "d 'de' MMMM", { locale: es })} - 
                    {format(new Date(offeringsReport.period.end), " d 'de' MMMM, yyyy", { locale: es })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {offeringsReport.byServiceType.map((service: any) => (
                      <motion.div
                        key={service.serviceType}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-800">{service.serviceType}</span>
                          <Badge variant="secondary">{service.count}</Badge>
                        </div>
                        <p className="text-2xl font-bold text-amber-600">
                          {formatCurrency(service.total)}
                        </p>
                      </motion.div>
                    ))}
                  </div>

                  <div className="p-4 bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-semibold text-gray-700">Total de Ofrendas</span>
                        <p className="text-sm text-gray-500">{offeringsReport.totalCount} registros</p>
                      </div>
                      <span className="text-2xl font-bold text-amber-700">
                        {formatCurrency(offeringsReport.grandTotal)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comparativo Mensual */}
            {activeReport === 'comparison' && comparisonReport && (
              <Card>
                <CardHeader className="text-center border-b">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-500" />
                    Comparativo Últimos 12 Meses
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {/* Gráfico simple con barras */}
                  <div className="mb-8">
                    <div className="flex items-end justify-between h-48 gap-2">
                      {comparisonReport.months.map((m: any) => {
                        const maxValue = Math.max(...comparisonReport.months.map((x: any) => Math.max(x.income, x.expense)))
                        const incomeHeight = (m.income / maxValue) * 100
                        const expenseHeight = (m.expense / maxValue) * 100
                        
                        return (
                          <div key={m.key} className="flex-1 flex flex-col items-center gap-1">
                            <div className="flex gap-0.5 h-40 items-end w-full">
                              <div 
                                className="flex-1 bg-green-400 rounded-t transition-all hover:bg-green-500"
                                style={{ height: `${incomeHeight}%` }}
                                title={`Ingresos: ${formatCurrency(m.income)}`}
                              />
                              <div 
                                className="flex-1 bg-red-400 rounded-t transition-all hover:bg-red-500"
                                style={{ height: `${expenseHeight}%` }}
                                title={`Gastos: ${formatCurrency(m.expense)}`}
                              />
                            </div>
                            <span className="text-xs text-gray-500">{m.month}</span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex justify-center gap-6 mt-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-400 rounded" />
                        <span className="text-sm text-gray-600">Ingresos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-400 rounded" />
                        <span className="text-sm text-gray-600">Gastos</span>
                      </div>
                    </div>
                  </div>

                  {/* Tabla detallada */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mes</TableHead>
                        <TableHead className="text-right">Ingresos</TableHead>
                        <TableHead className="text-right">Gastos</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comparisonReport.months.map((m: any) => (
                        <TableRow key={m.key}>
                          <TableCell className="font-medium capitalize">{m.label}</TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatCurrency(m.income)}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {formatCurrency(m.expense)}
                          </TableCell>
                          <TableCell className={`text-right font-semibold ${
                            m.balance >= 0 ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {formatCurrency(m.balance)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Promedios */}
                  <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 rounded-xl text-center">
                      <p className="text-sm text-gray-600">Promedio Ingresos</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(comparisonReport.averages.income)}
                      </p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-xl text-center">
                      <p className="text-sm text-gray-600">Promedio Gastos</p>
                      <p className="text-xl font-bold text-red-600">
                        {formatCurrency(comparisonReport.averages.expense)}
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-xl text-center">
                      <p className="text-sm text-gray-600">Promedio Balance</p>
                      <p className={`text-xl font-bold ${
                        comparisonReport.averages.balance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(comparisonReport.averages.balance)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reporte Anual */}
            {activeReport === 'annual' && annualReport && (
              <Card>
                <CardHeader className="text-center border-b">
                  <CardTitle className="flex items-center justify-center gap-2">
                    <PieChart className="w-5 h-5 text-purple-500" />
                    Reporte Anual {annualReport.year}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {/* Resumen General */}
                  <div className="grid md:grid-cols-3 gap-4 mb-8">
                    <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-green-500" />
                        <span className="text-sm text-gray-600">Total Ingresos</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(annualReport.totals.income)}
                      </p>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-red-50 to-rose-50 rounded-xl border border-red-100">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="w-5 h-5 text-red-500" />
                        <span className="text-sm text-gray-600">Total Gastos</span>
                      </div>
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(annualReport.totals.expense)}
                      </p>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-5 h-5 text-blue-500" />
                        <span className="text-sm text-gray-600">Balance Anual</span>
                      </div>
                      <p className={`text-2xl font-bold ${
                        annualReport.totals.balance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(annualReport.totals.balance)}
                      </p>
                    </div>
                  </div>

                  {/* Desglose por Categorías */}
                  <div className="grid md:grid-cols-2 gap-8 mb-8">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-4">Ingresos por Categoría</h4>
                      <div className="space-y-3">
                        {annualReport.incomeByCategory.map((cat: any) => (
                          <div key={cat.code} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: cat.color || '#10b981' }}
                              />
                              <span className="text-sm">{cat.name}</span>
                            </div>
                            <span className="font-semibold text-green-600">
                              {formatCurrency(cat.total)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-4">Gastos por Categoría</h4>
                      <div className="space-y-3">
                        {annualReport.expenseByCategory.map((cat: any) => (
                          <div key={cat.code} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: cat.color || '#ef4444' }}
                              />
                              <span className="text-sm">{cat.name}</span>
                            </div>
                            <span className="font-semibold text-red-600">
                              {formatCurrency(cat.total)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Movimiento Mensual */}
                  <h4 className="font-semibold text-gray-700 mb-4">Movimiento por Mes</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mes</TableHead>
                        <TableHead className="text-right">Ingresos</TableHead>
                        <TableHead className="text-right">Gastos</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {annualReport.months.map((m: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium capitalize">{m.month}</TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatCurrency(m.income)}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {formatCurrency(m.expense)}
                          </TableCell>
                          <TableCell className={`text-right font-semibold ${
                            m.balance >= 0 ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {formatCurrency(m.balance)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Fondos Actuales */}
                  {annualReport.funds && annualReport.funds.length > 0 && (
                    <div className="mt-8">
                      <h4 className="font-semibold text-gray-700 mb-4">Saldo de Fondos</h4>
                      <div className="grid md:grid-cols-3 gap-4">
                        {annualReport.funds.map((fund: any) => (
                          <div 
                            key={fund._id}
                            className="p-4 rounded-xl border"
                            style={{ borderColor: fund.color || '#e5e7eb' }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: fund.color || '#6b7280' }}
                              />
                              <span className="font-medium text-gray-700">{fund.name}</span>
                            </div>
                            <p className="text-xl font-bold text-gray-900">
                              {formatCurrency(fund.balance || 0)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default FinanceReportsPage
