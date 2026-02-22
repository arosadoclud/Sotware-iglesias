# Configuración de Cloudinary en Render

## 🔴 ERROR 500 al subir PDFs

Si estás viendo un error 500 al intentar subir PDFs de estudios bíblicos, es porque **las credenciales de Cloudinary no están configuradas en Render**.

## 📋 Variables de entorno requeridas

Debes configurar estas 3 variables en tu servicio de Render:

```
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

## 🔧 Cómo configurar en Render

### Paso 1: Obtener credenciales de Cloudinary

1. Ve a [Cloudinary Dashboard](https://console.cloudinary.com/)
2. Inicia sesión con tu cuenta
3. En el dashboard verás tus credenciales:
   - **Cloud Name**
   - **API Key**
   - **API Secret** (clic en "Show" para ver)

### Paso 2: Agregar variables en Render

1. Ve a tu servicio en [Render Dashboard](https://dashboard.render.com/)
2. Selecciona tu servicio backend (sotware-iglesias)
3. Ve a la pestaña **"Environment"**
4. Clic en **"Add Environment Variable"**
5. Agrega cada una de estas variables:

   | Key | Value |
   |-----|-------|
   | `CLOUDINARY_CLOUD_NAME` | `[tu cloud name]` |
   | `CLOUDINARY_API_KEY` | `[tu api key]` |
   | `CLOUDINARY_API_SECRET` | `[tu api secret]` |

6. Clic en **"Save Changes"**
7. Render **redesplegará automáticamente** el servicio con las nuevas variables

## ✅ Verificar configuración

### En Desarrollo (local)

```bash
curl http://localhost:5000/api/v1/bible-studies/cloudinary-check
```

Respuesta esperada:
```json
{
  "cloudinaryConfigured": true,
  "cloudName": true,
  "apiKey": true,
  "apiSecret": true
}
```

### En Producción

1. Ve a los **Logs** de tu servicio en Render
2. Busca estas líneas al iniciar:
   - ✅ `✓` = Variable configurada correctamente
   - ✗ `✗` = Variable faltante
3. Si ves `⚠️ WARNING: Cloudinary credentials are not configured properly`, falta alguna variable

## 🎯 Después de configurar

1. Espera a que Render termine el redespliegue (2-3 minutos)
2. Ve a `/estudios-biblicos/admin`
3. Clic en "Nuevo Estudio"
4. Sube un PDF
5. Debería subir correctamente en 2-5 segundos ✅

## 🐛 Si sigue sin funcionar

Verifica en los logs de Render:
```
📤 Uploading PDF to Cloudinary: { filename: '...', size: ..., mimetype: 'application/pdf' }
✅ PDF uploaded successfully: https://res.cloudinary.com/...
```

Si ves `❌ Cloudinary upload error`, copia el error y revisa:
- Que las credenciales sean correctas (sin espacios)
- Que el API Secret esté completo (es largo)
- Que tu plan de Cloudinary permita uploads (free tier tiene límites)

## 📊 Límites de Cloudinary (Free Tier)

- ✅ 25 GB de almacenamiento
- ✅ 25 GB de ancho de banda/mes
- ✅ Unlimited transformaciones
- ✅ Perfecto para estudios bíblicos en PDF

## 🔗 Enlaces útiles

- [Cloudinary Dashboard](https://console.cloudinary.com/)
- [Render Dashboard](https://dashboard.render.com/)
- [Documentación Cloudinary](https://cloudinary.com/documentation)
