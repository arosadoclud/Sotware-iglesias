# ⛪ Church Manager v4

<div align="center">

![Version](https://img.shields.io/badge/Version-4.2.0-blue.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)
![Node](https://img.shields.io/badge/Node-18+-brightgreen.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green.svg)
![React](https://img.shields.io/badge/React-18+-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg)

**Sistema integral de gestión para iglesias — Multi-tenant, RBAC, WhatsApp, PDF, Finanzas y más**

[Características](#-características) · [Instalación](#-instalación-rápida) · [Arquitectura](#-arquitectura) · [API](#-documentación) · [Producción](#-despliegue)

</div>

---

## 📋 Descripción

Church Manager v4 es una plataforma fullstack diseñada para administrar todos los aspectos operativos de una iglesia: miembros, programas de culto, actividades, cartas, finanzas, seguimiento de nuevos visitantes con integración WhatsApp, y mucho más. Incluye arquitectura multi-tenant con aislamiento completo de datos, control de acceso basado en roles (RBAC) con 6 niveles y un dashboard interactivo con slider de programas publicados.

---

## ✨ Características

### 🏢 Multi-Tenant
- Aislamiento completo de datos por iglesia
- Sistema de planes (FREE, PRO, ENTERPRISE) con límites configurables
- Middleware `tenantGuard` que filtra automáticamente por `churchId`

### 👥 Gestión de Miembros
- Registro completo de personas con roles, ministerios, disponibilidad y foto
- Asignación flexible de roles eclesiásticos
- Historial de participación y estadísticas por persona
- Exportación de datos

### 🆕 Seguimiento de Nuevos Miembros (CRM)
- Pipeline de seguimiento con 5 fases: Primera Visita → Contactado → En Seguimiento → Integrado / Inactivo
- Historial de seguimiento (llamadas, visitas, notas)
- **Integración WhatsApp** con plantillas predefinidas (bienvenida, invitación, seguimiento, agradecimiento)
- Alertas programadas para no perder contacto
- Conversión automática de visitante a miembro del sistema
- Dashboard con estadísticas: total, nuevos este mes, en seguimiento, alertas pendientes

### 📅 Programas de Culto
- Generación automática inteligente con **FairnessCalculator** (balance de carga)
- Generación por lote con revisión masiva
- Editor visual de flyers con vista previa en tiempo real
- Edición rápida (QuickEditDrawer) desde la lista sin cambiar de página
- Versículo bíblico automático con búsqueda desde API de la Biblia (RVR1960/NVI)
- **Slider interactivo en el Dashboard** que muestra programas publicados/completados
- Descarga PDF (servidor con Puppeteer + local con jsPDF)
- Compartir por WhatsApp con adjunto PDF

### 📄 Cartas e Invitaciones
- Plantillas personalizables con Handlebars
- Generación individual y masiva
- PDF profesional con branding por iglesia y firma del pastor

### 💰 Finanzas
- Registro de transacciones (ingresos/egresos) con categorías
- Fondos especiales (diezmos, ofrendas, misiones, etc.)
- Reportes financieros con gráficos
- Moneda configurable (RD$)

### 📧 Notificaciones
- Email con plantillas HTML (Nodemailer + SMTP/SendGrid)
- WhatsApp vía Twilio o Meta WhatsApp Cloud API
- Recordatorios automáticos 48h antes del culto
- Sistema de colas con Bull/Redis

### 🔐 Seguridad y RBAC
- Autenticación JWT con refresh tokens
- **6 niveles de roles:** SUPER_ADMIN > PASTOR > ADMIN > MINISTRY_LEADER > EDITOR > VIEWER
- Matriz de permisos granular: recurso × acción (view, create, edit, delete, assign, export...)
- Rate limiting, validación de datos, protección CSRF/XSS
- Protección frontend: navegación filtrada, botones protegidos, rutas guardadas (`PermissionRoute`)
- Logs de auditoría

### 📊 Dashboard
- Métricas en tiempo real (miembros, programas, actividades)
- Gráficos interactivos (Recharts)
- **Slider de programas publicados** con auto-play, navegación y descarga PDF
- Vista de calendario

---

## 🏗️ Arquitectura

```
┌───────────────────────────────────────────┐
│       REACT FRONTEND (Puerto 5173)        │
│  React 18 · TypeScript · TailwindCSS      │
│  Radix UI · Zustand · Framer Motion       │
│  React Router v6 · Sonner · Recharts      │
└────────────────┬──────────────────────────┘
                 │ REST API + JWT
┌────────────────▼──────────────────────────┐
│       EXPRESS BACKEND (Puerto 5000)       │
│  Node.js 18 · TypeScript · Express 4      │
│  JWT Auth + RBAC · Bull Queues            │
│  Puppeteer PDF · Nodemailer · Twilio      │
└────────────────┬──────────────────────────┘
                 │ Mongoose ODM
┌────────────────▼──────────────────────────┐
│           MONGODB DATABASE                │
│  Churches · Users · Persons · Programs    │
│  Activities · Letters · Finances          │
│  NewMembers · Roles · Notifications       │
└───────────────────────────────────────────┘
```

### Módulos Backend

| Módulo | Ruta API | Descripción |
|--------|----------|-------------|
| Auth | `/api/v1/auth` | Login, registro, refresh token |
| Persons | `/api/v1/persons` | CRUD miembros, roles, exportar |
| Programs | `/api/v1/programs` | CRUD programas, generar, batch, PDF |
| Activities | `/api/v1/activity-types` | Tipos de actividad |
| Letters | `/api/v1/letters` | Plantillas y generación de cartas |
| Finances | `/api/v1/finances` | Transacciones, fondos, reportes |
| New Members | `/api/v1/new-members` | CRM visitantes, seguimiento, WhatsApp |
| Churches | `/api/v1/churches` | Configuración iglesia, logo |
| Roles | `/api/v1/roles` | Roles eclesiásticos |
| Bible | `/api/v1/bible` | Proxy API bíblica |
| Notifications | `/api/v1/notifications` | Email + WhatsApp |
| Users | `/api/v1/users` | Gestión de usuarios admin |

---

## 🚀 Instalación Rápida

### Prerrequisitos

- Node.js 18+
- MongoDB 6.0+ (local o Atlas)
- Redis (opcional — para colas y cache)
- npm

### 1. Clonar e instalar

```bash
git clone https://github.com/arosadoclud/Sotware-iglesias.git
cd Sotware-iglesias

# Backend
cd backend
cp .env.development .env   # Config de desarrollo lista para usar
npm install

# Frontend
cd ../frontend
cp .env.development .env
npm install
```

### 2. Iniciar

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

### 3. Acceder

| | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000/api/v1 |
| Admin por defecto | `admin@church.com` / `Admin123!` |

> El archivo `.env.development` incluye configuración segura para desarrollo local. Ver [CONFIGURACION-ENTORNO.md](CONFIGURACION-ENTORNO.md) para detalles.

---

## 🔧 Variables de Entorno

### Backend (`backend/.env`)

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/church-program-manager-dev

JWT_SECRET=secreto_minimo_32_caracteres
JWT_REFRESH_SECRET=otro_secreto_diferente
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Opcional
REDIS_URL=redis://localhost:6379
WHATSAPP_PROVIDER=none          # none | twilio | meta
CLOUDINARY_CLOUD_NAME=
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api/v1
```

---

## 📦 Scripts

### Backend

```bash
npm run dev              # Desarrollo con hot-reload
npm run build            # Compilar TypeScript
npm start                # Producción
npm run ensure-indexes   # Índices MongoDB
npm run create-admin     # Crear usuario admin
npm run seed             # Datos de prueba
```

### Frontend

```bash
npm run dev              # Desarrollo con Vite
npm run build            # Build producción
npm run preview          # Preview del build
```

---

## 🌐 Despliegue

### Backend → Render

1. Crear Web Service en [render.com](https://render.com)
2. Conectar repositorio GitHub
3. **Root Directory:** `backend`
4. **Build Command:** `npm install && npm run build`
5. **Start Command:** `npm start`
6. Configurar variables de entorno (MongoDB Atlas, JWT secrets, etc.)

### Frontend → Vercel

1. Importar proyecto en [vercel.com](https://vercel.com)
2. **Root Directory:** `frontend`
3. **Framework Preset:** Vite
4. Agregar variable `VITE_API_URL` apuntando al backend en Render

---

## 🎯 Stack Tecnológico

### Backend
| Tecnología | Propósito |
|-----------|-----------|
| Node.js 18+ / Express 4 | Servidor REST |
| TypeScript | Tipado estático |
| MongoDB + Mongoose | Base de datos ODM |
| JWT + bcryptjs | Autenticación |
| Bull + Redis | Colas y cache |
| Puppeteer | Generación PDF servidor |
| Nodemailer | Email |
| Twilio / Meta API | WhatsApp |

### Frontend
| Tecnología | Propósito |
|-----------|-----------|
| React 18 + TypeScript | UI framework |
| Vite | Build tool |
| TailwindCSS | Estilos utilitarios |
| Radix UI / shadcn | Componentes accesibles |
| Zustand | Estado global |
| Framer Motion | Animaciones |
| Recharts | Gráficos |
| Sonner | Notificaciones toast |
| jsPDF | PDF en cliente |

---

## 📚 Documentación

- [Guía de Instalación](docs/INSTALLATION.md)
- [Documentación API](docs/API_DOCUMENTATION.md)
- [Arquitectura del Sistema](docs/ARCHITECTURE.md)
- [Guía de Despliegue](docs/DEPLOYMENT.md)
- [Manual de Usuario](docs/USER_GUIDE.md)
- [Configuración de Entorno](CONFIGURACION-ENTORNO.md)

---

## 📝 Licencia

MIT — ver [LICENSE](LICENSE)

## 👨‍💻 Autor

**Andy Rodriguez** — Systems Engineer

- GitHub: [@arosadoclud](https://github.com/arosadoclud)
- Email: arosadoclud@gmail.com

---

<div align="center">

Hecho con ❤️ para la comunidad cristiana

</div>
