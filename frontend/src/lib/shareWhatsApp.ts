import { programsApi } from './api'
import { toast } from 'sonner'

// ── Helpers internos ─────────────────────────────────────────────────────────

/** Descarga un archivo al dispositivo del usuario */
function downloadFile(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/** Abre WhatsApp (Web o app) con un mensaje pre-escrito */
function openWhatsAppWithMessage(message: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
}

/**
 * Ejecuta navigator.share con archivos.
 * Muestra un toast con botón "Enviar por WhatsApp" para que el usuario
 * lo toque y así se cree un gesto de usuario fresco (requerido por el navegador).
 */
function promptShareWithFiles(
  files: File[],
  title: string,
  text: string,
  fallbackMessage: string
) {
  const canShare = navigator.share && navigator.canShare?.({ files })
  if (!canShare) {
    // Sin soporte: descargar + abrir WhatsApp con texto
    files.forEach(f => downloadFile(f, f.name))
    openWhatsAppWithMessage(fallbackMessage)
    toast.success(
      files.length === 1
        ? 'PDF descargado. Adjúntalo en la conversación de WhatsApp.'
        : `${files.length} PDFs descargados. Adjúntalos en WhatsApp.`,
      { duration: 5000 }
    )
    return
  }

  // Con soporte: mostrar toast con botón de acción.
  // El clic en el botón crea un gesto de usuario fresco → navigator.share funciona siempre.
  toast(
    `📎 ${files.length === 1 ? 'PDF listo' : `${files.length} PDFs listos`} para compartir`,
    {
      duration: 30000,
      action: {
        label: '📱 Enviar por WhatsApp',
        onClick: async () => {
          try {
            await navigator.share({ title, text, files })
            toast.success('Compartido exitosamente')
          } catch (err: any) {
            if (err?.name === 'AbortError') return
            // Fallback final si aún falla
            console.info('Share falló, usando fallback:', err?.message)
            files.forEach(f => downloadFile(f, f.name))
            openWhatsAppWithMessage(fallbackMessage)
            toast.success('PDF descargado. Adjúntalo en WhatsApp.', { duration: 5000 })
          }
        },
      },
    }
  )
}

// ── Funciones públicas ───────────────────────────────────────────────────────

/**
 * Compartir un PDF de programa por WhatsApp.
 * Descarga el PDF del backend y muestra un botón para compartir con adjunto.
 */
export async function sharePdfViaWhatsApp(
  programId: string,
  programInfo: {
    activityName?: string
    dateStr?: string
    churchName?: string
  }
): Promise<void> {
  const actName = programInfo.activityName?.replace(/\s+/g, '-') || 'programa'
  const dateStr = programInfo.dateStr || 'sin-fecha'
  const fileName = `${actName}-${dateStr}.pdf`

  try {
    const res = await programsApi.downloadPdf(programId)
    const blob = new Blob([res.data], { type: 'application/pdf' })
    const file = new File([blob], fileName, { type: 'application/pdf' })

    const title = `Programa - ${programInfo.activityName || 'Iglesia'}`
    const text = `📋 ${programInfo.activityName || 'Programa'}\n📅 ${programInfo.dateStr || ''}\n🏛️ ${programInfo.churchName || ''}`
    const fallbackMsg =
      `📋 *${programInfo.activityName || 'Programa'}*\n` +
      `📅 ${programInfo.dateStr || ''}\n` +
      `🏛️ ${programInfo.churchName || ''}\n\n` +
      `📎 _El PDF del programa ha sido descargado. Adjúntalo a esta conversación._`

    promptShareWithFiles([file], title, text, fallbackMsg)
  } catch (error: any) {
    if (error?.name === 'AbortError') return
    console.error('Error al compartir PDF:', error)
    toast.error('Error al generar o compartir el PDF')
  }
}

/**
 * Compartir múltiples PDFs por WhatsApp.
 * Descarga todos los PDFs y muestra un botón para compartirlos con adjunto.
 */
export async function shareMultiplePdfsViaWhatsApp(
  programs: Array<{
    _id: string
    activityType?: { name: string }
    programDate: string
    churchName?: string
  }>,
  churchName?: string
): Promise<void> {
  if (programs.length === 0) {
    toast.info('No hay programas para compartir')
    return
  }

  const toastId = toast.loading(`Preparando ${programs.length} PDF${programs.length > 1 ? 's' : ''}...`)

  try {
    const files: File[] = []
    const formatDate = (ds: string) => {
      try {
        const d = new Date(ds)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      } catch { return ds }
    }

    for (const prog of programs) {
      const actName = prog.activityType?.name?.replace(/\s+/g, '-') || 'programa'
      const dateStr = formatDate(prog.programDate)
      const fileName = `${actName}-${dateStr}.pdf`

      const res = await programsApi.downloadPdf(prog._id)
      const blob = new Blob([res.data], { type: 'application/pdf' })
      files.push(new File([blob], fileName, { type: 'application/pdf' }))
    }

    toast.dismiss(toastId)

    const actNames = [...new Set(programs.map(p => p.activityType?.name || 'Programa'))]
    const title = `${programs.length} Programas`
    const text = `📋 ${actNames.join(', ')}\n🏛️ ${churchName || ''}`
    const fallbackMsg =
      `📋 *${actNames.join(', ')}*\n` +
      `📎 ${programs.length} programa${programs.length > 1 ? 's' : ''}\n` +
      `🏛️ ${churchName || ''}\n\n` +
      `📎 _Los PDFs han sido descargados. Adjúntalos a esta conversación._`

    promptShareWithFiles(files, title, text, fallbackMsg)
  } catch (error: any) {
    toast.dismiss(toastId)
    if (error?.name === 'AbortError') return
    console.error('Error al compartir PDFs:', error)
    toast.error('Error al preparar los PDFs')
  }
}
