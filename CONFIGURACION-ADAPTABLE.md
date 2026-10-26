# Configuración adaptable

- Cabecera con la identidad de Arca. Menú lateral con descripciones en escritorio y selector de sección en móvil.
- Formularios, tarjetas, campos y botones adaptados a pantallas estrechas. Campos de 16 px en móvil para evitar el zoom automático de iOS.
- Acciones de editar/eliminar roles visibles sin hover y con etiquetas accesibles. Selector de protección expuesto como switch.
- Aviso superior de cambios de la iglesia sin guardar con acceso directo al guardado. Campos de General deshabilitados durante su petición para evitar sobrescribir ediciones posteriores.
- Etiquetas asociadas a los campos generales y personales. Claves de WhatsApp conservadas como campos de contraseña. Instrucciones de activación plegables.
- Estado Avanzado muestra la última lectura real de la configuración en lugar de afirmar que todos los servicios funcionan sin haberlos comprobado.

Verificación: TypeScript y build Vite; Playwright con API simulada para las seis secciones y el modal de roles, en 320, 390, 768 y 1440 px (28 vistas). Se comprobó que un guardado fallido mantiene los datos y permite reintentar. No se cambiaron contraseñas, permisos, claves ni configuración de producción en las pruebas. Se conserva la advertencia previa de Vite sobre tamaño del bundle.

Script: frontend/scripts/check-settings-responsive.cjs. Ejecutar desde la raíz con el frontend en puerto 5173 y PLAYWRIGHT_MODULE si es necesario indicar la ruta del paquete.
