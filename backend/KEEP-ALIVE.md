# Keep-Alive System - Mantener Render Activo 🔄

## Problema

En el **plan gratuito de Render**, los servicios web se duermen automáticamente después de **15 minutos de inactividad**. Cuando se duerme:
- La primera petición tarda ~30 segundos en responder (cold start)
- Los usuarios experimentan delays al usar la aplicación
- Las notificaciones programadas pueden fallar

## Solución Implementada ✅

### 1. Keep-Alive Service Interno (Automático)

Hemos implementado un servicio interno que hace ping automáticamente cada 10 minutos para mantener el servidor activo.

**Ubicación:** `backend/src/services/keepAlive.service.ts`

**Características:**
- ✅ Se activa **solo en producción** automáticamente
- ✅ Hace ping cada **10 minutos** al endpoint `/health`
- ✅ Logging de cada ping con timestamp y duración
- ✅ Manejo de errores sin afectar el servidor principal
- ✅ Se detiene automáticamente al cerrar el servidor

**Configuración:**
```typescript
// En server.ts - ya configurado automáticamente
import { keepAliveService } from './services/keepAlive.service';

// Se inicia automáticamente al levantar el servidor
keepAliveService.start();
```

**Variables requeridas en Render:**
```bash
NODE_ENV=production
API_BASE_URL=https://sotware-iglesias.onrender.com
```

### 2. Health Check Endpoint

El servidor tiene dos endpoints de health check:

1. **`GET /health`** (básico, rápido)
   ```json
   {
     "success": true,
     "message": "Church Program Manager API — OK",
     "version": "v1",
     "env": "production",
     "timestamp": "2026-02-22T10:30:00.000Z"
   }
   ```

2. **`GET /api/v1/health/health`** (completo, verifica BD)
   ```json
   {
     "success": true,
     "status": "healthy",
     "timestamp": "2026-02-22T10:30:00.000Z",
     "database": {
       "connected": true,
       "users": 45,
       "churches": 3
     }
   }
   ```

### 3. Configuración en render.yaml

```yaml
services:
  - type: web
    name: church-manager-api
    plan: free
    healthCheckPath: /health  # Render usa esto para verificar el servicio
    autoDeploy: true
```

## Alternativas Externas (Opcional) 🌐

Si quieres redundancia adicional o monitor de uptime, puedes usar servicios externos gratuitos:

### Opción 1: UptimeRobot (Recomendado)
**URL:** https://uptimerobot.com

**Pasos:**
1. Crear cuenta gratuita
2. Add New Monitor
3. Monitor Type: HTTP(s)
4. URL: `https://sotware-iglesias.onrender.com/health`
5. Monitoring Interval: 5 minutos (plan gratuito)
6. Configurar alertas por email si falla

**Ventajas:**
- ✅ Gratuito hasta 50 monitores
- ✅ Interfaz visual de uptime
- ✅ Alertas por email/SMS/Slack
- ✅ Estadísticas históricas

### Opción 2: Cron-Job.org
**URL:** https://cron-job.org

**Pasos:**
1. Crear cuenta gratuita
2. Create cronjob
3. URL: `https://sotware-iglesias.onrender.com/health`
4. Schedule: Every 10 minutes
5. Enable execution

**Ventajas:**
- ✅ Completamente gratuito
- ✅ Sin límite de jobs
- ✅ Notificaciones de fallo

### Opción 3: Koyeb (Alternativa a Render)
Si el problema persiste, considera migrar a **Koyeb** que tiene un plan gratuito más generoso:
- No se duerme automáticamente
- 2 servicios gratuitos
- Deploy desde GitHub
- https://www.koyeb.com

## Verificación del Sistema ✓

### Logs del Keep-Alive Service

Una vez desplegado en Render, verás estos logs:

```
🔄 Keep-Alive Service: ACTIVADO
   URL: https://sotware-iglesias.onrender.com
   Intervalo: cada 10 minutos
✅ Keep-Alive Service iniciado correctamente

✓ Keep-Alive ping exitoso (142ms) - 2/22/2026, 10:15:30 AM
✓ Keep-Alive ping exitoso (98ms) - 2/22/2026, 10:25:30 AM
✓ Keep-Alive ping exitoso (103ms) - 2/22/2026, 10:35:30 AM
```

### Verificar manualmente
```bash
# Ping al health check
curl https://sotware-iglesias.onrender.com/health

# Response esperado:
# {
#   "success": true,
#   "message": "Church Program Manager API — OK",
#   ...
# }
```

## Monitoreo en Render Dashboard 📊

Render provee métricas gratuitas:
1. Ve a tu servicio en Render Dashboard
2. Pestaña "Metrics"
3. Verás:
   - CPU usage
   - Memory usage
   - Request count
   - Response times

Con el keep-alive activo, verás pings constantes cada 10 minutos.

## Solución de Problemas 🔧

### El servicio sigue durmiéndose

**Verificar:**
1. ¿`NODE_ENV=production` está configurado en Render?
2. ¿`API_BASE_URL` apunta a la URL correcta de Render?
3. Revisar logs en Render Dashboard para ver los pings

### Los pings aparecen como errores

Si ves errores de timeout:
- Es normal durante el cold start (primera vez)
- El servidor tarda ~30s en despertar
- Los siguientes pings serán rápidos

### Deshabilitar Keep-Alive temporalmente

Si necesitas deshabilitarlo:
```typescript
// En keepAlive.service.ts, cambiar:
this.isEnabled = false; // En lugar de: process.env.NODE_ENV === 'production'
```

## Consumo de Recursos 📉

El keep-alive consume recursos mínimos:
- **CPU:** <0.1% (ping simple HTTP)
- **Memoria:** <1MB (instancia cron)
- **Red:** ~1KB cada 10 minutos = ~144KB/día
- **Horas de compute:** No afecta límite de 750h/mes de Render (sigue corriendo igual)

## Actualizar a Plan Pago (Opcional) 💳

Si el proyecto crece, considera el plan **Starter de Render ($7/mes)**:
- ✅ Nunca se duerme
- ✅ No necesitas keep-alive
- ✅ 512MB RAM garantizada
- ✅ Mejor performance general

## Resumen Ejecutivo 📋

✅ **Sistema automático implementado**
- No requiere configuración adicional
- Se activa automáticamente en producción
- Mantiene el servidor despierto 24/7

🔍 **Monitoreo opcional**
- UptimeRobot para estadísticas y alertas
- Render Dashboard para métricas

🚀 **Próximos pasos**
- Deploy a Render (servicio se activará automáticamente)
- Verificar logs para confirmar pings exitosos
- (Opcional) Configurar UptimeRobot para monitoreo visual

---

**Última actualización:** Febrero 22, 2026
**Versión del servicio:** 1.0
**Estado:** ✅ Implementado y listo para producción
