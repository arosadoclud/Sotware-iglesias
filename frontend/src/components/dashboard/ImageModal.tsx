import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Calendar,
  MapPin,
  Clock,
  Users,
  Share2,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  slide: {
    id: string
    url: string
    title: string
    description?: string
    type: 'event' | 'flyer' | 'announcement'
    date?: string
    time?: string
    location?: string
    attendees?: number
  }
  onPrev?: () => void
  onNext?: () => void
  onShare?: (platform: string) => void
}

const TYPE_STYLES = {
  event: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    label: 'Evento',
  },
  flyer: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    label: 'Anuncio',
  },
  announcement: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    label: 'Información',
  },
}

export default function ImageModal({
  isOpen,
  onClose,
  slide,
  onPrev,
  onNext,
  onShare,
}: ImageModalProps) {
  if (!isOpen) return null

  const style = TYPE_STYLES[slide.type]

  const handleShare = (platform: string) => {
    const url = window.location.href
    const text = `${slide.title} - ${slide.description || ''}`

    const shareUrls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    }

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400')
    }

    onShare?.(platform)
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(slide.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${slide.title.replace(/\s+/g, '-').toLowerCase()}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading image:', error)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          {/* Contenido del modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className="relative max-w-6xl w-full max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 to-transparent p-4">
              <div className="flex items-center justify-between">
                <Badge className={`${style.bg} ${style.text} border ${style.border}`}>
                  {style.label}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Controles de navegación */}
            {onPrev && (
              <motion.button
                whileHover={{ scale: 1.1, x: -4 }}
                whileTap={{ scale: 0.9 }}
                onClick={onPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/90 hover:bg-white shadow-lg backdrop-blur-sm"
              >
                <ChevronLeft className="w-6 h-6 text-neutral-900" />
              </motion.button>
            )}
            {onNext && (
              <motion.button
                whileHover={{ scale: 1.1, x: 4 }}
                whileTap={{ scale: 0.9 }}
                onClick={onNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/90 hover:bg-white shadow-lg backdrop-blur-sm"
              >
                <ChevronRight className="w-6 h-6 text-neutral-900" />
              </motion.button>
            )}

            {/* Imagen */}
            <div className="relative">
              <img
                src={slide.url}
                alt={slide.title}
               className="w-full h-auto max-h-[60vh] object-contain bg-neutral-900"
              />
            </div>

            {/* Información */}
            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">{slide.title}</h2>
                {slide.description && (
                  <p className="text-neutral-600">{slide.description}</p>
                )}
              </div>

              {/* Detalles del evento */}
              {(slide.date || slide.time || slide.location || slide.attendees) && (
                <div className="flex flex-wrap gap-3">
                  {slide.date && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 rounded-lg">
                      <Calendar className="w-4 h-4 text-neutral-600" />
                      <span className="text-sm font-medium text-neutral-700">{slide.date}</span>
                    </div>
                  )}
                  {slide.time && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 rounded-lg">
                      <Clock className="w-4 h-4 text-neutral-600" />
                      <span className="text-sm font-medium text-neutral-700">{slide.time}</span>
                    </div>
                  )}
                  {slide.location && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 rounded-lg">
                      <MapPin className="w-4 h-4 text-neutral-600" />
                      <span className="text-sm font-medium text-neutral-700">{slide.location}</span>
                    </div>
                  )}
                  {slide.attendees && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 rounded-lg">
                      <Users className="w-4 h-4 text-neutral-600" />
                      <span className="text-sm font-medium text-neutral-700">
                        {slide.attendees} asistentes
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Acciones */}
              <div className="flex  flex-wrap gap-3 pt-4 border-t border-neutral-200">
                {/* Botones de compartir */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('facebook')}
                    className="gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Facebook
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('whatsapp')}
                    className="gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare('twitter')}
                    className="gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Twitter
                  </Button>
                </div>

                {/* Botón de descarga */}
                <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2 ml-auto">
                  <Download className="w-4 h-4" />
                  Descargar
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
