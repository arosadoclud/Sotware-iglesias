# Identidad visual y permisos en vivo

## Cambios

- Logo ARCA / DIOS FUERTE sin el texto superior, con mayor tamaño y fondo claro. Se conserva el archivo original recibido fuera de los assets de la aplicación; el logo de uso está en `frontend/public/arca-logo.png` y `backend/public/arca-logo.png`.
- Identidad compartida en azul profundo, dorado y fondos claros: navegación, acceso, registro, panel principal, tarjetas, controles y tablas. Los colores de estados y acciones destructivas se conservan.
- Editor unificado: se elimina la duplicación de formulario y vista previa entre móvil y escritorio. Barra de herramientas con acciones claras, estado real de guardado, pestañas en pantallas estrechas y campos de participantes en una fila completa con su etiqueta.
- PDF y compartir guardan primero los cambios. El estado no anuncia que se guardaron si falla la solicitud. El PDF local sigue disponible como exportación de vista previa.
- El logo se incrusta en los tres renderizadores de PDF para que no dependa de rutas de uploads ni de descargarlo desde un proveedor externo. Se verifica la igualdad entre el asset del frontend y el backend.
- La exportación de limpieza cierra el navegador incluso al fallar y deja de esperar `networkidle0`, que podía bloquear la generación por fuentes externas.

## Sesiones y permisos

El backend ya consultaba al usuario en MongoDB por cada petición HTTP. El navegador conservaba el rol y los permisos del inicio de sesión en el almacenamiento local y no tenía una suscripción para recibir cambios.

Ahora Socket.IO autentica la conexión con el JWT y obtiene iglesia e identidad desde la base de datos, no desde parámetros del cliente. Las notificaciones de sesión se envían solo a la sala del usuario dentro de su iglesia. La notificación de directorio solo invalida la lista de esa iglesia y no contiene perfiles ni permisos.

Al recibir una notificación, el frontend consulta `/auth/me`, actualiza su estado y recalcula navegación y acceso a la ruta actual. También sincroniza al reconectar, volver a la pestaña y recuperar conexión; una consulta por minuto ofrece recuperación si se pierde un evento. Las respuestas antiguas se descartan si cambió la sesión. Las cuentas desactivadas o eliminadas cierran sesión al recibir el 401 del servidor.

Las operaciones administrativas que crean, actualizan, desactivan, reactivan, eliminan o modifican permisos emiten la invalidación después de guardar. La lista de usuarios se vuelve a consultar cuando recibe el evento.

Se corrigió una inconsistencia adicional: el middleware restauraba los permisos predeterminados del rol cuando la lista personalizada estaba vacía. Ahora coincide con el modelo: personalización activa + lista vacía = ningún permiso.

## Verificación

- Compilación TypeScript del frontend y comprobación de tipos del backend sin generación de declaraciones.
- 47 comprobaciones de anchura en navegador a 320, 375, 390, 768, 1024 y 1440 px. Incluyen el generador, editor, lista y revisión por lote, sin desbordamiento horizontal del documento en esos casos.
- Pruebas de guardado correcto, fallo de guardado y reintento, un solo campo por dato y carga del logo.
- Prueba de navegador con Socket.IO real y respuestas HTTP simuladas: cambio de rol, aparición del menú al conceder permisos, salida de la ruta al revocarlos y cierre de sesión al desactivar la cuenta, sin recargar.
- Nueve pruebas Jest del backend: aislamiento de eventos por usuario/iglesia, rechazo de tokens falsos y cuentas inactivas, permisos vigentes frente a JWT antiguos, revocación con lista vacía, concesión nueva, logo y auditoría.
- Tres PDF reales generados mediante los renderizadores de la aplicación y revisados como PNG: programa individual, limpieza y exportación por lote, una página cada uno con siete participantes de prueba.

No se utilizaron cuentas reales para las pruebas ni se cambiaron roles o datos de producción. Falta comprobar Safari/iPhone físico y el funcionamiento después del despliegue con dos sesiones reales.

Los scripts reproducibles están en `frontend/scripts/check-responsive.cjs` y `frontend/scripts/check-live-session.cjs`. Requieren Playwright y Edge, frontend local en el puerto 5173; el segundo utiliza el puerto 5000 para un servidor de prueba sin MongoDB. `PLAYWRIGHT_MODULE` permite indicar el módulo disponible en el entorno. No apuntarlos a producción.

El ejecutor Vitest configurado en el proyecto presenta una incompatibilidad previa entre Vitest 4 y Vite 5 (`vite/module-runner`). Por eso la verificación del frontend de este cambio se hizo con las pruebas de navegador descritas; no se declara pasada la suite Vitest. La compilación backend original con declaraciones sigue teniendo la limitación local TS2742 de pnpm descrita en la revisión anterior.

El transporte de eventos de este cambio está previsto para la instancia única actual. Si el backend pasa a varias réplicas, será necesario compartir las salas y eventos mediante un adaptador de Socket.IO, como Redis.
