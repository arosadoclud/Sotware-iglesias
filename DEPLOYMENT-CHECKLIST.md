# 🚀 DEPLOYMENT A PRODUCCIÓN - GUÍA COMPLETA

## 📋 Resumen del Estado Actual

### ✅ Base de Datos (MongoDB Atlas)
- **Estado**: ✅ ACTUALIZADA
- **Usuarios**: 1 usuario con superusuario configurado
- **Categorías**: 10 categorías con colores asignados
- **Transacciones**: Sistema funcionando correctamente

### ✅ Backend (Render)
- **URL**: https://sotware-iglesias.onrender.com
- **Estado del código**: ✅ Actualizado en GitHub
- **Compilación**: ✅ Sin errores

### ✅ Frontend (Vercel)
- **URL**: https://sotware-iglesias.vercel.app
- **Estado del código**: ✅ Actualizado en GitHub
- **Compilación**: ✅ Sin errores

---

## 🔧 CONFIGURACIÓN REQUERIDA

### 1. Variables de Entorno en VERCEL (Frontend)

Ir a: https://vercel.com/dashboard → Tu proyecto → Settings → Environment Variables

**Variable requerida:**

```bash
VITE_API_URL=https://sotware-iglesias.onrender.com/api/v1
```

**❗ IMPORTANTE:** 
- Sin esta variable, el frontend intentará usar `/api/v1` (relativo) y fallará
- Debe incluir `/api/v1` al final
- No incluir `/` final después de `/api/v1`

**Después de configurarla:**
1. Ve a Deployments
2. Encuentra el último deployment
3. Click en los 3 puntos (...)
4. Selecciona "Redeploy"

---

### 2. Variables de Entorno en RENDER (Backend)

Ir a: https://dashboard.render.com → Tu servicio → Environment

**Variables requeridas:**

```bash
# MongoDB
MONGO_URI=tu-connection-string-de-mongodb-atlas

# Frontend URL (para CORS)
FRONTEND_URL=https://sotware-iglesias.vercel.app

# JWT Secrets
JWT_SECRET=tu-secret-super-seguro-aqui
JWT_REFRESH_SECRET=otro-secret-diferente-para-refresh

# Puerto (automático en Render, pero por si acaso)
PORT=5000

# Node Environment
NODE_ENV=production
```

**❗ IMPORTANTE:** 
- El FRONTEND_URL debe coincidir EXACTAMENTE con la URL de Vercel
- Los JWT secrets deben ser strings largos y seguros
- MONGO_URI debe incluir el nombre de la base de datos

---

## 🔑 CONFIGURACIÓN DE SUPERUSUARIO

### Usuario actual con permisos de superadmin:
- **Email**: admin@iglesia.com
- **Estado**: ✅ Configurado

### Para asignar superusuario a otro usuario:

```bash
# Desde el directorio backend/
npx ts-node scripts/setSuperUser.ts email@del-usuario.com
```

**Ejemplo:**
```bash
npx ts-node scripts/setSuperUser.ts pastor@iglesia.com
```

---

## ✨ NUEVAS FUNCIONALIDADES IMPLEMENTADAS

### 1. Sistema de Permisos de Superadmin
- ✅ Campo `isSuperUser` en modelo de Usuario
- ✅ Middleware de autenticación actualizado
- ✅ Protección en rutas sensibles
- ✅ Solo superusuarios pueden gestionar permisos

### 2. Categorías con Colores
- ✅ Campo `color` en modelo de FinanceCategory
- ✅ 10 categorías predefinidas con colores
- ✅ Visualización con colores en frontend

### 3. Mejoras en Reportes de Finanzas
- ✅ Desglose de diezmos con 10% para concilio
- ✅ Botones de editar/eliminar transacciones
- ✅ Reportes mensuales y anuales mejorados
- ✅ Exportación a PDF con nuevos formatos

### 4. Diezmos - Nueva Funcionalidad
- ✅ Endpoint para listar diezmos del mes
- ✅ Tabla de desglose de diezmos en frontend
- ✅ Cálculo automático del 10% para concilio
- ✅ Integración con reportes PDF

---

## 🔍 VERIFICACIÓN POST-DEPLOYMENT

### 1. Verificar Backend

```bash
# Test de health check
curl https://sotware-iglesias.onrender.com/health

# Test de autenticación
curl https://sotware-iglesias.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@iglesia.com","password":"tu-password"}'
```

### 2. Verificar Frontend

1. Abrir: https://sotware-iglesias.vercel.app
2. Hacer login con `admin@iglesia.com`
3. Verificar que se vea el dashboard
4. Ir a sección **Finanzas**:
   - ✓ Debe mostrar botones de editar/eliminar en transacciones
   - ✓ Debe mostrar categorías con colores
   - ✓ Debe permitir generar reportes PDF
5. Ir a sección **Reportes de Finanzas**:
   - ✓ Debe mostrar tabla de diezmos
   - ✓ Debe calcular el 10% para concilio
   - ✓ Debe permitir exportar a PDF

### 3. Verificar Permisos de Superadmin

Como superusuario debes poder:
- ✓ Ver sección de **Administración** → **Gestión de Usuarios**
- ✓ Ver botón de **Permisos** en cada usuario
- ✓ Editar permisos personalizados
- ✓ Ver todos los módulos del sistema

---

## 🐛 TROUBLESHOOTING

### Problema: "No puedo ver los botones de editar/eliminar"

**Causa**: Variable de entorno VITE_API_URL no configurada en Vercel

**Solución**:
1. Ir a Vercel → Settings → Environment Variables
2. Agregar `VITE_API_URL=https://sotware-iglesias.onrender.com/api/v1`
3. Redeploy el proyecto

---

### Problema: "No aparecen las categorías con colores"

**Causa**: Base de datos no migrada

**Solución**:
```bash
cd backend
npx ts-node scripts/checkProductionDB.ts
npx ts-node scripts/migrateProductionDB.ts
```

---

### Problema: "No aparece el desglose de diezmos"

**Causa**: El frontend no se conecta al backend o endpoint no disponible

**Solución**:
1. Verificar que VITE_API_URL esté configurado en Vercel
2. Verificar que el backend esté desplegado en Render
3. Abrir consola del navegador (F12) y buscar errores de red
4. Verificar que la transacción esté en la categoría "Diezmos" (ING-01)

---

### Problema: "No puedo acceder a permisos de usuario"

**Causa**: El usuario no es superadmin

**Solución**:
```bash
cd backend
npx ts-node scripts/setSuperUser.ts admin@iglesia.com
```

---

### Problema: "Error 500 en el backend"

**Causa**: Variables de entorno mal configuradas en Render

**Solución**:
1. Ir a Render Dashboard → Environment
2. Verificar que todas las variables estén correctas
3. Verificar especialmente MONGO_URI y FRONTEND_URL
4. Manual redeploy si es necesario

---

## 📝 CHECKLIST DE DEPLOYMENT

- [ ] Variables de entorno configuradas en Vercel
- [ ] Variables de entorno configuradas en Render
- [ ] Base de datos migrada (ejecutar checkProductionDB.ts)
- [ ] Superusuario configurado
- [ ] Frontend desplegado en Vercel
- [ ] Backend desplegado en Render
- [ ] Login funciona correctamente
- [ ] Botones de editar/eliminar visibles en Finanzas
- [ ] Categorías se muestran con colores
- [ ] Desglose de diezmos funciona
- [ ] Reportes PDF se generan correctamente
- [ ] Permisos de superadmin funcionan

---

## 🆘 SOPORTE

Si encuentras algún problema adicional:

1. **Verificar logs de Render**: 
   - https://dashboard.render.com → Tu servicio → Logs
   
2. **Verificar logs de Vercel**:
   - https://vercel.com/dashboard → Tu proyecto → Deployments → Logs

3. **Verificar consola del navegador**:
   - Presiona F12 → Console
   - Busca errores en rojo

4. **Verificar la base de datos**:
   ```bash
   cd backend
   npx ts-node scripts/checkProductionDB.ts
   ```

---

## 📚 DOCUMENTACIÓN ADICIONAL

- [Arquitectura del Sistema](../ARQUITECTURA.md)
- [Guía de API](../docs/API_DOCUMENTATION.md)
- [Guía de Usuario](../docs/USER_GUIDE.md)
- [Guía de Deployment](../DESPLIEGUE.md)

---

**Última actualización**: 17 de Febrero, 2026
**Versión del sistema**: 1.5.0
**Estado**: ✅ Producción
