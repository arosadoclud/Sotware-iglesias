# Asistente de flyers

Ruta: `/flyer-assistant`, menú Contenido → Asistente de flyers. Usa el permiso existente de visualización de Actividades; guardar el resultado requiere crear Actividades.

El formulario prepara un prompt con iglesia, tema, fecha, hora, lugar, estilo, formato y hasta diez predicadores o expositores. Las fotos son opcionales. Los retratos no se inventan cuando no se adjuntan fotografías.

“Copiar prompt y abrir ChatGPT” copia el texto y abre `https://chatgpt.com/` en otra pestaña por una acción del usuario. La persona inicia sesión, pega el texto, adjunta el logo y las fotos y genera la imagen desde su propia cuenta. La app no automatiza ChatGPT ni consume su API. La generación depende de las funciones y límites de esa cuenta. Hay un enlace alternativo y selección manual del texto si el navegador impide abrir la pestaña o copiar.

Los borradores contienen únicamente textos, se guardan localmente y se separan por usuario e iglesia. Las fotos no se conservan ni se envían automáticamente. El logo se descarga desde la identidad existente de la iglesia.

El resultado se selecciona desde el dispositivo. Solo se sube al backend al pulsar “Guardar en Eventos”; se crea con `isActive: false`. Una subida terminada se reutiliza si falla la creación del evento, para permitir reintentar sin duplicar la subida. El usuario publica después desde Eventos.

Verificación: `frontend/scripts/check-flyer-assistant.cjs` con Playwright y frontend local en el puerto 5173. API, portapapeles y apertura de pestaña simulados; prueba cuatro anchos, validación, fotos opcionales, borradores locales, guardado inactivo y reintentos. No abre una cuenta real de ChatGPT ni publica eventos reales.
