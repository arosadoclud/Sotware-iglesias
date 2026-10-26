# Finanzas, bienvenida, registro y correo

- Finanzas: cabecera y controles adaptables, períodos rápidos, filtros por fondo/estado/tipo, búsqueda literal por descripción o referencia, paginación y resumen visual. Los cálculos existentes del concilio se conservan.
- Los permisos financieros del servidor ahora utilizan los permisos individuales de la sesión: consultar, crear, editar, eliminar, aprobar y reportes. La inicialización de categorías y fondos se limita a quienes pueden crear.
- Splash: identidad Arca, logo transparente, composición editorial, entrada manual y animación compatible con movimiento reducido.
- Registro: diseño propio de la iglesia, etiquetas accesibles, campos adaptables, requisitos de contraseña y confirmación del envío. Redirección de acceso automático corregida a la ruta raíz.
- Correo de verificación: una plantilla compartida para Brevo y SMTP, logo, botón y enlace alternativo, texto plano, nombres escapados y plazo de 72 horas coincidente con el servidor.

Validación: TypeScript frontend/backend (backend sin declaraciones por la limitación existente de inferencia de routers con pnpm); build Vite; Jest para búsqueda, plantilla y permisos. Playwright con APIs simuladas verifica registro, envío simulado, filtros y modal financiero en 320, 390, 768 y 1440 px. Correo revisado en 320, 390 y 1440 px y splash con entrada manual. No se enviaron correos reales ni se modificaron registros financieros en producción. El render del correo se comprobó en navegador; no se comprobó en clientes Outlook/Gmail reales. Vite conserva la advertencia previa de tamaño de bundle.

Script reproducible: frontend/scripts/check-finances-registration.cjs, ejecutar desde la raíz con el frontend en puerto 5173 y PLAYWRIGHT_MODULE apuntando al paquete Playwright si no está instalado globalmente.
