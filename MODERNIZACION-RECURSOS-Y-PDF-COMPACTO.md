# Biblioteca, actividades, acceso protegido y PDF compacto

- Estudios Bíblicos adopta la cabecera con logo, búsqueda con espera breve, filtros accesibles, tarjetas editoriales, estados de error/vacío y descarga con estado visible. La búsqueda ignora respuestas anteriores y no vuelve a pedir las series en cada pulsación.
- Administración de estudios y Actividades comparten cabeceras y estilos coherentes con la iglesia. Actividades mantiene sus horarios y roles; muestra un texto alternativo si un rol ya no está disponible.
- Navegación lateral: estados seleccionado, hover y foco más discretos, sin desplazamiento lateral al pasar el cursor.
- Historial de cartas: estado vacío ilustrado con un acceso directo a crear la primera carta y mensajes para búsquedas sin coincidencias.
- Acceso protegido: diálogo con logo, descripción, campo etiquetado, botón mostrar/ocultar y mensajes de error. Radix gestiona foco, Escape y navegación con teclado. Se conserva el verificador y el alcance de desbloqueo existentes.
- PDF individual de programas: box-sizing incluye el relleno dentro de los 44 px de altura mínima; párrafos sin márgenes implícitos. Esto compacta las filas. Escala de impresión 1.15 para aprovechar mejor el ancho A4, nombres con ajuste de línea y hora normalizada para evitar AM/PM duplicado.

Verificación: TypeScript frontend y backend (sin declaraciones en backend por limitación previa de pnpm), build Vite y seis pruebas de formato horario. Playwright comprobó biblioteca/filtros/búsqueda, historial vacío, Actividades/modal y acceso protegido con contraseña errónea/correcta en 320, 390, 768 y 1440 px usando respuestas simuladas. Se generaron PDFs reales de programa, limpieza y lote; el programa estándar y un caso de siete nombres largos caben en una página y se revisaron como imágenes.

Las pruebas no modificaron registros de producción. La fuente web del PDF mantiene su alternativa serif si Google Fonts no está disponible; la espera está acotada. Vite mantiene la advertencia previa de bundle grande.

Script: frontend/scripts/check-resources-access.cjs, ejecutar desde la raíz con el frontend en puerto 5173 y PLAYWRIGHT_MODULE si se necesita indicar la ruta al paquete.
