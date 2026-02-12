# 🚀 CHURCH PROGRAM MANAGER - INICIO RÁPIDO

## ✅ Ya descargaste: `church-program-manager-fullstack.zip` (61KB)

**Proyecto completo:** Backend + Frontend ✨

---

## 📦 CONTENIDO

✅ **Backend (Node.js + Express + MongoDB)**
- 8 modelos de datos completos
- Autenticación con JWT
- API REST lista
- Logging profesional
- Manejo de errores

✅ **Frontend (React + TypeScript + Tailwind)**
- Dashboard interactivo
- Sistema de Login
- Gestión de Personas
- Gestión de Programas
- UI moderna y responsive

---

## 🎯 INSTALACIÓN EN 5 PASOS

### PASO 1: Descomprimir

```bash
unzip church-program-manager-fullstack.zip
cd church-program-manager
```

### PASO 2: Configurar MongoDB

**Opción A - MongoDB Atlas (Gratis, Recomendado):**
1. Ir a: https://www.mongodb.com/cloud/atlas/register
2. Crear cuenta
3. Crear cluster M0 (gratis, 512MB)
4. Click "Connect" → "Connect your application"
5. Copiar el connection string

**Opción B - MongoDB Local:**
```bash
# Ubuntu/Debian
sudo apt install mongodb
mongod

# macOS
brew install mongodb-community
brew services start mongodb-community

# Windows
# Descargar desde: https://www.mongodb.com/try/download/community
```

### PASO 3: Configurar Backend

```bash
cd backend
npm install
cp .env.example .env
nano .env  # O usa: code .env
```

**Editar `.env`:**
```env
# MongoDB (elegir UNA opción)

# Opción A - Atlas:
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/church-program-manager

# Opción B - Local:
# MONGODB_URI=mongodb://localhost:27017/church-program-manager

# Seguridad (genera secretos seguros)
JWT_SECRET=genera_un_secreto_seguro_de_minimo_32_caracteres_aqui
JWT_REFRESH_SECRET=genera_otro_secreto_diferente_de_minimo_32_caracteres

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

**💡 Genera secretos seguros:**
```bash
# En Linux/Mac:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# O usa: https://www.grc.com/passwords.htm
```

### PASO 4: Configurar Frontend

```bash
cd ../frontend
npm install
cp .env.example .env
nano .env  # O usa: code .env
```

**Editar `.env`:**
```env
VITE_API_URL=http://localhost:5000/api/v1
```

### PASO 5: ¡LANZAR! 🚀

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

Deberías ver:
```
✅ MongoDB conectado exitosamente
🚀 Servidor iniciado en puerto 5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Deberías ver:
```
VITE v5.0.11  ready in 500 ms
➜  Local:   http://localhost:5173/
```

---

## ✅ VERIFICAR QUE FUNCIONA

### 1. Backend
```bash
curl http://localhost:5000/health
```

Respuesta esperada:
```json
{
  "success": true,
  "message": "Server is running"
}
```

### 2. Frontend

Abrir en navegador: **http://localhost:5173**

Deberías ver la pantalla de login.

**Credenciales de prueba:**
- Email: `admin@iglesia.com`
- Password: `password123`

*(Nota: Primero debes crear un usuario en el backend)*

---

## 📁 ESTRUCTURA DEL PROYECTO

```
church-program-manager/
│
├── backend/                     ← API REST
│   ├── src/
│   │   ├── config/              ← MongoDB, env
│   │   ├── models/              ← 8 modelos
│   │   ├── middleware/          ← Auth, errores
│   │   ├── utils/               ← Logger, helpers
│   │   ├── app.ts
│   │   └── server.ts
│   ├── package.json
│   └── .env.example
│
└── frontend/                    ← React App
    ├── src/
    │   ├── components/          ← Layouts, UI
    │   ├── pages/               ← Login, Dashboard, etc.
    │   ├── lib/                 ← API config (Axios)
    │   ├── store/               ← Zustand (auth)
    │   ├── App.tsx
    │   └── main.tsx
    ├── package.json
    └── .env.example
```

---

## 🔧 SCRIPTS DISPONIBLES

### Backend (puerto 5000)
```bash
cd backend
npm run dev      # Desarrollo (hot reload)
npm run build    # Compilar TypeScript
npm start        # Producción
```

### Frontend (puerto 5173)
```bash
cd frontend
npm run dev      # Desarrollo (hot reload)
npm run build    # Compilar para producción
npm run preview  # Preview del build
```

---

## 🎨 CARACTERÍSTICAS IMPLEMENTADAS

### ✅ Backend
- Conexión a MongoDB
- 8 modelos de datos:
  - Church, User, Person, Role
  - ActivityType, Program
  - LetterTemplate, GeneratedLetter
- Autenticación JWT (estructura)
- Logging con Winston
- Manejo de errores robusto
- Validaciones completas

### ✅ Frontend
- Login (UI completa)
- Dashboard con estadísticas
- Layout con sidebar
- Páginas de:
  - Personas
  - Actividades
  - Programas
  - Calendario
  - Cartas
  - Configuración
- Tailwind CSS
- React Query
- Zustand (state management)
- Axios configurado

---

## 🔨 LO QUE FALTA (Próximas Sesiones)

### Fase 1 - CRUD Básico (1-2 semanas)
- [ ] Módulo de Autenticación completo
- [ ] CRUD de Personas (backend + frontend)
- [ ] CRUD de Actividades
- [ ] CRUD de Roles

### Fase 2 - Core del Sistema (2 semanas)
- [ ] **⭐ Algoritmo de generación** (el corazón)
- [ ] Generación de PDFs
- [ ] Sistema de plantillas de cartas
- [ ] Reportes y estadísticas

### Fase 3 - Pulido (1 semana)
- [ ] Tests
- [ ] Documentación con Swagger
- [ ] Deploy (Railway + Vercel)

---

## 🛠️ HERRAMIENTAS ÚTILES

### MongoDB Compass (GUI)
- Descargar: https://www.mongodb.com/products/compass
- Conectar con tu `MONGODB_URI`
- Visualizar colecciones y datos

### Postman (Probar API)
- Descargar: https://www.postman.com/downloads/
- Importar colección
- Probar endpoints

### Extensiones VSCode
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- MongoDB for VS Code

---

## 🐛 PROBLEMAS COMUNES

### ❌ "Cannot connect to MongoDB"

**Solución Atlas:**
- Verifica connection string en `.env`
- Verifica usuario/password
- En Atlas → Network Access → Add IP (0.0.0.0/0 para permitir todas)

**Solución Local:**
```bash
# Verificar que MongoDB esté corriendo
mongosh

# O iniciar:
sudo systemctl start mongodb  # Linux
brew services start mongodb-community  # Mac
```

### ❌ "Port 5000 already in use"

```bash
# Cambiar puerto en backend/.env
PORT=5001

# O matar proceso:
lsof -ti:5000 | xargs kill -9  # Mac/Linux
netstat -ano | findstr :5000   # Windows
```

### ❌ "CORS error" en Frontend

Verificar que en `backend/.env`:
```env
FRONTEND_URL=http://localhost:5173
```

### ❌ "Cannot find module..."

```bash
# Reinstalar dependencias
cd backend  # o frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 DOCUMENTACIÓN

- **README.md** - Información general
- **INICIO.md** - Guía detallada
- **ARQUITECTURA.md** - Diagramas y flujos
- **backend/README.md** - Documentación del backend
- **frontend/README.md** - Documentación del frontend

---

## 🎯 PRÓXIMOS PASOS

Una vez tengas backend + frontend corriendo:

**¿Qué quieres implementar primero?**

1. **Autenticación Completa** (Login, Registro, JWT)
2. **CRUD de Personas** (Crear, editar, listar)
3. **Algoritmo de Generación** ⭐ (El corazón del sistema)

---

## ✅ CHECKLIST INICIAL

- [ ] Descomprimí el archivo
- [ ] Instalé MongoDB (Atlas o local)
- [ ] Backend: `npm install` ✓
- [ ] Backend: Configuré `.env` ✓
- [ ] Backend: `npm run dev` → Corriendo en 5000 ✓
- [ ] Frontend: `npm install` ✓
- [ ] Frontend: Configuré `.env` ✓
- [ ] Frontend: `npm run dev` → Corriendo en 5173 ✓
- [ ] Verifiqué /health del backend ✓
- [ ] Abrí http://localhost:5173 en navegador ✓

**¿Todo listo?** ¡Estás listo para desarrollar! 🚀

---

**Stack:** Node.js + Express + MongoDB + React + TypeScript + Tailwind  
**Desarrollado por:** Andy - Systems Engineer  
**Versión:** 1.0.0 - Proyecto Base Completo
