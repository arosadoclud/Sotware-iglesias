import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  Loader2,
  Filter,
  FileText,
  PiggyBank,
  Building,
  HelpCircle,
  MoreHorizontal,
  Trash2,
  Pencil,
  CheckCircle,
  XCircle,
  Clock,
  Banknote,
  CreditCard,
  ArrowRightLeft,
  Heart,
  Gift,
  Star,
  Coins,
  Users,
  Zap,
  Wrench,
  BookOpen,
  BarChart3,
} from 'lucide-react'
import { financesApi, personsApi } from '../../lib/api'
import { tithesApi } from '../../lib/tithesApi'
import { useAuthStore } from '../../store/authStore'
import { P } from '../../constants/permissions'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'

import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../../components/ui/dialog'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'

// Iconos por categoría
const CATEGORY_ICONS: Record<string, any> = {
  'ING-01': Heart,      // Diezmos
  'ING-02': Gift,       // Ofrendas
  'ING-03': Star,       // Especiales
  'ING-04': Coins,      // Otros
  'GAS-01': Building,   // Pago del Local Iglesia
  'GAS-02': Zap,        // Servicios
  'GAS-03': Wrench,     // Mantenimiento
  'GAS-04': BookOpen,   // Ministerios
  'GAS-05': MoreHorizontal, // Otros
}

const PAYMENT_METHODS = {
  CASH: { label: 'Efectivo', icon: Banknote },
  CHECK: { label: 'Cheque', icon: FileText },
  TRANSFER: { label: 'Transferencia', icon: ArrowRightLeft },
  CARD: { label: 'Tarjeta', icon: CreditCard },
  OTHER: { label: 'Otro', icon: MoreHorizontal },
}

// Tipos de culto/servicio para ofrendas
const SERVICE_TYPES = [
  { value: 'DOMINGO_AM', label: 'Domingo - Mañana' },
  { value: 'DOMINGO_PM', label: 'Domingo - Noche' },
  { value: 'MIERCOLES', label: 'Miércoles' },
  { value: 'VIERNES', label: 'Viernes' },
  { value: 'SABADO', label: 'Sábado' },
  { value: 'ESPECIAL', label: 'Servicio Especial' },
  { value: 'AYUNO', label: 'Culto de Ayuno' },
  { value: 'VIGILIA', label: 'Vigilia' },
  { value: 'OTRO', label: 'Otro' },
]

interface Category {
  _id: string
  name: string
  code: string
  type: 'INCOME' | 'EXPENSE'
  color: string
}

interface Fund {
  _id: string
  name: string
  code: string
  color: string
  balance: number
  isDefault: boolean
}

interface Transaction {
  _id: string
  type: 'INCOME' | 'EXPENSE'
  category: Category
  fund: Fund
  amount: number
  date: string
  description?: string
  person?: { _id: string; fullName: string }
  paymentMethod: string
  reference?: string
  approvalStatus: string
  createdBy?: { name: string }
}

interface Person {
  _id: string
  fullName: string
}

const FinancesPage = () => {
  // Permisos
  const { hasPermission } = useAuthStore()
  const canCreate = hasPermission(P.FINANCES_CREATE)
  const canEdit   = hasPermission(P.FINANCES_EDIT)
  const canDelete = hasPermission(P.FINANCES_DELETE)

  // Estado
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [funds, setFunds] = useState<Fund[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [persons, setPersons] = useState<Person[]>([])
  const [summary, setSummary] = useState<any>(null)

  // Filtros
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  })
  const [filterType, setFilterType] = useState<string>('')

  // Modal
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'INCOME' | 'EXPENSE'>('INCOME')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    category: '',
    fund: '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    person: '',
    paymentMethod: 'CASH',
    reference: '',
    notes: '',
    serviceType: '', // Tipo de culto para ofrendas
  })

  // Modal de ayuda
  const [showHelp, setShowHelp] = useState(false)

  // Modal de crear categoría
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [categoryType, setCategoryType] = useState<'INCOME' | 'EXPENSE'>('INCOME')
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    icon: 'circle',
  })

  // Estado para desglose de diezmos
  const [tithesDetails, setTithesDetails] = useState<any[]>([])
  const [tithesLoading, setTithesLoading] = useState(false)

  // Cargar datos iniciales
  const loadData = async () => {
    setLoading(true)
    try {
      // Inicializar categorías y fondos si no existen
      await Promise.all([
        financesApi.seedCategories(),
        financesApi.seedFunds(),
      ])

      // Cargar todos los datos
      const [catRes, fundRes, transRes, summaryRes, personsRes] = await Promise.all([
        financesApi.getCategories(),
        financesApi.getFunds(),
        financesApi.getTransactions({ 
          startDate: dateRange.start, 
          endDate: dateRange.end,
          type: filterType || undefined,
          limit: 50,
        }),
        financesApi.getSummary({ startDate: dateRange.start, endDate: dateRange.end }),
        personsApi.getAll({ limit: 500 }),
      ])

      setCategories(catRes.data.data)
      setFunds(fundRes.data.data)
      setTransactions(transRes.data.data)
      setSummary(summaryRes.data.data)
      setPersons(personsRes.data.data)
    } catch (error) {
      toast.error('Error cargando datos de finanzas')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [dateRange, filterType])

  // Cargar desglose de diezmos para el período
  const loadTithesDetails = async () => {
    setTithesLoading(true)
    try {
      const res = await tithesApi.getMonthlyTithesDetails({ startDate: dateRange.start, endDate: dateRange.end })
      setTithesDetails(res.data.data)
    } catch {
      setTithesDetails([])
    }
    setTithesLoading(false)
  }

  useEffect(() => {
    loadTithesDetails()
  }, [dateRange])

  // Abrir modal
  const openModal = (type: 'INCOME' | 'EXPENSE') => {
    setModalType(type)
    setEditingId(null)
    const defaultFund = funds.find(f => f.isDefault)?._id || ''
    const defaultCategory = categories.find(c => c.type === type)?._id || ''
    
    setForm({
      category: defaultCategory,
      fund: defaultFund,
      amount: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
      person: '',
      paymentMethod: 'CASH',
      reference: '',
      notes: '',
      serviceType: '',
    })
    setShowModal(true)
  }

  // Abrir modal de crear categoría
  const openCategoryModal = (type: 'INCOME' | 'EXPENSE') => {
    setCategoryType(type)
    setCategoryForm({
      name: '',
      description: '',
      color: type === 'INCOME' ? '#22c55e' : '#ef4444',
      icon: 'circle',
    })
    setShowCategoryModal(true)
  }

  // Guardar nueva categoría
  const handleSaveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast.error('El nombre de la categoría es requerido')
      return
    }

    setSaving(true)
    try {
      // Generar código automático
      const prefix = categoryType === 'INCOME' ? 'ING' : 'GAS'
      const existingCodes = categories
        .filter(c => c.type === categoryType)
        .map(c => c.code)
      
      let nextNumber = 1
      while (existingCodes.includes(`${prefix}-${String(nextNumber).padStart(2, '0')}`)) {
        nextNumber++
      }
      const code = `${prefix}-${String(nextNumber).padStart(2, '0')}`

      await financesApi.createCategory({
        name: categoryForm.name,
        code,
        type: categoryType,
        description: categoryForm.description,
        color: categoryForm.color,
      })

      toast.success('Categoría creada exitosamente')
      setShowCategoryModal(false)
      loadData() // Recargar categorías
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear categoría')
    }
    setSaving(false)
  }

  // Abrir modal para editar transacción
  const handleEdit = (transaction: Transaction) => {
    setEditingId(transaction._id)
    setModalType(transaction.type)
    
    // Extraer serviceType si está en la descripción
    let serviceType = ''
    let description = transaction.description || ''
    const isOfrenda = transaction.category?.code === 'ING-02'
    if (isOfrenda && description) {
      const serviceMatch = SERVICE_TYPES.find(s => description.startsWith(s.label))
      if (serviceMatch) {
        serviceType = serviceMatch.value
        description = description.replace(serviceMatch.label, '').replace(/^\s*-\s*/, '').trim()
      }
    }

    setForm({
      category: transaction.category?._id || '',
      fund: transaction.fund?._id || '',
      amount: transaction.amount.toString(),
      date: format(new Date(transaction.date), 'yyyy-MM-dd'),
      description: description,
      person: transaction.person?._id || '',
      paymentMethod: transaction.paymentMethod || 'CASH',
      reference: transaction.reference || '',
      notes: '',
      serviceType: serviceType,
    })
    setShowModal(true)
  }

  // Guardar transacción
  const handleSave = async () => {
    if (!form.category || !form.fund || !form.amount) {
      toast.error('Completa los campos requeridos')
      return
    }

    // Validar que ofrendas tengan tipo de culto
    const isOfrenda = form.category === categories.find(c => c.code === 'ING-02')?._id
    if (isOfrenda && !form.serviceType) {
      toast.error('Selecciona el día del culto para la ofrenda')
      return
    }

    // Construir descripción con tipo de servicio si es ofrenda
    let description = form.description || ''
    if (isOfrenda && form.serviceType) {
      const serviceLabel = SERVICE_TYPES.find(s => s.value === form.serviceType)?.label || ''
      description = serviceLabel + (description ? ' - ' + description : '')
    }

    setSaving(true)
    try {
      const transactionData = {
        type: modalType,
        category: form.category,
        fund: form.fund,
        amount: parseFloat(form.amount),
        date: form.date,
        description: description || undefined,
        person: form.person || undefined,
        paymentMethod: form.paymentMethod,
        reference: form.reference || undefined,
        notes: form.notes || undefined,
      }

      if (editingId) {
        // Modo edición
        await financesApi.updateTransaction(editingId, transactionData)
        toast.success('Transacción actualizada correctamente')
      } else {
        // Modo creación
        await financesApi.createTransaction(transactionData)
        toast.success(modalType === 'INCOME' ? 'Ingreso registrado' : 'Gasto registrado')
      }

      setShowModal(false)
      loadData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar')
    }
    setSaving(false)
  }

  // Eliminar transacción
  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta transacción?')) return
    try {
      await financesApi.deleteTransaction(id)
      toast.success('Transacción eliminada')
      loadData()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  // Aprobar/Rechazar gasto
  const handleApproval = async (id: string, approved: boolean) => {
    try {
      await financesApi.approveTransaction(id, { approved })
      toast.success(approved ? 'Gasto aprobado' : 'Gasto rechazado')
      loadData()
    } catch {
      toast.error('Error al procesar')
    }
  }

  // Cambiar período rápido
  const setQuickRange = (months: number) => {
    const end = new Date()
    const start = months === 0 ? startOfMonth(end) : subMonths(startOfMonth(end), months - 1)
    setDateRange({
      start: format(start, 'yyyy-MM-dd'),
      end: format(endOfMonth(end), 'yyyy-MM-dd'),
    })
  }

  // Obtener icono de categoría
  const getCategoryIcon = (code: string) => {
    return CATEGORY_ICONS[code] || MoreHorizontal
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="relative">
          <div className="absolute inset-0 bg-green-200/50 rounded-full animate-ping" />
          <div className="relative p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-full">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
        </div>
        <p className="text-gray-500 animate-pulse">Cargando finanzas...</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl rotate-3 opacity-20" />
            <div className="relative p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg shadow-green-500/25">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Finanzas</h1>
            <p className="text-gray-500">
              Control de ingresos y gastos de la iglesia
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/finances/reports">
            <Button variant="outline" className="border-primary-200 text-primary-600 hover:bg-primary-50">
              <BarChart3 className="w-4 h-4 mr-2" />
              Reportes
            </Button>
          </Link>
          <Button variant="outline" onClick={() => setShowHelp(true)}>
            <HelpCircle className="w-4 h-4 mr-2" />
            Ayuda
          </Button>
          {canCreate && (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              onClick={() => openModal('EXPENSE')}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <ArrowDownCircle className="w-4 h-4 mr-2" />
              Registrar Gasto
            </Button>
          </motion.div>
          )}
          {canCreate && (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              onClick={() => openModal('INCOME')}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              <ArrowUpCircle className="w-4 h-4 mr-2" />
              Registrar Ingreso
            </Button>
          </motion.div>
          )}
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ingresos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="relative overflow-hidden border-green-100">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -mr-10 -mt-10" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Ingresos</p>
                  <p className="text-2xl font-bold text-green-600">
                    RD$ {summary?.totals?.income?.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {summary?.totals?.incomeCount || 0} transacciones
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Gastos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="relative overflow-hidden border-red-100">
            <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full -mr-10 -mt-10" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Gastos</p>
                  <p className="text-2xl font-bold text-red-600">
                    RD$ {summary?.totals?.expense?.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {summary?.totals?.expenseCount || 0} transacciones
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="relative overflow-hidden border-blue-100">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Balance del Mes</p>
                  <p className={`text-2xl font-bold ${(summary?.totals?.balance || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    RD$ {summary?.totals?.balance?.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Ingresos - Gastos
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Wallet className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pendientes de Aprobación */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="relative overflow-hidden border-amber-100">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -mr-10 -mt-10" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pendientes</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {summary?.pendingExpenses || 0}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Gastos por aprobar
                  </p>
                </div>
                <div className="p-3 bg-amber-100 rounded-full">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Desglose de Diezmos y 10% Concilio */}
      {tithesLoading ? (
        <div className="flex items-center gap-2 text-yellow-600 py-6">
          <Loader2 className="w-5 h-5 animate-spin" />
          Cargando desglose de diezmos...
        </div>
      ) : tithesDetails.length > 0 ? (
        <div className="overflow-x-auto my-8">
          <div className="mb-2 font-semibold text-amber-700 text-lg flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            Desglose de Diezmos y 10% Concilio
          </div>
          <table className="min-w-[600px] w-full border rounded-lg overflow-hidden text-sm">
            <thead>
              <tr className="bg-amber-100 text-amber-900">
                <th className="py-2 px-3 text-left">Fecha</th>
                <th className="py-2 px-3 text-left">Diezmador</th>
                <th className="py-2 px-3 text-right">Monto</th>
                <th className="py-2 px-3 text-right">10% Concilio</th>
                <th className="py-2 px-3 text-right">90% Iglesia</th>
              </tr>
            </thead>
            <tbody>
              {tithesDetails.map((t, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-amber-50'}>
                  <td className="py-2 px-3">{format(new Date(t.date), 'dd/MM/yyyy', { locale: es })}</td>
                  <td className="py-2 px-3">{t.personName}</td>
                  <td className="py-2 px-3 text-right text-green-700 font-semibold">RD$ {t.amount.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right text-amber-700 font-bold">RD$ {t.councilAmount.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right text-green-700">RD$ {t.churchAmount.toLocaleString()}</td>
                </tr>
              ))}
              <tr className="bg-amber-200 font-bold">
                <td colSpan={2} className="py-2 px-3 text-right">TOTALES:</td>
                <td className="py-2 px-3 text-right text-green-800">
                  RD$ {tithesDetails.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                </td>
                <td className="py-2 px-3 text-right text-amber-900">
                  RD$ {tithesDetails.reduce((sum, t) => sum + t.councilAmount, 0).toLocaleString()}
                </td>
                <td className="py-2 px-3 text-right text-green-800">
                  RD$ {tithesDetails.reduce((sum, t) => sum + t.churchAmount, 0).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
          <div className="mt-2 text-xs text-amber-700 bg-amber-50 rounded p-2">
            <strong>Nota:</strong> El 10% de cada diezmo se acumula para el concilio y se remite al finalizar el año fiscal.
          </div>
        </div>
      ) : null}

      {/* Fondos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-primary-600" />
              Fondos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {funds.map(fund => (
                <div 
                  key={fund._id}
                  className="p-4 rounded-xl border-2 transition-all hover:shadow-md"
                  style={{ borderColor: fund.color + '40', backgroundColor: fund.color + '10' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-700">{fund.name}</span>
                    {fund.isDefault && (
                      <Badge variant="secondary" className="text-xs">Principal</Badge>
                    )}
                  </div>
                  <p className="text-2xl font-bold" style={{ color: fund.color }}>
                    RD$ {fund.balance.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filtros y Transacciones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="lg:sticky lg:top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Período rápido */}
              <div>
                <Label className="text-xs text-gray-500">Período Rápido</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setQuickRange(0)}
                    className="text-xs"
                  >
                    Este mes
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setQuickRange(3)}
                    className="text-xs"
                  >
                    3 meses
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setQuickRange(12)}
                    className="text-xs"
                  >
                    Año
                  </Button>
                </div>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-500">Desde</Label>
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Hasta</Label>
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Tipo */}
              <div>
                <Label className="text-xs text-gray-500">Tipo</Label>
                <Select value={filterType || 'ALL'} onValueChange={(v) => setFilterType(v === 'ALL' ? '' : v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="INCOME">Solo Ingresos</SelectItem>
                    <SelectItem value="EXPENSE">Solo Gastos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Distribución por categoría */}
              <div className="pt-4 border-t">
                <Label className="text-xs text-gray-500 mb-3 block">Distribución</Label>
                <div className="space-y-2">
                  {summary?.byCategory?.slice(0, 6).map((cat: any) => {
                    const total = cat.type === 'INCOME' 
                      ? summary?.totals?.income 
                      : summary?.totals?.expense
                    const percentage = total > 0 ? (cat.total / total) * 100 : 0
                    const Icon = getCategoryIcon(cat.code || '')
                    
                    return (
                      <div key={cat._id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" style={{ color: cat.color }} />
                            <span className="text-gray-600 truncate">{cat.name}</span>
                          </div>
                          <span className="font-medium">RD$ {cat.total.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${Math.min(percentage, 100)}%`,
                              backgroundColor: cat.color 
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Lista de transacciones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Movimientos
                </CardTitle>
                <Badge variant="secondary">
                  {transactions.length} registros
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No hay transacciones en este período</p>
                  {canCreate && (
                  <Button 
                    variant="link" 
                    className="mt-2"
                    onClick={() => openModal('INCOME')}
                  >
                    Registrar el primer ingreso
                  </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y">
                  <AnimatePresence>
                    {transactions.map((tx, index) => {
                      const Icon = getCategoryIcon(tx.category?.code || '')
                      const PaymentIcon = PAYMENT_METHODS[tx.paymentMethod as keyof typeof PAYMENT_METHODS]?.icon || Banknote
                      
                      return (
                        <motion.div
                          key={tx._id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ delay: index * 0.02 }}
                          className="p-4 hover:bg-gray-50/50 transition-colors group"
                        >
                          <div className="flex items-center gap-4">
                            {/* Icono y categoría */}
                            <div 
                              className="p-2.5 rounded-xl"
                              style={{ backgroundColor: tx.category?.color + '20' }}
                            >
                              <Icon 
                                className="w-5 h-5" 
                                style={{ color: tx.category?.color }}
                              />
                            </div>

                            {/* Detalles */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900">
                                  {tx.category?.name}
                                </p>
                                {tx.approvalStatus === 'PENDING' && (
                                  <Badge variant="warning" className="text-xs">
                                    Pendiente
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>{format(new Date(tx.date), "d MMM yyyy", { locale: es })}</span>
                                {tx.person && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate">{tx.person.fullName}</span>
                                  </>
                                )}
                                {tx.description && (
                                  <>
                                    <span>•</span>
                                    <span className="truncate">{tx.description}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Método de pago */}
                            <div className="hidden sm:flex items-center gap-1 text-gray-400">
                              <PaymentIcon className="w-4 h-4" />
                            </div>

                            {/* Monto */}
                            <div className={`text-right font-bold ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.type === 'INCOME' ? '+' : '-'}RD$ {tx.amount.toLocaleString()}
                            </div>

                            {/* Acciones */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {canEdit && tx.approvalStatus === 'PENDING' && (
                                  <>
                                    <DropdownMenuItem 
                                      onClick={() => handleApproval(tx._id, true)}
                                      className="text-green-600"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Aprobar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleApproval(tx._id, false)}
                                      className="text-red-600"
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Rechazar
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {canEdit && (
                                  <DropdownMenuItem 
                                    onClick={() => handleEdit(tx)}
                                    className="text-blue-600"
                                  >
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                )}
                                {canDelete && (
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(tx._id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Modal de registro */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingId ? (
                <>
                  <Pencil className="w-5 h-5 text-blue-600" />
                  Editar Transacción
                </>
              ) : modalType === 'INCOME' ? (
                <>
                  <ArrowUpCircle className="w-5 h-5 text-green-600" />
                  Registrar Ingreso
                </>
              ) : (
                <>
                  <ArrowDownCircle className="w-5 h-5 text-red-600" />
                  Registrar Gasto
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Modifica los datos de la transacción'
                : modalType === 'INCOME' 
                  ? 'Registra diezmos, ofrendas u otros ingresos' 
                  : 'Registra gastos de la iglesia'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Categoría */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Categoría *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => openCategoryModal(modalType)}
                  className="h-6 px-2 text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Nueva
                </Button>
              </div>
              <Select 
                value={form.category} 
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter(c => c.type === modalType)
                    .map(cat => {
                      const Icon = getCategoryIcon(cat.code)
                      return (
                        <SelectItem key={cat._id} value={cat._id}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" style={{ color: cat.color }} />
                            {cat.name}
                          </div>
                        </SelectItem>
                      )
                    })}
                </SelectContent>
              </Select>
            </div>

            {/* Fondo */}
            <div className="space-y-2">
              <Label>Fondo *</Label>
              <Select 
                value={form.fund} 
                onValueChange={(v) => setForm({ ...form, fund: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar fondo" />
                </SelectTrigger>
                <SelectContent>
                  {funds.map(fund => (
                    <SelectItem key={fund._id} value={fund._id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: fund.color }}
                        />
                        {fund.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Monto y Fecha */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monto *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="pl-9"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
            </div>

            {/* Persona (solo para diezmos) */}
            {modalType === 'INCOME' && form.category === categories.find(c => c.code === 'ING-01')?._id && (
              <div className="space-y-2">
                <Label>Diezmador</Label>
                <Select 
                  value={form.person || 'none'} 
                  onValueChange={(v) => setForm({ ...form, person: v === 'none' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar persona (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin identificar</SelectItem>
                    {persons.map(person => (
                      <SelectItem key={person._id} value={person._id}>
                        {person.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Tipo de culto (solo para ofrendas) */}
            {modalType === 'INCOME' && form.category === categories.find(c => c.code === 'ING-02')?._id && (
              <div className="space-y-2">
                <Label>Día del Culto *</Label>
                <Select 
                  value={form.serviceType || 'none'} 
                  onValueChange={(v) => setForm({ ...form, serviceType: v === 'none' ? '' : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="¿En qué culto se recogió?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Seleccionar culto</SelectItem>
                    {SERVICE_TYPES.map(service => (
                      <SelectItem key={service.value} value={service.value}>
                        {service.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Selecciona el día/servicio donde se recogió esta ofrenda</p>
              </div>
            )}

            {/* Método de pago */}
            <div className="space-y-2">
              <Label>Forma de Pago</Label>
              <Select 
                value={form.paymentMethod} 
                onValueChange={(v) => setForm({ ...form, paymentMethod: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_METHODS).map(([key, val]) => {
                    const Icon = val.icon
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {val.label}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Referencia */}
            {(form.paymentMethod === 'CHECK' || form.paymentMethod === 'TRANSFER') && (
              <div className="space-y-2">
                <Label>
                  {form.paymentMethod === 'CHECK' ? 'Número de Cheque' : 'Referencia de Transferencia'}
                </Label>
                <Input
                  value={form.reference}
                  onChange={(e) => setForm({ ...form, reference: e.target.value })}
                  placeholder={form.paymentMethod === 'CHECK' ? 'Ej: 001234' : 'Ej: TRF-2024-001'}
                />
              </div>
            )}

            {/* Descripción */}
            <div className="space-y-2">
              <Label>Descripción (opcional)</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Breve descripción"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving}
              className={modalType === 'INCOME' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Guardar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Ayuda */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary-600" />
              Guía de Uso del Sistema Financiero
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Paso 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center font-bold text-primary-600">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Conteo del Domingo</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Después del servicio, <strong>2 personas</strong> (nunca una sola) cuentan el dinero y separan:
                </p>
                <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
                  <li><strong>Sobres de diezmo</strong> con nombre</li>
                  <li><strong>Ofrenda general</strong> sin identificar</li>
                  <li><strong>Ofrendas especiales</strong> (misioneras, pro-templo)</li>
                </ul>
              </div>
            </div>

            {/* Paso 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center font-bold text-primary-600">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Registro en el Sistema</h4>
                <p className="text-sm text-gray-600 mt-1">
                  El tesorero ingresa cada monto por separado usando el botón <span className="text-green-600 font-semibold">"Registrar Ingreso"</span>:
                </p>
                <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
                  <li>Los <strong>diezmos</strong> se registran con el nombre de la persona</li>
                  <li>Las <strong>ofrendas</strong> generales van sin nombre</li>
                  <li>El sistema genera recibos al final del año</li>
                </ul>
              </div>
            </div>

            {/* Paso 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center font-bold text-primary-600">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Registro de Gastos</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Antes de pagar cualquier gasto, regístrelo con <span className="text-red-600 font-semibold">"Registrar Gasto"</span>:
                </p>
                <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
                  <li>Gastos menores a <strong>RD$500</strong>: se registran directamente</li>
                  <li>Gastos de <strong>RD$500 o más</strong>: requieren aprobación</li>
                  <li>Guarde siempre el comprobante/factura</li>
                </ul>
              </div>
            </div>

            {/* Paso 4 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center font-bold text-primary-600">
                4
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Reporte Mensual</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Al cierre de cada mes:
                </p>
                <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
                  <li>Revise el balance en el dashboard</li>
                  <li>Genere el reporte mensual en PDF</li>
                  <li>Presente el reporte a la junta directiva</li>
                  <li>La aportación al concilio (10%) se calcula automáticamente al final del año</li>
                </ul>
              </div>
            </div>

            {/* Categorías */}
            <div className="border-t pt-4 mt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Categorías del Sistema</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-green-600 mb-2">Ingresos</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>💚 <strong>Diezmos:</strong> 10% de miembros</li>
                    <li>🎁 <strong>Ofrendas:</strong> Generales</li>
                    <li>⭐ <strong>Especiales:</strong> Misioneras, etc.</li>
                    <li>💰 <strong>Otros:</strong> Eventos, donaciones</li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium text-red-600 mb-2">Gastos</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>🏠 <strong>Local:</strong> Alquiler/pago del templo</li>
                    <li>⚡ <strong>Servicios:</strong> Luz, agua, internet</li>
                    <li>🔧 <strong>Mantenimiento:</strong> Reparaciones</li>
                    <li>📖 <strong>Ministerios:</strong> Actividades</li>
                    <li>📦 <strong>Otros:</strong> Gastos varios</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowHelp(false)}>
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Crear Categoría */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Nueva Categoría de {categoryType === 'INCOME' ? 'Ingreso' : 'Gasto'}
            </DialogTitle>
            <DialogDescription>
              Crea una categoría personalizada para tus transacciones
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="Ej: Alquiler, Donaciones especiales..."
                maxLength={50}
              />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label>Descripción (opcional)</Label>
              <Input
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="Breve descripción..."
                maxLength={100}
              />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  className="w-20 h-10 cursor-pointer"
                />
                <div className="flex-1 h-10 rounded border-2 transition-all"
                  style={{ backgroundColor: categoryForm.color }}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCategory} disabled={saving || !categoryForm.name.trim()}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Categoría
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

export default FinancesPage
