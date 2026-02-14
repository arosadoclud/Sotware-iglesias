# 🚀 Guía de Despliegue - Church Program Manager

## Arquitectura de Producción

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Vercel      │────▶│     Render      │────▶│   MongoDB Atlas │
│   (Frontend)    │     │   (Backend)     │     │   (Database)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 📋 Pre-requisitos

1. Cuenta en [Vercel](https://vercel.com)
2. Cuenta en [Render](https://render.com)
3. Cuenta en [MongoDB Atlas](https://www.mongodb.com/atlas) (gratis)
4. Repositorio en GitHub

---

## 1️⃣ Configurar MongoDB Atlas

1. Ir a [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Crear cuenta gratuita
3. Crear un nuevo cluster (M0 - Free)
4. En **Database Access**: Crear usuario con contraseña
5. En **Network Access**: Agregar `0.0.0.0/0` (permite todas las IPs)
6. En **Databases**: Click en **Connect** → **Connect your application**
7. Copiar la URI de conexión:
   ```
   mongodb+srv://usuario:contraseña@cluster.xxxxx.mongodb.net/church-manager?retryWrites=true&w=majority
   ```

---

## 2️⃣ Desplegar Backend en Render

### Opción A: Desde el Dashboard (Recomendado)

1. Ir a [Render Dashboard](https://dashboard.render.com)
2. Click en **New** → **Web Service**
3. Conectar tu repositorio de GitHub
4. Configurar:
   - **Name**: `church-manager-api`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Docker`
   - **Plan**: Free

5. **Environment Variables** (Agregar todas):

| Variable | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `MONGO_URI` | `mongodb+srv://...` (tu URI de Atlas) |
| `JWT_SECRET` | (generar string aleatorio de 64 caracteres) |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_SECRET` | (generar string aleatorio de 64 caracteres) |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | `https://tu-app.vercel.app` (agregar después) |
| `API_BASE_URL` | `https://church-manager-api.onrender.com` |

6. Click en **Create Web Service**
7. Esperar a que termine el deploy (~5-10 minutos)
8. Copiar la URL generada (ej: `https://church-manager-api.onrender.com`)

### Verificar el Backend

Visitar: `https://church-manager-api.onrender.com/health`

Deberías ver:
```json
{
  "success": true,
  "message": "Church Program Manager API — OK",
  "version": "v1",
  "env": "production"
}
```

---

## 3️⃣ Desplegar Frontend en Vercel

### Desde el Dashboard

1. Ir a [Vercel Dashboard](https://vercel.com/dashboard)
2. Click en **Add New** → **Project**
3. Importar tu repositorio de GitHub
4. Configurar:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. **Environment Variables**:

| Variable | Valor |
|----------|-------|
| `VITE_API_URL` | `https://church-manager-api.onrender.com/api/v1` |

6. Click en **Deploy**
7. Esperar el deploy (~2-3 minutos)
8. Copiar la URL generada (ej: `https://tu-app.vercel.app`)

---

## 4️⃣ Actualizar FRONTEND_URL en Render

1. Volver a Render Dashboard
2. Ir a tu servicio `church-manager-api`
3. En **Environment** → Editar `FRONTEND_URL`
4. Poner la URL de Vercel: `https://tu-app.vercel.app`
5. Guardar y esperar el redeploy

---

## 5️⃣ Crear Usuario Admin Inicial

Una vez desplegado, necesitas crear el primer usuario admin.

### Opción 1: Usar el Shell de Render

1. En Render Dashboard → Tu servicio → **Shell**
2. Ejecutar:
   ```bash
   node dist/scripts/seed.js
   ```

### Opción 2: Llamar la API directamente

```bash
curl -X POST https://church-manager-api.onrender.com/api/v1/auth/setup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tuiglesia.com",
    "password": "TuPassword123!",
    "fullName": "Administrador",
    "churchName": "Tu Iglesia"
  }'
```

---

## 🔧 Variables de Entorno Completas

### Backend (Render)

```env
# Servidor
NODE_ENV=production
PORT=5000
API_BASE_URL=https://tu-app.onrender.com
FRONTEND_URL=https://tu-app.vercel.app

# Base de datos
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/church-manager

# JWT
JWT_SECRET=tu_secreto_super_largo_minimo_64_caracteres_aleatorios
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=otro_secreto_diferente_igual_de_largo
JWT_REFRESH_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=200

# Timezone
DEFAULT_TIMEZONE=America/Santo_Domingo
```

### Frontend (Vercel)

```env
VITE_API_URL=https://tu-app.onrender.com/api/v1
```

---

## ⚠️ Notas Importantes

### Render Free Tier
- El servicio se "duerme" después de 15 minutos de inactividad
- La primera request después de dormir toma ~30 segundos
- Para evitar esto, puedes usar un servicio como UptimeRobot para hacer ping cada 14 minutos

### MongoDB Atlas Free Tier
- 512 MB de almacenamiento
- Suficiente para miles de programas y personas
- Backups automáticos

### Vercel Free Tier
- Dominio personalizado gratuito
- SSL automático
- Sin límites de bandwidth razonables

---

## 🔄 Actualizar la Aplicación

### Backend
1. Push cambios a GitHub
2. Render detecta automáticamente y hace redeploy

### Frontend
1. Push cambios a GitHub
2. Vercel detecta automáticamente y hace redeploy

---

## 📱 Dominio Personalizado (Opcional)

### En Vercel
1. Dashboard → Tu proyecto → **Settings** → **Domains**
2. Agregar tu dominio (ej: `app.tuiglesia.com`)
3. Configurar DNS según instrucciones

### En Render
1. Dashboard → Tu servicio → **Settings** → **Custom Domains**
2. Agregar dominio (ej: `api.tuiglesia.com`)
3. Configurar DNS según instrucciones

---

## 🆘 Troubleshooting

### Error de CORS
- Verificar que `FRONTEND_URL` en Render coincida exactamente con la URL de Vercel
- Incluir `https://`

### Error de conexión a MongoDB
- Verificar que la IP `0.0.0.0/0` esté permitida en Atlas
- Verificar usuario y contraseña en la URI

### PDFs no se generan
- Verificar que el Dockerfile tenga Chrome instalado
- Revisar los logs en Render Dashboard

### Login no funciona
- Verificar que `VITE_API_URL` esté correctamente configurado en Vercel
- Debe incluir `/api/v1` al final

---

## ✅ Checklist Final

- [ ] MongoDB Atlas configurado con usuario y acceso de red
- [ ] Backend desplegado en Render con todas las variables
- [ ] Endpoint `/health` responde correctamente
- [ ] Frontend desplegado en Vercel con `VITE_API_URL`
- [ ] `FRONTEND_URL` actualizado en Render
- [ ] Usuario admin creado
- [ ] Login funciona correctamente
- [ ] Crear programa funciona
- [ ] Generar PDF funciona
- [ ] Compartir por WhatsApp funciona

---

¡Listo! Tu aplicación está en producción 🎉
