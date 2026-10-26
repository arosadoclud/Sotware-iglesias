# Secretaría, Pastoral y correspondencia

## Cambios incluidos

- Estados hover y foco de los botones de Finanzas con colores explícitos y contraste estable.
- Cabeceras con el logo real de Arca, tarjetas y formularios adaptables para Secretaría y Cartas.
- Secretaría conserva sus seis registros; corrige la lectura de los contadores y muestra acciones también en pantallas táctiles.
- Pastoral ofrece accesos a herramientas existentes según permisos. Visitas, consejería, acompañamiento e informes continúan identificados como planificados: este cambio no crea expedientes pastorales.
- Cartas incorpora búsqueda en todo el historial cargado, selección de tipo mediante teclado y vista previa con membrete. Valida las variables utilizadas para evitar cartas con marcadores incompletos. El reintento de una descarga fallida no repite el guardado dentro del mismo asistente.
- PDF de cartas con logo embebido del backend, estilo azul/dorado, nombre largo adaptable, contenido escapado, firma y cierre agrupados con el último párrafo. El navegador se cierra también ante errores. No incorpora firmas digitalizadas ni sellos.

## Ideas recomendadas para la siguiente etapa

1. Borradores guardados por usuario y por iglesia, con recuperación al volver al asistente. Evitar conservar datos personales en localStorage compartido.
2. Biblioteca de plantillas administrables: traslado, constancia de membresía, agradecimiento, invitación y recomendación. Permitir revisar el texto antes de emitirlo.
3. Revisión pastoral: estados Borrador, En revisión, Aprobada y Emitida. Definir qué permisos permiten cada transición y registrar quién aprobó.
4. Numeración por iglesia/año y registro de versiones, para identificar documentos sin sobrescribir cartas emitidas.
5. Reabrir un documento histórico con sus datos originales y descargar exactamente su versión emitida.
6. Personalizar remitente y firmante desde la configuración de la iglesia, con validación de campos y una vista previa consistente con el PDF.
7. Envío de una carta aprobada por correo con confirmación explícita del destinatario y registro del resultado de entrega.

## Verificación

TypeScript frontend y backend (backend sin declaraciones), build Vite y pruebas Jest del render de carta. Pruebas Playwright con APIs simuladas en 320, 390, 768 y 1440 px: Secretaría, modal, Pastoral, búsqueda, asistente, vista previa y reintento de PDF. Hover financiero comprobado en 390 y 1440 px. Se generaron con el controlador real tres PDFs de prueba (invitación, recomendación y carta extensa) y se revisaron imágenes renderizadas, incluido el cierre de la carta extensa. No se crearon registros ni se enviaron cartas reales en producción.

El chequeo backend con declaraciones continúa sujeto a la limitación previa de inferencia de Express con pnpm. Vite conserva su advertencia de bundle grande.
