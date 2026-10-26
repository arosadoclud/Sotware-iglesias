# Revisión del proyecto — 26 de octubre de 2026

## Alcance y estado

Revisión de arquitectura, rutas, componentes compartidos, autenticación y flujo de programas. Se inspeccionaron también los patrones de maquetación de personas, calendario, finanzas, secretaría, pastoral y panel principal. No equivale a una prueba funcional exhaustiva de todos los módulos ni a una auditoría de seguridad completa.

Cambios preparados localmente en `codex/corregir-registro`. No se han enviado a GitHub ni desplegado. Los registros de Render compartidos por el usuario corresponden a su despliegue, no confirman la publicación de estos cambios locales.

## Implementado

- Generador en tres pasos: actividad, fechas y revisión; resumen de planificación; validación de rango y fechas coincidentes; revisión explícita de los borradores sin redirección automática.
- Se conserva la generación individual, por lote y la configuración de personas para Mensaje. Las actividades de limpieza usan lotes, que es la ruta que implementa los grupos en el backend.
- Se invalidan resultados y vistas previas al cambiar la configuración; se evita volver a generar el mismo resultado desde el botón de confirmación.
- Encabezado móvil integrado, cierre de navegación al cambiar de ruta, Escape, control de foco y bloqueo del desplazamiento del fondo.
- Se retira la regla que forzaba todos los enlaces y casillas a 44 × 44 px. Los botones mantienen tamaño táctil y los campos conservan 16 px para evitar zoom automático en iOS.
- Tarjetas compartidas con espaciado adaptable, textos con mejor jerarquía, separación y foco visible; se respeta la preferencia de reducir animaciones.
- Editor con pestañas funcionales en móvil. Su adaptación considera el ancho disponible dentro del panel, incluyendo el espacio ocupado por la barra lateral. Acciones con texto y roles legibles sin depender del cursor.
- Revisión por lote sin doble margen exterior y con acciones que se apilan en pantallas pequeñas.

## Hallazgos prioritarios pendientes

| Área | Evidencia | Siguiente mejora |
| --- | --- | --- |
| Motor de asignación | `AssignmentEngine` mezcla candidatos aleatoriamente y entrega puntuaciones constantes de 1.0. `FairnessCalculator` existe, pero no se usa en la selección actual. | Integrar puntuaciones reales y probar carga, disponibilidad, restricciones, suplentes y rotación entre lotes antes de cambiar la política. |
| Vista previa | La previsualización ejecuta una selección nueva; no reserva el resultado. El endpoint de scoring no recibe la restricción de Mensaje y construye la fecha de forma distinta a la generación. | Unificar parámetros y fechas; aclarar que la vista previa es orientativa o implementar confirmación de una propuesta persistida. |
| Rendimiento móvil | El frontend carga las pantallas mediante imports directos. La compilación genera un archivo principal de aproximadamente 2.38 MB sin comprimir. | Carga diferida por ruta, separar gráficos y PDF; medir con red móvil. |
| Editor | Duplica formularios y previsualización entre móvil y escritorio y concentra estilos, datos y exportación en un archivo extenso. | Extraer un único formulario y una vista de programa reutilizable; unificar nombres, fechas y diseño del PDF. |
| Resto de módulos | Existen componentes compartidos junto a estilos propios, tablas y copias de páginas `backup`, `original` e `improved`. | Migración gradual al sistema compartido y revisión visual por módulo con datos representativos. |
| Registro | Hay excepciones de rol y verificación según un correo fijo y parámetros del cuerpo de la solicitud. | Separar el alta pública del aprovisionamiento administrativo y revisar autorización y vinculación de personas. |
| Dependencias y compilación | El backend importaba Axios en keep-alive sin declararlo como dependencia directa. | Se sustituyó ese uso por `fetch` de Node 20. Mantener una instalación reproducible y revisar versiones en un trabajo separado. |

## Verificación realizada

- TypeScript del frontend sin errores y compilación Vite correcta. Persiste la advertencia de tamaño del archivo principal.
- 47 comprobaciones de anchura en Chromium/Edge con datos simulados, a 320, 375, 390, 768, 1024 y 1440 px: actividad, fechas, revisión, resultado individual, editor, revisión por lote y listado. Sin desbordamiento horizontal del documento en los casos probados.
- Generación individual simulada en los seis tamaños, validación del botón de fecha, permanencia del resultado sin redirección, cambio entre pestañas del editor y apertura/cierre de navegación móvil.
- Capturas locales y resultados en `.cache/design-qa/`. No se usaron cuentas reales ni se generaron programas en producción. Falta la validación en Safari/iPhone real, entrega real de correo, generación con MongoDB de producción y exportación real de PDF.
- Tres pruebas del modelo de auditoría: acepta intentos de acceso fallidos sin identidad y sigue exigiendo iglesia/usuario para acceso exitoso y cambios de recursos.
- Cinco pruebas de configuración de verificación y tres del diagnóstico de Brevo, todas correctas. El diagnóstico usa respuestas simuladas.
- Comprobación de tipos del backend correcta con `--noEmit --declaration false --declarationMap false`. La generación de declaraciones de la configuración original presenta errores TS2742 de portabilidad de tipos de Express con la instalación local de pnpm; no se declara verificada la compilación Docker completa.

## Incidente de correo y auditoría

Los registros del 26 de octubre muestran `Brevo API error: 401 — API Key is not enabled`. El alta se revierte al fallar el envío, por lo que un inicio de sesión posterior puede devolver 401 por cuenta inexistente. Es distinto del error del modelo de auditoría al recibir identificadores nulos.

La corrección local de auditoría admite identificadores desconocidos únicamente en `LOGIN_FAILED`, categoría `AUTH`, con `success: false`. No asigna los intentos anónimos a una iglesia arbitraria.

Para el correo se valida el remitente, se elimina el falso éxito cuando falta configuración, se selecciona Brevo por HTTPS cuando procede y se agrega tiempo de espera. Ningún cambio de código puede habilitar una clave rechazada por Brevo.

El script `backend/scripts/check-email.cjs` consulta `GET /v3/account` sin enviar mensajes. Ejecutado dentro del backend desplegado mediante `node scripts/check-email.cjs`, permite comprobar qué cuenta reconoce la clave y muestra únicamente sus cuatro caracteres finales. El script estará disponible en producción después de desplegar estos archivos.

La última captura de registros facilitada termina con `Your service is live` a las 15:16 UTC (11:16 en Caracas). Confirma el arranque, pero no incluye una petición de registro ni una respuesta de envío posterior al nuevo despliegue.
