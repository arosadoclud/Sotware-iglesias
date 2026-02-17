# 🔧 Configuración de Entorno - Desarrollo Local

## 📋 Archivos de Configuración

Este proyecto utiliza diferentes archivos de entorno para separar las configuraciones de desarrollo y producción:

### Archivos en el Repositorio (públicos):
- ✅ `.env.example` - Plantilla con todas las variables disponibles
- ✅ `.env.development` - **Configuración segura para desarrollo local** (este archivo SÍ se sube al repo)

### Archivos Locales (NO se suben al repo):
- 🔒 `.env` - Tu configuración personal de desarrollo
- 🔒 `.env.local` - Sobrescribe variables para tu máquina específica
- 🔒 `.env.production` - Configuración de producción (solo en el servidor)

## 🚀 Configuración Rápida para Desarrollo

### 1️⃣ Primera vez clonando el proyecto:

```bash
# Backend
cd backend
cp .env.development .env
# ¡Listo! Ya puedes trabajar en local

# Frontend
cd ../frontend
cp .env.development .env
# ¡Listo! Ya puedes trabajar en local
```

### 2️⃣ Si necesitas personalizar (opcional):

Edita tu archivo `.env` local con tus credenciales personales:
- Credenciales de email (Gmail, Mailtrap, etc.)
- Claves de Cloudinary para subir imágenes
- Cualquier otra configuración específica de tu máquina

## 🌍 Configuraciones por Entorno

### Desarrollo Local (`.env.development`)
- Base de datos: MongoDB local en `localhost:27017`
- Puerto: `5000` (backend) y `5173` (frontend)
- Email: Deshabilitado o Mailtrap
- Redis: Opcional (comentado por defecto)
- WhatsApp: Deshabilitado

### Producción (Render/Vercel)
- Base de datos: MongoDB Atlas
- Email: SendGrid o SMTP real
- Redis: Upstash o servicio real
- WhatsApp: Twilio o Meta Business API

## ⚙️ Variables Clave

### Backend (`backend/.env.development`)

```env
# Básicas
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
API_BASE_URL=http://localhost:5000

# Base de datos
MONGODB_URI=mongodb://localhost:27017/church-program-manager-dev

# JWT (secretos de desarrollo - cambiar en producción)
JWT_SECRET=cambia_esto_por_un_secreto_muy_seguro_min_32_chars_desarrollo
JWT_REFRESH_SECRET=otro_secreto_diferente_para_el_refresh_token_desarrollo
```

### Frontend (`frontend/.env.development`)

```env
# URL del API local
VITE_API_URL=http://localhost:5000/api/v1
```

## 📝 Notas Importantes

1. **¿Por qué `.env.development` en el repo?**
   - Facilita la configuración inicial para nuevos desarrolladores
   - Solo contiene valores seguros para desarrollo local
   - No contiene credenciales reales ni secretos de producción

2. **¿Cuándo usar `.env` vs `.env.development`?**
   - `.env.development`: Configuración base compartida por todo el equipo
   - `.env`: Tu configuración personal (sobrescribe `.env.development`)

3. **Seguridad**
   - NUNCA subas archivos `.env` con credenciales reales
   - Los archivos `.env` están en `.gitignore` y no se subirán
   - Usa secretos diferentes en producción

## 🔄 Workflow Recomendado

```bash
# 1. Clonar el repositorio
git clone https://github.com/arosadoclud/Sotware-iglesias.git
cd Sotware-iglesias

# 2. Instalar dependencias
npm install
cd backend && npm install
cd ../frontend && npm install

# 3. Copiar configuración de desarrollo
cd backend && cp .env.development .env
cd ../frontend && cp .env.development .env

# 4. Iniciar MongoDB local (si no está corriendo)
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod

# 5. Iniciar el proyecto
cd backend && npm run dev    # Terminal 1
cd frontend && npm run dev   # Terminal 2
```

## 🐛 Problemas Comunes

**"Cannot connect to MongoDB"**
- Verifica que MongoDB esté corriendo localmente
- Revisa la URL en `MONGODB_URI`

**"CORS error" al hacer peticiones**
- Verifica que `FRONTEND_URL` en backend apunte a `http://localhost:5173`
- Verifica que `VITE_API_URL` en frontend apunte a `http://localhost:5000/api/v1`

**"JWT invalid" al hacer login**
- Asegúrate de que `JWT_SECRET` tenga al menos 32 caracteres
- Verifica que el backend y frontend estén usando la misma configuración

## 📚 Más Información

- Ver [INICIO-RAPIDO.md](./INICIO-RAPIDO.md) para una guía completa
- Ver [DESPLIEGUE.md](./DESPLIEGUE.md) para configuración de producción
