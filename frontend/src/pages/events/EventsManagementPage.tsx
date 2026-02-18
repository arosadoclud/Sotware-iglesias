import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Calendar,
  MapPin,
  Clock,
  Users,
  Loader2,
  Search,
  Filter,
  Upload,
  X,
  Save,
  Eye,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { eventsApi } from '../../lib/api'
import { toast } from 'sonner'
import { useAuthStore } from '../../store/authStore'

interface Event {
  _id: string
  title: string
  description?: string
  imageUrl: string
  type: 'event' | 'flyer' | 'announcement'
  date?: string
  time?: string
  location?: string
  attendees?: number
  isActive: boolean
  order: number
}

const TYPE_OPTIONS = [
  { value: 'event', label: 'Evento', color: 'purple' },
  { value: 'flyer', label: 'Anuncio', color: 'blue' },
  { value: 'announcement', label: 'Información', color: 'amber' },
]

export default function EventsManagementPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'event' | 'flyer' | 'announcement'>('all')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const { user } = useAuthStore()

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'event' as 'event' | 'flyer' | 'announcement',
    date: '',
    time: '',
    location: '',
    attendees: '',
    imageUrl: '',
    isActive: true,
    order: 0,
  })

  // Load events
  useEffect(() => {
    loadEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, user?.churchId])

  const loadEvents = async () => {
    setLoading(true)
    try {
      const params: any = {
        isActive: 'all',
        limit: 100,
        sort: '-order',
      }
      if (filterType !== 'all') {
        params.type = filterType
      }
      if (user?.churchId) {
        params.church = user.churchId
      }

      const res = await eventsApi.getAll(params)
      const data = res.data.data || res.data || []
      setEvents(data)
    } catch (error) {
      console.error('Error loading events:', error)
      toast.error('Error al cargar los eventos')
    }
    setLoading(false)
  }

  const handleOpenDialog = (event?: Event) => {
    if (event) {
      setEditingEvent(event)
      setFormData({
        title: event.title,
        description: event.description || '',
        type: event.type,
        date: event.date || '',
        time: event.time || '',
        location: event.location || '',
        attendees: event.attendees?.toString() || '',
        imageUrl: event.imageUrl,
        isActive: event.isActive,
        order: event.order,
      })
      setImagePreview(event.imageUrl)
    } else {
      setEditingEvent(null)
      setFormData({
        title: '',
        description: '',
        type: 'event',
        date: '',
        time: '',
        location: '',
        attendees: '',
        imageUrl: '',
        isActive: true,
        order: events.length,
      })
      setImagePreview(null)
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingEvent(null)
    setImagePreview(null)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen')
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 10MB')
      return
    }

    setUploadingImage(true)
    try {
      const uploadRes = await eventsApi.uploadImage(file)
      const imageUrl = uploadRes.data.data.url
      setFormData(prev => ({ ...prev, imageUrl }))
      setImagePreview(imageUrl)
      toast.success('Imagen subida exitosamente')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Error al subir la imagen')
    }
    setUploadingImage(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.title.trim()) {
      toast.error('El título es requerido')
      return
    }
    if (!formData.imageUrl) {
      toast.error('Debes subir una imagen')
      return
    }

    try {
      const payload = {
        ...formData,
        attendees: formData.attendees ? parseInt(formData.attendees) : undefined,
      }

      if (editingEvent) {
        await eventsApi.update(editingEvent._id, payload)
        toast.success('Evento actualizado exitosamente')
      } else {
        await eventsApi.create(payload)
        toast.success('Evento creado exitosamente')
      }

      handleCloseDialog()
      loadEvents()
    } catch (error: any) {
      console.error('Error saving event:', error)
      toast.error(error.response?.data?.message || 'Error al guardar el evento')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este evento?')) return

    try {
      await eventsApi.delete(id)
      toast.success('Evento eliminado exitosamente')
      loadEvents()
    } catch (error) {
      console.error('Error deleting event:', error)
      toast.error('Error al eliminar el evento')
    }
  }

  const handleToggleActive = async (event: Event) => {
    try {
      await eventsApi.update(event._id, { isActive: !event.isActive })
      toast.success(event.isActive ? 'Evento desactivado' : 'Evento activado')
      loadEvents()
    } catch (error) {
      console.error('Error toggling active:', error)
      toast.error('Error al cambiar el estado')
    }
  }

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
              Gestión de Eventos
            </h1>
            <p className="text-neutral-600 mt-1">
              Administra los eventos, anuncios e información mostrados en el dashboard
            </p>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Evento
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <Input
                  placeholder="Buscar por título..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-5 h-5 text-neutral-500" />
                <div className="flex gap-2 flex-wrap">
                  {['all', 'event', 'flyer', 'announcement'].map((type) => (
                    <Button
                      key={type}
                      size="sm"
                      variant={filterType === type ? 'default' : 'outline'}
                      onClick={() => setFilterType(type as any)}
                    >
                      {type === 'all' ? 'Todos' : TYPE_OPTIONS.find(t => t.value === type)?.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Events Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="py-20">
            <div className="text-center">
              <ImageIcon className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
              <h3 className="text-xl font-semibold text-neutral-700 mb-2">No hay eventos</h3>
              <p className="text-neutral-500 mb-6">
                {searchTerm
                  ? 'No se encontraron eventos con ese término'
                  : 'Comienza creando tu primer evento'}
              </p>
              {!searchTerm && (
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="w-5 h-5 mr-2" />
                  Crear Evento
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredEvents.map((event, idx) => (
              <motion.div
                key={event._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
                  <div className="relative h-48 overflow-hidden bg-neutral-900">
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      <Badge
                        variant={event.isActive ? 'default' : 'secondary'}
                        className={event.isActive ? 'bg-green-500' : 'bg-neutral-500'}
                      >
                        {event.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>

                    {/* Type Badge */}
                    <div className="absolute top-3 right-3">
                      <Badge className={`bg-${TYPE_OPTIONS.find(t => t.value === event.type)?.color}-500`}>
                        {TYPE_OPTIONS.find(t => t.value === event.type)?.label}
                      </Badge>
                    </div>

                    {/* Quick Actions - visible on mobile, hover on desktop */}
                    <div className="absolute bottom-3 right-3 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleToggleActive(event)}
                        className="backdrop-blur-md bg-white/20 hover:bg-white/30"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleOpenDialog(event)}
                        className="backdrop-blur-md bg-white/20 hover:bg-white/30"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(event._id)}
                        className="backdrop-blur-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg text-neutral-900 mb-2 line-clamp-2">
                      {event.title}
                    </h3>
                    {event.description && (
                      <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
                        {event.description}
                      </p>
                    )}
                    <div className="space-y-2 text-sm text-neutral-600">
                      {event.date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-neutral-400" />
                          <span>{event.date}</span>
                        </div>
                      )}
                      {event.time && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-neutral-400" />
                          <span>{event.time}</span>
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-neutral-400" />
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                      )}
                      {event.attendees && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-neutral-400" />
                          <span>{event.attendees} asistentes</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingEvent ? 'Editar Evento' : 'Crear Nuevo Evento'}
            </DialogTitle>
            <DialogDescription>
              Completa la información del evento. Los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="image" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Imagen del Evento *
              </Label>
              <div className="flex flex-col gap-4">
                {imagePreview ? (
                  <div className="relative group">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-lg border-2 border-neutral-200"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setImagePreview(null)
                        setFormData(prev => ({ ...prev, imageUrl: '' }))
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
                    <Upload className="w-12 h-12 mx-auto text-neutral-400 mb-3" />
                    <p className="text-sm text-neutral-600 mb-2">
                      Arrastra una imagen o haz clic para seleccionar
                    </p>
                    <p className="text-xs text-neutral-500 mb-4">
                      PNG, JPG, GIF, WEBP hasta 10MB
                    </p>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploadingImage}
                      onClick={() => document.getElementById('image')?.click()}
                    >
                      {uploadingImage ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Seleccionar Imagen
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                placeholder="Ej: Culto de Adoración Dominical"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Describe el evento..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date, Time in row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="text"
                  placeholder="Ej: 18 de Febrero, 2026"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Hora</Label>
                <Input
                  id="time"
                  type="text"
                  placeholder="Ej: 10:00 AM"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Ubicación</Label>
              <Input
                id="location"
                placeholder="Ej: Templo Principal"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>

            {/* Attendees */}
            <div className="space-y-2">
              <Label htmlFor="attendees">Asistentes Esperados</Label>
              <Input
                id="attendees"
                type="number"
                placeholder="Ej: 250"
                value={formData.attendees}
                onChange={(e) => setFormData(prev => ({ ...prev, attendees: e.target.value }))}
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-lg">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
              />
              <Label htmlFor="isActive" className="cursor-pointer flex-1">
                <div className="font-semibold text-neutral-900">Evento Activo</div>
                <div className="text-sm text-neutral-600">
                  Los eventos activos se mostrarán en el slider del dashboard
                </div>
              </Label>
            </div>
          </form>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {editingEvent ? 'Guardar Cambios' : 'Crear Evento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
