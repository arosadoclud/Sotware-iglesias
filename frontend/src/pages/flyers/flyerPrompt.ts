export interface FlyerSpeaker {
  id: string
  name: string
  role: string
  photoName?: string
}
export interface FlyerBrief {
  church: string
  theme: string
  date: string
  time: string
  location: string
  style: string
  size: string
  notes: string
}
export const initialBrief: FlyerBrief = {
  church: '',
  theme: '',
  date: '',
  time: '',
  location: '',
  style: 'Elegante: azul marino, marfil y dorado',
  size: 'Vertical 1080 × 1350 px',
  notes: ''
}
export function buildFlyerPrompt(brief: FlyerBrief, speakers: FlyerSpeaker[]) {
  const date = brief.date
    ? new Date(brief.date + 'T12:00:00').toLocaleDateString('es-DO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : '[Fecha]'
  return `Crea un flyer profesional para una actividad de iglesia cristiana, listo para compartir. Genera la imagen, no solamente una descripción.

DATOS EXACTOS DEL FLYER
Iglesia: ${brief.church || '[Nombre de la iglesia]'}
Tema: ${brief.theme || '[Tema]'}
Fecha: ${date}
Hora: ${brief.time || '[Hora]'}
Lugar: ${brief.location || '[Lugar]'}
Formato: ${brief.size}
Estilo: ${brief.style}

PREDICADORES O EXPOSITORES
${speakers.length ? speakers.map((speaker, i) => `${i + 1}. ${speaker.role || 'Expositor/a'}: ${speaker.name || '[Nombre]'} — ${speaker.photoName ? 'usar la fotografía adjunta llamada «' + speaker.photoName + '»' : 'sin foto; presentar únicamente su nombre y cargo, sin inventar un retrato'}`).join('\n') : 'No incluir predicadores o expositores.'}

DIRECCIÓN VISUAL
Usa una jerarquía clara, composición equilibrada, tipografía legible en móvil, márgenes amplios y contraste cuidado. El tema debe ser el protagonista. Integra el logo adjunto de la iglesia sin redibujarlo ni alterar sus letras, colores o proporciones. Respeta los rasgos de las personas de las fotografías y no los sustituyas por otros rostros. Si falta un adjunto indicado, pídelo antes de generar. No inventes nombres, teléfonos, fechas, patrocinadores ni información adicional. Revisa la ortografía en español. No incluyas estas instrucciones dentro del diseño.
${brief.notes.trim() ? '\nINDICACIONES ADICIONALES\n' + brief.notes.trim() + '\n' : ''}
ADJUNTOS QUE DEBO PROPORCIONAR EN ESTE CHAT
- Logo actualizado de la iglesia: arca-logo.png
${
  speakers
    .filter((s) => s.photoName)
    .map((s) => '- ' + s.photoName + ' → ' + s.name)
    .join('\n') ||
  '- No hay fotos de participantes; crear el diseño sin retratos.'
}`
}
