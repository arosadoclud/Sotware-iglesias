# ⚡ Guía Rápida para IA - Configuración del Proyecto

## 🎯 Información Esencial

### Arquitectura
- **Stack**: TypeScript + React + Node.js + Express + MongoDB
- **Frontend**: Vite + React + TailwindCSS + Zustand
- **Backend**: Express + TypeScript + Mongoose
- **Deployment**: Vercel (frontend) + Render (backend) + MongoDB Atlas

### Estado Actual
✅ **Código**: Completamente funcional y sin errores TypeScript  
✅ **Producción**: Desplegado y operativo  
✅ **Superusuario**: Configurado correctamente (admin@iglesia.com)

---

## 🔗 URLs de Producción

```
Frontend:  https://sotware-iglesias.vercel.app/
Backend:   https://sotware-iglesias.onrender.com
API:       https://sotware-iglesias.onrender.com/api/v1
MongoDB:   mongodb+srv://sotwareiglesiav1:y9dG4RpjSNdpeo5x@software-iglesia.e4pdeui.mongodb.net/church-program-manager
```

### Credenciales Superusuario
```
Email:     admin@iglesia.com
Password:  password123
```

---

## ⚙️ Variables de Entorno

### Render (Backend) - Environment Variables
```env
MONGODB_URI=mongodb+srv://sotwareiglesiav1:y9dG4RpjSNdpeo5x@software-iglesia.e4pdeui.mongodb.net/church-program-manager?retryWrites=true&w=majority
FRONTEND_URL=https://sotware-iglesias.vercel.app
JWT_SECRET=tu-jwt-secret
NODE_ENV=production
PORT=5000
```

### Vercel (Frontend) - Environment Variables
```env
VITE_API_URL=https://sotware-iglesias.onrender.com/api/v1
```

---

## 🚀 Comandos Comunes

### Desarrollo Local
```bash
# Backend
cd backend
npm install
npm run dev          # Port 5000

# Frontend
cd frontend
npm install
npm run dev          # Port 5173
```

### Build y Deploy
```bash
# Commit y push (deploy automático)
git add .
git commit -m "mensaje"
git push origin main

# Vercel y Render detectan el push y redesplegan automáticamente
```

### Scripts de Producción

**Establecer SuperUsuario**:
```bash
cd backend
npx ts-node scripts/setSuperUserProduction.ts admin@iglesia.com "mongodb+srv://sotwareiglesiav1:y9dG4RpjSNdpeo5x@software-iglesia.e4pdeui.mongodb.net/church-program-manager?retryWrites=true&w=majority"
```

**Verificar Login**:
```bash
node test-login-production.js password123
```

**Resultado esperado**:
```
🔑 isSuperUser: true ✅
finances:edit   → ✅ SÍ
finances:delete → ✅ SÍ
```

---

## 🐛 Solución Rápida de Problemas

### Botones no aparecen en producción

**Diagnóstico**:
```bash
# 1. Verificar backend
node test-login-production.js password123
# Debe mostrar: isSuperUser: true ✅

# 2. Si es false, ejecutar script de superusuario
cd backend
npx ts-node scripts/setSuperUserProduction.ts admin@iglesia.com "mongodb+srv://..."

# 3. Verificar nuevamente
cd ..
node test-login-production.js password123
```

**En el navegador**:
1. Cerrar sesión
2. `Ctrl + Shift + R` (hard refresh)
3. Volver a iniciar sesión
4. Verificar consola: `JSON.parse(localStorage.getItem('church-auth-storage'))`

### Error CORS
```bash
# Verificar FRONTEND_URL en Render
# Debe ser: https://sotware-iglesias.vercel.app (sin trailing slash)
```

### Backend no responde
```bash
# Verificar en Render Dashboard → Logs
# Verificar que MongoDB Atlas está accesible
# Verificar que no hay errores de compilación TypeScript
```

### Errores TypeScript al hacer build
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build

# Ver errores específicos y corregir
```

---

## 📁 Estructura Importante

```
backend/
  scripts/
    setSuperUserProduction.ts  ← Script para configurar superusuario en producción
    checkProductionDB.ts       ← Verificar estado de DB producción
  src/
    middleware/
      auth.middleware.ts       ← AuthRequest interface, NO incluye get() method
    modules/
      auth/
        auth.controller.ts     ← Login response incluye isSuperUser
      finances/
        finances.controller.ts ← Controlador de finanzas
        finances.routes.ts     ← Rutas protegidas con permisos
    models/
      User.model.ts           ← Schema incluye isSuperUser: Boolean

frontend/
  src/
    store/
      authStore.ts            ← hasPermission() chequea isSuperUser
    pages/
      finances/
        FinancesPage.tsx      ← Botones condicionales con hasPermission()

test-login-production.js      ← Script de prueba de login en producción
```

---

## 🔑 Permisos y SuperUsuario

### Lógica de Permisos

**Backend** (`auth.controller.ts` línea 240):
```typescript
isSuperUser: user.isSuperUser || false  // Se envía en respuesta de login
```

**Frontend** (`authStore.ts` líneas 62-68):
```typescript
hasPermission: (permission: string) => {
  const { user } = get()
  if (!user) return false
  if (user.isSuperUser || user.role === 'SUPER_ADMIN') return true  // ← Acceso total
  return user.permissions?.includes(permission) ?? false
}
```

**UI** (`FinancesPage.tsx` líneas 147-148, 980-996):
```typescript
const canEdit = hasPermission(P.FINANCES_EDIT)
const canDelete = hasPermission(P.FINANCES_DELETE)

// Botones renderizados condicionalmente
{canEdit && <button>Editar</button>}
{canDelete && <button>Eliminar</button>}
```

### Permisos de Finanzas
```typescript
P.FINANCES_VIEW = 'finances:view'
P.FINANCES_CREATE = 'finances:create'
P.FINANCES_EDIT = 'finances:edit'
P.FINANCES_DELETE = 'finances:delete'
P.FINANCES_APPROVE = 'finances:approve'
P.FINANCES_REPORTS = 'finances:reports'
```

**SuperUsuario tiene TODOS los permisos automáticamente**

---

## 📊 Características Principales

### Módulos Implementados
✅ Autenticación (Login/Registro/Permisos)  
✅ Gestión de Personas  
✅ Finanzas (Ingresos/Egresos con categorías coloreadas)  
✅ Diezmos (Breakdown detallado por usuario)  
✅ Programas de Eventos  
✅ Ministerios  
✅ Generación de PDF y Flyers  
✅ Cartas y Templates  
✅ Actividades  
✅ Roles y Permisos granulares  
✅ Auditoría (logs de acciones)  

### Características de Finanzas
- CRUD completo de transacciones
- Categorías con colores
- Aprobación de transacciones
- Filtros avanzados (fecha, tipo, categoría, estado)
- Reportes y gráficos
- Desglose de diezmos por persona
- Solo SuperUsuario o usuarios con permisos pueden editar/eliminar

---

## 🎨 Tecnologías y Librerías

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS + shadcn/ui
- Zustand (state management)
- React Query (data fetching)
- Recharts (gráficos)
- React Router (routing)
- Axios (HTTP client)

### Backend
- Node.js + Express
- TypeScript
- Mongoose (MongoDB ODM)
- JWT (autenticación)
- Bcrypt (hashing passwords)
- Multer (file uploads)
- PDFKit (generación de PDFs)

---

## ⚠️ Notas Críticas para IA

1. **AuthRequest Interface**: NO redeclarar método `get()` - causa conflicto de tipos
   - Ubicación: `backend/src/middleware/auth.middleware.ts`
   - Declarar solo propiedades, no métodos heredados de Express.Request

2. **isSuperUser**: Campo en User model, enviado en login response
   - Backend: `user.isSuperUser || false` en auth.controller.ts
   - Frontend: Verificar en `hasPermission()` en authStore.ts
   - Si es `true`, usuario tiene TODOS los permisos

3. **CORS**: `FRONTEND_URL` en Render debe coincidir EXACTAMENTE con URL de Vercel
   - Sin trailing slash
   - Con https://
   - Caso sensitivo

4. **Scripts de Producción**: Siempre usar `setSuperUserProduction.ts` con URI de Atlas
   - NO usar `setSuperUser.ts` (usa .env local)
   - Pasar MongoDB URI como argumento

5. **Verificación**: Después de cambios en permisos:
   - Cerrar sesión en app
   - Limpiar caché (`Ctrl + Shift + R`)
   - Volver a iniciar sesión
   - Verificar con `test-login-production.js`

---

## 📚 Documentación Adicional

- **Configuración Detallada**: `CONFIGURACION-PRODUCCION-VS-LOCAL.md`
- **Arquitectura**: `ARQUITECTURA.md`
- **Deployment**: `DESPLIEGUE.md`
- **API Documentation**: `docs/API_DOCUMENTATION.md`
- **Guía de Usuario**: `docs/USER_GUIDE.md`

---

## ✅ Checklist Post-Deploy

- [ ] Verificar Vercel deployment: Status "Ready"
- [ ] Verificar Render deployment: Status "Live"
- [ ] Ejecutar `node test-login-production.js password123`
- [ ] Confirmar `isSuperUser: true ✅`
- [ ] Confirmar `finances:edit → ✅ SÍ` y `finances:delete → ✅ SÍ`
- [ ] Abrir app en navegador
- [ ] Iniciar sesión con admin@iglesia.com
- [ ] Ir a Finanzas → Verificar botones Editar/Eliminar aparecen
- [ ] Probar crear/editar/eliminar transacción
- [ ] Verificar breakdown de diezmos funciona
- [ ] Verificar categorías tienen colores

---

**Última actualización**: 17 de febrero de 2026  
**Estado**: ✅ Producción estable y funcional  
**Contacto**: admin@iglesia.com (superusuario configurado)
