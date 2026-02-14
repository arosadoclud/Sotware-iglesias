import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  FileText,
  Loader2,
  Trash2,
  Pencil,
  Eye,
  Copy,
  Search,
  Calendar,
  User,
  Tag,
  Save,
  Send,
  Download,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { lettersApi, personsApi } from '@/lib/api'
import { toast } from 'sonner'

interface LetterTemplate {
  _id: string
  name: string
  category: string
  content: string
  variables: string[]
  createdBy: { id: string; name: string }
  createdAt: string
  updatedAt: string
}

interface GeneratedLetter {
  _id: string
  templateName: string
  personName?: string
  recipientName?: string
  finalContent: string
  variablesUsed?: Record<string, string>
  generatedBy: { id: string; name: string }
  createdAt: string
}

const CATEGORIES = [
  'General',
  'Invitación',
  'Invitación Individual',
  'Certificado',
  'Constancia',
  'Agradecimiento',
  'Recomendación',
  'Bautismo',
  'Membresía',
]

const AVAILABLE_VARIABLES = [
  // Datos de MI IGLESIA
  { key: 'nombre_iglesia', label: 'Mi Iglesia', desc: 'Nombre de mi iglesia (remitente)' },
  { key: 'direccion_iglesia', label: 'Dirección', desc: 'Dirección de mi iglesia' },
  { key: 'telefono_iglesia', label: 'Teléfono', desc: 'Teléfono de mi iglesia' },
  { key: 'nombre_pastor', label: 'Mi Pastor/a', desc: 'Nombre del pastor/a que firma' },
  { key: 'titulo_pastor', label: 'Título', desc: 'Título del pastor (Pastor, Pastora, Rev.)' },
  // Datos del DESTINATARIO (iglesia o institución)
  { key: 'iglesia_destinatario', label: 'Iglesia Dest.', desc: 'Nombre de la iglesia destinataria' },
  { key: 'pastor_destinatario', label: 'Pastor Dest.', desc: 'Pastor/a de la iglesia destinataria' },
  { key: 'institucion_destino', label: 'Institución', desc: 'Nombre de la institución destino' },
  // Datos del EVENTO
  { key: 'tipo_evento', label: 'Tipo Evento', desc: 'Tipo de evento (culto de Jóvenes, congreso, etc.)' },
  { key: 'dia_actividad', label: 'Día', desc: 'Día de la semana (viernes, sábado, etc.)' },
  { key: 'fecha_actividad', label: 'Fecha', desc: 'Fecha del evento (14 de abril del 2023)' },
  { key: 'tema_evento', label: 'Tema', desc: 'Tema del evento entre comillas' },
  { key: 'hora_actividad', label: 'Hora', desc: 'Hora del evento (7:00 P.M.)' },
  // Datos para RECOMENDACIÓN
  { key: 'fecha_carta', label: 'Fecha Carta', desc: 'Fecha de la carta' },
  { key: 'nombre_persona', label: 'Nombre Persona', desc: 'Nombre de la persona recomendada' },
  { key: 'titulo_persona', label: 'Título Persona', desc: 'Hno., Hna., Lic., etc.' },
  { key: 'años_conocido', label: 'Años', desc: 'Tiempo que conoce a la persona' },
  { key: 'proposito', label: 'Propósito', desc: 'Propósito de la recomendación' },
]

// Plantilla de invitación a IGLESIAS (con destinatario específico)
const DEFAULT_INVITATION_TEMPLATE = `Iglesia: {{iglesia_destinatario}}
Pastor/a/es: {{pastor_destinatario}}

Que la paz y el amor de nuestro Señor Jesús esté con cada uno ustedes y en su congregación.

Después de darle un cordial saludo, la iglesia {{nombre_iglesia}} tiene el honor de invitarles a ser partes de su gran {{tipo_evento}}, que estaremos efectuando el {{dia_actividad}} {{fecha_actividad}} con el tema "{{tema_evento}}", a partir de las {{hora_actividad}}, donde estaremos adorando a nuestro Padre celestial unánimes, contamos con su apoyo.

De antemano le damos las gracias por su apoyo, que la paz del Dios todo poderoso inunde sus vidas.


_______________________________
{{nombre_pastor}}
{{titulo_pastor}}`

// Plantilla de invitación INDIVIDUAL (con destinatario pero formato más limpio)
const DEFAULT_INDIVIDUAL_INVITATION_TEMPLATE = `{{fecha_carta}}

Iglesia: {{iglesia_destinatario}}
Pastor/a: {{pastor_destinatario}}

Que la paz y el amor de nuestro Señor Jesús esté con cada uno ustedes y en su congregación.

Después de darle un cordial saludo, la iglesia {{nombre_iglesia}} tiene el honor de invitarles a ser partes de su gran {{tipo_evento}}, que estaremos efectuando el {{dia_actividad}} {{fecha_actividad}} con el tema "{{tema_evento}}", a partir de las {{hora_actividad}}, donde estaremos adorando a nuestro Padre celestial unánimes, contamos con su apoyo.

De antemano le damos las gracias por su apoyo, que la paz del Dios todo poderoso inunde sus vidas.


_______________________________
{{nombre_pastor}}
{{titulo_pastor}}`

// Plantilla de Carta de Recomendación
const DEFAULT_RECOMMENDATION_TEMPLATE = `{{fecha_carta}}

Dirigido a: {{institucion_destino}}
De: {{nombre_iglesia}}

Carta de Recomendación

El/la que suscribe la {{titulo_pastor}} {{nombre_pastor}}, doy constancia de que el {{titulo_persona}} {{nombre_persona}} miembro activo de la iglesia, {{nombre_iglesia}} y a quien conozco ya hace {{años_conocido}} y que ha mostrado ser un buen cristiano, además de ser una persona íntegra y respetuoso(a); por tal motivo la recomendación para que {{proposito}}.

Se extiende la siguiente para usos y fines a quien interesa o a quien pueda interesar.


_______________________________
{{nombre_pastor}}
{{titulo_pastor}}`

const LetterTemplatesPage = () => {
  const [templates, setTemplates] = useState<LetterTemplate[]>([])
  const [generated, setGenerated] = useState<GeneratedLetter[]>([])
  const [persons, setPersons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  // Modal states
  const [showEditor, setShowEditor] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<LetterTemplate | null>(null)
  const [templateForm, setTemplateForm] = useState({
    name: '',
    category: 'General',
    content: '',
  })
  const [savingTemplate, setSavingTemplate] = useState(false)

  // Generate modal - formulario completo
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [generateTemplate, setGenerateTemplate] = useState<LetterTemplate | null>(null)
  const [generatePersonId, setGeneratePersonId] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generateForm, setGenerateForm] = useState({
    // Datos de MI iglesia (remitente)
    nombre_iglesia: '',
    direccion_iglesia: '',
    telefono_iglesia: '',
    nombre_pastor: '',
    titulo_pastor: 'Pastora',
    // Datos del DESTINATARIO (iglesia)
    iglesia_destinatario: '',
    pastor_destinatario: '',
    // Datos del DESTINATARIO (institución)
    institucion_destino: '',
    // Datos del EVENTO
    tipo_evento: 'culto de Jóvenes',
    dia_actividad: 'viernes',
    fecha_actividad: '',
    tema_evento: '',
    hora_actividad: '7:00 P.M.',
    // Datos para RECOMENDACIÓN
    fecha_carta: new Date().toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' }),
    nombre_persona: '',
    titulo_persona: 'Hno.',
    años_conocido: 'varios años',
    proposito: 'sea aceptado como alumno del Instituto Bíblico de las Asambleas de Dios HASHEM',
  })
  const [showLetterPreview, setShowLetterPreview] = useState(false)
  const [letterPreviewContent, setLetterPreviewContent] = useState('')
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  // Preview modal
  const [showPreview, setShowPreview] = useState(false)
  const [previewContent, setPreviewContent] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')

  // History tab
  const [activeView, setActiveView] = useState<'templates' | 'history'>('templates')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [tRes, gRes, pRes] = await Promise.all([
        lettersApi.getTemplates(),
        lettersApi.getGenerated(),
        personsApi.getAll(),
      ])
      setTemplates(tRes.data.data)
      setGenerated(gRes.data.data)
      setPersons(pRes.data.data)
    } catch {
      toast.error('Error al cargar datos')
    }
    setLoading(false)
  }

  const openEditor = (template?: LetterTemplate) => {
    if (template) {
      setEditingTemplate(template)
      setTemplateForm({
        name: template.name,
        category: template.category,
        content: typeof template.content === 'string' ? template.content : JSON.stringify(template.content),
      })
    } else {
      setEditingTemplate(null)
      setTemplateForm({ name: '', category: 'General', content: '' })
    }
    setShowEditor(true)
  }

  const saveTemplate = async () => {
    if (!templateForm.name.trim()) return toast.error('Nombre requerido')
    if (!templateForm.content.trim()) return toast.error('Contenido requerido')
    setSavingTemplate(true)
    try {
      if (editingTemplate) {
        await lettersApi.updateTemplate(editingTemplate._id, templateForm)
        toast.success('Plantilla actualizada')
      } else {
        await lettersApi.createTemplate(templateForm)
        toast.success('Plantilla creada')
      }
      setShowEditor(false)
      loadData()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al guardar')
    }
    setSavingTemplate(false)
  }

  const deleteTemplate = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar plantilla "${name}"? Esta acción no se puede deshacer.`)) return
    try {
      await lettersApi.deleteTemplate(id)
      toast.success('Plantilla eliminada')
      loadData()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const duplicateTemplate = (template: LetterTemplate) => {
    setEditingTemplate(null)
    setTemplateForm({
      name: `${template.name} (Copia)`,
      category: template.category,
      content: typeof template.content === 'string' ? template.content : JSON.stringify(template.content),
    })
    setShowEditor(true)
  }

  const openGenerateModal = (template: LetterTemplate) => {
    setGenerateTemplate(template)
    setGeneratePersonId('')
    // Resetear formulario con valores predeterminados
    setGenerateForm({
      // Datos de MI iglesia (remitente)
      nombre_iglesia: '',
      direccion_iglesia: '',
      telefono_iglesia: '',
      nombre_pastor: '',
      titulo_pastor: 'Pastora',
      // Datos del DESTINATARIO (iglesia)
      iglesia_destinatario: '',
      pastor_destinatario: '',
      // Datos del DESTINATARIO (institución)
      institucion_destino: '',
      // Datos del EVENTO
      tipo_evento: 'culto de Jóvenes',
      dia_actividad: 'viernes',
      fecha_actividad: '',
      tema_evento: '',
      hora_actividad: '7:00 P.M.',
      // Datos para RECOMENDACIÓN
      fecha_carta: new Date().toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' }),
      nombre_persona: '',
      titulo_persona: 'Hno.',
      años_conocido: 'varios años',
      proposito: 'sea aceptado como alumno del Instituto Bíblico de las Asambleas de Dios HASHEM',
    })
    setShowLetterPreview(false)
    setLetterPreviewContent('')
    setShowGenerateModal(true)
  }

  // Función para reemplazar variables en el contenido
  const replaceVariables = (content: string, formData: typeof generateForm) => {
    let result = content
    Object.entries(formData).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi')
      result = result.replace(regex, value || `{{${key}}}`)
    })
    return result
  }

  // Preview de la carta con los datos del formulario
  const previewGeneratedLetter2 = () => {
    if (!generateTemplate) return
    const content = typeof generateTemplate.content === 'string' 
      ? generateTemplate.content 
      : JSON.stringify(generateTemplate.content)
    const preview = replaceVariables(content, generateForm)
    setLetterPreviewContent(preview)
    setShowLetterPreview(true)
  }

  const generateLetter = async () => {
    if (!generateTemplate) return toast.error('Selecciona una plantilla')
    
    // Validar campos requeridos según categoría
    if (generateTemplate.category === 'Invitación' && !generateForm.iglesia_destinatario.trim()) {
      return toast.error('La iglesia destinataria es requerida')
    }
    if (generateTemplate.category === 'Recomendación' && !generateForm.nombre_persona.trim()) {
      return toast.error('El nombre de la persona es requerido')
    }
    if (generateTemplate.category === 'Invitación Individual' && !generateForm.iglesia_destinatario.trim()) {
      return toast.error('La iglesia destinataria es requerida')
    }
    
    // Determinar el nombre del destinatario para guardar
    let recipientName = 'General'
    if (generateTemplate.category === 'Recomendación') {
      recipientName = generateForm.nombre_persona
    } else if (generateTemplate.category === 'Invitación') {
      recipientName = generateForm.iglesia_destinatario || generateForm.institucion_destino
    } else if (generateTemplate.category === 'Invitación Individual') {
      recipientName = generateForm.iglesia_destinatario || generateForm.tipo_evento
    }
    
    setGenerating(true)
    try {
      const content = typeof generateTemplate.content === 'string' 
        ? generateTemplate.content 
        : JSON.stringify(generateTemplate.content)
      const finalContent = replaceVariables(content, generateForm)
      
      await lettersApi.generate({
        templateId: generateTemplate._id,
        customFields: generateForm,
        content: finalContent,
        recipientName,
      })
      toast.success('Carta generada exitosamente')
      setShowGenerateModal(false)
      loadData()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al generar')
    }
    setGenerating(false)
  }

  // Descargar carta como PDF
  const downloadLetterPdf = async () => {
    if (!letterPreviewContent) return
    
    // Determinar el nombre del destinatario para el archivo
    let recipientName = 'carta'
    if (generateTemplate?.category === 'Recomendación') {
      recipientName = generateForm.nombre_persona
    } else if (generateTemplate?.category === 'Invitación') {
      recipientName = generateForm.iglesia_destinatario || generateForm.institucion_destino || 'invitacion'
    } else if (generateTemplate?.category === 'Invitación Individual') {
      recipientName = generateForm.tipo_evento || 'invitacion-individual'
    }
    
    setDownloadingPdf(true)
    try {
      const res = await lettersApi.downloadPdf({
        content: letterPreviewContent,
        title: generateTemplate?.name || 'Carta',
        recipientName,
        // Datos adicionales para el encabezado y firma
        churchData: {
          nombre: generateForm.nombre_iglesia,
          direccion: generateForm.direccion_iglesia,
          telefono: generateForm.telefono_iglesia,
          pastor: generateForm.nombre_pastor,
          tituloPastor: generateForm.titulo_pastor,
        },
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `carta-${recipientName?.replace(/\s+/g, '-') || 'documento'}-${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('PDF descargado')
    } catch (e: any) {
      toast.error('Error al generar PDF')
    }
    setDownloadingPdf(false)
  }

  const previewTemplate = (template: LetterTemplate) => {
    const content = typeof template.content === 'string' ? template.content : JSON.stringify(template.content, null, 2)
    setPreviewContent(content)
    setPreviewTitle(template.name)
    setShowPreview(true)
  }

  const previewGeneratedLetter = (letter: GeneratedLetter) => {
    setPreviewContent(letter.finalContent)
    setPreviewTitle(`${letter.templateName} - ${letter.personName || letter.recipientName || 'Destinatario'}`)
    setShowPreview(true)
  }

  const insertVariable = (varKey: string) => {
    setTemplateForm((prev) => ({
      ...prev,
      content: prev.content + `{{${varKey}}}`,
    }))
  }

  // Filtered templates
  const filteredTemplates = templates.filter((t) => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = !filterCategory || t.category === filterCategory
    return matchSearch && matchCategory
  })

  const uniqueCategories = [...new Set(templates.map((t) => t.category))]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        <p className="text-sm text-neutral-500">Cargando plantillas...</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Plantillas de Cartas</h1>
          <p className="text-neutral-500 mt-1">
            Crea y gestiona plantillas para cartas, certificados e invitaciones
          </p>
        </div>
        <Button onClick={() => openEditor()}>
          <Plus className="w-4 h-4 mr-1.5" />
          Nueva Plantilla
        </Button>
      </div>

      {/* View Toggle */}
      <div className="flex gap-1 p-1 bg-neutral-100 rounded-xl w-fit">
        <button
          onClick={() => setActiveView('templates')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeView === 'templates'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-1.5" />
          Plantillas ({templates.length})
        </button>
        <button
          onClick={() => setActiveView('history')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeView === 'history'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-1.5" />
          Historial ({generated.length})
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'templates' ? (
          <motion.div
            key="templates"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Filters */}
            {templates.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar plantilla..."
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setFilterCategory('')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      !filterCategory
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                    }`}
                  >
                    Todas
                  </button>
                  {uniqueCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(filterCategory === cat ? '' : cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        filterCategory === cat
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Templates Grid */}
            {filteredTemplates.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="text-center py-16">
                  <FileText className="w-14 h-14 mx-auto mb-4 text-neutral-200" />
                  {templates.length === 0 ? (
                    <>
                      <h3 className="text-lg font-semibold text-neutral-700">No hay plantillas creadas</h3>
                      <p className="text-neutral-500 mt-1 max-w-md mx-auto">
                        Crea tu primera plantilla para generar cartas personalizadas con variables automáticas
                      </p>
                      <Button onClick={() => openEditor()} className="mt-5">
                        <Plus className="w-4 h-4 mr-1.5" />
                        Crear Primera Plantilla
                      </Button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-neutral-700">Sin resultados</h3>
                      <p className="text-neutral-500 mt-1">
                        No se encontraron plantillas que coincidan con tu búsqueda
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTemplates.map((template, i) => (
                  <motion.div
                    key={template._id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card className="border-0 shadow-sm hover:shadow-md transition-all group h-full flex flex-col">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 min-w-0 flex-1">
                            <CardTitle className="text-base truncate">{template.name}</CardTitle>
                            <Badge variant="secondary" className="text-[10px]">
                              <Tag className="w-3 h-3 mr-1" />
                              {template.category}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 flex-1 flex flex-col">
                        {/* Variables */}
                        {template.variables?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {template.variables.slice(0, 4).map((v) => (
                              <span
                                key={v}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-primary-50 text-primary-600 font-mono"
                              >
                                {`{{${v}}}`}
                              </span>
                            ))}
                            {template.variables.length > 4 && (
                              <span className="text-[10px] text-neutral-400">
                                +{template.variables.length - 4} más
                              </span>
                            )}
                          </div>
                        )}

                        {/* Content preview */}
                        <p className="text-xs text-neutral-400 line-clamp-2 mb-4 flex-1">
                          {typeof template.content === 'string'
                            ? template.content.replace(/\{\{[^}]+\}\}/g, '[...]').substring(0, 120)
                            : 'Contenido JSON'}
                        </p>

                        {/* Metadata */}
                        <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-3">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {template.createdBy?.name}
                          </span>
                          <span>
                            {new Date(template.createdAt).toLocaleDateString('es-DO', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1.5 pt-3 border-t border-neutral-100">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-xs"
                            onClick={() => openGenerateModal(template)}
                          >
                            <Send className="w-3 h-3 mr-1" />
                            Generar
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => previewTemplate(template)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditor(template)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => duplicateTemplate(template)}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-danger-50"
                            onClick={() => deleteTemplate(template._id, template.name)}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-danger-400" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          /* History View */
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {generated.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="text-center py-16">
                  <Calendar className="w-14 h-14 mx-auto mb-4 text-neutral-200" />
                  <h3 className="text-lg font-semibold text-neutral-700">No hay cartas generadas</h3>
                  <p className="text-neutral-500 mt-1">
                    Genera tu primera carta desde una plantilla
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
                  <div className="divide-y divide-neutral-100">
                    {generated.map((letter, i) => (
                      <motion.div
                        key={letter._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-primary-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-neutral-900 truncate">
                              {letter.templateName}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-neutral-500">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {letter.personName || letter.recipientName || 'Destinatario'}
                              </span>
                              <span>
                                {new Date(letter.createdAt).toLocaleDateString('es-DO', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => previewGeneratedLetter(letter)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Modal */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
            </DialogTitle>
            <DialogDescription>
              Usa variables entre llaves dobles para personalizar. Ej: {'{{nombre}}'}, {'{{fecha}}'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="Ej: Carta de Bienvenida"
                />
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <select
                  value={templateForm.category}
                  onChange={(e) => {
                    const category = e.target.value
                    let defaultContent = templateForm.content
                    // Auto-rellenar con plantilla por defecto según categoría
                    if (category === 'Invitación') {
                      defaultContent = DEFAULT_INVITATION_TEMPLATE
                    } else if (category === 'Invitación Individual') {
                      defaultContent = DEFAULT_INDIVIDUAL_INVITATION_TEMPLATE
                    } else if (category === 'Recomendación') {
                      defaultContent = DEFAULT_RECOMMENDATION_TEMPLATE
                    }
                    setTemplateForm({ ...templateForm, category, content: defaultContent })
                  }}
                  className="w-full h-10 rounded-md border border-neutral-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick insert variables */}
            <div className="space-y-2">
              <Label className="text-xs text-neutral-500">Variables disponibles (click para insertar)</Label>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_VARIABLES.map((v) => (
                  <button
                    key={v.key}
                    onClick={() => insertVariable(v.key)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors font-mono border border-primary-100"
                    title={v.desc}
                  >
                    {`{{${v.key}}}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Contenido *</Label>
              <textarea
                value={templateForm.content}
                onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                placeholder={`Estimado/a {{nombre}},\n\nPor medio de la presente, nos es grato comunicarle que...\n\nAtentamente,\n{{pastor}}\n{{iglesia}}`}
                className="w-full min-h-[300px] rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y font-mono leading-relaxed"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditor(false)}>
              Cancelar
            </Button>
            <Button onClick={saveTemplate} disabled={savingTemplate}>
              {savingTemplate ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {editingTemplate ? 'Guardar Cambios' : 'Crear Plantilla'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Modal */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generar Carta de Invitación</DialogTitle>
            <DialogDescription>
              Completa los datos para generar la carta con la plantilla "{generateTemplate?.name}"
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Column */}
            <div className="space-y-4">
              {/* SECCIÓN: MI IGLESIA */}
              <div className="rounded-lg border border-primary-100 bg-primary-50/30 p-4 space-y-3">
                <p className="text-xs font-semibold text-primary-700 uppercase tracking-wide">Mi Iglesia (Remitente)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nombre de la Iglesia *</Label>
                    <Input
                      value={generateForm.nombre_iglesia}
                      onChange={(e) => setGenerateForm({ ...generateForm, nombre_iglesia: e.target.value })}
                      placeholder="Ej: Iglesia Evangélica Dios Fuerte"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Dirección</Label>
                    <Input
                      value={generateForm.direccion_iglesia}
                      onChange={(e) => setGenerateForm({ ...generateForm, direccion_iglesia: e.target.value })}
                      placeholder="Ej: C/ Principal No. 168"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Teléfono</Label>
                    <Input
                      value={generateForm.telefono_iglesia}
                      onChange={(e) => setGenerateForm({ ...generateForm, telefono_iglesia: e.target.value })}
                      placeholder="849-876-7611"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Pastor/a que firma *</Label>
                    <Input
                      value={generateForm.nombre_pastor}
                      onChange={(e) => setGenerateForm({ ...generateForm, nombre_pastor: e.target.value })}
                      placeholder="Orfelina Ferreras"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Título</Label>
                    <select
                      value={generateForm.titulo_pastor}
                      onChange={(e) => setGenerateForm({ ...generateForm, titulo_pastor: e.target.value })}
                      className="w-full h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                    >
                      <option value="Pastor">Pastor</option>
                      <option value="Pastora">Pastora</option>
                      <option value="Rev.">Rev.</option>
                      <option value="Obispo">Obispo</option>
                      <option value="Apóstol">Apóstol</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECCIÓN: DESTINATARIO (para Invitaciones e Invitaciones Individuales) */}
              {['Invitación', 'Invitación Individual'].includes(generateTemplate?.category || '') && (
              <div className="rounded-lg border border-blue-100 bg-blue-50/30 p-4 space-y-3">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Iglesia Destinataria</p>
                {generateTemplate?.category === 'Invitación Individual' && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Fecha de la Carta</Label>
                  <Input
                    value={generateForm.fecha_carta}
                    onChange={(e) => setGenerateForm({ ...generateForm, fecha_carta: e.target.value })}
                    placeholder="14 de febrero de 2026"
                    className="h-9 text-sm"
                  />
                </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nombre de la Iglesia *</Label>
                    <Input
                      value={generateForm.iglesia_destinatario}
                      onChange={(e) => setGenerateForm({ ...generateForm, iglesia_destinatario: e.target.value })}
                      placeholder="Ej: Redil de amor"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Pastor/a</Label>
                    <Input
                      value={generateForm.pastor_destinatario}
                      onChange={(e) => setGenerateForm({ ...generateForm, pastor_destinatario: e.target.value })}
                      placeholder="Ej: Milcíades"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              </div>
              )}

              {/* SECCIÓN: EVENTO (para Invitaciones a Iglesias e Individuales) */}
              {['Invitación', 'Invitación Individual'].includes(generateTemplate?.category || '') && (
              <div className="rounded-lg border border-amber-100 bg-amber-50/30 p-4 space-y-3">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Datos del Evento</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tipo de Evento</Label>
                    <Input
                      value={generateForm.tipo_evento}
                      onChange={(e) => setGenerateForm({ ...generateForm, tipo_evento: e.target.value })}
                      placeholder="culto de Jóvenes"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tema del Evento</Label>
                    <Input
                      value={generateForm.tema_evento}
                      onChange={(e) => setGenerateForm({ ...generateForm, tema_evento: e.target.value })}
                      placeholder="ACTIVANDO LA GENERACIÓN DE LOS ÍNTIMOS"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Día</Label>
                    <select
                      value={generateForm.dia_actividad}
                      onChange={(e) => setGenerateForm({ ...generateForm, dia_actividad: e.target.value })}
                      className="w-full h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                    >
                      <option value="lunes">lunes</option>
                      <option value="martes">martes</option>
                      <option value="miércoles">miércoles</option>
                      <option value="jueves">jueves</option>
                      <option value="viernes">viernes</option>
                      <option value="sábado">sábado</option>
                      <option value="domingo">domingo</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Fecha</Label>
                    <Input
                      value={generateForm.fecha_actividad}
                      onChange={(e) => setGenerateForm({ ...generateForm, fecha_actividad: e.target.value })}
                      placeholder="14 de abril del 2023"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Hora</Label>
                    <Input
                      value={generateForm.hora_actividad}
                      onChange={(e) => setGenerateForm({ ...generateForm, hora_actividad: e.target.value })}
                      placeholder="7:00 P.M."
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              </div>
              )}

              {/* SECCIÓN: RECOMENDACIÓN (para Cartas de Recomendación) */}
              {generateTemplate?.category === 'Recomendación' && (
              <div className="rounded-lg border border-green-100 bg-green-50/30 p-4 space-y-3">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Datos de Recomendación</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Fecha de la Carta</Label>
                    <Input
                      value={generateForm.fecha_carta}
                      onChange={(e) => setGenerateForm({ ...generateForm, fecha_carta: e.target.value })}
                      placeholder="15 de agosto de 2023"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Institución Destino *</Label>
                    <Input
                      value={generateForm.institucion_destino}
                      onChange={(e) => setGenerateForm({ ...generateForm, institucion_destino: e.target.value })}
                      placeholder="Instituto Bíblico de las Asambleas de Dios HASHEM"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Título</Label>
                    <select
                      value={generateForm.titulo_persona}
                      onChange={(e) => setGenerateForm({ ...generateForm, titulo_persona: e.target.value })}
                      className="w-full h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm"
                    >
                      <option value="Hno.">Hno.</option>
                      <option value="Hna.">Hna.</option>
                      <option value="Sr.">Sr.</option>
                      <option value="Sra.">Sra.</option>
                      <option value="Lic.">Lic.</option>
                      <option value="Dr.">Dr.</option>
                    </select>
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs">Nombre de la Persona *</Label>
                    <Input
                      value={generateForm.nombre_persona}
                      onChange={(e) => setGenerateForm({ ...generateForm, nombre_persona: e.target.value })}
                      placeholder="Andy R. Rosado Segura"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tiempo que lo conoce</Label>
                    <Input
                      value={generateForm.años_conocido}
                      onChange={(e) => setGenerateForm({ ...generateForm, años_conocido: e.target.value })}
                      placeholder="varios años"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Propósito de la recomendación</Label>
                    <Input
                      value={generateForm.proposito}
                      onChange={(e) => setGenerateForm({ ...generateForm, proposito: e.target.value })}
                      placeholder="sea aceptado como alumno del Instituto..."
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={previewGeneratedLetter2}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Vista Previa
                </Button>
              </div>
            </div>

            {/* Preview Column */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Vista Previa de la Carta</Label>
              {showLetterPreview && letterPreviewContent ? (
                <div className="bg-white border border-neutral-200 rounded-lg p-6 min-h-[400px] max-h-[500px] overflow-y-auto">
                  <div className="font-serif text-sm text-neutral-800 leading-relaxed whitespace-pre-wrap">
                    {letterPreviewContent}
                  </div>
                </div>
              ) : (
                <div className="bg-neutral-50 border border-dashed border-neutral-200 rounded-lg p-6 min-h-[400px] flex items-center justify-center">
                  <div className="text-center text-neutral-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Completa los datos y presiona "Vista Previa"</p>
                    <p className="text-xs mt-1">para ver cómo quedará la carta</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowGenerateModal(false)}>
              Cancelar
            </Button>
            {showLetterPreview && letterPreviewContent && (
              <Button 
                variant="secondary"
                onClick={downloadLetterPdf}
                disabled={downloadingPdf}
              >
                {downloadingPdf ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                Descargar PDF
              </Button>
            )}
            <Button onClick={generateLetter} disabled={generating || (
              generateTemplate?.category === 'Invitación' ? !generateForm.iglesia_destinatario :
              generateTemplate?.category === 'Recomendación' ? !generateForm.nombre_persona :
              generateTemplate?.category === 'Invitación Individual' ? !generateForm.tipo_evento :
              !generateForm.nombre_iglesia
            )}>
              {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Guardar Carta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewTitle}</DialogTitle>
            <DialogDescription>Vista previa del contenido</DialogDescription>
          </DialogHeader>
          <div className="bg-white border border-neutral-200 rounded-lg p-8 min-h-[200px] font-serif text-neutral-800 leading-relaxed whitespace-pre-wrap">
            {previewContent}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

export default LetterTemplatesPage
