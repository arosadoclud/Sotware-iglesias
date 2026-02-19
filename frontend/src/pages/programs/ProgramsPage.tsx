import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Wand2, Loader2, FileText, Trash2, Download, Send, Clock, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Edit, Calendar, Sparkles, MessageCircle, Zap } from 'lucide-react'
import { programsApi } from '../../lib/api'
import { sharePdfViaWhatsApp } from '../../lib/shareWhatsApp'
import { safeDateParse, toDateStr } from '../../lib/utils'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { QuickEditDrawer } from '../../components/programs/QuickEditDrawer'
import { useAuthStore } from '../../store/authStore'
import { P } from '../../constants/permissions'

const DAYS: Record<number,string> = {0:'Domingo',1:'Lunes',2:'Martes',3:'Miércoles',4:'Jueves',5:'Viernes',6:'Sábado'}

const STATUS_CONFIG: Record<string, { label: string; style: string; icon: any }> = {
  DRAFT:     { label:'Borrador',   style:'bg-amber-50 text-amber-700 border-amber-200',  icon: Clock },
  PUBLISHED: { label:'Publicado',  style:'bg-green-50 text-green-700 border-green-200',  icon: CheckCircle2 },
  COMPLETED: { label:'Completado', style:'bg-blue-50 text-blue-700 border-blue-200',     icon: CheckCircle2 },
  CANCELLED: { label:'Cancelado',  style:'bg-red-50 text-red-700 border-red-200',        icon: XCircle },
}

const NEXT_STATUS: Record<string, { label: string; value: string }> = {
  DRAFT:     { label:'Publicar', value:'PUBLISHED' },
  PUBLISHED: { label:'Completar', value:'COMPLETED' },
}

const ProgramsPage = () => {
  const { hasPermission } = useAuthStore()
  const canCreate = hasPermission(P.PROGRAMS_CREATE)
  const canEdit = hasPermission(P.PROGRAMS_EDIT)
  const canDelete = hasPermission(P.PROGRAMS_DELETE)

  const [programs, setPrograms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [updatingStatus, setUpdatingStatus] = useState<string|null>(null)
  const [downloadingPdf, setDownloadingPdf] = useState<string|null>(null)
  const [sharingWhatsApp, setSharingWhatsApp] = useState<string|null>(null)
  const [deletingAll, setDeletingAll] = useState(false)
  const [publishingAll, setPublishingAll] = useState(false)
  const [downloadingAllPdf, setDownloadingAllPdf] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [quickEditId, setQuickEditId] = useState<string | null>(null)
  const LIMIT = 20

  const load = async () => {
    setLoading(true)
    setSelectedIds(new Set()) // Limpiar selección al recargar
    try {
      const res = await programsApi.getAll({ status: filterStatus || undefined, limit: String(LIMIT), page: String(page) })
      setPrograms(res.data.data)
      setTotal(res.data.pagination?.total || 0)
    } catch { toast.error('Error cargando programas') }
    setLoading(false)
  }


  const navigate = useNavigate();
  useEffect(() => { load() }, [filterStatus, page])

  const handleStatusChange = async (id: string, status: string, programName: string) => {
    setUpdatingStatus(id)
    try {
      await programsApi.updateStatus(id, status)
      if (status === 'PUBLISHED') toast.success(`✅ "${programName}" publicado — notificaciones enviadas`)
      else toast.success(`Estado actualizado a ${STATUS_CONFIG[status]?.label}`)
      load()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al cambiar estado')
    }
    setUpdatingStatus(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este programa? Esta acción no se puede deshacer.')) return
    try { await programsApi.delete(id); toast.success('Programa eliminado'); load() }
    catch { toast.error('Error al eliminar') }
  }

  const handleDeleteAll = async () => {
    if (!confirm(`⚠️ ¿Estás seguro de eliminar TODOS los programas?\n\nSe eliminarán ${total} programa${total !== 1 ? 's' : ''}.\n\nEsta acción NO se puede deshacer.`)) return
    
    setDeletingAll(true)
    try {
      const res = await programsApi.deleteAll()
      toast.success(res.data.message || 'Todos los programas eliminados')
      load()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al eliminar programas')
    }
    setDeletingAll(false)
  }

  const handlePublishAll = async () => {
    const draftCount = programs.filter(p => p.status === 'DRAFT').length
    if (draftCount === 0) {
      return toast.info('No hay programas en borrador para publicar')
    }
    if (!confirm(`¿Publicar todos los programas en borrador?\n\nSe publicarán los programas con estado "Borrador".`)) return
    
    setPublishingAll(true)
    try {
      const res = await programsApi.publishAll()
      toast.success(res.data.message || 'Programas publicados')
      load()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al publicar programas')
    }
    setPublishingAll(false)
  }

  const handleDownloadPdf = async (prog: any) => {
    setDownloadingPdf(prog._id)
    try {
      const res = await programsApi.downloadPdf(prog._id)
      const dateStr = toDateStr(prog.programDate)
      const filename = `${prog.activityType?.name?.replace(/\s+/g, '-') || 'programa'}-${dateStr}.pdf`
      downloadBlob(new Blob([res.data]), filename)
      toast.success('PDF descargado')
    } catch {
      toast.error('Error al generar PDF')
    }
    setDownloadingPdf(null)
  }

  const handleDownloadAllPdf = async () => {
    const toDownload = selectedIds.size > 0 
      ? programs.filter(p => selectedIds.has(p._id))
      : programs
    
    if (toDownload.length === 0) {
      return toast.info('No hay programas para descargar')
    }
    
    const msg = selectedIds.size > 0
      ? `¿Descargar ${toDownload.length} PDF${toDownload.length !== 1 ? 's' : ''} seleccionado${toDownload.length !== 1 ? 's' : ''}?`
      : `¿Descargar TODOS los ${toDownload.length} PDF${toDownload.length !== 1 ? 's' : ''}?\n\n(Selecciona programas específicos con los checkboxes si prefieres)`
    
    if (!confirm(msg)) return
    
    setDownloadingAllPdf(true)
    let downloaded = 0
    let failed = 0
    
    for (const prog of toDownload) {
      try {
        const res = await programsApi.downloadPdf(prog._id)
        const dateStr = toDateStr(prog.programDate)
        const filename = `${prog.activityType?.name?.replace(/\s+/g, '-') || 'programa'}-${dateStr}.pdf`
        downloadBlob(new Blob([res.data]), filename)
        downloaded++
        await new Promise(resolve => setTimeout(resolve, 500)) // Small delay between downloads
      } catch {
        failed++
      }
      // Pequeña pausa para no saturar
      await new Promise(r => setTimeout(r, 300))
    }
    
    if (failed > 0) {
      toast.warning(`${downloaded} PDF${downloaded !== 1 ? 's' : ''} descargado${downloaded !== 1 ? 's' : ''}, ${failed} fallido${failed !== 1 ? 's' : ''}`)
    } else {
      toast.success(`${downloaded} PDF${downloaded !== 1 ? 's' : ''} descargado${downloaded !== 1 ? 's' : ''}`)
    }
    setSelectedIds(new Set())
    setDownloadingAllPdf(false)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === programs.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(programs.map(p => p._id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header mejorado */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl rotate-3 opacity-20" />
              <div className="relative p-2 sm:p-2.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/25">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900">Programas</h1>
              <p className="text-gray-500 text-xs sm:text-sm">
                {total} programa{total !== 1 ? 's' : ''} en total
                {filterStatus && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    {STATUS_CONFIG[filterStatus]?.label}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {total > 0 && (
              <>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDownloadAllPdf}
                  disabled={downloadingAllPdf}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloadingAllPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="hidden sm:inline">Descargando...</span>
                      <span className="sm:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">{selectedIds.size > 0 ? `Descargar (${selectedIds.size})` : 'Descargar PDFs'}</span>
                      <span className="sm:hidden">PDF</span>
                    </>
                  )}
                </motion.button>
                {canEdit && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePublishAll}
                  disabled={publishingAll}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {publishingAll ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Publicando...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Publicar</span>
                  </>
                )}
              </motion.button>
              )}
              {canDelete && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDeleteAll}
                disabled={deletingAll}
                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar</span>
                  </>
                )}
              </motion.button>
              )}
            </>
          )}
          {canCreate && (
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link to="/programs/generate" className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-md hover:shadow-lg">
              <Sparkles className="w-4 h-4" />
              <span>Nuevo</span>
            </Link>
          </motion.div>
          )}
        </div>
      </div>
      </div>

      {/* Filters mejorados */}
      <div className="flex gap-1.5 sm:gap-2 flex-wrap pb-2 -mb-2">
        {[['', 'Todos'], ['DRAFT','Borrador'], ['PUBLISHED','Publicado'], ['COMPLETED','Completado'], ['CANCELLED','Cancelado']].map(([val, lbl]) => (
          <motion.button
            key={val}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setFilterStatus(val); setPage(1) }}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all border whitespace-nowrap ${
              filterStatus === val
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white border-transparent shadow-md shadow-primary-500/25'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary-200 hover:bg-primary-50/50'
            }`}
          >{lbl}</motion.button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-200/50 rounded-full animate-ping" />
            <div className="relative p-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          </div>
          <p className="text-gray-500 animate-pulse">Cargando programas...</p>
        </div>
      ) : programs.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card text-center py-16 border-2 border-dashed border-gray-200 bg-gray-50/50 rounded-xl"
        >
          <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <FileText className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium text-lg">No hay programas{filterStatus ? ` con estado "${STATUS_CONFIG[filterStatus]?.label}"` : ''}</p>
          <Link to="/programs/generate" className="inline-flex items-center gap-2 px-4 py-2 mt-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold transition-colors">
            <Wand2 className="w-4 h-4" /> Generar el primero
          </Link>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, type: "spring", bounce: 0.2 }}
          className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden"
        >
          {/* Vista móvil - Tarjetas */}
          <div className="block md:hidden">
            <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === programs.length && programs.length > 0}
                    onChange={toggleSelectAll}
                    className="w-2.5 h-2.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Seleccionar todos ({programs.length})
                  </span>
                </label>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {programs.map((prog, index) => {
                const date = safeDateParse(prog.programDate)
                const sc = STATUS_CONFIG[prog.status] || STATUS_CONFIG.DRAFT
                const StatusIcon = sc.icon
                const nextSt = NEXT_STATUS[prog.status]
                // Contar personas correctamente según tipo de programa
                const assignedCount = (prog as any).generationType === 'cleaning_groups'
                  ? ((prog as any).cleaningMembers?.length || 0)
                  : (prog.assignments || []).filter((a: any) => a.person?.name).length

                return (
                  <motion.div
                    key={prog._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`p-4 transition-all ${selectedIds.has(prog._id) ? 'bg-primary-50/50' : 'hover:bg-gray-50'}`}
                  >
                    {/* Header con checkbox y estado */}
                    <div className="flex items-start justify-between mb-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(prog._id)}
                        onChange={() => toggleSelect(prog._id)}
                        className="w-2.5 h-2.5 mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500 flex-shrink-0"
                      />
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${sc.style}`}>
                        <StatusIcon className="w-3 h-3" />
                        {sc.label}
                      </span>
                    </div>

                    {/* Contenido principal */}
                    <div className="mb-3">
                      <h3 className="font-semibold text-gray-900 text-base mb-1">
                        {prog.activityType?.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>{DAYS[date.getDay()]}, {format(date, "d MMM yyyy", { locale: es })}</span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {assignedCount} persona{assignedCount !== 1 ? 's' : ''} asignada{assignedCount !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Cambiar estado */}
                      {canEdit && nextSt && (
                        <button
                          onClick={() => handleStatusChange(prog._id, nextSt.value, prog.activityType?.name)}
                          disabled={updatingStatus === prog._id}
                          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 flex-1 justify-center"
                        >
                          {updatingStatus === prog._id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Send className="w-4 h-4" />
                          }
                          {nextSt.label}
                        </button>
                      )}
                      
                      {/* Botones secundarios */}
                      <div className="flex gap-2">
                        {/* Edición Rápida */}
                        {canEdit && (
                        <button
                          onClick={() => setQuickEditId(prog._id)}
                          className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edición rápida"
                        >
                          <Zap className="w-5 h-5" />
                        </button>
                        )}
                        
                        {/* Editar (solo DRAFT) */}
                        {canEdit && prog.status === 'DRAFT' && (
                          <button
                            onClick={() => {
                              const editPath = (prog as any).generationType === 'cleaning_groups'
                                ? `/programs/edit-cleaning/${prog._id}`
                                : `/programs/${prog._id}/edit`;
                              navigate(editPath);
                            }}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar programa"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                        )}
                        
                        {/* Descargar PDF (programas publicados/completados) */}
                        {(prog.status === 'PUBLISHED' || prog.status === 'COMPLETED') && (
                          <button
                            onClick={() => handleDownloadPdf(prog)}
                            disabled={downloadingPdf === prog._id}
                            className="p-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Descargar PDF"
                          >
                            {downloadingPdf === prog._id
                              ? <Loader2 className="w-5 h-5 animate-spin" />
                              : <Download className="w-5 h-5" />
                            }
                          </button>
                        )}
                        
                        {/* WhatsApp (programas publicados/completados) */}
                        {(prog.status === 'PUBLISHED' || prog.status === 'COMPLETED') && (
                          <button
                            onClick={async () => {
                              setSharingWhatsApp(prog._id)
                              try {
                                await sharePdfViaWhatsApp(prog._id, {
                                  activityName: prog.activityType?.name,
                                  dateStr: toDateStr(prog.programDate),
                                  churchName: prog.church?.name,
                                })
                              } finally {
                                setSharingWhatsApp(null)
                              }
                            }}
                            disabled={sharingWhatsApp === prog._id}
                            className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Compartir PDF por WhatsApp"
                          >
                            {sharingWhatsApp === prog._id
                              ? <Loader2 className="w-5 h-5 animate-spin" />
                              : <MessageCircle className="w-5 h-5" />
                            }
                          </button>
                        )}
                        
                        {/* Eliminar */}
                        {canDelete && (
                        <button
                          onClick={() => handleDelete(prog._id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Vista desktop - Tabla */}
          <div className="hidden md:block overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100/50">
                  <th className="py-3.5 px-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === programs.length && programs.length > 0}
                      onChange={toggleSelectAll}
                      className="w-2.5 h-2.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                      title="Seleccionar todos"
                    />
                  </th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actividad / Fecha</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Asignados</th>
                  <th className="text-left py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="text-right py-3.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {programs.map((prog, index) => {
                  const date = safeDateParse(prog.programDate)
                  const sc = STATUS_CONFIG[prog.status] || STATUS_CONFIG.DRAFT
                  const StatusIcon = sc.icon
                  const nextSt = NEXT_STATUS[prog.status]
                  // Contar personas correctamente según tipo de programa
                  const assignedCount = (prog as any).generationType === 'cleaning_groups'
                    ? ((prog as any).cleaningMembers?.length || 0)
                    : (prog.assignments || []).filter((a: any) => a.person?.name).length

                  return (
                    <motion.tr 
                      key={prog._id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`hover:bg-primary-50/30 transition-all group ${selectedIds.has(prog._id) ? 'bg-primary-50/50' : ''}`}
                    >
                      <td className="py-4 px-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(prog._id)}
                          onChange={() => toggleSelect(prog._id)}
                          className="w-2.5 h-2.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-gray-900 text-sm">{prog.activityType?.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {DAYS[date.getDay()]}, {format(date, "d MMM yyyy", { locale: es })}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-sm text-gray-600">
                          {assignedCount} persona{assignedCount !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${sc.style}`}>
                          <StatusIcon className="w-3 h-3" />
                          {sc.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-end gap-1">
                          {/* Cambiar estado */}
                          {canEdit && nextSt && (
                            <button
                              onClick={() => handleStatusChange(prog._id, nextSt.value, prog.activityType?.name)}
                              disabled={updatingStatus === prog._id}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors border border-transparent hover:border-primary-200"
                              title={nextSt.label}
                            >
                              {updatingStatus === prog._id
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Send className="w-3.5 h-3.5" />
                              }
                              <span className="hidden lg:inline">{nextSt.label}</span>
                            </button>
                          )}
                          {/* Edición Rápida */}
                          {canEdit && (
                          <button
                            onClick={() => setQuickEditId(prog._id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-200"
                            title="Edición rápida"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span className="hidden lg:inline">Rápida</span>
                          </button>
                          )}
                          
                          {/* Editar (solo DRAFT) */}
                          {canEdit && prog.status === 'DRAFT' && (
                            <button
                              onClick={() => {
                                const editPath = (prog as any).generationType === 'cleaning_groups'
                                  ? `/programs/edit-cleaning/${prog._id}`
                                  : `/programs/${prog._id}/edit`;
                                navigate(editPath);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                              title="Editar programa"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span className="hidden lg:inline">Editor</span>
                            </button>
                          )}
                          {/* Descargar PDF (programas publicados/completados) */}
                          {(prog.status === 'PUBLISHED' || prog.status === 'COMPLETED') && (
                            <button
                              onClick={() => handleDownloadPdf(prog)}
                              disabled={downloadingPdf === prog._id}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-200"
                              title="Descargar PDF"
                            >
                              {downloadingPdf === prog._id
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Download className="w-3.5 h-3.5" />
                              }
                              <span className="hidden lg:inline">Descargar PDF</span>
                            </button>
                          )}
                          {/* Compartir WhatsApp (programas publicados/completados) */}
                          {(prog.status === 'PUBLISHED' || prog.status === 'COMPLETED') && (
                            <button
                              onClick={async () => {
                                setSharingWhatsApp(prog._id)
                                try {
                                  await sharePdfViaWhatsApp(prog._id, {
                                    activityName: prog.activityType?.name,
                                    dateStr: toDateStr(prog.programDate),
                                    churchName: prog.church?.name,
                                  })
                                } finally {
                                  setSharingWhatsApp(null)
                                }
                              }}
                              disabled={sharingWhatsApp === prog._id}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-200 disabled:opacity-50"
                              title="Compartir PDF por WhatsApp"
                            >
                              {sharingWhatsApp === prog._id
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <MessageCircle className="w-3.5 h-3.5" />
                              }
                              <span className="hidden lg:inline">WhatsApp</span>
                            </button>
                          )}
                          {/* Eliminar */}
                          {canDelete && (
                          <button
                            onClick={() => handleDelete(prog._id)}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0 px-4 py-3 border-t border-gray-100 bg-gray-50/50">
              <p className="text-xs sm:text-sm text-gray-500">
                <span className="hidden sm:inline">Página </span><span className="font-medium text-gray-700">{page}</span> de <span className="font-medium text-gray-700">{totalPages}</span><span className="hidden sm:inline"> · {total} programas</span>
              </p>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-40 transition-all border border-transparent hover:border-gray-200">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page === totalPages}
                  className="p-2 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-40 transition-all border border-transparent hover:border-gray-200">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
      
      {/* Quick Edit Drawer */}
      <QuickEditDrawer
        programId={quickEditId}
        open={quickEditId !== null}
        onOpenChange={(open) => !open && setQuickEditId(null)}
        onSaved={() => load()}
      />
    </motion.div>
  )
}

export default ProgramsPage
