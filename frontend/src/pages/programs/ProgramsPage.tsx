import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Wand2, Loader2, FileText, Trash2, Download, Send, Clock, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { programsApi } from '../../lib/api'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'

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
  const [programs, setPrograms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [downloadingPdf, setDownloadingPdf] = useState<string|null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string|null>(null)
  const LIMIT = 20

  const load = async () => {
    setLoading(true)
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

  const handleDownloadPdf = async (prog: any) => {
    setDownloadingPdf(prog._id)
    try {
      const res = await programsApi.downloadPdf(prog._id)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      const dateStr = format(new Date(prog.programDate), 'yyyy-MM-dd')
      a.download = `${prog.activityType?.name?.replace(/\s+/g,'-')}-${dateStr}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('PDF descargado')
    } catch { toast.error('Error al generar PDF') }
    setDownloadingPdf(null)
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programas</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} programa{total !== 1 ? 's' : ''} en total</p>
        </div>
        <Link to="/programs/generate" className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm">
          <Wand2 className="w-4 h-4" /> Generar Programa
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[['', 'Todos'], ['DRAFT','Borrador'], ['PUBLISHED','Publicado'], ['COMPLETED','Completado'], ['CANCELLED','Cancelado']].map(([val, lbl]) => (
          <button
            key={val}
            onClick={() => { setFilterStatus(val); setPage(1) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
              filterStatus === val
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >{lbl}</button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-primary-600" /></div>
      ) : programs.length === 0 ? (
        <div className="card text-center py-16">
          <FileText className="w-14 h-14 mx-auto mb-4 text-gray-200" />
          <p className="text-gray-500 font-medium">No hay programas{filterStatus ? ` con estado "${STATUS_CONFIG[filterStatus]?.label}"` : ''}</p>
          <Link to="/programs/generate" className="inline-flex items-center gap-1.5 text-primary-600 text-sm mt-3 hover:underline font-medium">
            <Wand2 className="w-4 h-4" /> Generar el primero
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actividad / Fecha</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Asignados</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {programs.map(prog => {
                  const date = new Date(prog.programDate)
                  const sc = STATUS_CONFIG[prog.status] || STATUS_CONFIG.DRAFT
                  const StatusIcon = sc.icon
                  const nextSt = NEXT_STATUS[prog.status]
                  const assignedCount = (prog.assignments || []).filter((a: any) => a.person?.name).length

                  return (
                    <tr key={prog._id} className="hover:bg-gray-50/60 transition-colors group">
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-gray-900 text-sm">{prog.activityType?.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {DAYS[date.getDay()]}, {format(date, "d MMM yyyy", { locale: es })}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 hidden sm:table-cell">
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
                          {nextSt && (
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
                              <span className="hidden md:inline">{nextSt.label}</span>
                            </button>
                          )}
                          {/* Editar */}
                          <button
                            onClick={() => navigate(`/programs/${prog._id}/flyer`)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-2.828 1.172H7v-2a4 4 0 011.172-2.828z" /></svg>
                          </button>
                          {/* Editor Visual Flyer */}
                          <button
                            onClick={() => navigate(`/programs/${prog._id}/flyer`)}
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Editor Visual Flyer"
                          >
                            <span role="img" aria-label="flyer">🎨</span>
                          </button>
                          {/* Descargar PDF */}
                          <button
                            onClick={() => handleDownloadPdf(prog)}
                            disabled={downloadingPdf === prog._id}
                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Descargar PDF"
                          >
                            {downloadingPdf === prog._id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Download className="w-4 h-4" />
                            }
                          </button>
                          {/* Eliminar */}
                          <button
                            onClick={() => handleDelete(prog._id)}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Página {page} de {totalPages} · {total} programas
              </p>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page === 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page === totalPages}
                  className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ProgramsPage
