# 🔧 Configuración: Producción vs Local

## 📋 Resumen Rápido

### URLs de Producción
- **Frontend**: https://sotware-iglesias.vercel.app/
- **Backend**: https://sotware-iglesias.onrender.com
- **API Base**: https://sotware-iglesias.onrender.com/api/v1
- **MongoDB**: MongoDB Atlas (cloud)

### URLs de Local
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000
- **API Base**: http://localhost:5000/api/v1
- **MongoDB**: MongoDB Local o Atlas

---

## 🔐 Variables de Entorno

### Backend - Producción (Render)

**Ubicación**: Render Dashboard → sotware-iglesias (service) → Environment

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://sotwareiglesiav1:y9dG4RpjSNdpeo5x@software-iglesia.e4pdeui.mongodb.net/church-program-manager?retryWrites=true&w=majority
JWT_SECRET=tu-jwt-secret-aqui
FRONTEND_URL=https://sotware-iglesias.vercel.app
CORS_ORIGIN=https://sotware-iglesias.vercel.app
```

**⚠️ IMPORTANTE**: 
- `FRONTEND_URL` debe coincidir EXACTAMENTE con la URL de Vercel
- `MONGODB_URI` apunta a MongoDB Atlas (producción)

### Backend - Local

**Ubicación**: `backend/.env`

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/church-program-manager
JWT_SECRET=tu-jwt-secret-local
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
```

**⚠️ IMPORTANTE**: 
- `FRONTEND_URL` debe apuntar al frontend local
- `MONGODB_URI` puede ser local o Atlas para desarrollo

### Frontend - Producción (Vercel)

**Ubicación**: Vercel Dashboard → sotware-iglesias (project) → Settings → Environment Variables

```env
VITE_API_URL=https://sotware-iglesias.onrender.com/api/v1
```

**⚠️ IMPORTANTE**: 
- Debe apuntar al backend de Render
- Variable empieza con `VITE_` para que Vite la reconozca
- NO incluir trailing slash

### Frontend - Local

**Ubicación**: `frontend/.env`

```env
VITE_API_URL=http://localhost:5000/api/v1
```

**⚠️ IMPORTANTE**: 
- Debe apuntar al backend local
- Asegúrate que el backend está corriendo en el puerto 5000

---

## 👤 Credenciales de Producción

### Usuario Superadministrador
```
Email: admin@iglesia.com
Password: password123
Rol: ADMIN
isSuperUser: true ✅
```

### MongoDB Atlas
```
URI: mongodb+srv://sotwareiglesiav1:y9dG4RpjSNdpeo5x@software-iglesia.e4pdeui.mongodb.net/church-program-manager?retryWrites=true&w=majority
Usuario: sotwareiglesiav1
Base de datos: church-program-manager
Cluster: software-iglesia.e4pdeui.mongodb.net
```

---

## 🚀 Scripts Útiles

### 1. Establecer SuperUsuario en Producción

```bash
cd backend
npx ts-node scripts/setSuperUserProduction.ts admin@iglesia.com "mongodb+srv://sotwareiglesiav1:y9dG4RpjSNdpeo5x@software-iglesia.e4pdeui.mongodb.net/church-program-manager?retryWrites=true&w=majority"
```

**Resultado esperado**:
```
✅ Usuario actualizado exitosamente
SuperUsuario DESPUÉS: true
```

### 2. Verificar Login en Producción

```bash
node test-login-production.js password123
```

**Resultado esperado**:
```
🔑 isSuperUser: true ✅
🎯 PERMISOS CRÍTICOS:
   finances:edit   → ✅ SÍ
   finances:delete → ✅ SÍ
```

### 3. Verificar Base de Datos de Producción

```bash
cd backend
npx ts-node scripts/checkProductionDB.ts
```

---

## 🔄 Pasos para Aplicar Cambios en Producción

### 1. Actualizar Código
```bash
git add .
git commit -m "tu mensaje"
git push origin main
```

### 2. Redeploy Automático
- **Vercel**: Automático al hacer push a `main`
- **Render**: Automático al hacer push a `main`

### 3. Verificar Deployments
- **Vercel**: https://vercel.com/dashboard → Deployments → Status: ✅ Ready
- **Render**: https://dashboard.render.com → Services → Status: 🟢 Live

### 4. Limpiar Caché
- Abrir https://sotware-iglesias.vercel.app/
- Presionar `Ctrl + Shift + R` (hard refresh)
- Cerrar sesión y volver a iniciar sesión

---

## 🐛 Troubleshooting

### Problema: "isSuperUser: false" después de ejecutar script

**Causa**: El script se ejecutó contra la base de datos local, no la de producción.

**Solución**:
```bash
# Usar el script de PRODUCCIÓN con la URI de Atlas
cd backend
npx ts-node scripts/setSuperUserProduction.ts admin@iglesia.com "mongodb+srv://sotwareiglesiav1:y9dG4RpjSNdpeo5x@software-iglesia.e4pdeui.mongodb.net/church-program-manager?retryWrites=true&w=majority"
```

### Problema: Botones de editar/eliminar no aparecen

**Pasos de diagnóstico**:

1. **Verificar backend devuelve isSuperUser**:
```bash
node test-login-production.js password123
```

Debe mostrar: `🔑 isSuperUser: true ✅`

2. **Verificar en navegador**:
- Abrir consola (F12)
- Ejecutar: `JSON.parse(localStorage.getItem('church-auth-storage'))`
- Verificar que `user.isSuperUser === true`

3. **Si isSuperUser es false en localStorage**:
- Cerrar sesión completamente
- Limpiar caché: `Ctrl + Shift + R`
- Volver a iniciar sesión

4. **Si persiste el problema**:
- Verificar que `VITE_API_URL` en Vercel apunta a Render
- Verificar que `FRONTEND_URL` en Render apunta a Vercel
- Verificar logs de Render para errores de CORS

### Problema: Error CORS en producción

**Causa**: `FRONTEND_URL` en Render no coincide con la URL real de Vercel.

**Solución**:
1. Ir a Render Dashboard → Environment
2. Verificar: `FRONTEND_URL=https://sotware-iglesias.vercel.app`
3. Si está mal, corregir y hacer redeploy
4. Esperar 2-3 minutos a que el servicio reinicie

### Problema: Backend no responde

**Verificar**:
1. Render Dashboard → Logs → Ver últimos logs
2. Verificar que no hay errores de compilación
3. Verificar que MongoDB Atlas está accesible
4. Verificar que no hay errores de TypeScript

### Problema: Frontend muestra página en blanco

**Verificar**:
1. Vercel Dashboard → Deployments → Ver último deployment
2. Ver logs de build para errores de compilación
3. Verificar que `VITE_API_URL` está configurada
4. Abrir consola del navegador (F12) para ver errores JavaScript

---

## 📊 Comparación Rápida

| Aspecto | Producción | Local |
|---------|-----------|-------|
| **Frontend URL** | https://sotware-iglesias.vercel.app/ | http://localhost:5173 |
| **Backend URL** | https://sotware-iglesias.onrender.com | http://localhost:5000 |
| **API URL** | https://sotware-iglesias.onrender.com/api/v1 | http://localhost:5000/api/v1 |
| **MongoDB** | MongoDB Atlas (cloud) | MongoDB local o Atlas |
| **Deploy** | Automático (git push) | Manual (npm run dev) |
| **Logs** | Render/Vercel Dashboard | Terminal local |
| **Variables** | Render/Vercel Dashboard | .env files |

---

## ✅ Checklist de Configuración Inicial

### Primera vez configurando producción:

- [ ] MongoDB Atlas creado y accesible
- [ ] Backend desplegado en Render
- [ ] Frontend desplegado en Vercel
- [ ] Variables de entorno configuradas en Render:
  - [ ] `MONGODB_URI` (MongoDB Atlas)
  - [ ] `FRONTEND_URL` (URL de Vercel)
  - [ ] `JWT_SECRET`
  - [ ] `CORS_ORIGIN`
- [ ] Variables de entorno configuradas en Vercel:
  - [ ] `VITE_API_URL` (URL de Render + /api/v1)
- [ ] SuperUsuario configurado en producción:
  ```bash
  cd backend
  npx ts-node scripts/setSuperUserProduction.ts admin@iglesia.com "MONGODB_URI_AQUI"
  ```
- [ ] Verificar login funciona:
  ```bash
  node test-login-production.js password123
  ```
- [ ] Abrir app en producción y verificar botones aparecen

---

## 📝 Notas Importantes

1. **NUNCA** commitear archivos `.env` al repositorio
2. **SIEMPRE** usar variables de entorno para credenciales
3. **VERIFICAR** que las URLs en producción coincidan exactamente
4. **NO** incluir trailing slashes en URLs de variables de entorno
5. **RECORDAR** que cambios en variables de entorno requieren redeploy
6. **ESPERAR** 2-3 minutos después de redeploy para que tome efecto
7. **LIMPIAR** caché del navegador después de cada deploy
8. **CERRAR SESIÓN** y volver a entrar después de cambios en permisos

---

## 🔗 Links Útiles

- **GitHub Repo**: https://github.com/arosadoclud/Sotware-iglesias
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Render Dashboard**: https://dashboard.render.com
- **MongoDB Atlas**: https://cloud.mongodb.com

---

**Última actualización**: 17 de febrero de 2026
**Estado**: ✅ Configuración verificada y funcionando
