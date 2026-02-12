# Church Program Manager — v2

Sistema de gestión de programas de oportunidades para iglesias.
Backend Node.js/TypeScript + MongoDB · Frontend React/Vite/TypeScript

---

## ✅ Mejoras Implementadas (v1 → v2)

### Paso 1 — Tenant Guard (Seguridad Crítica)
Archivo: `backend/src/middleware/tenant.middleware.ts`
- El churchId SIEMPRE viene del token JWT, nunca del body
- Verifica iglesia activa en DB (con cache Redis 5 min)
- Sobreescribe cualquier churchId en el body
- planLimit() para enforcement de límites por plan

### Paso 2 — RBAC 6 Roles
Archivo: `backend/src/middleware/rbac.middleware.ts`
Roles: SUPER_ADMIN > PASTOR > ADMIN > MINISTRY_LEADER > EDITOR > VIEWER
Uso: router.get('/', rbac('programs', 'read'), handler)

### Paso 3 — AssignmentEngine v2 (Bug Crítico Corregido)
Directorio: `backend/src/modules/programs/engine/`
- FairnessCalculator: algoritmo normalizado en 3 componentes
- HistoryAnalyzer: pre-carga historial en memoria (elimina N+1 queries)
- AssignmentEngine: orquestador, elimina el antipatrón fakeReq/fakeRes
- Nuevo score: menor participación = mayor prioridad (comportamiento correcto)

### Paso 4 — Índices MongoDB
Indices criticos añadidos:
- Program: { churchId, programDate, status } — lookback del motor
- Person: { churchId, roles.roleId, status } — carga de candidatos
Script: npm run ensure-indexes

### Paso 5 — Módulo PDF
Directorio: `backend/src/modules/pdf/`
- Puppeteer + Handlebars templates
- Logo dinámico, colores de marca, firma del pastor
- Marca de agua en plan FREE
- GET /api/v1/programs/:id/pdf — descarga
- GET /api/v1/programs/:id/pdf/preview — previsualización HTML

### Paso 6 — Notificaciones
Directorio: `backend/src/modules/notifications/` + `backend/src/infrastructure/`
- Bull queues + Redis para procesamiento asíncrono
- Email HTML (Nodemailer / SendGrid / SMTP)
- WhatsApp (Twilio o Meta Cloud API)
- Recordatorios automáticos 48h antes del culto
- Se dispara al publicar un programa

### Paso 7 — Church Model Expandido
Nuevos campos: plan (FREE/PRO/ENTERPRISE), brandColor, pastorName,
signatureUrl, settings.whatsappEnabled, settings.defaultTime

### Paso 8 — Cache Redis
Archivo: `backend/src/infrastructure/cache/CacheAdapter.ts`
- Fallback automático a Map en memoria si Redis no está disponible
- Tenant validation: 5 min TTL
- Dashboard stats: 5 min TTL
- Invalidación automática al mutar datos

### Pasos 9-10 — Frontend + DevEx
- DashboardPage rediseñada con métricas, download PDF directo
- GenerateProgramPage con vista previa de scoring y warnings
- ProgramsPage con paginación, cambio de estado progresivo
- api.ts completo con todos los endpoints
- .env.example completo
- server.ts con graceful shutdown
- README técnico

---

## Instalación

```bash
# Backend
cd backend
cp .env.example .env
# Editar .env con tus valores
npm install
npm run ensure-indexes   # Crear índices en MongoDB
npm run create-admin     # Crear usuario admin inicial
npm run dev              # Puerto 5000

# Frontend
cd ../frontend
npm install
npm run dev              # Puerto 5173
```

## Variables mínimas requeridas (.env)
```
MONGODB_URI=mongodb://localhost:27017/church_program_manager
JWT_SECRET=secreto_seguro_minimo_32_caracteres
JWT_REFRESH_SECRET=otro_secreto_diferente
```

## Dependencias opcionales
```bash
npm install ioredis bull          # Cache + Colas (Redis requerido)
npm install nodemailer             # Email
npm install twilio                 # WhatsApp via Twilio
```

---

## Instalación rápida

1. Clona el repositorio:
   ```sh
   git clone <URL_DE_TU_REPO>
   ```
2. Instala dependencias en backend y frontend:
   ```sh
   cd backend && npm install
   cd ../frontend && npm install
   ```
3. Copia el archivo `.env.example` a `.env` en la carpeta backend y configura tus variables.

## Primer uso seguro
- El sistema **NO borra datos existentes** en la base de datos al correr el seed.
- El seed solo inserta datos si la base está vacía.
- Puedes restaurar datos manualmente si lo necesitas.

## Subida de archivos
- La carpeta `uploads/` está en el `.gitignore` para evitar subir archivos privados.
- Si necesitas que exista en el repo, deja un archivo vacío llamado `.gitkeep` dentro de `uploads/`.

## Scripts útiles
- `npm run dev` (backend): Inicia el backend en modo desarrollo.
- `npm run dev` (frontend): Inicia el frontend en modo desarrollo.
- `npm run build` (backend): Compila el backend.

## Notas
- No subas tu archivo `.env` ni datos sensibles.
- Si usas el proyecto en otra PC, crea tu propio `.env` y asegúrate de tener MongoDB corriendo.

---

¿Dudas? Abre un issue o contacta al autor.
