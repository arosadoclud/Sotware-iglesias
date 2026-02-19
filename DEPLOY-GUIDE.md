# 🚀 Guía de Deploy - Church Program Manager

## URLs de Producción

- **Backend API**: https://sotware-iglesias.onrender.com
- **Frontend**: https://sotware-iglesias.vercel.app
- **MongoDB**: Atlas Cluster `software-iglesia.e4pdeui.mongodb.net`
- **Redis**: Upstash `thankful-lemur-38367.upstash.io`

---

## 📦 Deploy Automático

Los deploys se ejecutan automáticamente cuando haces push a `main`:

```bash
git add .
git commit -m "Nuevos cambios"
git push origin main
```

- **Vercel** detecta el push y redespliega el frontend (~2 min)
- **Render** detecta el push y redespliega el backend (~5-8 min)

---

## ⚙️ Variables de Entorno en Render

Tu servicio en Render ya tiene estas variables configuradas. Para editarlas:

1. Ve a [Render Dashboard](https://dashboard.render.com/)
2. Selecciona tu servicio: `church-manager-api`
3. Click en **Environment**
4. Edita las variables necesarias

### Variables Actuales:

```env
# SERVIDOR
NODE_ENV=production
PORT=5000
API_VERSION=v1
FRONTEND_URL=https://sotware-iglesias.vercel.app
API_BASE_URL=https://sotware-iglesias.onrender.com

# BASE DE DATOS
MONGODB_URI=mongodb+srv://username:password@your-cluster.mongodb.net/...

# JWT (genera secretos seguros de 64+ caracteres)
JWT_SECRET=your-secure-jwt-secret-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-secure-refresh-secret-here
JWT_REFRESH_EXPIRES_IN=7d

# REDIS (Upstash)
REDIS_URL=rediss://default:YOUR_PASSWORD@thankful-lemur-38367.upstash.io:6379

# EMAIL (Brevo)
EMAIL_PROVIDER=brevo
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=Your Church Name
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-brevo-user@smtp-brevo.com
SMTP_PASS=your-brevo-smtp-password
BREVO_API_KEY=your-brevo-api-key
```

> **Nota**: Los valores reales están configurados directamente en Render Dashboard por seguridad.

---

## 🔒 Tareas de Seguridad Pendientes

### ⚠️ IMPORTANTE - Rotar credenciales

1. **Redis Password (URGENTE)**:
   - Ve a [Upstash Console](https://console.upstash.com/)
   - Click en tu database `thankful-lemur-38367`
   - **Reset Password**
   - Actualiza `REDIS_URL` en Render con el nuevo password

2. **JWT Secrets (Recomendado)**:
   Genera nuevos secrets en PowerShell:
   ```powershell
   -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
   ```
   Actualiza `JWT_SECRET` y `JWT_REFRESH_SECRET` en Render.

---

## 🔍 Ver Logs

### Backend (Render):
1. Ve a tu servicio en [Render Dashboard](https://dashboard.render.com/)
2. Click en **Logs** en el menú lateral
3. Filtra por nivel: `Error`, `Warning`, `Info`

### Frontend (Vercel):
1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Click en tu proyecto
3. **Deployments** → Selecciona un deploy → **View Function Logs**

---

## 🧪 Verificar Deploy

### Backend Health Check:
```bash
curl https://sotware-iglesias.onrender.com/api/v1/health/health
```

Respuesta esperada:
```json
{
  "success": true,
  "status": "healthy",
  "database": {
    "connected": true
  }
}
```

### Frontend:
Abrir en navegador: https://sotware-iglesias.vercel.app

---

## 🔄 Redeploy Manual

### Backend (Render):
```bash
# Opción 1: Push a main
git push origin main

# Opción 2: Desde Render Dashboard
# - Click en "Manual Deploy" → "Deploy latest commit"
```

### Frontend (Vercel):
```bash
# Opción 1: Push a main
git push origin main

# Opción 2: Desde Vercel Dashboard
# - Click en tu proyecto → "Deployments" → "Redeploy"
```

---

## 📊 Monitoreo

### Uptime Robot (opcional):
Configura alertas si el servicio cae:
1. [uptimerobot.com](https://uptimerobot.com/)
2. Agregar monitor HTTP(S)
3. URL: `https://sotware-iglesias.onrender.com/api/v1/health/health`
4. Intervalo: 5 minutos

### Render Alertas:
Render envía emails automáticamente si:
- El deploy falla
- El servicio crash
- Uso de recursos alto

---

## 🚨 Rollback (Volver a Versión Anterior)

### Backend:
1. Ve a Render Dashboard → Tu servicio
2. **Events** → Encuentra el deploy anterior que funcionaba
3. Click en "Redeploy"

### Frontend:
1. Ve a Vercel Dashboard → Tu proyecto
2. **Deployments** → Encuentra el deploy anterior
3. Click en "⋮" → "Promote to Production"

---

## 📝 Checklist Post-Deploy

- [ ] Backend responde en `/api/v1/health/health`
- [ ] Frontend carga correctamente
- [ ] Login funciona
- [ ] Crear programa funciona
- [ ] PDFs se generan correctamente
- [ ] Emails se envían (si configurado)
- [ ] Redis conectado (ver logs)
- [ ] MongoDB Atlas: connections estables

---

## 💰 Costos Mensuales

- **Render Free Tier**: $0 (750 horas/mes)
- **Vercel Free Tier**: $0 (100 GB bandwidth)
- **MongoDB Atlas Free**: $0 (512 MB storage)
- **Upstash Redis Free**: $0 (10,000 commands/day)
- **Brevo Free**: $0 (300 emails/day)

**Total: $0/mes** 🎉

---

## 🆘 Solución de Problemas

### Backend no responde:
```bash
# Ver logs en Render
# Verificar que MongoDB esté accesible
# Verificar variables de entorno
```

### Frontend error de CORS:
```bash
# Verificar FRONTEND_URL en Render
# Debe coincidir con la URL de Vercel
```

### Redis no conecta:
```bash
# Verificar REDIS_URL en Render
# Formato: rediss://default:PASSWORD@HOST:6379
# Nota: doble 's' en rediss:// para TLS
```

### Base de datos lenta:
```bash
# MongoDB Atlas → Cluster → Metrics
# Verificar índices: npm run ensure-indexes
```

---

## 📚 Recursos

- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [MongoDB Atlas Docs](https://www.mongodb.com/docs/atlas/)
- [Upstash Redis Docs](https://docs.upstash.com/redis)
