import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  FileText,
  Loader2,
  Trash2,
  Eye,
  Download,
  ChevronRight,
  ChevronLeft,
  Church,
  Users,
  Award,
  Calendar,
  CheckCircle2,
  Sparkles,
  Copy,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '../../store/authStore'
import { P } from '../../constants/permissions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { lettersApi } from '@/lib/api'
import { toast } from 'sonner'

// Tipos de carta disponibles
const LETTER_TYPES = [
  {
    id: 'invitation',
    name: 'Invitación a Iglesia',
    description: 'Carta formal para invitar a otra iglesia a un evento',
    icon: Church,
    color: 'bg-blue-500',
  },
  {
    id: 'individual',
    name: 'Invitación Individual',
    description: 'Invitación con destinatario específico (pastor/iglesia)',
    icon: Users,
    color: 'bg-green-500',
  },
  {
    id: 'recommendation',
    name: 'Carta de Recomendación',
    description: 'Recomendar a un miembro para institución o propósito',
    icon: Award,
    color: 'bg-purple-500',
  },
]

// Plantillas por tipo (sin firma, el backend la genera automáticamente)
const TEMPLATES = {
  invitation: `Iglesia: {{iglesia_destinatario}}
Pastor/a/es: {{pastor_destinatario}}

Que la paz y el amor de nuestro Señor Jesús esté con cada uno de ustedes y en su congregación.

Después de darle un cordial saludo, la iglesia {{nombre_iglesia}} tiene el honor de invitarles a ser parte de su gran {{tipo_evento}}, que estaremos efectuando el {{dia_actividad}} {{fecha_actividad}} con el tema "{{tema_evento}}", a partir de las {{hora_actividad}}, donde estaremos adorando a nuestro Padre celestial unánimes. Contamos con su apoyo.

De antemano le damos las gracias por su respaldo. Que la paz del Dios todo poderoso inunde sus vidas.`,

  individual: `{{fecha_carta}}

Iglesia: {{iglesia_destinatario}}
Pastor/a: {{pastor_destinatario}}

Que la paz y el amor de nuestro Señor Jesús esté con cada uno de ustedes y en su congregación.

Después de darle un cordial saludo, la iglesia {{nombre_iglesia}} tiene el honor de invitarles a ser parte de su gran {{tipo_evento}}, que estaremos efectuando el {{dia_actividad}} {{fecha_actividad}} con el tema "{{tema_evento}}", a partir de las {{hora_actividad}}, donde estaremos adorando a nuestro Padre celestial unánimes. Contamos con su apoyo.

De antemano le damos las gracias por su respaldo. Que la paz del Dios todo poderoso inunde sus vidas.`,

  recommendation: `{{fecha_carta}}

Dirigido a: {{institucion_destino}}
De: {{nombre_iglesia}}

Carta de Recomendación

El/la que suscribe, {{titulo_pastor}} {{nombre_pastor}}, doy constancia de que el/la {{titulo_persona}} {{nombre_persona}}, miembro activo de {{nombre_iglesia}}, a quien conozco hace {{años_conocido}}, ha demostrado ser un buen cristiano(a), además de ser una persona íntegra y respetuosa. Por tal motivo, extiendo esta recomendación para que {{proposito}}.

Se extiende la presente para los fines que correspondan.`,
}

interface GeneratedLetter {
  _id: string
  templateId?: string
  templateName: string
  personName?: string
  recipientName?: string
  finalContent: string
  variablesUsed?: Record<string, string>
  generatedBy: { id: string; name: string }
  createdAt: string
}

const LetterWizardPage = () => {
  const { hasPermission } = useAuthStore()
  const canCreate = hasPermission(P.LETTERS_CREATE)
  const canDelete = hasPermission(P.LETTERS_DELETE)

  const [generated, setGenerated] = useState<GeneratedLetter[]>([])
  const [loading, setLoading] = useState(true)
  
  // Wizard state
  const [showWizard, setShowWizard] = useState(false)
  const [step, setStep] = useState(1)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  
  // Form data
  const [formData, setFormData] = useState({
    // Mi iglesia
    nombre_iglesia: '',
    direccion_iglesia: '',
    telefono_iglesia: '',
    nombre_pastor: '',
    titulo_pastor: 'Pastora',
    // Destinatario
    iglesia_destinatario: '',
    pastor_destinatario: '',
    institucion_destino: '',
    // Evento
    tipo_evento: 'culto de Jóvenes',
    dia_actividad: 'viernes',
    fecha_actividad: '',
    tema_evento: '',
    hora_actividad: '7:00 P.M.',
    // Recomendación
    fecha_carta: new Date().toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' }),
    nombre_persona: '',
    titulo_persona: 'Hno.',
    años_conocido: 'varios años',
    proposito: 'sea aceptado como alumno del Instituto Bíblico',
  })
  
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  
  // Preview modal for history
  const [showPreview, setShowPreview] = useState(false)
  const [previewContent, setPreviewContent] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [gRes] = await Promise.all([
        lettersApi.getGenerated(),
      ])
      setGenerated(gRes.data.data)
    } catch {
      toast.error('Error al cargar datos')
    }
    setLoading(false)
  }

  // Replace variables in template
  const replaceVariables = (template: string, data: Record<string, string>) => {
    let result = template
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      result = result.replace(regex, value || `[${key}]`)
    })
    return result
  }

  // Get current template based on selected type
  const currentTemplate = useMemo(() => {
    if (!selectedType) return ''
    return TEMPLATES[selectedType as keyof typeof TEMPLATES] || ''
  }, [selectedType])

  // Preview content with replaced variables
  const previewContentMemo = useMemo(() => {
    return replaceVariables(currentTemplate, formData)
  }, [currentTemplate, formData])

  // Open wizard
  const openWizard = () => {
    setStep(1)
    setSelectedType(null)
    setFormData({
      nombre_iglesia: '',
      direccion_iglesia: '',
      telefono_iglesia: '',
      nombre_pastor: '',
      titulo_pastor: 'Pastora',
      iglesia_destinatario: '',
      pastor_destinatario: '',
      institucion_destino: '',
      tipo_evento: 'culto de Jóvenes',
      dia_actividad: 'viernes',
      fecha_actividad: '',
      tema_evento: '',
      hora_actividad: '7:00 P.M.',
      fecha_carta: new Date().toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' }),
      nombre_persona: '',
      titulo_persona: 'Hno.',
      años_conocido: 'varios años',
      proposito: 'sea aceptado como alumno del Instituto Bíblico',
    })
    setShowWizard(true)
  }

  // Validate form based on type
  const validateForm = () => {
    if (!formData.nombre_iglesia.trim()) {
      toast.error('El nombre de tu iglesia es requerido')
      return false
    }
    if (!formData.nombre_pastor.trim()) {
      toast.error('El nombre del pastor es requerido')
      return false
    }
    
    if (selectedType === 'invitation' || selectedType === 'individual') {
      if (!formData.iglesia_destinatario.trim()) {
        toast.error('La iglesia destinataria es requerida')
        return false
      }
      if (!formData.tipo_evento.trim()) {
        toast.error('El tipo de evento es requerido')
        return false
      }
    }
    
    if (selectedType === 'recommendation') {
      if (!formData.nombre_persona.trim()) {
        toast.error('El nombre de la persona es requerido')
        return false
      }
      if (!formData.institucion_destino.trim()) {
        toast.error('La institución destino es requerida')
        return false
      }
    }
    
    return true
  }

  // Go to next step
  const nextStep = () => {
    if (step === 1 && !selectedType) {
      toast.error('Selecciona un tipo de carta')
      return
    }
    if (step === 2 && !validateForm()) {
      return
    }
    setStep(step + 1)
  }

  // Go to previous step
  const prevStep = () => {
    setStep(step - 1)
  }

  // Download PDF
  const downloadPdf = async () => {
    let recipientName = 'carta'
    let letterType = 'Invitación'
    
    if (selectedType === 'recommendation') {
      recipientName = formData.nombre_persona
      letterType = 'Recomendación'
    } else if (selectedType === 'invitation') {
      recipientName = formData.iglesia_destinatario
      letterType = 'Invitación'
    } else if (selectedType === 'individual') {
      recipientName = formData.iglesia_destinatario
      letterType = 'Invitación Individual'
    }
    
    setDownloadingPdf(true)
    try {
      const res = await lettersApi.downloadPdf({
        content: previewContentMemo,
        title: letterType,
        recipientName,
        churchData: {
          nombre: formData.nombre_iglesia,
          direccion: formData.direccion_iglesia,
          telefono: formData.telefono_iglesia,
          pastor: formData.nombre_pastor,
          tituloPastor: formData.titulo_pastor,
        },
        eventData: {
          fecha: formData.fecha_actividad,
          tema: formData.tema_evento,
          hora: formData.hora_actividad,
          iglesiaDestinatario: formData.iglesia_destinatario,
          pastorDestinatario: formData.pastor_destinatario,
        },
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `carta-${recipientName?.replace(/\s+/g, '-') || 'documento'}-${new Date().toISOString().split('T')[0]}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('PDF descargado exitosamente')
    } catch (e: any) {
      toast.error('Error al generar PDF')
      console.error(e)
    }
    setDownloadingPdf(false)
  }

  // Save to history
  const saveAndDownload = async () => {
    if (!validateForm()) return
    
    let recipientName = 'carta'
    let letterType = 'Invitación'
    
    if (selectedType === 'recommendation') {
      recipientName = formData.nombre_persona
      letterType = 'Recomendación'
    } else if (selectedType === 'invitation') {
      recipientName = formData.iglesia_destinatario
      letterType = 'Invitación'
    } else if (selectedType === 'individual') {
      recipientName = formData.iglesia_destinatario
      letterType = 'Invitación Individual'
    }

    try {
      // Save to history
      await lettersApi.generate({
        templateId: 'wizard-' + selectedType,
        customFields: formData,
        content: previewContentMemo,
        recipientName,
        templateName: letterType,
      })
      
      // Download PDF
      await downloadPdf()
      
      setShowWizard(false)
      loadData()
    } catch (e: any) {
      toast.error('Error al guardar carta')
    }
  }

  // Preview from history
  const viewHistoryLetter = (letter: GeneratedLetter) => {
    setPreviewContent(letter.finalContent)
    setPreviewTitle(`${letter.templateName || 'Carta'} - ${letter.recipientName || 'Destinatario'}`)
    setShowPreview(true)
  }

  // Delete from history
  const deleteHistoryLetter = async (id: string) => {
    if (!confirm('¿Eliminar esta carta del historial?')) return
    try {
      await lettersApi.deleteGenerated(id)
      toast.success('Carta eliminada')
      loadData()
    } catch {
      toast.error('Error al eliminar')
    }
  }

  // Duplicar carta desde historial
  const duplicateLetter = (letter: GeneratedLetter) => {
    // Determinar el tipo basado en templateId o templateName
    let type = 'invitation'
    if (letter.templateId?.includes('recommendation') || letter.templateName?.includes('Recomendación')) {
      type = 'recommendation'
    } else if (letter.templateId?.includes('individual') || letter.templateName?.includes('Individual')) {
      type = 'individual'
    }
    
    // Precargar datos del formulario desde variablesUsed
    const vars = letter.variablesUsed || {}
    setFormData({
      nombre_iglesia: vars.nombre_iglesia || '',
      direccion_iglesia: vars.direccion_iglesia || '',
      telefono_iglesia: vars.telefono_iglesia || '',
      nombre_pastor: vars.nombre_pastor || '',
      titulo_pastor: vars.titulo_pastor || 'Pastora',
      iglesia_destinatario: vars.iglesia_destinatario || '',
      pastor_destinatario: vars.pastor_destinatario || '',
      institucion_destino: vars.institucion_destino || '',
      tipo_evento: vars.tipo_evento || 'culto de Jóvenes',
      dia_actividad: vars.dia_actividad || 'viernes',
      fecha_actividad: vars.fecha_actividad || '',
      tema_evento: vars.tema_evento || '',
      hora_actividad: vars.hora_actividad || '7:00 P.M.',
      fecha_carta: vars.fecha_carta || new Date().toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' }),
      nombre_persona: vars.nombre_persona || '',
      titulo_persona: vars.titulo_persona || 'Hno.',
      años_conocido: vars.años_conocido || 'varios años',
      proposito: vars.proposito || '',
    })
    
    setSelectedType(type)
    setStep(2) // Ir directo al paso 2 (formulario)
    setShowWizard(true)
    toast.success('Carta cargada - modifica lo que necesites')
  }

  // Step labels for indicator
  const STEP_LABELS = ['Tipo', 'Datos', 'Vista Previa']
  
  // Step indicator component - Improved
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((s, idx) => (
        <div key={s} className="flex items-center">
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: s === step ? 1.1 : 1 }}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm transition-all duration-300 ${
                s === step
                  ? 'bg-gradient-to-br from-primary-500 to-primary-700 text-white ring-4 ring-primary-100'
                  : s < step
                  ? 'bg-gradient-to-br from-green-500 to-green-600 text-white'
                  : 'bg-neutral-100 text-neutral-400 border-2 border-neutral-200'
              }`}
            >
              {s < step ? <CheckCircle2 className="w-5 h-5" /> : s}
            </motion.div>
            <span className={`text-xs mt-1.5 font-medium transition-colors ${
              s === step ? 'text-primary-700' : s < step ? 'text-green-600' : 'text-neutral-400'
            }`}>
              {STEP_LABELS[idx]}
            </span>
          </div>
          {s < 3 && (
            <div className={`w-16 h-1 mx-3 rounded-full transition-colors duration-300 ${
              s < step ? 'bg-gradient-to-r from-green-500 to-green-400' : 'bg-neutral-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  )

  // Step 1: Select letter type
  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-neutral-800">¿Qué tipo de carta deseas crear?</h3>
        <p className="text-sm text-neutral-500">Selecciona una opción para continuar</p>
      </div>
      
      <div className="grid gap-3">
        {LETTER_TYPES.map((type, index) => {
          const Icon = type.icon
          const isSelected = selectedType === type.id
          return (
            <motion.div
              key={type.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.01, x: 4 }}
              whileTap={{ scale: 0.99 }}
            >
              <Card
                className={`cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'ring-2 ring-primary-500 bg-gradient-to-r from-primary-50 to-white shadow-md border-primary-200'
                    : 'hover:shadow-md hover:border-neutral-300 border-neutral-200'
                }`}
                onClick={() => setSelectedType(type.id)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`w-12 h-12 rounded-xl ${type.color} flex items-center justify-center shadow-sm`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-semibold ${isSelected ? 'text-primary-700' : 'text-neutral-800'}`}>{type.name}</h4>
                    <p className="text-sm text-neutral-500">{type.description}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected 
                      ? 'border-primary-500 bg-primary-500' 
                      : 'border-neutral-300'
                  }`}>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )

  // Step 2: Fill form - Improved UI
  const renderStep2 = () => (
    <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
      {/* Mi Iglesia Section */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/50 to-white p-5 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center shadow-sm">
            <Church className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-900">Mi Iglesia</h4>
            <p className="text-xs text-blue-600">Datos del remitente</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-blue-800">Nombre de la Iglesia *</Label>
            <Input
              value={formData.nombre_iglesia}
              onChange={(e) => setFormData({ ...formData, nombre_iglesia: e.target.value })}
              placeholder="Ej: Iglesia Pentecostal Nueva Vida"
              className="border-blue-200 focus:border-blue-400 focus:ring-blue-400/20"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-blue-800">Dirección</Label>
            <Input
              value={formData.direccion_iglesia}
              onChange={(e) => setFormData({ ...formData, direccion_iglesia: e.target.value })}
              placeholder="Ej: Calle Principal #123, Sector"
              className="border-blue-200 focus:border-blue-400 focus:ring-blue-400/20"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-blue-800">Teléfono</Label>
            <Input
              value={formData.telefono_iglesia}
              onChange={(e) => setFormData({ ...formData, telefono_iglesia: e.target.value })}
              placeholder="Ej: 809-555-1234"
              className="border-blue-200 focus:border-blue-400 focus:ring-blue-400/20"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-blue-800">Título del Pastor *</Label>
            <select
              value={formData.titulo_pastor}
              onChange={(e) => setFormData({ ...formData, titulo_pastor: e.target.value })}
              className="w-full h-9 rounded-md border border-blue-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400"
            >
              <option value="Pastora">Pastora</option>
              <option value="Pastor">Pastor</option>
              <option value="Rev.">Rev.</option>
              <option value="Apóstol">Apóstol</option>
              <option value="Obispo">Obispo</option>
            </select>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs font-medium text-blue-800">Nombre del Pastor/a *</Label>
            <Input
              value={formData.nombre_pastor}
              onChange={(e) => setFormData({ ...formData, nombre_pastor: e.target.value })}
              placeholder="Ej: María García de Rodríguez"
              className="border-blue-200 focus:border-blue-400 focus:ring-blue-400/20"
            />
          </div>
        </div>
      </motion.div>

      {/* Destinatario Section - Para Invitaciones */}
      {(selectedType === 'invitation' || selectedType === 'individual') && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-green-100 bg-gradient-to-br from-green-50/50 to-white p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-green-900">Iglesia Invitada</h4>
              <p className="text-xs text-green-600">Destinatario de la carta</p>
            </div>
          </div>
          
          {selectedType === 'individual' && (
            <div className="space-y-1.5 mb-4">
              <Label className="text-xs font-medium text-green-800">Fecha de la Carta</Label>
              <Input
                value={formData.fecha_carta}
                onChange={(e) => setFormData({ ...formData, fecha_carta: e.target.value })}
                placeholder="14 de febrero del 2026"
                className="border-green-200 focus:border-green-400 focus:ring-green-400/20"
              />
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-green-800">Nombre de la Iglesia *</Label>
              <Input
                value={formData.iglesia_destinatario}
                onChange={(e) => setFormData({ ...formData, iglesia_destinatario: e.target.value })}
                placeholder="Ej: Iglesia Bautista El Redentor"
                className="border-green-200 focus:border-green-400 focus:ring-green-400/20"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-green-800">Pastor/a</Label>
              <Input
                value={formData.pastor_destinatario}
                onChange={(e) => setFormData({ ...formData, pastor_destinatario: e.target.value })}
                placeholder="Ej: Juan Pérez"
                className="border-green-200 focus:border-green-400 focus:ring-green-400/20"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Destinatario Section - Para Recomendación */}
      {selectedType === 'recommendation' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50/50 to-white p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center shadow-sm">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-purple-900">Persona Recomendada</h4>
              <p className="text-xs text-purple-600">Datos para la recomendación</p>
            </div>
          </div>
          <div className="space-y-1.5 mb-4">
            <Label className="text-xs font-medium text-purple-800">Fecha de la Carta</Label>
            <Input
              value={formData.fecha_carta}
              onChange={(e) => setFormData({ ...formData, fecha_carta: e.target.value })}
              placeholder="14 de febrero del 2026"
              className="border-purple-200 focus:border-purple-400 focus:ring-purple-400/20"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-purple-800">Institución Destino *</Label>
              <Input
                value={formData.institucion_destino}
                onChange={(e) => setFormData({ ...formData, institucion_destino: e.target.value })}
                placeholder="Ej: Instituto Bíblico HASHEM"
                className="border-purple-200 focus:border-purple-400 focus:ring-purple-400/20"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-purple-800">Título de la Persona</Label>
              <select
                value={formData.titulo_persona}
                onChange={(e) => setFormData({ ...formData, titulo_persona: e.target.value })}
                className="w-full h-9 rounded-md border border-purple-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/20 focus:border-purple-400"
              >
                <option value="Hno.">Hno.</option>
                <option value="Hna.">Hna.</option>
                <option value="Lic.">Lic.</option>
                <option value="Dr.">Dr.</option>
                <option value="Sr.">Sr.</option>
                <option value="Sra.">Sra.</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-purple-800">Nombre de la Persona *</Label>
              <Input
                value={formData.nombre_persona}
                onChange={(e) => setFormData({ ...formData, nombre_persona: e.target.value })}
                placeholder="Ej: José Antonio Martínez"
                className="border-purple-200 focus:border-purple-400 focus:ring-purple-400/20"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-purple-800">Tiempo que lo conoce</Label>
              <Input
                value={formData.años_conocido}
                onChange={(e) => setFormData({ ...formData, años_conocido: e.target.value })}
                placeholder="Ej: varios años"
                className="border-purple-200 focus:border-purple-400 focus:ring-purple-400/20"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-medium text-purple-800">Propósito de la Recomendación</Label>
              <Input
                value={formData.proposito}
                onChange={(e) => setFormData({ ...formData, proposito: e.target.value })}
                placeholder="Ej: sea aceptado como alumno en el programa de liderazgo"
                className="border-purple-200 focus:border-purple-400 focus:ring-purple-400/20"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Evento Section - Para Invitaciones */}
      {(selectedType === 'invitation' || selectedType === 'individual') && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-orange-100 bg-gradient-to-br from-orange-50/50 to-white p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center shadow-sm">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-orange-900">Detalles del Evento</h4>
              <p className="text-xs text-orange-600">Información de la actividad</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-orange-800">Tipo de Evento *</Label>
              <Input
                value={formData.tipo_evento}
                onChange={(e) => setFormData({ ...formData, tipo_evento: e.target.value })}
                placeholder="Ej: Culto de Jóvenes"
                className="border-orange-200 focus:border-orange-400 focus:ring-orange-400/20"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-orange-800">Día de la Semana</Label>
              <select
                value={formData.dia_actividad}
                onChange={(e) => setFormData({ ...formData, dia_actividad: e.target.value })}
                className="w-full h-9 rounded-md border border-orange-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/20 focus:border-orange-400"
              >
                <option value="lunes">Lunes</option>
                <option value="martes">Martes</option>
                <option value="miércoles">Miércoles</option>
                <option value="jueves">Jueves</option>
                <option value="viernes">Viernes</option>
                <option value="sábado">Sábado</option>
                <option value="domingo">Domingo</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-orange-800">Fecha del Evento</Label>
              <Input
                value={formData.fecha_actividad}
                onChange={(e) => setFormData({ ...formData, fecha_actividad: e.target.value })}
                placeholder="Ej: 14 de abril del 2026"
                className="border-orange-200 focus:border-orange-400 focus:ring-orange-400/20"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-orange-800">Hora</Label>
              <Input
                value={formData.hora_actividad}
                onChange={(e) => setFormData({ ...formData, hora_actividad: e.target.value })}
                placeholder="Ej: 7:00 P.M."
                className="border-orange-200 focus:border-orange-400 focus:ring-orange-400/20"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-medium text-orange-800">Tema del Evento</Label>
              <Input
                value={formData.tema_evento}
                onChange={(e) => setFormData({ ...formData, tema_evento: e.target.value })}
                placeholder="Ej: Unidos en Adoración"
                className="border-orange-200 focus:border-orange-400 focus:ring-orange-400/20"
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )

  // Step 3: Preview - Improved
  const renderStep3 = () => (
    <div className="space-y-5">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-2">
          <CheckCircle2 className="w-4 h-4" />
          ¡Carta lista para descargar!
        </div>
        <p className="text-xs text-neutral-500">Revisa la vista previa y descarga tu PDF</p>
      </div>

      {/* Letter Preview - Enhanced styling */}
      <div className="border-2 border-neutral-200 rounded-xl shadow-lg overflow-hidden max-h-[45vh] overflow-y-auto bg-white ring-1 ring-black/5">
        {/* Header with logo simulation */}
        <div className="p-6 bg-gradient-to-b from-neutral-50 to-white">
          <div className="flex items-start gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <Church className="w-8 h-8 text-primary-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-primary-800">{formData.nombre_iglesia || 'Nombre de la Iglesia'}</h2>
              {formData.direccion_iglesia && (
                <p className="text-sm font-medium text-neutral-600">{formData.direccion_iglesia}</p>
              )}
              {formData.telefono_iglesia && (
                <p className="text-sm font-medium text-neutral-600">Tel: {formData.telefono_iglesia}</p>
              )}
            </div>
          </div>

          {/* Letter Content with bold highlights */}
          <div className="text-sm text-neutral-700 leading-relaxed space-y-3">
            {previewContentMemo.split('\n').map((line, i) => {
              if (line.trim() === '') return <br key={i} />
              
              // Aplicar negritas a campos importantes
              let displayLine = line
              
              // Nombre de iglesia remitente en mayúsculas y negrita
              if (formData.nombre_iglesia && line.includes(formData.nombre_iglesia)) {
                displayLine = displayLine.replace(
                  formData.nombre_iglesia,
                  `<strong>${formData.nombre_iglesia.toUpperCase()}</strong>`
                )
              }
              
              // Fecha del evento en negrita
              if (formData.fecha_actividad && line.includes(formData.fecha_actividad)) {
                displayLine = displayLine.replace(
                  formData.fecha_actividad,
                  `<strong>${formData.fecha_actividad}</strong>`
                )
              }
              
              // Tema en mayúsculas y negrita
              if (formData.tema_evento && line.includes(`"${formData.tema_evento}"`)) {
                displayLine = displayLine.replace(
                  `"${formData.tema_evento}"`,
                  `"<strong>${formData.tema_evento.toUpperCase()}</strong>"`
                )
              }
              
              // Hora en negrita
              if (formData.hora_actividad && line.includes(formData.hora_actividad)) {
                displayLine = displayLine.replace(
                  formData.hora_actividad,
                  `<strong>${formData.hora_actividad}</strong>`
                )
              }
              
              // Nombre de iglesia destinatario en negrita
              if (formData.iglesia_destinatario && line.includes(`Iglesia: ${formData.iglesia_destinatario}`)) {
                displayLine = displayLine.replace(
                  `Iglesia: ${formData.iglesia_destinatario}`,
                  `Iglesia: <strong>${formData.iglesia_destinatario}</strong>`
                )
              }
              
              // Nombre del pastor destinatario en negrita
              if (formData.pastor_destinatario && line.includes(formData.pastor_destinatario)) {
                displayLine = displayLine.replace(
                  formData.pastor_destinatario,
                  `<strong>${formData.pastor_destinatario}</strong>`
                )
              }
              
              return (
                <p 
                  key={i} 
                  className="text-justify"
                  dangerouslySetInnerHTML={{ __html: displayLine }}
                />
              )
            })}
          </div>

          {/* Firma centrada */}
          <div className="text-center mt-10 pt-6">
            <div className="w-52 border-t-2 border-neutral-300 mx-auto mb-2"></div>
            <p className="font-bold text-neutral-800">{formData.nombre_pastor || 'Nombre del Pastor'}</p>
            <p className="text-primary-600 font-medium">{formData.titulo_pastor || 'Pastor'}</p>
            <div className="mt-3 flex justify-center">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center shadow-sm">
                <Church className="w-5 h-5 text-primary-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <motion.div 
        className="flex justify-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          onClick={saveAndDownload}
          disabled={downloadingPdf}
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 gap-2 shadow-lg shadow-green-200 px-8"
          size="lg"
        >
          {downloadingPdf ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generando PDF...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Descargar PDF
            </>
          )}
        </Button>
      </motion.div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin h-8 w-8 text-primary-600" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Cartas de Iglesia</h1>
          <p className="text-neutral-500">Crea invitaciones, recomendaciones y más</p>
        </div>
        {canCreate && (
        <Button onClick={openWizard} className="gap-2 bg-primary-600 hover:bg-primary-700">
          <Plus className="w-5 h-5" />
          Nueva Carta
        </Button>
        )}
      </div>

      {/* Main Content - Create Card + History */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Create New Card */}
        {canCreate && (
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="cursor-pointer"
          onClick={openWizard}
        >
          <Card className="h-full border-2 border-dashed border-primary-200 hover:border-primary-400 hover:bg-primary-50/50 transition-all">
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px] p-8">
              <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                <Sparkles className="w-10 h-10 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-800 mb-2">Crear Nueva Carta</h3>
              <p className="text-neutral-500 text-center max-w-sm">
                Usa nuestro asistente paso a paso para crear cartas profesionales con el membrete de tu iglesia
              </p>
              <div className="flex gap-2 mt-6">
                {LETTER_TYPES.map((type) => {
                  const Icon = type.icon
                  return (
                    <div key={type.id} className={`p-2 rounded-lg ${type.color}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        )}

        {/* History Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-neutral-500" />
                Historial de Cartas
              </h3>
              <Badge variant="secondary">{generated.length}</Badge>
            </div>

            {generated.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No hay cartas generadas aún</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[320px] overflow-y-auto">
                {generated.slice(0, 10).map((letter) => (
                  <div
                    key={letter._id}
                    className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-neutral-800">
                          {letter.templateName || 'Carta'}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {letter.recipientName || letter.personName || 'Destinatario'} • {new Date(letter.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Duplicar carta"
                        className="text-primary-600 hover:text-primary-800 hover:bg-primary-50"
                        onClick={() => duplicateLetter(letter)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Ver carta"
                        onClick={() => viewHistoryLetter(letter)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Eliminar"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => deleteHistoryLetter(letter._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Wizard Modal */}
      <Dialog open={showWizard} onOpenChange={setShowWizard}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden bg-gradient-to-b from-white to-neutral-50">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold text-neutral-800">
              {step === 1 && '✨ Nueva Carta'}
              {step === 2 && '✏️ Completa los Datos'}
              {step === 3 && '👁️ Vista Previa y Descarga'}
            </DialogTitle>
          </DialogHeader>

          <StepIndicator />

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-5 border-t border-neutral-200 bg-white rounded-b-lg">
            <Button
              variant="outline"
              onClick={step === 1 ? () => setShowWizard(false) : prevStep}
              className="gap-2 border-neutral-300 hover:bg-neutral-100"
            >
              <ChevronLeft className="w-4 h-4" />
              {step === 1 ? 'Cancelar' : 'Anterior'}
            </Button>
            
            {step < 3 && (
              <Button 
                onClick={nextStep} 
                className="gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-sm"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal for History */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{previewTitle}</DialogTitle>
          </DialogHeader>
          <div className="bg-neutral-50 p-6 rounded-lg max-h-[60vh] overflow-auto">
            <pre className="whitespace-pre-wrap font-sans text-sm text-neutral-700">
              {previewContent}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default LetterWizardPage
