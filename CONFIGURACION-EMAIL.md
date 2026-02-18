# 📧 Configuración de Email para Verificación y Recuperación de Contraseña

## ✅ Sistema Implementado

El sistema ahora incluye:
- ✅ **Verificación de email obligatoria** para nuevos registros
- ✅ **Recuperación de contraseña** con email
- ✅ **Reenvío de email de verificación**
- ✅ **Compatible con todos los proveedores** (Gmail, Hotmail, Yahoo, Outlook, etc.)

## 🚀 Opción 1: Gmail con App Password (RECOMENDADO)

### Paso 1: Crear App Password de Gmail

1. Ve a tu cuenta de Gmail: https://myaccount.google.com/
2. En el menú lateral, haz clic en **"Seguridad"**
3. En "Cómo inicias sesión en Google":
   - Si no tienes **Verificación en 2 pasos**, actívala primero
4. Busca **"Contraseñas de aplicaciones"** (abajo en la página)
5. Selecciona:
   - **App**: Correo
   - **Dispositivo**: Otro (nombre personalizado) → Escribe "Church Manager"
6. Google generará un código de **16 caracteres** (ejemplo: `abcd efgh ijkl mnop`)
7. **Copia este código SIN espacios**

### Paso 2: Configurar backend/.env

Abre el archivo `backend/.env` y edita estas líneas:

```env
# Email Configuration
EMAIL_PROVIDER=smtp
EMAIL_FROM=tu-email@gmail.com
EMAIL_FROM_NAME=Iglesia Dios Fuerte
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=abcdefghijklmnop    # ← Pega los 16 caracteres SIN espacios
```

### Paso 3: Reiniciar el Backend

```bash
cd backend
npm run dev
```

¡Listo! Ya puedes probar:
- Registrar un nuevo usuario
- Recuperar contraseña

---

## 🌐 Opción 2: SendGrid (Para producción profesional)

### Ventajas de SendGrid:
- ✅ 100 emails gratis por día (suficiente para iglesias pequeñas/medianas)
- ✅ No requiere configurar 2FA como Gmail
- ✅ Mejor entregabilidad (no cae en spam)
- ✅ Funciona para **todos los proveedores** (Gmail, Hotmail, Yahoo, etc.)

### Paso 1: Crear Cuenta en SendGrid

1. Ve a https://sendgrid.com
2. Regístrate (gratis)
3. Verifica tu email
4. Ve a **Settings** → **API Keys**
5. Crea una nueva API Key:
   - Nombre: "Church Manager"
   - Permisos: **Full Access** (para enviar emails)
6. Copia la API Key (empieza con `SG.`)

### Paso 2: Verificar Dominio o Email (Opcional pero recomendado)

SendGrid requiere verificar el email que usarás como remitente:

1. Ve a **Settings** → **Sender Authentication**
2. Opción A: **Single Sender Verification** (más fácil):
   - Haz clic en "Create New Sender"
   - Llena el formulario con tus datos
   - Verifica el email que recibirás
3. Opción B: **Domain Authentication** (profesional):
   - Requiere configurar DNS de tu dominio

### Paso 3: Configurar backend/.env

```env
# Email Configuration
EMAIL_PROVIDER=sendgrid
EMAIL_FROM=noreply@tuiglesia.com    # ← Email verificado en SendGrid
EMAIL_FROM_NAME=Iglesia Dios Fuerte
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx    # ← Tu API Key
```

### Paso 4: Reiniciar el Backend

```bash
cd backend
npm run dev
```

---

## 🧪 Cómo Probar que Funciona

### 1. Probar Registro con Verificación de Email

1. Ve a tu frontend: http://localhost:5173/register
2. Regístrate con un email real
3. Deberías ver: **"¡Verifica tu Email!"**
4. Revisa tu email:
   - Gmail: https://mail.google.com
   - Hotmail: https://outlook.live.com
5. Abre el email y haz clic en **"Verificar Email"**
6. Deberías ser redirigido al dashboard automáticamente

### 2. Probar Recuperación de Contraseña

1. Ve al login: http://localhost:5173/login
2. Haz clic en **"¿Olvidaste tu contraseña?"**
3. Ingresa tu email
4. Deberías recibir un email con link de reseteo
5. Haz clic en el link e ingresa nueva contraseña

### 3. Probar Reenvío de Email

1. Si no recibiste el email de verificación
2. Intenta hacer login (te mostrará alerta)
3. Haz clic en **"Reenviar email de verificación"**
4. Recibirás un nuevo email (válido por 24 horas)

---

## ❓ Preguntas Frecuentes

### ¿SendGrid funciona para Gmail y Hotmail?

**Sí, 100%**. SendGrid es un servicio de envío de emails. Puede enviar emails a:
- ✅ Gmail (@gmail.com)
- ✅ Hotmail/Outlook (@hotmail.com, @outlook.com)
- ✅ Yahoo (@yahoo.com, @yahoo.es)
- ✅ Cualquier proveedor de email

El destinatario puede usar **cualquier proveedor**, SendGrid solo es el servicio que **envía** los emails.

### ¿Cuántos emails puedo enviar gratis?

- **Gmail**: Sin límite (pero tiene cuotas diarias: ~500 emails/día)
- **SendGrid**: 100 emails/día gratis (suficiente para la mayoría de iglesias)

### ¿Qué pasa si el email no llega?

1. **Revisa spam/correo no deseado**
2. **Verifica configuración**:
   - Gmail: App Password correcto (16 caracteres)
   - SendGrid: API Key y email verificado
3. **Revisa logs del backend**: `npm run dev` mostrará errores
4. **Prueba con otro email**: A veces Gmail bloquea emails si detecta sospecha

### ¿Los usuarios creados por admin necesitan verificar email?

**No**. Solo los usuarios que se **auto-registran** necesitan verificar su email. Los usuarios creados por un administrador desde el panel de administración se crean con `isEmailVerified: true` automáticamente.

### ¿Cuánto tiempo es válido el link de verificación?

- **Verificación de email**: 24 horas
- **Recuperación de contraseña**: 1 hora

---

## 🔧 Troubleshooting

### Error: "Error enviando email de verificación"

**Causa**: Credenciales incorrectas o no configuradas

**Solución**:
1. Verifica que `SMTP_USER` y `SMTP_PASS` (Gmail) o `SENDGRID_API_KEY` no estén vacíos
2. Gmail: Asegúrate de usar App Password, NO tu contraseña normal
3. SendGrid: Verifica que la API Key sea correcta y tenga permisos de envío

### Error: "El enlace de verificación es inválido o ha expirado"

**Causa**: El link expiró (24 horas) o ya fue usado

**Solución**:
1. Ve al login
2. Intenta iniciar sesión
3. Haz clic en "Reenviar email de verificación"
4. Recibirás un nuevo link

### Los emails caen en spam

**Solución para Gmail**:
- Agrega tu email a contactos
- Usa SendGrid en producción (mejor entregabilidad)

**Solución para SendGrid**:
- Verifica tu dominio (Domain Authentication)
- Usa un email corporativo (@tuiglesia.com) en lugar de @gmail.com

### ¿Cómo verifico si el email está configurado?

Revisa los logs del backend cuando un usuario se registre:

```bash
# Logs del backend
Email de verificación enviado a: usuario@gmail.com
```

Si ves:
```
Email no configurado - Token de verificación: abc123...
```

Significa que las credenciales de email NO están configuradas.

---

## 📝 Configuración Recomendada por Ambiente

### Desarrollo Local
```env
EMAIL_PROVIDER=smtp
SMTP_USER=tu-email@gmail.com
SMTP_PASS=app-password-16-caracteres
```

### Producción
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
EMAIL_FROM=noreply@tudominio.com
```

---

## 🎯 Resumen Rápido

**Para empezar rápido (Gmail)**:
1. Activa 2FA en Gmail
2. Genera App Password
3. Pega en `backend/.env` → `SMTP_PASS`
4. Reinicia backend
5. Registra usuario de prueba

**Para producción (SendGrid)**:
1. Crea cuenta en SendGrid
2. Crea API Key
3. Verifica email remitente
4. Pega en `backend/.env` → `SENDGRID_API_KEY`
5. Reinicia backend

¡Listo! 🎉
