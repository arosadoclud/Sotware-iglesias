import { useEffect, useState } from 'react'
import { programsApi } from '../lib/api'
import { safeDateParse } from '../lib/utils'
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
    <div className="space-y-3 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Calendario de Programas</h1>
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-lg active:bg-gray-200 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-base sm:text-lg font-semibold capitalize min-w-[150px] text-center">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </span>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded-lg active:bg-gray-200 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div> : (
        <div className="card overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[640px] sm:min-w-0">
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {/* Encabezado de días */}
              {DAYS_FULL.map((d) => (
                <div key={d} className="bg-gray-50 py-2 px-1 text-center text-xs sm:text-sm font-semibold text-gray-700">
                  <span className="sm:hidden">{d.slice(0, 1)}</span>
                  <span className="hidden sm:inline">{d}</span>
                </div>
              ))}
              {/* Celdas vacías antes del primer día */}
              {Array.from({ length: startDay }).map((_, i) => <div key={`e-${i}`} className="bg-white min-h-[80px] sm:min-h-[100px] md:min-h-[120px]" />)}
              {/* Días del mes */}
              {days.map(day => {
                const dayPrograms = programs.filter(p => isSameDay(safeDateParse(p.programDate), day))
                const isToday = isSameDay(day, new Date())
                return (
                  <div key={day.toISOString()} className={`bg-white min-h-[80px] sm:min-h-[100px] md:min-h-[120px] p-1.5 sm:p-2 border-l border-t border-gray-100 ${isToday ? 'ring-2 ring-primary-500 ring-inset bg-primary-50/30' : ''}`}>
                    <div className={`text-xs sm:text-sm font-bold mb-1 ${isToday ? 'text-primary-600' : 'text-gray-700'}`}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-0.5 sm:space-y-1">
                      {dayPrograms.slice(0, 3).map(p => (
                        <div key={p._id} className="flex items-start gap-1 text-[9px] sm:text-xs leading-tight">
                          <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 mt-0.5 ${STATUS_DOT[p.status] || 'bg-gray-400'}`} />
                          <span className="truncate text-gray-700 font-medium">{p.activityType?.name}</span>
                        </div>
                      ))}
                      {dayPrograms.length > 3 && (
                        <div className="text-[8px] sm:text-[10px] text-primary-600 font-semibold ml-2">+{dayPrograms.length - 3}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default CalendarPage
