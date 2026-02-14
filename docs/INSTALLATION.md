# 📦 Guía de Instalación Completa

Esta guía te llevará paso a paso a través de la instalación de Church Manager v4 en tu entorno local.

## 📋 Tabla de Contenidos

- [Prerrequisitos](#prerrequisitos)
- [Instalación de Dependencias](#instalación-de-dependencias)
- [Configuración del Backend](#configuración-del-backend)
- [Configuración del Frontend](#configuración-del-frontend)
- [Configuración de Servicios Externos](#configuración-de-servicios-externos)
- [Verificación de la Instalación](#verificación-de-la-instalación)
- [Solución de Problemas](#solución-de-problemas)

---

## Prerrequisitos

### Software Requerido

| Software | Versión Mínima | Verificar |
|----------|---------------|-----------|
| Node.js  | 18.0.0       | `node --version` |
| MongoDB  | 6.0.0        | `mongod --version` |
| npm      | 9.0.0        | `npm --version` |
| Git      | 2.30.0       | `git --version` |

### Software Opcional

| Software | Propósito | Verificar |
|----------|-----------|-----------|
| Redis    | Cache y colas | `redis-cli --version` |
| Docker   | Contenedores | `docker --version` |

## 🔽 Instalación de Dependencias

### Windows

#### 1. Node.js
```powershell
# Descargar e instalar desde https://nodejs.org/
# O usar Chocolatey
choco install nodejs-lts

# Verificar
node --version
npm --version
```

#### 2. MongoDB
```powershell
# Descargar desde https://www.mongodb.com/try/download/community
# O usar Chocolatey
choco install mongodb

# Iniciar servicio
net start MongoDB
```

#### 3. Redis (Opcional)
```powershell
# Descargar desde https://github.com/microsoftarchive/redis/releases
# O usar WSL
```

### macOS

#### 1. Node.js
```bash
# Usando Homebrew
brew install node@18

# Verificar
node --version
npm --version
```

#### 2. MongoDB
```bash
# Usando Homebrew
brew tap mongodb/brew
brew install mongodb-community@6.0

# Iniciar servicio
brew services start mongodb-community
```

#### 3. Redis (Opcional)
```bash
# Usando Homebrew
brew install redis

# Iniciar servicio
brew services start redis
```

### Linux (Ubuntu/Debian)

#### 1. Node.js
```bash
# Instalar desde NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar
node --version
npm --version
```

#### 2. MongoDB
```bash
# Importar clave pública
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Crear lista de archivos
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Instalar
sudo apt-get update
sudo apt-get install -y mongodb-org

# Iniciar servicio
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### 3. Redis (Opcional)
```bash
sudo apt-get install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

## 🔧 Configuración del Backend

### 1. Clonar el Repositorio

```bash
git clone https://github.com/arosadoclud/Sotware-iglesias.git
cd Sotware-iglesias/backend
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar con tu editor favorito
nano .env  # o code .env
```

#### Configuración Mínima (.env)

```env
# Entorno
NODE_ENV=development
PORT=5000

# MongoDB - REQUERIDO
MONGODB_URI=mongodb://localhost:27017/church_manager

# JWT - REQUERIDO
JWT_SECRET=generate_random_32_characters_minimum_here
JWT_REFRESH_SECRET=another_different_random_secret_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

#### Generar Secretos Seguros

```bash
# En Linux/macOS
openssl rand -base64 32

# En Node.js (cualquier plataforma)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# En PowerShell
[System.Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

#### Configuración Completa (Opcional)

```env
# Redis (para cache y colas)
REDIS_URL=redis://localhost:6379

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_app_password
EMAIL_FROM=noreply@church.com

# WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=+14155238886

# Cloudinary (para imágenes)
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your_api_secret

# Logs
LOG_LEVEL=info
```

### 4. Crear Índices de MongoDB

```bash
npm run ensure-indexes
```

Este comando crea los índices necesarios para optimizar las consultas:
- Índices compuestos en `programs` para búsquedas por fecha
- Índices en `persons` para filtros por roles y estado
- Índices únicos en `users` y `churches`

### 5. Crear Usuario Administrador

```bash
npm run create-admin
```

Credenciales por defecto:
- **Email:** admin@church.com
- **Contraseña:** Admin123!

> 💡 **Importante:** Cambia estas credenciales al iniciar sesión por primera vez.

### 6. Iniciar el Servidor

```bash
# Modo desarrollo (con hot-reload)
npm run dev

# Modo producción
npm run build
npm start
```

El servidor estará disponible en: http://localhost:5000

### 7. Verificar Backend

```bash
# Verificar salud del servidor
curl http://localhost:5000/health

# Respuesta esperada:
# {"status":"ok","timestamp":"2026-02-13T...","uptime":...}
```

---

## 🎨 Configuración del Frontend

### 1. Navegar al Directorio

```bash
cd ../frontend
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

```bash
# Crear archivo .env
touch .env  # Linux/macOS
# O New-Item .env  # PowerShell

# Editar
nano .env
```

```env
# URL del API Backend
VITE_API_URL=http://localhost:5000/api/v1

# Opcional: Google Maps
VITE_GOOGLE_MAPS_KEY=tu_api_key

# Opcional: Sentry
VITE_SENTRY_DSN=https://your_sentry_dsn
```

### 4. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

El frontend estará disponible en: http://localhost:5173

### 5. Construir para Producción

```bash
npm run build

# Vista previa del build
npm run preview
```

---

## 🌐 Configuración de Servicios Externos

### Email (Gmail como Ejemplo)

#### 1. Habilitar App Password
1. Ve a https://myaccount.google.com/security
2. Habilita "2-Step Verification"
3. Ve a "App passwords"
4. Genera un password para "Mail"
5. Usa ese password en `SMTP_PASS`

#### 2. Configurar en .env
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # App password
EMAIL_FROM=noreply@church.com
```

### WhatsApp (Twilio)

#### 1. Crear Cuenta
1. Ve a https://www.twilio.com/try-twilio
2. Regístrate (tienen trial gratuito)
3. Obtén tu Account SID y Auth Token

#### 2. Configurar WhatsApp Sandbox
1. En el dashboard, ve a "Try WhatsApp"
2. Sigue las instrucciones para conectar tu número
3. Envía el mensaje de activación

#### 3. Configurar en .env
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_NUMBER=+14155238886
```

### Cloudinary (Imágenes)

#### 1. Crear Cuenta
1. Ve a https://cloudinary.com/users/register/free
2. Completa el registro

#### 2. Obtener Credenciales
1. En el dashboard, copia:
   - Cloud name
   - API Key
   - API Secret

#### 3. Configurar en .env
```env
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=AbCdEfGhIjKlMnOpQrStUvWxYz
```

---

## ✅ Verificación de la Instalación

### Checklist Completo

- [ ] MongoDB está ejecutándose
- [ ] Redis está ejecutándose (si se usa)
- [ ] Backend iniciado sin errores
- [ ] Frontend iniciado sin errores
- [ ] Puedes acceder a http://localhost:5173
- [ ] Puedes iniciar sesión con las credenciales de admin
- [ ] Puedes ver el dashboard

### Probar Funcionalidades Básicas

#### 1. Login
```bash
# En el navegador
http://localhost:5173/login

# Credenciales
Email: admin@church.com
Password: Admin123!
```

#### 2. Crear una Persona
1. Ve a "Personas" → "Nueva Persona"
2. Completa el formulario
3. Guarda

#### 3. Generar un Programa
1. Ve a "Programas" → "Generar Programa"
2. Selecciona fecha y actividades
3. Genera

---

## 🔧 Solución de Problemas

### Backend no inicia

#### Error: "Cannot connect to MongoDB"
```bash
# Verificar que MongoDB esté ejecutándose
# Windows
tasklist | findstr mongod

# Linux/macOS
ps aux | grep mongod

# Iniciar MongoDB si no está ejecutándose
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

#### Error: "Port 5000 already in use"
```bash
# Encontrar proceso usando el puerto
# Windows
netstat -ano | findstr :5000

# Linux/macOS  
lsof -i :5000

# Matar el proceso o cambiar PORT en .env
```

#### Error: "JWT_SECRET is not defined"
```bash
# Verificar archivo .env
cat .env | grep JWT_SECRET

# Si no existe, agregarlo
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env
```

### Frontend no inicia

#### Error: "Cannot find module"
```bash
# Limpiar y reinstalar
rm -rf node_modules package-lock.json
npm install
```

#### Error: "Failed to fetch"
```bash
# Verificar que el backend esté ejecutándose
curl http://localhost:5000/health

# Verificar VITE_API_URL en .env
echo $VITE_API_URL  # Linux/macOS
echo %VITE_API_URL%  # Windows CMD
```

### Redis Issues

#### Redis no disponible
```bash
# El sistema funcionará sin Redis, pero con funcionalidad reducida
# Para instalar Redis:

# macOS
brew install redis
brew services start redis

# Linux
sudo apt-get install redis-server
sudo systemctl start redis

# Windows
# Usar WSL o Docker
docker run -d -p 6379:6379 redis:latest
```

### MongoDB Issues

#### Error: "Authentication failed"
```bash
# Si configuraste autenticación en MongoDB
MONGODB_URI=mongodb://username:password@localhost:27017/church_manager?authSource=admin
```

#### Error: "Database locked"
```bash
# En caso de shutdown incorrecto
sudo rm /var/lib/mongodb/mongod.lock
sudo mongod --repair
sudo systemctl start mongod
```

---

## 📚 Próximos Pasos

1. **Configurar tu Iglesia**: Ve a Configuración → Iglesia
2. **Agregar Roles**: Crea los roles necesarios (Predicador, Músico, etc.)
3. **Registrar Miembros**: Agrega los miembros de tu iglesia
4. **Crear Ministerios**: Organiza ministerios y asigna líderes
5. **Generar Programas**: Comienza a generar programas de culto

---

## 🆘 Soporte

Si encuentras problemas no cubiertos en esta guía:

- **Issues**: https://github.com/arosadoclud/Sotware-iglesias/issues
- **Email**: arosadoclud@gmail.com
- **Documentación**: Ver [docs/](../)

---

¡Felicitaciones! 🎉 Church Manager v4 está instalado y listo para usar.
