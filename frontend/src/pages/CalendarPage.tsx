import { useEffect, useState } from 'react'
import { programsApi } from '../lib/api'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'

const DAYS = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
const DAYS_FULL = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const STATUS_DOT: Record<string, string> = { DRAFT: 'bg-yellow-400', PUBLISHED: 'bg-green-400', COMPLETED: 'bg-blue-400', CANCELLED: 'bg-red-400' }

const CalendarPage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [programs, setPrograms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const from = startOfMonth(currentMonth).toISOString()
    const to = endOfMonth(currentMonth).toISOString()
    setLoading(true)
    programsApi.getAll({ from, to, limit: '100' }).then(r => setPrograms(r.data.data)).catch(() => {}).finally(() => setLoading(false))
  }, [currentMonth])

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const startDay = getDay(startOfMonth(currentMonth))

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Calendario de Programas</h1>
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 sm:p-2 hover:bg-gray-100 rounded touch-manipulation">
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <span className="text-sm sm:text-lg font-semibold capitalize min-w-[140px] sm:min-w-[180px] text-center">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </span>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 sm:p-2 hover:bg-gray-100 rounded touch-manipulation">
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div> : (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-7 gap-px bg-gray-200 overflow-x-auto">
            {/* Encabezado de días - móvil usa letras, tablet/desktop nombres completos */}
            {DAYS.map((d, i) => (
              <div key={d} className="bg-gray-50 py-1.5 sm:py-2 text-center text-xs sm:text-sm font-semibold text-gray-600">
                <span className="sm:hidden">{d}</span>
                <span className="hidden sm:inline">{DAYS_FULL[i]}</span>
              </div>
            ))}
            {/* Celdas vacías antes del primer día */}
            {Array.from({ length: startDay }).map((_, i) => <div key={`e-${i}`} className="bg-white min-h-[60px] sm:min-h-[80px] md:min-h-[100px]" />)}
            {/* Días del mes */}
            {days.map(day => {
              const dayPrograms = programs.filter(p => isSameDay(new Date(p.programDate), day))
              const isToday = isSameDay(day, new Date())
              return (
                <div key={day.toISOString()} className={`bg-white min-h-[70px] sm:min-h-[90px] md:min-h-[110px] p-1.5 sm:p-2 ${isToday ? 'ring-2 ring-primary-500 ring-inset' : ''}`}>
                  <span className={`text-xs sm:text-sm font-semibold ${isToday ? 'font-bold text-primary-600' : 'text-gray-700'}`}>{day.getDate()}</span>
                  <div className="mt-1 sm:mt-1.5 space-y-1">
                    {dayPrograms.slice(0, 2).map(p => (
                      <div key={p._id} className="flex items-center gap-1 text-[10px] sm:text-xs">
                        <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 ${STATUS_DOT[p.status] || 'bg-gray-400'}`} />
                        <span className="truncate text-gray-600 leading-tight">{p.activityType?.name}</span>
                      </div>
                    ))}
                    {dayPrograms.length > 2 && (
                      <div className="text-[9px] sm:text-[10px] text-gray-500 font-medium ml-2">+{dayPrograms.length - 2} más</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
export default CalendarPage
