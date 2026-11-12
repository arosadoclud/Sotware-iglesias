import { Step } from 'react-joyride'

const step = (title: string, description: string, target = 'body'): Step => ({
  target,
  content: <div><h3 style={{ fontWeight: 700, marginBottom: 8 }}>{title}</h3><p style={{ lineHeight: 1.6 }}>{description}</p></div>,
  placement: target === 'body' ? 'center' : 'right',
  disableBeacon: true,
})

export const ADMIN_TOUR: Step[] = [
  step('Bienvenido a tu iglesia', 'Este recorrido te ayudará a encontrar las herramientas principales. Usa Siguiente para avanzar o Saltar tour para cerrarlo.'),
  step('Inicio', 'Aquí ves un resumen de las actividades y los datos principales de tu iglesia.', '.sidebar-dashboard'),
  step('Personas', 'Abre el directorio para buscar personas. Haz clic en un nombre para ver correo, teléfono, ministerio, roles y la cuenta conectada.', '.sidebar-personas'),
  step('Actividades', 'Organiza y consulta las actividades de la comunidad.', '.sidebar-activities'),
  step('Programas', 'Prepara los programas y consulta la planificación de los cultos.', '.sidebar-programs'),
  step('Finanzas', 'Consulta ingresos y gastos de la iglesia según tus permisos.', '.sidebar-finances'),
  step('Configuración', 'Gestiona los ajustes de la iglesia y las cuentas de usuario. Desde el menú puedes volver a abrir este recorrido.', '.sidebar-settings'),
  step('Listo para comenzar', 'Puedes empezar desde Inicio o elegir cualquier sección del menú. El recorrido está disponible de nuevo desde «Ver tour de ayuda».')
]

export const VIEWER_TOUR: Step[] = [
  step('Bienvenido', 'Te mostraremos cómo encontrar las funciones disponibles para tu cuenta. Puedes saltar el recorrido cuando quieras.'),
  step('Inicio', 'Consulta aquí el resumen de la iglesia y las novedades.', '.sidebar-dashboard'),
  step('Explora el menú', 'Las opciones que ves dependen de los permisos de tu cuenta. Selecciona una para consultar su información.'),
  step('Listo', 'Ya puedes empezar. Usa «Ver tour de ayuda» si necesitas repetir esta guía.')
]
