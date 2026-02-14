# 🎯 Church Manager v4

<div align="center">

![Church Manager](https://img.shields.io/badge/Version-4.0.0-blue.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)
![Node](https://img.shields.io/badge/Node-18+-brightgreen.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green.svg)
![React](https://img.shields.io/badge/React-18+-blue.svg)

**Sistema completo de gestión integral para iglesias**

[Características](#-características) •
[Instalación](#-instalación-rápida) •
[Documentación](#-documentación) •
[Demo](#-demo)

</div>

---

## 📋 Descripción

Church Manager v4 es un sistema completo de gestión para iglesias que permite administrar miembros, programas de culto, ministerios, actividades, cartas personalizadas, notificaciones automatizadas y mucho más. Diseñado con arquitectura multi-tenant, seguridad robusta y escalabilidad empresarial.

## ✨ Características

### 🏢 Multi-Tenant
- ✅ Completo aislamiento de datos entre iglesias
- ✅ Sistema de planes (FREE, PRO, ENTERPRISE)
- ✅ Límites personalizables por plan
- ✅ Seguridad a nivel de middleware con JWT

### 👥 Gestión de Miembros
- ✅ Registro completo de personas
- ✅ Roles y ministerios flexibles
- ✅ Historial de participación
- ✅ Sistema de disponibilidad
- ✅ Fotos y datos de contacto

### 📅 Programas de Culto
- ✅ Generación automática inteligente
- ✅ Algoritmo de asignación justa (FairnessCalculator)
- ✅ Balance de carga de trabajo
- ✅ Historial y estadísticas de participación
- ✅ Estados: borrador, publicado, completado

### 📄 Generación de Cartas y PDFs
- ✅ Plantillas personalizables con Handlebars
- ✅ Cartas individuales y masivas
- ✅ PDFs profesionales con Puppeteer
- ✅ Branding personalizado por iglesia
- ✅ Firma digital del pastor

### 📧 Notificaciones Automatizadas
- ✅ Email con plantillas HTML
- ✅ WhatsApp (integración Twilio/Meta)
- ✅ Recordatorios automáticos (48h antes)
- ✅ Sistema de colas con Bull/Redis
- ✅ Procesamiento asíncrono

### 🔐 Seguridad y Control
- ✅ Autenticación JWT con refresh tokens
- ✅ RBAC con 6 niveles de roles
- ✅ Rate limiting
- ✅ Validación de datos con class-validator
- ✅ Protección CSRF y XSS

### 📊 Dashboard e Informes
- ✅ Métricas en tiempo real
- ✅ Estadísticas de participación
- ✅ Gráficos interactivos
- ✅ Exportación de datos
- ✅ Vista de calendario

## 🏗️ Arquitectura

```
┌─────────────────────────────────────┐
│   REACT FRONTEND (Puerto 5173)      │
│   · React 18 + TypeScript           │
│   · TailwindCSS + Radix UI          │
│   · React Query + Zustand           │
│   · React Router v6                 │
└──────────────┬──────────────────────┘
               │ REST API + JWT
┌──────────────▼──────────────────────┐
│   EXPRESS BACKEND (Puerto 5000)     │
│   · Node.js + TypeScript            │
│   · Express + Middleware Stack      │
│   · JWT Auth + RBAC                 │
│   · Bull Queues + Redis Cache       │
└──────────────┬──────────────────────┘
               │ Mongoose ODM
┌──────────────▼──────────────────────┐
│        MONGODB DATABASE             │
│   · Churches (Multi-tenant)         │
│   · Users + Persons                 │
│   · Programs + Assignments          │
│   · Templates + Letters             │
└─────────────────────────────────────┘
```

## 🚀 Instalación Rápida

### Prerrequisitos

- Node.js 18+ 
- MongoDB 6.0+
- Redis (opcional, para cache y colas)
- npm o yarn

### Paso 1: Clonar el repositorio

```bash
git clone https://github.com/arosadoclud/Sotware-iglesias.git
cd Sotware-iglesias
```

### Paso 2: Backend

```bash
cd backend
cp .env.example .env
# Edita .env con tus credenciales
npm install
npm run ensure-indexes
npm run create-admin
npm run dev
```

### Paso 3: Frontend

```bash
cd frontend
npm install
npm run dev
```

### Paso 4: Acceder

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Usuario admin: admin@church.com / Admin123!

## 🔧 Configuración

### Variables de Entorno Backend (.env)

```env
# Base
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/church_manager

# JWT
JWT_SECRET=tu_secreto_super_seguro_minimo_32_caracteres
JWT_REFRESH_SECRET=otro_secreto_diferente_para_refresh
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis (opcional)
REDIS_URL=redis://localhost:6379

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_password
EMAIL_FROM=noreply@church.com

# WhatsApp (opcional)
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_WHATSAPP_NUMBER=+14155238886

# Cloudinary (opcional)
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

### Variables de Entorno Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api/v1
```

## 📚 Documentación

- 📖 [Guía de Instalación Completa](docs/INSTALLATION.md)
- 🔌 [Documentación de API](docs/API_DOCUMENTATION.md)
- 🏗️ [Arquitectura del Sistema](docs/ARCHITECTURE.md)
- 🚀 [Guía de Despliegue](docs/DEPLOYMENT.md)
- 👨‍💻 [Guía de Contribución](docs/CONTRIBUTING.md)
- 📘 [Manual de Usuario](docs/USER_GUIDE.md)

## 🎯 Stack Tecnológico

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express 4
- **Lenguaje:** TypeScript
- **Base de Datos:** MongoDB + Mongoose
- **Cache:** Redis + ioredis
- **Autenticación:** JWT + bcryptjs
- **Validación:** class-validator
- **Colas:** Bull
- **PDF:** Puppeteer + Handlebars
- **Email:** Nodemailer
- **Testing:** Jest + Supertest

### Frontend
- **Framework:** React 18
- **Lenguaje:** TypeScript
- **Build Tool:** Vite
- **Routing:** React Router v6
- **Estado:** Zustand + React Query
- **Estilos:** TailwindCSS
- **UI:** Radix UI + shadcn/ui
- **Formularios:** React Hook Form + Zod
- **Gráficos:** Recharts
- **Notificaciones:** Sonner

## 📦 Scripts Disponibles

### Backend

```bash
npm run dev              # Modo desarrollo
npm run build            # Compilar TypeScript
npm start                # Producción
npm run ensure-indexes   # Crear índices MongoDB
npm run create-admin     # Crear usuario admin
npm run seed             # Datos de prueba
npm test                 # Tests
npm run lint             # Linter
```

### Frontend

```bash
npm run dev              # Modo desarrollo
npm run build            # Build producción
npm run preview          # Preview build
npm run lint             # Linter
```

## 🌟 Demo

Visita nuestra demo en línea: **[Demo disponible próximamente]**

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor lee [CONTRIBUTING.md](docs/CONTRIBUTING.md) para detalles.

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver [LICENSE](LICENSE) para más detalles.

## 👨‍💻 Autor

**Andy Rodriguez** - Systems Engineer

## 📞 Soporte

- 📧 Email: arosadoclud@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/arosadoclud/Sotware-iglesias/issues)

---

<div align="center">

Hecho con ❤️ para la comunidad cristiana

</div>
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
