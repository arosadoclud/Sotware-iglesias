import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Shield, User, Activity, FileText,
  Loader2, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, Info,
  RefreshCw, BarChart3, Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { auditApi, adminApi } from '@/lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuditLog {
  _id: string
  userId: string
  userEmail: string
  userName: string
  userRole: string
  action: string
  category: string
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  resourceType: string
  resourceId?: string
  resourceName?: string
  previousValue?: any
  newValue?: any
  changes?: Record<string, { old: any; new: any }>
  success: boolean
  errorMessage?: string
  ipAddress?: string
  userAgent?: string
  endpoint?: string
  method?: string
  metadata?: any
  createdAt: string
}

interface AuditStats {
  total: number
  byCategory: Array<{ _id: string; count: number }>
  byUser: Array<{ _id: { id: string; name: string }; count: number }>
  byDay: Array<{ _id: string; count: number }>
}

interface User {
  _id: string
  fullName: string
  email: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const actionLabels: Record<string, string> = {
  LOGIN: 'Inicio de sesión',
  LOGOUT: 'Cierre de sesión',
  LOGIN_FAILED: 'Login fallido',
  PASSWORD_CHANGE: 'Cambio de contraseña',
  USER_CREATE: 'Usuario creado',
  USER_UPDATE: 'Usuario actualizado',
  USER_DELETE: 'Usuario eliminado',
  USER_ACTIVATE: 'Usuario activado',
  USER_DEACTIVATE: 'Usuario desactivado',
  USER_PERMISSION_CHANGE: 'Permisos modificados',
  PERSON_CREATE: 'Persona creada',
  PERSON_UPDATE: 'Persona actualizada',
  PERSON_DELETE: 'Persona eliminada',
  PERSON_ROLE_ASSIGN: 'Rol asignado',
  PERSON_ROLE_REMOVE: 'Rol removido',
  PROGRAM_CREATE: 'Programa creado',
  PROGRAM_UPDATE: 'Programa actualizado',
  PROGRAM_DELETE: 'Programa eliminado',
  PROGRAM_GENERATE: 'Programa generado',
  PROGRAM_BATCH_GENERATE: 'Generación en lote',
  PROGRAM_PDF_DOWNLOAD: 'PDF descargado',
  ACTIVITY_CREATE: 'Actividad creada',
  ACTIVITY_UPDATE: 'Actividad actualizada',
  ACTIVITY_DELETE: 'Actividad eliminada',
  ROLE_CREATE: 'Rol creado',
  ROLE_UPDATE: 'Rol actualizado',
  ROLE_DELETE: 'Rol eliminado',
  LETTER_CREATE: 'Carta creada',
  LETTER_UPDATE: 'Carta actualizada',
  LETTER_DELETE: 'Carta eliminada',
  LETTER_PDF_GENERATE: 'PDF de carta',
  CHURCH_UPDATE: 'Iglesia actualizada',
  SETTINGS_UPDATE: 'Config actualizada',
  CLEANING_GROUP_GENERATE: 'Grupos de limpieza',
  EXPORT_DATA: 'Datos exportados',
  IMPORT_DATA: 'Datos importados',
}

const categoryLabels: Record<string, string> = {
  AUTH: 'Autenticación',
  USERS: 'Usuarios',
  PERSONS: 'Personas',
  PROGRAMS: 'Programas',
  ACTIVITIES: 'Actividades',
  ROLES: 'Roles',
  LETTERS: 'Cartas',
  SETTINGS: 'Configuración',
  DATA: 'Datos',
}

const categoryColors: Record<string, string> = {
  AUTH: 'bg-blue-100 text-blue-700',
  USERS: 'bg-purple-100 text-purple-700',
  PERSONS: 'bg-green-100 text-green-700',
  PROGRAMS: 'bg-amber-100 text-amber-700',
  ACTIVITIES: 'bg-cyan-100 text-cyan-700',
  ROLES: 'bg-pink-100 text-pink-700',
  LETTERS: 'bg-indigo-100 text-indigo-700',
  SETTINGS: 'bg-neutral-100 text-neutral-700',
  DATA: 'bg-red-100 text-red-700',
}

const severityConfig: Record<string, { icon: any; color: string; label: string }> = {
  INFO: { icon: Info, color: 'text-blue-500', label: 'Info' },
  WARNING: { icon: AlertTriangle, color: 'text-amber-500', label: 'Advertencia' },
  CRITICAL: { icon: AlertTriangle, color: 'text-red-500', label: 'Crítico' },
}

// ── Main Component ────────────────────────────────────────────────────────────

const AuditLogsPage = () => {
  // State
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 })
  
  // Filters
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    category: '',
    severity: '',
    startDate: '',
    endDate: '',
  })
  
  // Detail modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  // ── Load data ───────────────────────────────────────────────────────────────
  
  useEffect(() => {
    loadLogs()
    loadStats()
    loadUsers()
  }, [])

  useEffect(() => {
    loadLogs()
  }, [pagination.page, filters])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      }
      if (filters.userId) params.userId = filters.userId
      if (filters.action) params.action = filters.action
      if (filters.category) params.category = filters.category
      if (filters.severity) params.severity = filters.severity
      if (filters.startDate) params.startDate = filters.startDate
      if (filters.endDate) params.endDate = filters.endDate
      
      const res = await auditApi.getLogs(params)
      setLogs(res.data.data || [])
      setPagination(prev => ({
        ...prev,
        total: res.data.pagination.total,
        pages: res.data.pagination.pages,
      }))
    } catch (e: any) {
      toast.error('Error al cargar logs')
    }
    setLoading(false)
  }

  const loadStats = async () => {
    try {
      const res = await auditApi.getStats({ days: 30 })
      setStats(res.data.data)
    } catch (e) {
      console.error('Error loading stats:', e)
    }
  }

  const loadUsers = async () => {
    try {
      const res = await adminApi.getUsers({ limit: 100 })
      setUsers(res.data.data?.map((u: any) => ({ _id: u._id, fullName: u.fullName, email: u.email })) || [])
    } catch (e) {
      console.error('Error loading users:', e)
    }
  }

  // ── Handlers ────────────────────────────────────────────────────────────────
  
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const clearFilters = () => {
    setFilters({
      userId: '',
      action: '',
      category: '',
      severity: '',
      startDate: '',
      endDate: '',
    })
  }

  const viewDetail = (log: AuditLog) => {
    setSelectedLog(log)
    setShowDetail(true)
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Auditoría del Sistema</h1>
            <p className="text-neutral-500">Historial de acciones y cambios</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => { loadLogs(); loadStats() }} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900">{stats.total}</p>
                  <p className="text-xs text-neutral-500">Eventos (30 días)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900">{stats.byUser.length}</p>
                  <p className="text-xs text-neutral-500">Usuarios activos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900">
                    {Math.round(stats.total / 30)}
                  </p>
                  <p className="text-xs text-neutral-500">Promedio/día</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900">{stats.byCategory.length}</p>
                  <p className="text-xs text-neutral-500">Categorías</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <Select value={filters.userId} onValueChange={(v) => handleFilterChange('userId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los usuarios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los usuarios</SelectItem>
                  {users.map(u => (
                    <SelectItem key={u._id} value={u._id}>{u.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-[180px]">
              <Select value={filters.category} onValueChange={(v) => handleFilterChange('category', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {Object.entries(categoryLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-[150px]">
              <Select value={filters.severity} onValueChange={(v) => handleFilterChange('severity', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Severidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                  <SelectItem value="WARNING">Advertencia</SelectItem>
                  <SelectItem value="CRITICAL">Crítico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-[150px]"
              />
            </div>
            
            <div>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-[150px]"
              />
            </div>
            
            <Button variant="ghost" onClick={clearFilters} size="sm">
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
              <p className="text-neutral-500">No se encontraron registros</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase">Fecha</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase">Usuario</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase">Acción</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase">Categoría</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase">Recurso</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase">Estado</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {logs.map((log, idx) => {
                    const SeverityIcon = severityConfig[log.severity]?.icon || Info
                    return (
                      <motion.tr
                        key={log._id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="hover:bg-neutral-50"
                      >
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-neutral-900">
                            {format(new Date(log.createdAt), 'dd MMM yyyy', { locale: es })}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {format(new Date(log.createdAt), 'HH:mm:ss')}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-neutral-900">{log.userName}</div>
                          <div className="text-xs text-neutral-500">{log.userEmail}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <SeverityIcon className={`w-4 h-4 ${severityConfig[log.severity]?.color}`} />
                            <span className="text-sm">{actionLabels[log.action] || log.action}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`${categoryColors[log.category] || 'bg-neutral-100 text-neutral-700'}`}>
                            {categoryLabels[log.category] || log.category}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-neutral-600">
                            {log.resourceName || log.resourceType}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {log.success ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => viewDetail(log)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-neutral-500">
                Mostrando {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Detalle del Evento
            </DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-neutral-500">Fecha y Hora</label>
                  <p className="font-medium">
                    {format(new Date(selectedLog.createdAt), "dd 'de' MMMM yyyy, HH:mm:ss", { locale: es })}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-neutral-500">Usuario</label>
                  <p className="font-medium">{selectedLog.userName}</p>
                  <p className="text-sm text-neutral-500">{selectedLog.userEmail}</p>
                </div>
                <div>
                  <label className="text-xs text-neutral-500">Acción</label>
                  <p className="font-medium">{actionLabels[selectedLog.action] || selectedLog.action}</p>
                </div>
                <div>
                  <label className="text-xs text-neutral-500">Categoría</label>
                  <Badge className={categoryColors[selectedLog.category]}>
                    {categoryLabels[selectedLog.category] || selectedLog.category}
                  </Badge>
                </div>
                <div>
                  <label className="text-xs text-neutral-500">Recurso</label>
                  <p className="font-medium">{selectedLog.resourceType}</p>
                  {selectedLog.resourceName && (
                    <p className="text-sm text-neutral-500">{selectedLog.resourceName}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-neutral-500">Estado</label>
                  <div className="flex items-center gap-2">
                    {selectedLog.success ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-green-600">Exitoso</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="text-red-600">Fallido</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Changes */}
              {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
                <div>
                  <label className="text-xs text-neutral-500 block mb-2">Cambios Realizados</label>
                  <div className="bg-neutral-50 rounded-lg p-3 space-y-2">
                    {Object.entries(selectedLog.changes).map(([field, { old, new: newVal }]) => (
                      <div key={field} className="text-sm">
                        <span className="font-medium text-neutral-700">{field}:</span>
                        <span className="text-red-500 line-through ml-2">
                          {typeof old === 'object' ? JSON.stringify(old) : String(old || '(vacío)')}
                        </span>
                        <span className="text-green-600 ml-2">
                          → {typeof newVal === 'object' ? JSON.stringify(newVal) : String(newVal || '(vacío)')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error */}
              {selectedLog.errorMessage && (
                <div>
                  <label className="text-xs text-neutral-500 block mb-2">Error</label>
                  <div className="bg-red-50 text-red-700 rounded-lg p-3 text-sm">
                    {selectedLog.errorMessage}
                  </div>
                </div>
              )}

              {/* Technical Info */}
              <div className="border-t pt-4">
                <label className="text-xs text-neutral-500 block mb-2">Información Técnica</label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-neutral-500">IP:</span>
                    <span className="ml-2">{selectedLog.ipAddress || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Endpoint:</span>
                    <span className="ml-2 font-mono text-xs">{selectedLog.endpoint || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Método:</span>
                    <span className="ml-2">{selectedLog.method || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Rol:</span>
                    <span className="ml-2">{selectedLog.userRole}</span>
                  </div>
                </div>
                {selectedLog.userAgent && (
                  <div className="mt-2 text-xs text-neutral-400 truncate">
                    User Agent: {selectedLog.userAgent}
                  </div>
                )}
              </div>

              {/* Metadata */}
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div className="border-t pt-4">
                  <label className="text-xs text-neutral-500 block mb-2">Metadata Adicional</label>
                  <pre className="bg-neutral-100 p-3 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AuditLogsPage
