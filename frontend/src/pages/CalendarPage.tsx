import { useEffect, useState } from 'react'
import { programsApi } from '../lib/api'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Calendario de Programas</h1>
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded"><ChevronLeft className="w-5 h-5" /></button>
          <span className="text-lg font-semibold capitalize">{format(currentMonth, 'MMMM yyyy', { locale: es })}</span>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-gray-100 rounded"><ChevronRight className="w-5 h-5" /></button>
        </div>
      </div>

      {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div> : (
        <div className="card">
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {DAYS.map(d => <div key={d} className="bg-gray-50 py-2 text-center text-sm font-semibold text-gray-600">{d}</div>)}
            {Array.from({ length: startDay }).map((_, i) => <div key={`e-${i}`} className="bg-white min-h-[80px]" />)}
            {days.map(day => {
              const dayPrograms = programs.filter(p => isSameDay(new Date(p.programDate), day))
              const isToday = isSameDay(day, new Date())
              return (
                <div key={day.toISOString()} className={`bg-white min-h-[80px] p-2 ${isToday ? 'ring-2 ring-primary-500 ring-inset' : ''}`}>
                  <span className={`text-sm ${isToday ? 'font-bold text-primary-600' : 'text-gray-700'}`}>{day.getDate()}</span>
                  <div className="mt-1 space-y-1">
                    {dayPrograms.map(p => (
                      <div key={p._id} className="flex items-center gap-1 text-xs">
                        <span className={`w-2 h-2 rounded-full ${STATUS_DOT[p.status] || 'bg-gray-400'}`} />
                        <span className="truncate text-gray-600">{p.activityType?.name}</span>
                      </div>
                    ))}
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
