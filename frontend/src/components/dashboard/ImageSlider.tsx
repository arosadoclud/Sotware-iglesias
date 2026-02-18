import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Maximize2,
  Calendar,
  MapPin,
  Clock,
  Users,
  Sparkles,
  Image as ImageIcon,
  ExternalLink,
  Filter,
  Loader2,
} from 'lucide-react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { eventsApi } from '../../lib/api'
import ImageModal from './ImageModal'
import { toast } from 'sonner'
import { useAuthStore } from '../../store/authStore'

interface ImageSlide {
  id: string
  url: string
  title: string
  description?: string
  type: 'event' | 'flyer' | 'announcement'
  date?: string
  location?: string
  time?: string
  attendees?: number
}

// Imágenes placeholder de ejemplo
const DEMO_SLIDES: ImageSlide[] = [
  {
    id: '1',
    url: 'https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1200&q=80',
    title: 'Culto de Adoración Dominical',
    description: 'Únete a nosotros este domingo para un tiempo de alabanza y adoración',
    type: 'event',
    date: '18 de Febrero, 2026',
    location: 'Templo Principal',
    time: '10:00 AM',
    attendees: 250,
  },
  {
    id: '2',
    url: 'https://images.unsplash.com/photo-1510133744874-a58952684bc3?auto=format&fit=crop&w=1200&q=80',
    title: 'Retiro de Jóvenes 2026',
    description: 'Un fin de semana de comunión, crecimiento espiritual y diversión',
    type: 'event',
    date: '25-27 de Febrero',
    location: 'Centro de Retiros Emanuel',
    time: 'Viernes 6:00 PM',
    attendees: 120,
  },
  {
    id: '3',
    url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
    title: 'Conferencia de Matrimonios',
    description: 'Fortaleciendo los lazos del amor cristiano en el matrimonio',
    type: 'flyer',
    date: '15 de Marzo, 2026',
    location: 'Salón de Conferencias',
    time: '7:00 PM',
    attendees: 80,
  },
  {
    id: '4',
    url: 'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?auto=format&fit=crop&w=1200&q=80',
    title: 'Escuela Bíblica Dominical',
    description: 'Estudio profundo de la Palabra para todas las edades',
    type: 'announcement',
    date: 'Todos los Domingos',
    location: 'Aulas de Enseñanza',
    time: '9:00 AM',
    attendees: 180,
  },
  {
    id: '5',
    url: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1200&q=80',
    title: 'Concierto de Alabanza',
    description: 'Noche especial de adoración con invitados especiales',
    type: 'event',
    date: '5 de Marzo, 2026',
    location: 'Templo Principal',
    time: '7:30 PM',
    attendees: 300,
  },
]

const TYPE_STYLES = {
  event: {
    gradient: 'from-purple-500 via-pink-500 to-red-500',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    label: 'Evento',
  },
  flyer: {
    gradient: 'from-blue-500 via-cyan-500 to-teal-500',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    label: 'Anuncio',
  },
  announcement: {
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    label: 'Información',
  },
}

export default function ImageSlider() {
  const [slides, setSlides] = useState<ImageSlide[]>([])
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(0)
  const [isAutoPlay, setIsAutoPlay] = useState(true)
  const [direction, setDirection] = useState(0)
  const [selectedType, setSelectedType] = useState<'all' | 'event' | 'flyer' | 'announcement'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { user } = useAuthStore()

  // Cargar eventos desde la API
  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true)
      try {
        const params: any = {
          type: selectedType === 'all' ? undefined : selectedType,
          isActive: 'true',
          limit: 20,
          sort: '-order',
        }
        
        // Incluir churchId si el usuario está autenticado
        if (user?.churchId) {
          params.church = user.churchId
        }
        
        const res = await eventsApi.getAll(params)
        const events = res.data.data || res.data || []
        
        // Si no hay eventos de la API, usar demos como fallback
        if (events.length === 0) {
          setSlides(DEMO_SLIDES)
        } else {
          // Mapear eventos de la API al formato del slider
          const mappedEvents = events.map((e: any) => ({
            id: e._id || e.id,
            url: e.imageUrl,
            title: e.title,
            description: e.description,
            type: e.type,
            date: e.date,
            time: e.time,
            location: e.location,
            attendees: e.attendees,
          }))
          setSlides(mappedEvents)
        }
      } catch (error) {
        console.error('Error loading events:', error)
        // Usar demos como fallback en caso de error
        setSlides(DEMO_SLIDES)
        toast.error('No se pudieron cargar los eventos')
      }
      setLoading(false)
    }
    loadEvents()
  }, [selectedType, user?.churchId])

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (isAutoPlay && slides.length > 1) {
      timerRef.current = setInterval(() => {
        setDirection(1)
        setCurrent(prev => (prev + 1) % slides.length)
      }, 6000)
    }
  }, [isAutoPlay, slides.length])

  useEffect(() => {
    if (slides.length > 1) resetTimer()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [slides.length, resetTimer])

  const goTo = (idx: number) => {
    setDirection(idx > current ? 1 : -1)
    setCurrent(idx)
    resetTimer()
  }

  const prev = () => {
    setDirection(-1)
    setCurrent((current - 1 + slides.length) % slides.length)
    resetTimer()
  }

  const next = () => {
    setDirection(1)
    setCurrent((current + 1) % slides.length)
    resetTimer()
  }

  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 50
    if (info.offset.x > threshold) {
      prev()
    } else if (info.offset.x < -threshold) {
      next()
    }
  }

  if (slides.length === 0 && !loading) {
    return (
      <Card className="relative overflow-hidden border-0 shadow-xl">
        <div className="h-[420px] flex items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-neutral-50">
          <div className="flex flex-col items-center gap-4 text-neutral-400">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-neutral-100 flex items-center justify-center">
                <ImageIcon className="w-10 h-10 opacity-40" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-primary-600" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-neutral-600">No hay eventos publicados</p>
              <p className="text-sm text-neutral-400 mt-1">Los eventos aparecerán aquí cuando sean creados</p>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  const openModal = () => setIsModalOpen(true)
  const closeModal = () => setIsModalOpen(false)

  const handleModalPrev = () => {
    prev()
    // No cerrar el modal, solo cambiar slide
  }

  const handleModalNext = () => {
    next()
    // No cerrar el modal, solo cambiar slide
  }

  // Loading state
  if (loading) {
    return (
      <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/50">
        <div className="flex items-center justify-center h-[500px]">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary-500" />
            <p className="text-neutral-500 font-medium">Cargando eventos...</p>
          </div>
        </div>
      </Card>
    )
  }

  // Empty state
  if (slides.length === 0) {
    return (
      <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/50">
        <div className="flex items-center justify-center h-[500px]">
          <div className="text-center space-y-4">
            <ImageIcon className="w-16 h-16 mx-auto text-neutral-300" />
            <div>
              <p className="text-neutral-700 font-semibold text-lg">No hay eventos disponibles</p>
              <p className="text-neutral-500 text-sm">Los eventos aparecerán aquí cuando se creen</p>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  const slide = slides[current]
  const style = TYPE_STYLES[slide.type]

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.9,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.9,
    }),
  }

  return (
    <div
      className="relative group"
      onMouseEnter={() => setIsAutoPlay(false)}
      onMouseLeave={() => setIsAutoPlay(true)}
    >
      <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/50">
        {/* Efectos decorativos de fondo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              rotate: [0, 180, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-purple-200/20 via-transparent to-pink-200/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, -180, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-blue-200/20 via-transparent to-cyan-200/20 rounded-full blur-3xl"
          />
        </div>

        {/* Header con controles */}
        <div className="relative px-4 sm:px-6 py-3 sm:py-5 border-b border-white/50 backdrop-blur-sm bg-white/40">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.5 }}
                className={`w-8 h-8 sm:w-11 sm:h-11 bg-gradient-to-br ${style.gradient} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}
              >
                <ImageIcon className="w-4 h-4 sm:w-6 sm:h-6 text-white drop-shadow-lg" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-neutral-900 text-base sm:text-lg flex items-center gap-2">
                  <span className="hidden sm:inline">Galería de Eventos</span>
                  <span className="sm:hidden">Eventos</span>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="hidden sm:block"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </motion.div>
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500 truncate">
                  {slides.length} imagen{slides.length !== 1 ? 'es' : ''}
                  <span className="hidden sm:inline"> • {selectedType === 'all' ? 'Todos los tipos' : TYPE_STYLES[selectedType].label}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
              {/* Filtros - Solo desktop */}
              <div className="hidden lg:flex items-center gap-2">
                <Filter className="w-4 h-4 text-neutral-500" />
                {(['all', 'event', 'flyer', 'announcement'] as const).map((type) => (
                  <motion.button
                    key={type}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedType(type)
                      setCurrent(0)
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      selectedType === type
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'bg-white/60 text-neutral-600 hover:bg-white/80'
                    }`}
                  >
                    {type === 'all' ? 'Todos' : TYPE_STYLES[type].label}
                  </motion.button>
                ))}
              </div>

              {/* Play/Pause - Solo tablet+ */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsAutoPlay(!isAutoPlay)}
                className="hidden sm:flex p-2 rounded-lg bg-white/60 hover:bg-white/80 backdrop-blur-sm border border-neutral-200/50 transition-all shadow-sm"
              >
                {isAutoPlay ? (
                  <Pause className="w-4 h-4 text-neutral-600" />
                ) : (
                  <Play className="w-4 h-4 text-neutral-600" />
                )}
              </motion.button>

              {/* Fullscreen/Modal */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={openModal}
                className="p-1.5 sm:p-2 rounded-lg bg-white/60 hover:bg-white/80 backdrop-blur-sm border border-neutral-200/50 transition-all shadow-sm"
              >
                <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-600" />
              </motion.button>

              {/* Navigation arrows - Solo desktop */}
              {slides.length > 1 && (
                <div className="hidden md:flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1, x: -2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={prev}
                    className="p-2 rounded-lg bg-white/60 hover:bg-white/80 backdrop-blur-sm border border-neutral-200/50 transition-all shadow-sm"
                  >
                    <ChevronLeft className="w-5 h-5 text-neutral-700" />
                  </motion.button>
                  <span className="text-sm font-bold text-neutral-700 min-w-[3.5rem] text-center tabular-nums">
                    {current + 1} / {slides.length}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.1, x: 2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={next}
                    className="p-2 rounded-lg bg-white/60 hover:bg-white/80 backdrop-blur-sm border border-neutral-200/50 transition-all shadow-sm"
                  >
                    <ChevronRight className="w-5 h-5 text-neutral-700" />
                  </motion.button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Slider content */}
        <div className="relative" style={{ perspective: '1500px' }}>
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={slide.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.3 },
                scale: { duration: 0.3 },
              }}
              drag={slides.length > 1 ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className="cursor-grab active:cursor-grabbing"
            >
              <div className="relative">
                {/* Imagen principal */}
                <div className="relative h-[320px] sm:h-[400px] md:h-[450px] lg:h-[500px] overflow-hidden bg-neutral-900">
                  <motion.img
                    src={slide.url}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.6 }}
                  />
                  {/* Overlay gradiente */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  
                  {/* Badge de tipo */}
                  <div className="absolute top-4 left-4">
                    <Badge className={`${style.bg} ${style.text} border ${style.border} text-sm font-bold px-4 py-2 shadow-lg backdrop-blur-sm`}>
                      {style.label}
                    </Badge>
                  </div>

                  {/* Información sobre la imagen */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-3 drop-shadow-2xl line-clamp-2">
                        {slide.title}
                      </h2>
                      {slide.description && (
                        <p className="hidden sm:block text-base sm:text-lg md:text-xl text-white/90 mb-3 sm:mb-4 max-w-3xl drop-shadow-lg line-clamp-2">
                          {slide.description}
                        </p>
                      )}
                      
                      {/* Info cards */}
                      <div className="flex flex-wrap gap-2 sm:gap-3 mb-3 sm:mb-4">
                        {slide.date && (
                          <motion.div
                            whileHover={{ scale: 1.05, y: -2 }}
                            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-white/20 backdrop-blur-md rounded-lg border border-white/30"
                          >
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-white flex-shrink-0" />
                            <span className="text-xs sm:text-sm font-semibold text-white whitespace-nowrap">{slide.date}</span>
                          </motion.div>
                        )}
                        {slide.time && (
                          <motion.div
                            whileHover={{ scale: 1.05, y: -2 }}
                            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-white/20 backdrop-blur-md rounded-lg border border-white/30"
                          >
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-white flex-shrink-0" />
                            <span className="text-xs sm:text-sm font-semibold text-white whitespace-nowrap">{slide.time}</span>
                          </motion.div>
                        )}
                        {slide.location && (
                          <motion.div
                            whileHover={{ scale: 1.05, y: -2 }}
                            className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-lg border border-white/30"
                          >
                            <MapPin className="w-4 h-4 text-white flex-shrink-0" />
                            <span className="text-sm font-semibold text-white truncate max-w-[200px]">{slide.location}</span>
                          </motion.div>
                        )}
                        {slide.attendees && (
                          <motion.div
                            whileHover={{ scale: 1.05, y: -2 }}
                            className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-lg border border-white/30"
                          >
                            <Users className="w-4 h-4 text-white flex-shrink-0" />
                            <span className="text-sm font-semibold text-white whitespace-nowrap">{slide.attendees} asistentes</span>
                          </motion.div>
                        )}
                      </div>

                      {/* CTA Button */}
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="hidden sm:block">
                        <Button className={`bg-gradient-to-r ${style.gradient} text-white border-0 shadow-xl hover:shadow-2xl transition-all px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold`}>
                          <span className="hidden sm:inline">Más información</span>
                          <span className="sm:hidden">Info</span>
                          <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1.5 sm:ml-2" />
                        </Button>
                      </motion.div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots indicadores */}
        {slides.length > 1 && (
          <div className="relative px-6 py-5">
            <div className="flex justify-center items-center gap-2">
              {slides.map((_, i) => {
                const s = TYPE_STYLES[slides[i].type]
                return (
                  <motion.button
                    key={i}
                    onClick={() => goTo(i)}
                    whileHover={{ scale: 1.3 }}
                    whileTap={{ scale: 0.9 }}
                    className="relative group"
                  >
                    <div
                      className={`transition-all duration-300 rounded-full ${
                        i === current ? 'w-12 h-3' : 'w-3 h-3 hover:w-5'
                      }`}
                    >
                      <div
                        className={`w-full h-full rounded-full transition-all ${
                          i === current
                            ? `bg-gradient-to-r ${s.gradient} shadow-lg`
                            : 'bg-neutral-300 group-hover:bg-neutral-400'
                        }`}
                      />
                    </div>
                    {i === current && isAutoPlay && (
                      <motion.div
                        className={`absolute inset-0 rounded-full bg-gradient-to-r ${s.gradient}`}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 6, ease: 'linear' }}
                        style={{ transformOrigin: 'left' }}
                      />
                    )}
                  </motion.button>
                )
              })}
            </div>
          </div>
        )}

        {/* Thumbnails preview */}
        <div className="hidden lg:block relative px-6 pb-6">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent">
            {slides.map((s, i) => {
              const st = TYPE_STYLES[s.type]
              return (
                <motion.button
                  key={s.id}
                  onClick={() => goTo(i)}
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex-shrink-0 w-40 rounded-xl overflow-hidden border-2 transition-all ${
                    i === current
                      ? `border-${st.gradient.split(' ')[0].replace('from-', '')} shadow-lg`
                      : 'border-transparent hover:border-neutral-300 hover:shadow-md'
                  }`}
                >
                  <div className="relative h-24 bg-neutral-900">
                    <img
                      src={s.url}
                      alt={s.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-xs font-bold text-white truncate drop-shadow-lg">
                        {s.title}
                      </p>
                    </div>
                    {i === current && (
                      <div className={`absolute top-2 right-2 w-2 h-2 rounded-full bg-gradient-to-r ${st.gradient} shadow-lg animate-pulse`} />
                    )}
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>
      </Card>

      {/* Modal de galería */}
      {slides.length > 0 && (
        <ImageModal
          isOpen={isModalOpen}
          onClose={closeModal}
          slide={slide}
          onPrev={slides.length > 1 ? handleModalPrev : undefined}
          onNext={slides.length > 1 ? handleModalNext : undefined}
          onShare={(platform) => {
            console.log('Compartiendo en:', platform)
            toast.success(`Compartido en ${platform}`)
          }}
        />
      )}
    </div>
  )
}
