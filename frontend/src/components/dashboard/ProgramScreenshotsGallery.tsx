import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { programsApi } from '../../lib/api'
import { safeDateParse } from '../../lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, Eye, Loader2, Image as ImageIcon, Sparkles } from 'lucide-react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { useAuthStore } from '../../store/authStore'

interface ProgramWithScreenshot {
  _id: string
  activityType: { name: string }
  programDate: string
  churchName?: string
  subtitle?: string
  screenshotUrl?: string
  status: string
}

export default function ProgramScreenshotsGallery() {
  const [programs, setPrograms] = useState<ProgramWithScreenshot[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()
  const apiBaseUrl = import.meta.env.VITE_API_URL || ''

  useEffect(() => {
    const load = async () => {
      try {
        const params: any = { 
          status: 'PUBLISHED', 
          limit: 6, 
          sort: '-programDate',
        }
        
        if (user?.churchId) {
          params.church = user.churchId
        }
        
        const res = await programsApi.getAll(params)
        const list = res.data.data || res.data || []
        
        // Filtrar solo programas que tengan screenshotUrl
        const withScreenshots = list.filter((p: ProgramWithScreenshot) => p.screenshotUrl)
        setPrograms(withScreenshots)
      } catch (error) {
        console.error('Error loading program screenshots:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.churchId])

  if (loading) {
    return (
      <Card className="relative overflow-hidden border-0 shadow-lg">
        <div className="h-96 flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-indigo-50">
          <div className="flex flex-col items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="w-8 h-8 text-primary-600" />
            </motion.div>
            <span className="text-neutral-500 font-medium">Cargando previsualizaciones...</span>
          </div>
        </div>
      </Card>
    )
  }

  if (programs.length === 0) {
    return (
      <Card className="relative overflow-hidden border-0 shadow-lg">
        <div className="p-8 bg-gradient-to-br from-neutral-50 via-white to-neutral-50">
          <div className="flex flex-col items-center gap-4 text-neutral-400">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 opacity-40" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-primary-600" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-neutral-600">No hay capturas disponibles</p>
              <p className="text-sm text-neutral-400 mt-1">Las capturas aparecerán automáticamente cuando publiques programas</p>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="relative overflow-hidden border-0 shadow-lg">
      {/* Header */}
      <div className="px-6 py-5 border-b border-neutral-100 bg-gradient-to-r from-white via-primary-50/30 to-indigo-50/40">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md"
          >
            <Eye className="w-5 h-5 text-white" />
          </motion.div>
          <div>
            <h3 className="font-bold text-neutral-900 text-lg">Programas Publicados</h3>
            <p className="text-sm text-neutral-500">Previsualización de programas recientes</p>
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="p-6 bg-gradient-to-br from-white via-neutral-50/50 to-neutral-100/30">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((program, index) => {
            const date = safeDateParse(program.programDate)
            const screenshotFullUrl = program.screenshotUrl?.startsWith('http')
              ? program.screenshotUrl
              : `${apiBaseUrl}${program.screenshotUrl}`

            return (
              <motion.div
                key={program._id}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group"
              >
                <Card className="overflow-hidden border border-neutral-200 hover:border-primary-300 transition-all duration-300 hover:shadow-xl">
                  {/* Screenshot Image */}
                  <div className="relative aspect-[3/4] bg-neutral-100 overflow-hidden">
                    {program.screenshotUrl ? (
                      <>
                        <img
                          src={screenshotFullUrl}
                          alt={`Preview de ${program.activityType.name}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                          onError={(e) => {
                            // Fallback si la imagen no carga
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent) {
                              parent.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
                                  <div class="text-center text-neutral-400">
                                    <svg class="w-12 h-12 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                    <p class="text-sm">Imagen no disponible</p>
                                  </div>
                                </div>
                              `
                            }
                          }}
                        />
                        {/* Overlay gradient on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
                        <ImageIcon className="w-12 h-12 text-neutral-300" />
                      </div>
                    )}

                    {/* Status badge */}
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-emerald-500/90 text-white border-0 shadow-lg backdrop-blur-sm">
                        Publicado
                      </Badge>
                    </div>
                  </div>

                  {/* Card info */}
                  <div className="p-4 bg-white">
                    <h4 className="font-bold text-neutral-900 mb-2 line-clamp-1">
                      {program.activityType.name}
                    </h4>
                    {program.churchName && (
                      <p className="text-sm text-neutral-600 mb-2 line-clamp-1">
                        {program.churchName}
                      </p>
                    )}
                    {program.subtitle && (
                      <p className="text-xs text-neutral-500 mb-2 line-clamp-1">
                        {program.subtitle}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {date ? format(date, "EEEE, d 'de' MMMM yyyy", { locale: es }) : 'Fecha no disponible'}
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
