import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  MessageCircle, Send, Users, Calendar, CheckCircle2, ChevronLeft, ChevronRight,
  Loader2, Search, User, Phone, FileText, Image,
  Check, Sparkles, PhoneCall, Plus, X, UserPlus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { programsApi, personsApi } from '@/lib/api'
import { safeDateParse } from '@/lib/utils'

// ── TYPES ─────────────────────────────────────────────────────────────────────

interface Program {
  _id: string
  programDate: string
  activityType?: { name: string; _id: string }
  assignments?: Array<{ 
    personId?: { fullName: string; _id: string }
    roleName?: string 
  }>
  cleaningMembers?: Array<{ name: string; phone?: string }>
  generationType?: string
  assignedGroupNumber?: number
  totalGroups?: number
  status?: string
}

interface Person {
  _id: string
  fullName: string
  phone?: string
  email?: string
  status?: string
  roles?: Array<{ roleId?: string; roleName?: string }>
}

interface Recipient {
  id: string
  name: string
  phone: string
  initials: string
  color: string
  type: 'person' | 'assigned'
  roleInProgram?: string
}

// ── CONSTANTS ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-gradient-to-br from-blue-500 to-blue-600',
  'bg-gradient-to-br from-emerald-500 to-emerald-600',
  'bg-gradient-to-br from-violet-500 to-violet-600',
  'bg-gradient-to-br from-rose-500 to-rose-600',
  'bg-gradient-to-br from-amber-500 to-amber-600',
  'bg-gradient-to-br from-cyan-500 to-cyan-600',
  'bg-gradient-to-br from-fuchsia-500 to-fuchsia-600',
  'bg-gradient-to-br from-indigo-500 to-indigo-600',
  'bg-gradient-to-br from-teal-500 to-teal-600',
  'bg-gradient-to-br from-orange-500 to-orange-600',
]

const MESSAGE_TEMPLATES = [
  {
    id: 'program_notification',
    name: 'Notificación de Programa',
    icon: '📋',
    template: `🙏 *{church_name}*

📅 *{activity_name}*
📆 {date}
⏰ {time}

{assignments}

¡Dios les bendiga! 🕊️`,
  },
  {
    id: 'cleaning_group',
    name: 'Grupo de Limpieza',
    icon: '🧹',
    template: `🧹 *Programa de Limpieza*

📆 Fecha: {date}
👥 Grupo #{group_number} de {total_groups}

*Miembros asignados:*
{members}

Gracias por su servicio. ¡Dios les bendiga! 🙏`,
  },
  {
    id: 'reminder',
    name: 'Recordatorio Personal',
    icon: '⏰',
    template: `⏰ *Recordatorio*

No olvide su participación en:
📅 *{activity_name}*
📆 {date} - {time}

Su asignación: {role}

Contamos con usted. ¡Bendiciones! 🙌`,
  },
]

// ── HELPER FUNCTIONS ──────────────────────────────────────────────────────────

const getInitials = (name: string): string => {
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const getColorFromName = (name: string): string => {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/[^\d+]/g, '')
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`
  }
  return phone
}

// ── STEP INDICATOR ────────────────────────────────────────────────────────────

const StepIndicator = ({ currentStep, steps }: { currentStep: number; steps: string[] }) => (
  <div className="flex items-center justify-center mb-8 px-4">
    {steps.map((label, idx) => {
      const stepNum = idx + 1
      const isActive = stepNum === currentStep
      const isCompleted = stepNum < currentStep
      return (
        <div key={stepNum} className="flex items-center">
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: isActive ? 1.1 : 1 }}
              className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shadow-md transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white ring-4 ring-green-100'
                  : isCompleted
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                  : 'bg-neutral-100 text-neutral-400 border-2 border-neutral-200'
              }`}
            >
              {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : stepNum}
            </motion.div>
            <span className={`text-xs mt-2 font-medium transition-colors ${
              isActive ? 'text-green-700' : isCompleted ? 'text-green-600' : 'text-neutral-400'
            }`}>
              {label}
            </span>
          </div>
          {stepNum < steps.length && (
            <div className={`w-12 sm:w-20 h-1.5 mx-2 sm:mx-4 rounded-full transition-all duration-500 ${
              isCompleted ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-neutral-200'
            }`} />
          )}
        </div>
      )
    })}
  </div>
)

// ── PERSON AVATAR ─────────────────────────────────────────────────────────────

const PersonAvatar = ({ name, size = 'md', selected = false }: { 
  name: string
  size?: 'sm' | 'md' | 'lg'
  selected?: boolean 
}) => {
  const initials = getInitials(name)
  const color = getColorFromName(name)
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg'
  }
  
  return (
    <div className={`${sizeClasses[size]} ${color} rounded-full flex items-center justify-center font-bold text-white shadow-lg ${
      selected ? 'ring-3 ring-green-400 ring-offset-2' : ''
    }`}>
      {initials}
    </div>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

const WhatsAppWizardPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  
  // Get program IDs from URL params (from batch generation)
  const preselectedIds = searchParams.get('ids')?.split(',').filter(Boolean) || []
  
  // Data
  const [programs, setPrograms] = useState<Program[]>([])
  const [persons, setPersons] = useState<Person[]>([])
  
  // Wizard state
  const [step, setStep] = useState(1)
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>(preselectedIds)
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState(MESSAGE_TEMPLATES[0].id)
  const [sendAsImage, setSendAsImage] = useState(true)
  
  // Filters
  const [programFilter, setProgramFilter] = useState('')
  const [recipientFilter, setRecipientFilter] = useState('')
  const [recipientType, setRecipientType] = useState<'all' | 'assigned' | 'all-members'>('all')
  
  // Connection - REMOVED QR simulation, using direct wa.me links
  const [sentRecipients, setSentRecipients] = useState<Set<string>>(new Set())
  
  // PDF URLs for sharing
  const [pdfUrls, setPdfUrls] = useState<Record<string, string>>({})
  const [generatingPdfs, setGeneratingPdfs] = useState(false)
  
  // Manual phone input
  const [manualPhone, setManualPhone] = useState('')
  const [manualName, setManualName] = useState('')
  const [showAddManual, setShowAddManual] = useState(false)
  
  const STEPS = ['Programas', 'Destinatarios', 'Mensaje', 'Enviar']

  // ── Load data ───────────────────────────────────────────────────────────────
  
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [progsRes, personsRes] = await Promise.all([
        programsApi.getAll(),
        personsApi.getAll(),
      ])
      
      // Sort programs by date (newest first)
      const sortedPrograms = (progsRes.data.data || []).sort((a: Program, b: Program) => 
        safeDateParse(b.programDate).getTime() - safeDateParse(a.programDate).getTime()
      )
      setPrograms(sortedPrograms)
      
      // Filter persons with phone numbers
      const personsWithPhone = (personsRes.data.data || []).filter((p: Person) => 
        p.phone && p.phone.trim().length > 0 && (p.status === 'active' || p.status === 'ACTIVO' || p.status === 'ACTIVE')
      )
      setPersons(personsWithPhone)
      
      // If we have preselected IDs, jump to step 2
      if (preselectedIds.length > 0) {
        setSelectedPrograms(preselectedIds)
        setTimeout(() => setStep(2), 300)
      }
    } catch (e) {
      console.error(e)
      toast.error('Error al cargar datos')
    }
    setLoading(false)
  }

  // ── Get recipients from selected programs ───────────────────────────────────
  
  const assignedRecipients = useMemo(() => {
    const recipients: Recipient[] = []
    const seenIds = new Set<string>()
    
    selectedPrograms.forEach(progId => {
      const prog = programs.find(p => p._id === progId)
      if (!prog) return
      
      // Standard program assignments
      prog.assignments?.forEach(a => {
        if (a.personId?._id && !seenIds.has(a.personId._id)) {
          const person = persons.find(p => p._id === a.personId?._id)
          if (person?.phone) {
            seenIds.add(a.personId._id)
            recipients.push({
              id: a.personId._id,
              name: a.personId.fullName || person.fullName,
              phone: person.phone,
              initials: getInitials(a.personId.fullName || person.fullName),
              color: getColorFromName(a.personId.fullName || person.fullName),
              type: 'assigned',
              roleInProgram: a.roleName
            })
          }
        }
      })
      
      // Cleaning members
      prog.cleaningMembers?.forEach(m => {
        if (m.phone && !seenIds.has(m.name)) {
          seenIds.add(m.name)
          recipients.push({
            id: `cleaning-${m.name}`,
            name: m.name,
            phone: m.phone,
            initials: getInitials(m.name),
            color: getColorFromName(m.name),
            type: 'assigned',
            roleInProgram: 'Limpieza'
          })
        }
      })
    })
    
    return recipients
  }, [selectedPrograms, programs, persons])

  // ── All members with phone ──────────────────────────────────────────────────
  
  const allMembersWithPhone = useMemo(() => {
    return persons.map(p => ({
      id: p._id,
      name: p.fullName,
      phone: p.phone!,
      initials: getInitials(p.fullName),
      color: getColorFromName(p.fullName),
      type: 'person' as const,
      roleInProgram: undefined
    }))
  }, [persons])

  // ── Filtered recipients based on tab selection ──────────────────────────────
  
  const filteredRecipients = useMemo(() => {
    let recipients: Recipient[] = []
    
    // Get manual recipients from selected
    const manualRecipients = selectedRecipients.filter(r => r.id.startsWith('manual_'))
    
    if (recipientType === 'all') {
      const assignedIds = new Set(assignedRecipients.map(r => r.id))
      recipients = [
        ...manualRecipients,
        ...assignedRecipients,
        ...allMembersWithPhone.filter(m => !assignedIds.has(m.id))
      ]
    } else if (recipientType === 'assigned') {
      recipients = [...manualRecipients, ...assignedRecipients]
    } else {
      recipients = [...manualRecipients, ...allMembersWithPhone]
    }
    
    // Deduplicate by id
    const seen = new Set<string>()
    recipients = recipients.filter(r => {
      if (seen.has(r.id)) return false
      seen.add(r.id)
      return true
    })
    
    if (!recipientFilter) return recipients
    const q = recipientFilter.toLowerCase()
    return recipients.filter(r => 
      r.name.toLowerCase().includes(q) || 
      r.phone.includes(q) ||
      r.roleInProgram?.toLowerCase().includes(q)
    )
  }, [recipientType, assignedRecipients, allMembersWithPhone, recipientFilter, selectedRecipients])

  // ── Filtered programs ───────────────────────────────────────────────────────
  
  const filteredPrograms = useMemo(() => {
    if (!programFilter) return programs
    const q = programFilter.toLowerCase()
    return programs.filter(p => 
      p.activityType?.name?.toLowerCase().includes(q) ||
      safeDateParse(p.programDate).toLocaleDateString('es-DO', { timeZone: 'America/Santo_Domingo' }).includes(q)
    )
  }, [programs, programFilter])

  // ── Selection handlers ──────────────────────────────────────────────────────
  
  const toggleProgram = (id: string) => {
    setSelectedPrograms(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const toggleRecipient = (recipient: Recipient) => {
    setSelectedRecipients(prev => {
      const exists = prev.find(r => r.id === recipient.id)
      return exists ? prev.filter(r => r.id !== recipient.id) : [...prev, recipient]
    })
  }

  const selectAllPrograms = () => {
    if (selectedPrograms.length === filteredPrograms.length) {
      setSelectedPrograms([])
    } else {
      setSelectedPrograms(filteredPrograms.map(p => p._id))
    }
  }

  const selectAllRecipients = () => {
    if (selectedRecipients.length === filteredRecipients.length) {
      setSelectedRecipients([])
    } else {
      setSelectedRecipients([...filteredRecipients])
    }
  }

  const selectAssignedOnly = () => {
    setSelectedRecipients(assignedRecipients)
  }

  // ── Add manual recipient ────────────────────────────────────────────────────
  
  const addManualRecipient = () => {
    const phone = manualPhone.trim().replace(/\s/g, '')
    if (!phone || phone.length < 7) {
      toast.error('Ingresa un número de teléfono válido')
      return
    }
    
    // Check if already exists
    if (selectedRecipients.some(r => r.phone.replace(/\D/g, '') === phone.replace(/\D/g, ''))) {
      toast.error('Este número ya está agregado')
      return
    }
    
    const name = manualName.trim() || `Contacto ${phone.slice(-4)}`
    const newRecipient: Recipient = {
      id: `manual-${Date.now()}`,
      name,
      phone,
      initials: getInitials(name),
      color: getColorFromName(name),
      type: 'person',
      roleInProgram: undefined
    }
    
    setSelectedRecipients(prev => [...prev, newRecipient])
    setManualPhone('')
    setManualName('')
    setShowAddManual(false)
    toast.success(`Agregado: ${name}`)
  }

  const removeRecipient = (id: string) => {
    setSelectedRecipients(prev => prev.filter(r => r.id !== id))
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  
  const canProceed = () => {
    switch (step) {
      case 1: return selectedPrograms.length > 0
      case 2: return selectedRecipients.length > 0
      case 3: return !!selectedTemplate
      case 4: return true
      default: return false
    }
  }

  const nextStep = async () => {
    if (canProceed() && step < 4) {
      if (step === 1 && assignedRecipients.length > 0 && selectedRecipients.length === 0) {
        setSelectedRecipients(assignedRecipients)
      }
      
      // When moving to step 4, generate PDF URLs
      if (step === 3) {
        setGeneratingPdfs(true)
        try {
          const urls: Record<string, string> = {}
          for (const programId of selectedPrograms) {
            try {
              const response = await programsApi.getPdfUrl(programId)
              if (response.data.success) {
                urls[programId] = response.data.data.url
              }
            } catch (err) {
              console.error(`Error generating PDF for program ${programId}:`, err)
            }
          }
          setPdfUrls(urls)
        } catch (err) {
          console.error('Error generating PDFs:', err)
        } finally {
          setGeneratingPdfs(false)
        }
      }
      
      setStep(step + 1)
    }
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  // ── Format helpers ──────────────────────────────────────────────────────────
  
  const formatDate = (date: string) => {
    return safeDateParse(date).toLocaleDateString('es-DO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'America/Santo_Domingo'
    })
  }

  // ── Build WhatsApp message ──────────────────────────────────────────────────
  
  const buildMessage = (recipient: Recipient): string => {
    const template = MESSAGE_TEMPLATES.find(t => t.id === selectedTemplate)
    let message = template?.template || ''
    
    // Get the first selected program for main info
    const mainProgram = selectedPrograms.length > 0 
      ? programs.find(p => p._id === selectedPrograms[0]) 
      : null
    
    // Church name (can be configured in settings or use default)
    message = message.replace('{church_name}', 'Iglesia Dios Fuerte')
    
    // Activity name from program
    message = message.replace('{activity_name}', mainProgram?.activityType?.name || 'Actividad')
    
    // Date formatting
    const formattedDate = mainProgram?.programDate 
      ? safeDateParse(mainProgram.programDate).toLocaleDateString('es-DO', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          timeZone: 'America/Santo_Domingo'
        })
      : ''
    message = message.replace('{date}', formattedDate)
    
    // Time (default to common service time)
    message = message.replace('{time}', '7:00 PM')
    
    // Build assignments list for this recipient
    let assignmentsList = ''
    if (recipient.roleInProgram) {
      assignmentsList = `• ${recipient.roleInProgram}: ${recipient.name}`
    } else if (mainProgram?.assignments && mainProgram.assignments.length > 0) {
      assignmentsList = mainProgram.assignments
        .map(a => `• ${a.roleName || 'Participante'}: ${a.personId?.fullName || 'Por asignar'}`)
        .join('\n')
    }
    message = message.replace('{assignments}', assignmentsList)
    
    // Cleaning group specific
    message = message.replace('{group_number}', mainProgram?.assignedGroupNumber?.toString() || '1')
    message = message.replace('{total_groups}', mainProgram?.totalGroups?.toString() || '1')
    
    // Cleaning members list
    const membersList = mainProgram?.cleaningMembers
      ?.map(m => `• ${m.name}`)
      .join('\n') || ''
    message = message.replace('{members}', membersList)
    
    // Role for reminder template
    message = message.replace('{role}', recipient.roleInProgram || 'Participante')
    
    // Generic variables (legacy support)
    message = message.replace('{nombre}', recipient.name.split(' ')[0])
    message = message.replace('{programa}', mainProgram?.activityType?.name || '')
    message = message.replace('{fecha}', formattedDate)
    
    // Add PDF links if available
    const pdfLinks = selectedPrograms
      .map(id => pdfUrls[id])
      .filter(Boolean)
    
    if (pdfLinks.length > 0) {
      message += '\n\n📎 *Ver programa completo:*'
      pdfLinks.forEach((url, idx) => {
        const prog = programs.find(p => p._id === selectedPrograms[idx])
        const progName = prog?.activityType?.name || 'Programa'
        message += `\n${progName}: ${url}`
      })
    }
    
    return message
  }
  
  // ── Clean phone number for wa.me ──────────────────────────────────────────────
  
  const cleanPhoneForWhatsApp = (phone: string): string => {
    // Remove everything except digits
    let cleaned = phone.replace(/[^\d]/g, '')
    
    // If starts with 0, remove it
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1)
    }
    
    // If doesn't start with country code, add Dominican Republic code
    if (cleaned.length === 10) {
      // Assuming Dominican Republic number without country code
      cleaned = '1' + cleaned
    }
    
    return cleaned
  }
  
  // ── Open WhatsApp for a recipient ─────────────────────────────────────────────
  
  const openWhatsApp = (recipient: Recipient) => {
    const message = buildMessage(recipient)
    const phone = cleanPhoneForWhatsApp(recipient.phone)
    const encodedMessage = encodeURIComponent(message)
    
    // Use wa.me for direct WhatsApp link
    const url = `https://wa.me/${phone}?text=${encodedMessage}`
    
    // Open in new tab
    window.open(url, '_blank')
    
    // Mark as sent
    setSentRecipients(prev => new Set([...prev, recipient.id]))
    
    toast.success(`WhatsApp abierto para ${recipient.name}`)
  }
  
  // ── Send to next recipient ────────────────────────────────────────────────────
  
  const sendToNext = () => {
    const pending = selectedRecipients.filter(r => !sentRecipients.has(r.id))
    if (pending.length === 0) {
      toast.success('🎉 ¡Todos los mensajes han sido enviados!')
      return
    }
    openWhatsApp(pending[0])
  }
  
  // ── Send to all (opens multiple tabs) ─────────────────────────────────────────
  
  const handleSendAll = () => {
    const pending = selectedRecipients.filter(r => !sentRecipients.has(r.id))
    if (pending.length === 0) {
      toast.info('Ya enviaste a todos los destinatarios')
      return
    }
    
    if (pending.length > 5) {
      toast.warning(
        `Se abrirán ${pending.length} pestañas. Tu navegador puede bloquearlas.`,
        { duration: 5000 }
      )
    }
    
    // Open all with small delay
    pending.forEach((recipient, index) => {
      setTimeout(() => openWhatsApp(recipient), index * 500)
    })
  }
  
  // ── Finish and go back ────────────────────────────────────────────────────────
  
  const handleFinish = () => {
    const sent = sentRecipients.size
    const total = selectedRecipients.length
    
    if (sent === total) {
      toast.success(`✅ ${sent} mensaje${sent !== 1 ? 's' : ''} enviado${sent !== 1 ? 's' : ''}`)
    } else if (sent > 0) {
      toast.warning(`Enviados ${sent} de ${total} mensajes`)
    }
    
    navigate('/programs')
  }

  // ── RENDER STEP 1: Programs ─────────────────────────────────────────────────
  
  const renderStep1 = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" />
            Seleccionar Programas
          </h3>
          <p className="text-sm text-neutral-500 mt-0.5">Elige los programas que deseas compartir por WhatsApp</p>
        </div>
        <Button variant="outline" size="sm" onClick={selectAllPrograms} className="gap-2">
          <Check className="w-4 h-4" />
          {selectedPrograms.length === filteredPrograms.length ? 'Ninguno' : 'Todos'}
        </Button>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <Input
          placeholder="Buscar por actividad o fecha..."
          value={programFilter}
          onChange={(e) => setProgramFilter(e.target.value)}
          className="pl-10 bg-white"
        />
      </div>
      
      <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
        {filteredPrograms.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            <Calendar className="w-16 h-16 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No hay programas disponibles</p>
            <p className="text-sm">Genera programas primero para compartirlos</p>
          </div>
        ) : (
          filteredPrograms.map((prog) => {
            const isSelected = selectedPrograms.includes(prog._id)
            const isCleaning = prog.generationType === 'cleaning_groups'
            return (
              <motion.div
                key={prog._id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => toggleProgram(prog._id)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 shadow-md'
                    : 'border-neutral-200 hover:border-green-300 bg-white hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected 
                      ? 'border-green-500 bg-green-500' 
                      : 'border-neutral-300 bg-white'
                  }`}>
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                  
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isCleaning 
                      ? 'bg-gradient-to-br from-amber-100 to-orange-100' 
                      : 'bg-gradient-to-br from-blue-100 to-indigo-100'
                  }`}>
                    {isCleaning ? '🧹' : '📋'}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        isCleaning 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {prog.activityType?.name || 'Programa'}
                      </span>
                      {isCleaning && prog.assignedGroupNumber && (
                        <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                          Grupo {prog.assignedGroupNumber}/{prog.totalGroups}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        prog.status === 'PUBLISHED' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-neutral-100 text-neutral-500'
                      }`}>
                        {prog.status === 'PUBLISHED' ? 'Publicado' : 'Borrador'}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-neutral-700 mt-1.5 capitalize">
                      {formatDate(prog.programDate)}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {isCleaning 
                        ? `${prog.cleaningMembers?.length || 0} miembros asignados`
                        : `${prog.assignments?.length || 0} asignaciones`
                      }
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>
      
      {selectedPrograms.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-3 border-t flex items-center justify-between"
        >
          <p className="text-sm text-green-600 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {selectedPrograms.length} programa{selectedPrograms.length !== 1 ? 's' : ''} seleccionado{selectedPrograms.length !== 1 ? 's' : ''}
          </p>
          <div className="flex -space-x-2">
            {selectedPrograms.slice(0, 3).map(id => {
              const prog = programs.find(p => p._id === id)
              return (
                <div key={id} className="w-8 h-8 rounded-full bg-green-100 border-2 border-white flex items-center justify-center text-xs">
                  {prog?.generationType === 'cleaning_groups' ? '🧹' : '📋'}
                </div>
              )
            })}
            {selectedPrograms.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-green-500 text-white border-2 border-white flex items-center justify-center text-xs font-bold">
                +{selectedPrograms.length - 3}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )

  // ── RENDER STEP 2: Recipients ───────────────────────────────────────────────
  
  const renderStep2 = () => (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-green-600" />
          Seleccionar Destinatarios
        </h3>
        <p className="text-sm text-neutral-500 mt-0.5">
          Elige a quién enviar los programas • Solo se muestran personas con teléfono registrado
        </p>
      </div>
      
      {/* Quick actions */}
      {assignedRecipients.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200"
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-green-800">{assignedRecipients.length} personas asignadas</p>
                <p className="text-xs text-green-600">en los programas seleccionados</p>
              </div>
            </div>
            <Button 
              size="sm" 
              onClick={selectAssignedOnly}
              className="bg-green-600 hover:bg-green-700 gap-2"
            >
              <Users className="w-4 h-4" />
              Seleccionar asignados
            </Button>
          </div>
        </motion.div>
      )}
      
      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'all', label: 'Todos', icon: Users, count: allMembersWithPhone.length },
          { id: 'assigned', label: 'Asignados', icon: CheckCircle2, count: assignedRecipients.length },
          { id: 'all-members', label: 'Miembros', icon: User, count: allMembersWithPhone.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setRecipientType(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              recipientType === tab.id
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
              recipientType === tab.id ? 'bg-white/20' : 'bg-neutral-200'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>
      
      {/* Search and select all */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            placeholder="Buscar por nombre, teléfono o rol..."
            value={recipientFilter}
            onChange={(e) => setRecipientFilter(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowAddManual(!showAddManual)}
          className="gap-1 whitespace-nowrap border-green-300 text-green-600 hover:bg-green-50"
        >
          <UserPlus className="w-4 h-4" />
          Agregar
        </Button>
        <Button variant="outline" size="sm" onClick={selectAllRecipients} className="gap-1 whitespace-nowrap">
          <Check className="w-4 h-4" />
          {selectedRecipients.length === filteredRecipients.length ? 'Ninguno' : 'Todos'}
        </Button>
      </div>
      
      {/* Add manual phone form */}
      <AnimatePresence>
        {showAddManual && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-blue-800">Agregar número manualmente</p>
                  <p className="text-xs text-blue-600">Ingresa un número de WhatsApp para agregar</p>
                </div>
                <button 
                  onClick={() => setShowAddManual(false)}
                  className="ml-auto text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <Input
                    placeholder="Nombre (opcional)"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="bg-white"
                  />
                </div>
                <div className="sm:col-span-1">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <Input
                      placeholder="Número de WhatsApp"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      className="pl-10 bg-white"
                      onKeyDown={(e) => e.key === 'Enter' && addManualRecipient()}
                    />
                  </div>
                </div>
                <Button 
                  onClick={addManualRecipient}
                  className="bg-blue-600 hover:bg-blue-700 gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </Button>
              </div>
              
              <p className="text-xs text-blue-500 mt-2">
                Ejemplo: 809-555-1234 o +1809555123
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Recipients list */}
      <div className="space-y-2 max-h-[38vh] overflow-y-auto pr-2 custom-scrollbar">
        {filteredRecipients.length === 0 && selectedRecipients.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            <Phone className="w-16 h-16 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No hay destinatarios disponibles</p>
            <p className="text-sm">Registra teléfonos a los miembros o agrega uno manualmente</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowAddManual(true)}
              className="mt-4 gap-2 border-green-300 text-green-600 hover:bg-green-50"
            >
              <UserPlus className="w-4 h-4" />
              Agregar número manual
            </Button>
          </div>
        ) : filteredRecipients.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <Search className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p className="font-medium">No se encontraron resultados</p>
            <p className="text-sm">Intenta con otro término de búsqueda</p>
          </div>
        ) : (
          filteredRecipients.map((recipient) => {
            const isSelected = selectedRecipients.some(r => r.id === recipient.id)
            return (
              <motion.div
                key={recipient.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => toggleRecipient(recipient)}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 shadow-md'
                    : 'border-neutral-200 hover:border-green-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Checkbox */}
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    isSelected ? 'border-green-500 bg-green-500' : 'border-neutral-300'
                  }`}>
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                  
                  {/* Avatar */}
                  <PersonAvatar name={recipient.name} selected={isSelected} />
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-neutral-800 truncate">{recipient.name}</p>
                      {recipient.id.startsWith('manual_') && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 font-medium">
                          Manual
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-neutral-500 flex items-center gap-1.5">
                        <PhoneCall className="w-3.5 h-3.5 text-green-500" />
                        {formatPhone(recipient.phone)}
                      </span>
                      {recipient.roleInProgram && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 font-medium">
                          {recipient.roleInProgram}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Remove button for manual recipients */}
                  {recipient.id.startsWith('manual_') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeRecipient(recipient.id)
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                      title="Eliminar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  
                  {/* WhatsApp icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isSelected 
                      ? 'bg-green-500 text-white' 
                      : 'bg-green-100 text-green-600'
                  }`}>
                    <MessageCircle className="w-5 h-5" />
                  </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>
      
      {/* Selection summary */}
      {selectedRecipients.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-3 border-t"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-green-600 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {selectedRecipients.length} destinatario{selectedRecipients.length !== 1 ? 's' : ''} seleccionado{selectedRecipients.length !== 1 ? 's' : ''}
            </p>
            <div className="flex -space-x-2">
              {selectedRecipients.slice(0, 5).map(r => (
                <div key={r.id} className={`w-8 h-8 rounded-full ${r.color} border-2 border-white flex items-center justify-center text-xs font-bold text-white`}>
                  {r.initials}
                </div>
              ))}
              {selectedRecipients.length > 5 && (
                <div className="w-8 h-8 rounded-full bg-green-500 text-white border-2 border-white flex items-center justify-center text-xs font-bold">
                  +{selectedRecipients.length - 5}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )

  // ── RENDER STEP 3: Message ──────────────────────────────────────────────────
  
  const renderStep3 = () => (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-green-600" />
          Configurar Mensaje
        </h3>
        <p className="text-sm text-neutral-500 mt-0.5">Selecciona la plantilla y formato de envío</p>
      </div>
      
      {/* Template selection */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-neutral-700">Plantilla de Mensaje</Label>
        <div className="grid gap-3">
          {MESSAGE_TEMPLATES.map((tmpl) => (
            <motion.div
              key={tmpl.id}
              whileTap={{ scale: 0.99 }}
              onClick={() => setSelectedTemplate(tmpl.id)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedTemplate === tmpl.id
                  ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50'
                  : 'border-neutral-200 hover:border-green-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedTemplate === tmpl.id ? 'border-green-500 bg-green-500' : 'border-neutral-300'
                }`}>
                  {selectedTemplate === tmpl.id && <Check className="w-4 h-4 text-white" />}
                </div>
                <span className="text-2xl">{tmpl.icon}</span>
                <span className="font-medium">{tmpl.name}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Send format options */}
      <div className="space-y-3 pt-4 border-t">
        <Label className="text-sm font-semibold text-neutral-700">Formato de Envío</Label>
        <div className="grid grid-cols-2 gap-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setSendAsImage(true)}
            className={`p-5 rounded-2xl border-2 transition-all ${
              sendAsImage
                ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50'
                : 'border-neutral-200 hover:border-green-300 bg-white'
            }`}
          >
            <Image className={`w-10 h-10 mx-auto mb-3 ${sendAsImage ? 'text-green-600' : 'text-neutral-400'}`} />
            <p className={`font-semibold ${sendAsImage ? 'text-green-700' : 'text-neutral-600'}`}>
              Imagen + Texto
            </p>
            <p className="text-xs text-neutral-500 mt-1">Envía el flyer como imagen</p>
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setSendAsImage(false)}
            className={`p-5 rounded-2xl border-2 transition-all ${
              !sendAsImage
                ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50'
                : 'border-neutral-200 hover:border-green-300 bg-white'
            }`}
          >
            <FileText className={`w-10 h-10 mx-auto mb-3 ${!sendAsImage ? 'text-green-600' : 'text-neutral-400'}`} />
            <p className={`font-semibold ${!sendAsImage ? 'text-green-700' : 'text-neutral-600'}`}>
              Solo Texto
            </p>
            <p className="text-xs text-neutral-500 mt-1">Mensaje formateado</p>
          </motion.button>
        </div>
      </div>
      
      {/* Preview */}
      <div className="pt-4 border-t">
        <Label className="text-sm font-semibold text-neutral-700 mb-3 block">Vista Previa</Label>
        <div className="bg-[#0b141a] p-6 rounded-2xl">
          <div className="max-w-[300px] mx-auto">
            <div className="bg-[#005c4b] rounded-t-2xl rounded-br-2xl p-3 shadow-lg">
              {sendAsImage && (
                <div className="bg-neutral-800/30 rounded-xl h-36 flex items-center justify-center mb-2">
                  <Image className="w-10 h-10 text-white/50" />
                </div>
              )}
              <pre className="text-sm whitespace-pre-wrap font-sans text-white/90">
                {MESSAGE_TEMPLATES.find(t => t.id === selectedTemplate)?.template
                  .replace('{church_name}', 'Iglesia Dios Fuerte')
                  .replace('{activity_name}', 'Culto de Jóvenes')
                  .replace('{date}', 'Sábado, 15 de marzo')
                  .replace('{time}', '7:00 PM')
                  .replace('{assignments}', '• Predicador: Juan Pérez\n• Alabanza: María López')
                  .replace('{group_number}', '3')
                  .replace('{total_groups}', '6')
                  .replace('{members}', '• Pedro García\n• Ana Martínez')
                  .replace('{role}', 'Alabanza')
                }
              </pre>
            </div>
            <p className="text-xs text-white/40 text-right mt-2 pr-2">10:30 AM ✓✓</p>
          </div>
        </div>
      </div>
    </div>
  )

  // ── RENDER STEP 4: Send (Real WhatsApp) ──────────────────────────────────────
  
  const renderStep4 = () => {
    const pending = selectedRecipients.filter(r => !sentRecipients.has(r.id))
    const sent = selectedRecipients.filter(r => sentRecipients.has(r.id))
    const progress = selectedRecipients.length > 0 
      ? Math.round((sent.length / selectedRecipients.length) * 100) 
      : 0
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl flex items-center justify-center mb-5 shadow-xl"
          >
            <Send className="w-12 h-12 text-white" />
          </motion.div>
          <h3 className="text-2xl font-bold text-neutral-800">Enviar por WhatsApp</h3>
          <p className="text-neutral-500 mt-1">Haz clic en cada destinatario para abrir WhatsApp</p>
        </div>
        
        {/* Progress bar */}
        <div className="bg-neutral-100 rounded-full h-3 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
          />
        </div>
        <p className="text-center text-sm text-neutral-600 font-medium">
          {sent.length} de {selectedRecipients.length} enviados ({progress}%)
        </p>
        
        {/* Quick actions */}
        <div className="flex gap-3 justify-center">
          <Button
            onClick={sendToNext}
            disabled={pending.length === 0}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            <Send className="w-4 h-4" />
            Enviar al siguiente
          </Button>
          {pending.length > 1 && (
            <Button
              onClick={handleSendAll}
              variant="outline"
              className="gap-2 border-green-300 text-green-700 hover:bg-green-50"
            >
              <Users className="w-4 h-4" />
              Enviar a todos ({pending.length})
            </Button>
          )}
        </div>
        
        {/* Recipients list */}
        <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-2">
          {/* Pending recipients */}
          {pending.length > 0 && (
            <>
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-2">
                ⏳ Pendientes ({pending.length})
              </p>
              {pending.map(recipient => (
                <motion.button
                  key={recipient.id}
                  onClick={() => openWhatsApp(recipient)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border-2 border-amber-200 hover:border-green-400 hover:shadow-md transition-all text-left"
                >
                  <PersonAvatar name={recipient.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-800 truncate">{recipient.name}</p>
                    <p className="text-sm text-neutral-500">{formatPhone(recipient.phone)}</p>
                  </div>
                  <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
                    <MessageCircle className="w-5 h-5" />
                    Enviar
                  </div>
                </motion.button>
              ))}
            </>
          )}
          
          {/* Sent recipients */}
          {sent.length > 0 && (
            <>
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mt-4 mb-2">
                ✅ Enviados ({sent.length})
              </p>
              {sent.map(recipient => (
                <div
                  key={recipient.id}
                  className="flex items-center gap-4 p-4 bg-green-50 rounded-2xl border-2 border-green-200 opacity-70"
                >
                  <PersonAvatar name={recipient.name} size="sm" selected />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-green-800 truncate">{recipient.name}</p>
                    <p className="text-sm text-green-600">{formatPhone(recipient.phone)}</p>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
              ))}
            </>
          )}
        </div>
        
        {/* Finish button */}
        <div className="pt-4 border-t">
          <Button
            onClick={handleFinish}
            variant="outline"
            className="w-full h-12 gap-2"
          >
            {sent.length === selectedRecipients.length ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Finalizar
              </>
            ) : (
              <>
                Finalizar ({sent.length}/{selectedRecipients.length} enviados)
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // ── MAIN RENDER ─────────────────────────────────────────────────────────────
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center animate-pulse">
          <MessageCircle className="w-10 h-10 text-white" />
        </div>
        <Loader2 className="animate-spin h-6 w-6 text-green-600" />
        <p className="text-neutral-500">Cargando datos...</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/programs')} className="rounded-xl">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-800 flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              Compartir por WhatsApp
            </h1>
            <p className="text-sm text-neutral-500">Envía programas y asignaciones a miembros</p>
          </div>
        </div>
      </motion.div>
      
      {/* Wizard Card */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden">
        <CardContent className="p-6 sm:p-8">
          <StepIndicator currentStep={step} steps={STEPS} />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
            >
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}
            </motion.div>
          </AnimatePresence>
          
          {/* Navigation */}
          {step < 4 && (
            <div className="flex justify-between pt-6 mt-6 border-t">
              <Button
                variant="outline"
                onClick={step === 1 ? () => navigate('/programs') : prevStep}
                className="gap-2 rounded-xl h-11"
                disabled={generatingPdfs}
              >
                <ChevronLeft className="w-4 h-4" />
                {step === 1 ? 'Cancelar' : 'Anterior'}
              </Button>
              <Button
                onClick={nextStep}
                disabled={!canProceed() || generatingPdfs}
                className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl h-11 px-6 shadow-lg"
              >
                {generatingPdfs ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generando PDFs...
                  </>
                ) : (
                  <>
                    {step === 3 ? 'Generar y Continuar' : 'Siguiente'}
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  )
}

export default WhatsAppWizardPage
