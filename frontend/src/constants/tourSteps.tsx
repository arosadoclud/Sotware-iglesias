import { Step } from 'react-joyride'

// Helper para agregar contador de progreso en español
const withProgress = (content: JSX.Element, current: number, total: number) => (
  <div>
    <div style={{ 
      fontSize: '12px', 
      color: '#9ca3af', 
      marginBottom: '12px',
      fontWeight: '500',
      letterSpacing: '0.5px'
    }}>
      Paso {current} de {total}
    </div>
    {content}
  </div>
)

// Tour completo para usuarios con rol ADMIN
export const ADMIN_TOUR: Step[] = [
  {
    target: 'body',
    content: withProgress(
      <div style={{ padding: '8px 0' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', color: '#111827' }}>
          ¡Bienvenido al Sistema de Gestión de Iglesias! 🎉
        </h2>
        <p style={{ marginBottom: '8px', color: '#374151', lineHeight: '1.6' }}>
          Como <span style={{ fontWeight: '600', color: '#6366f1' }}>Administrador</span>, tienes acceso completo a todas las funciones del sistema.
        </p>
        <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.5' }}>
          Este tour te mostrará las principales características. Puedes saltar en cualquier momento.
        </p>
      </div>,
      1, 13
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '.dashboard-stats',
    content: withProgress(
      <div style={{ padding: '4px 0' }}>
        <h3 style={{ fontWeight: 'bold', marginBottom: '8px', color: '#111827', fontSize: '16px' }}>
          📊 Panel de Estadísticas
        </h3>
        <p style={{ color: '#374151', lineHeight: '1.6' }}>
          Aquí verás un resumen en tiempo real de tu iglesia: número de miembros, balance financiero, eventos próximos y más.
        </p>
      </div>,
      2, 13
    ),
    placement: 'bottom',
  },
  {
    target: '.sidebar-dashboard',
    content: withProgress(
      <div style={{ padding: '4px 0' }}>
        <h3 style={{ fontWeight: 'bold', marginBottom: '8px', color: '#111827', fontSize: '16px' }}>
          🏠 Dashboard Principal
        </h3>
        <p style={{ color: '#374151', lineHeight: '1.6' }}>
          Tu punto de partida. Visualiza eventos, programas y estadísticas clave de un vistazo.
        </p>
      </div>,
      3, 13
    ),
    placement: 'right',
  },
  {
    target: '.sidebar-personas',
    content: withProgress(
      <div style={{ padding: '4px 0' }}>
        <h3 style={{ fontWeight: 'bold', marginBottom: '8px', color: '#111827', fontSize: '16px' }}>
          👥 Gestión de Personas
        </h3>
        <p style={{ color: '#374151', lineHeight: '1.6', marginBottom: '8px' }}>
          Administra tu membresía completa: agrega nuevos miembros, edita información, asigna roles ministeriales y mantén un historial detallado.
        </p>
        <p style={{ fontSize: '13px', color: '#6366f1', fontWeight: '500' }}>
          ✓ Permisos: Crear, Editar, Eliminar
        </p>
      </div>,
      4, 13
    ),
    placement: 'right',
  },
  {
    target: '.sidebar-finances',
    content: withProgress(
      <div style={{ padding: '4px 0' }}>
        <h3 style={{ fontWeight: 'bold', marginBottom: '8px', color: '#111827', fontSize: '16px' }}>
          💰 Finanzas
        </h3>
        <p style={{ color: '#374151', lineHeight: '1.6', marginBottom: '8px' }}>
          Gestiona ingresos y gastos con categorías predefinidas. Crea transacciones, apruébalas y genera reportes profesionales.
        </p>
        <p style={{ fontSize: '13px', color: '#f59e0b', fontWeight: '500', marginBottom: '4px' }}>
          ⭐ El sistema calcula automáticamente el 10% de diezmos para el concilio
        </p>
        <p style={{ fontSize: '13px', color: '#6366f1', fontWeight: '500' }}>
          ✓ Permisos: Crear, Aprobar, Generar Reportes PDF
        </p>
      </div>,
      5, 13
    ),
    placement: 'right',
  },
  {
    target: '.sidebar-finance-reports',
    content: withProgress(
      <div style={{ padding: '4px 0' }}>
        <h3 style={{ fontWeight: 'bold', marginBottom: '8px', color: '#111827', fontSize: '16px' }}>
          📊 Reportes Financieros
        </h3>
        <p style={{ color: '#374151', lineHeight: '1.6', marginBottom: '8px' }}>
          Genera reportes profesionales en PDF con el logo de tu iglesia, listos para presentar en contabilidad.
        </p>
        <p style={{ fontSize: '13px', color: '#10b981', fontWeight: '500' }}>
          💡 Incluye reportes mensuales, anuales, de diezmos y ofrendas
        </p>
      </div>,
      6, 13
    ),
    placement: 'right',
  },
  {
    target: '.sidebar-letters',
    content: withProgress(
      <div style={{ padding: '4px 0' }}>
        <h3 style={{ fontWeight: 'bold', marginBottom: '8px', color: '#111827', fontSize: '16px' }}>
          📄 Generador de Cartas
        </h3>
        <p style={{ color: '#374151', lineHeight: '1.6', marginBottom: '8px' }}>
          Crea cartas oficiales con plantillas predefinidas o personalizadas. Genera PDFs con membrete de la iglesia.
        </p>
        <p style={{ fontSize: '13px', color: '#6366f1', fontWeight: '500' }}>
          ✓ Plantillas: Recomendación, Membresía, Testimonios, etc.
        </p>
      </div>,
      7, 13
    ),
    placement: 'right',
  },
  {
    target: '.sidebar-programs',
    content: withProgress(
      <div style={{ padding: '4px 0' }}>
        <h3 style={{ fontWeight: 'bold', marginBottom: '8px', color: '#111827', fontSize: '16px' }}>
          📅 Programas
        </h3>
        <p style={{ color: '#374151', lineHeight: '1.6' }}>
          Crea programas de culto con actividades, himnos, predicadores y participantes. Imprime o comparte digitalmente.
        </p>
      </div>,
      8, 13
    ),
    placement: 'right',
  },
  {
    target: '.sidebar-ministries',
    content: withProgress(
      <div style={{ padding: '4px 0' }}>
        <h3 style={{ fontWeight: 'bold', marginBottom: '8px', color: '#111827', fontSize: '16px' }}>
          🤝 Ministerios
        </h3>
        <p style={{ color: '#374151', lineHeight: '1.6' }}>
          Organiza los ministerios de la iglesia, asigna miembros y gestiona roles y responsabilidades.
        </p>
      </div>,
      9, 13
    ),
    placement: 'right',
  },
  {
    target: '.sidebar-activities',
    content: withProgress(
      <div style={{ padding: '4px 0' }}>
        <h3 style={{ fontWeight: 'bold', marginBottom: '8px', color: '#111827', fontSize: '16px' }}>
          🎯 Actividades
        </h3>
        <p style={{ color: '#374151', lineHeight: '1.6' }}>
          Programa actividades especiales de la iglesia: conferencias, retiros, campañas y eventos especiales.
        </p>
      </div>,
      10, 13
    ),
    placement: 'right',
  },
  {
    target: '.sidebar-person-statuses',
    content: withProgress(
      <div style={{ padding: '4px 0' }}>
        <h3 style={{ fontWeight: 'bold', marginBottom: '8px', color: '#111827', fontSize: '16px' }}>
          📋 Estados de Personas
        </h3>
        <p style={{ color: '#374151', lineHeight: '1.6' }}>
          Define estados personalizados para categorizar a los miembros: activos, inactivos, visitantes, nuevos convertidos, etc.
        </p>
      </div>,
      11, 13
    ),
    placement: 'right',
  },
  {
    target: '.sidebar-settings',
    content: withProgress(
      <div style={{ padding: '4px 0' }}>
        <h3 style={{ fontWeight: 'bold', marginBottom: '8px', color: '#111827', fontSize: '16px' }}>
          ⚙️ Configuración
        </h3>
        <p style={{ color: '#374151', lineHeight: '1.6' }}>
          Personaliza el sistema: información de la iglesia, logo, usuarios, roles y permisos.
        </p>
      </div>,
      12, 13
    ),
    placement: 'right',
  },
  {
    target: 'body',
    content: withProgress(
      <div style={{ padding: '8px 0' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', color: '#111827' }}>
          🎉 ¡Tour Completado!
        </h2>
        <p style={{ color: '#374151', lineHeight: '1.6', marginBottom: '12px' }}>
          Ya conoces las funciones principales del sistema. Las secciones con la etiqueta <span style={{ fontWeight: '600', color: '#f59e0b' }}>NUEVO</span> contienen características que aún no has explorado.
        </p>
        <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}>
          💡 <strong>Consejo:</strong> Puedes volver a ver este tour desde el menú de configuración.
        </p>
      </div>,
      13, 13
    ),
    placement: 'center',
  },
]

// Tour simplificado para usuarios con permisos limitados (VIEWER)
export const VIEWER_TOUR: Step[] = [
  {
    target: 'body',
    content: withProgress(
      <div style={{ padding: '8px 0' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px', color: '#111827' }}>
          ¡Bienvenido al Sistema! 👋
        </h2>
        <p style={{ marginBottom: '8px', color: '#374151', lineHeight: '1.6' }}>
          Este tour te mostrará las funciones disponibles según tus permisos.
        </p>
        <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.5' }}>
          Puedes saltar el tour en cualquier momento.
        </p>
      </div>,
      1, 7
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '.sidebar-dashboard',
    content: withProgress(
      <div style={{ padding: '4px 0' }}>
        <h3 style={{ fontWeight: 'bold', marginBottom: '8px', color: '#111827', fontSize: '16px' }}>
          🏠 Dashboard
        </h3>
        <p style={{ color: '#374151', lineHeight: '1.6' }}>
          Visualiza estadísticas generales, eventos próximos y actividades de la iglesia.
        </p>
      </div>,
      2, 7
    ),
    placement: 'right',
  },
  {
    target: '.sidebar-personas',
    content: withProgress(
      <div style={{ padding: '4px 0' }}>
        <h3 style={{ fontWeight: 'bold', marginBottom: '8px', color: '#111827', fontSize: '16px' }}>
          👥 Gestión de Personas
        </h3>
        <p style={{ color: '#374151', lineHeight: '1.6' }}>
          Consulta el directorio de miembros de la iglesia.
        </p>
      </div>,
      3, 7
    ),
    placement: 'right',
  },
  {
    target: '.sidebar-programs',
    content: withProgress(
      <div style={{ padding: '4px 0' }}>
        <h3 style={{ fontWeight: 'bold', marginBottom: '8px', color: '#111827', fontSize: '16px' }}>
          📅 Programas
        </h3>
        <p style={{ color: '#374151', lineHeight: '1.6' }}>
          Visualiza los programas de culto y eventos programados.
        </p>
      </div>,
      4, 7
    ),
    placement: 'right',
  },
  {
    target: '.sidebar-ministries',
    content: withProgress(
      <div style={{ padding: '4px 0' }}>
        <h3 style={{ fontWeight: 'bold', marginBottom: '8px', color: '#111827', fontSize: '16px' }}>
          🤝 Ministerios
        </h3>
        <p style={{ color: '#374151', lineHeight: '1.6' }}>
          Consulta información sobre los ministerios de la iglesia.
        </p>
      </div>,
      5, 7
    ),
    placement: 'right',
  },
  {
    target: '.sidebar-activities',
    content: withProgress(
      <div style={{ padding: '4px 0' }}>
        <h3 style={{ fontWeight: 'bold', marginBottom: '8px', color: '#111827', fontSize: '16px' }}>
          🎯 Actividades
        </h3>
        <p style={{ color: '#374151', lineHeight: '1.6' }}>
          Visualiza las actividades especiales programadas.
        </p>
      </div>,
      6, 7
    ),
    placement: 'right',
  },
  {
    target: 'body',
    content: withProgress(
      <div style={{ padding: '8px 0' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', color: '#111827' }}>
          ✅ Tour Completado
        </h2>
        <p style={{ color: '#374151', lineHeight: '1.6', marginBottom: '8px' }}>
          Ya conoces las funciones disponibles para tu rol.
        </p>
        <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}>
          Si necesitas más permisos, contacta con el administrador.
        </p>
      </div>,
      7, 7
    ),
    placement: 'center',
  },
]
