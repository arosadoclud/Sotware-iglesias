# 📧 Guía Anti-SPAM: Mejora la Entregabilidad de tus Emails

## 🎯 Objetivo
Evitar que los emails de verificación y notificaciones lleguen a la carpeta de SPAM.

---

## 🔧 1. Configuración de Brevo (CRÍTICO)

### A) Verificar Dominio Remitente

**Problema actual:**
- Usas `sotwareiglesiav1@gmail.com` (Gmail)
- Gmail tiene mala reputación para emails transaccionales
- Filtros SPAM penalizan emails de Gmail a Yahoo, Hotmail, etc.

**Solución:**
1. Ve a: https://app.brevo.com/settings/senders
2. Haz clic en **"Add a Sender"**
3. Agrega un dominio propio: `noreply@tuiglesia.com`

### B) Configurar Registros DNS (SPF, DKIM, DMARC)

Una vez agregues el dominio, Brevo te dará valores para agregar en tu DNS:

#### **SPF (Sender Policy Framework)**
Autoriza a Brevo a enviar emails por ti.

```dns
Tipo: TXT
Host: @
Valor: v=spf1 include:spf.brevo.com ~all
```

#### **DKIM (DomainKeys Identified Mail)**
Firma digital que verifica autenticidad.

```dns
Tipo: TXT
Host: brevo._domainkey
Valor: [Brevo te dará el valor exacto]
```

#### **DMARC (Domain-based Message Authentication)**
Política de autenticación y reportes.

```dns
Tipo: TXT
Host: _dmarc
Valor: v=DMARC1; p=none; rua=mailto:dmarc@tudominio.com
```

**Verificación:**
- Brevo verificará automáticamente
- ✅ Verde = Configurado correctamente
- ❌ Rojo = Revisa los valores

---

## 📝 2. Mejoras en el Contenido del Email

### ✅ YA IMPLEMENTADO en el código:

#### **Estructura HTML Profesional:**
```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verificación de Email</title>
</head>
<!-- Resto del email -->
```

#### **Versión Texto Plano:**
- Incluye `textContent` además de `htmlContent`
- Mejora deliverability en clientes que bloquean HTML

#### **Headers Anti-SPAM:**
```javascript
headers: {
  'X-Mailer': 'Church Program Manager',
  'List-Unsubscribe': '<mailto:email@ejemplo.com?subject=unsubscribe>',
}
```

#### **Tags de Brevo:**
```javascript
tags: ['email-verification', 'transactional']
```

---

## 🚨 3. Palabras y Prácticas a EVITAR

### ❌ Palabras SPAM Comunes:
- GRATIS, FREE, URGENTE, CLICK AQUÍ
- ¡¡¡Múltiples exclamaciones!!!  
- MAYÚSCULAS EXCESIVAS
- "Gana dinero rápido"
- "Oferta limitada"
- "Haz clic ahora"

### ❌ Prácticas Penalizadas:
- Enlaces acortados (bit.ly, tinyurl)
- Archivos adjuntos grandes (> 1MB)
- HTML mal formado
- Imágenes sin texto alternativo
- Demasiadas imágenes vs texto
- Falta de botón "Unsubscribe"

### ✅ Buenas Prácticas:
- Ratio texto/imagen: 60/40
- Subject corto y descriptivo (< 50 caracteres)
- Remitente reconocible
- Enlaces completos (https://...)
- HTML responsive
- Incluir información de contacto

---

## 📊 4. Monitoreo en Brevo Dashboard

### Ver estadísticas:
1. Ve a: https://app.brevo.com/campaign/dashboard
2. Sección: **Transactional Emails**

**Métricas importantes:**
- ✅ **Delivered:** Email llegó exitosamente
- ⏳ **Pending:** En cola de envío
- ❌ **Hard Bounce:** Email no existe
- ⚠️ **Soft Bounce:** Buzón lleno o temporal
- 🚫 **Blocked:** Rechazado por servidor
- 📭 **Spam:** Marcado como spam

**Si ves muchos "Spam":**
1. Revisa el contenido del email
2. Verifica configuración DNS
3. Cambia de Gmail a dominio propio

---

## 🔍 5. Testing con Herramientas Profesionales

### A) Mail Tester (GRATIS)
https://www.mail-tester.com

1. Envía un email de prueba a la dirección que te dan
2. Te da un score de 0-10
3. Muestra problemas específicos
4. **Objetivo:** Score > 8/10

### B) GlockApps (PAGO)
https://glockapps.com

- Prueba deliverability en Gmail, Yahoo, Outlook, etc.
- Verifica filtros SPAM de diferentes proveedores
- $39/mes, pero puedes hacer 1 test gratis

### C) MXToolbox
https://mxtoolbox.com/EmailHealth.aspx

- Verifica configuración DNS (SPF, DKIM, DMARC)
- Revisa blacklists de IP
- Gratis

---

## 🎯 6. Checklist de Implementación

### Inmediato (Hoy):
- [x] ✅ Mejorar HTML del email (ya implementado)
- [x] ✅ Agregar versión texto plano (ya implementado)
- [x] ✅ Remover emojis del subject (ya implementado)
- [x] ✅ Agregar headers anti-SPAM (ya implementado)
- [ ] ⏳ Probar con Mail Tester

### Corto Plazo (Esta Semana):
- [ ] 📝 Registrar dominio propio si no tienes
- [ ] 🔧 Configurar SPF, DKIM, DMARC en Brevo
- [ ] 📧 Cambiar remitente de Gmail a dominio propio
- [ ] 📊 Verificar que Brevo muestre "✅" verde en DNS

### Mediano Plazo (Este Mes):
- [ ] 🔍 Monitorear métricas de Brevo semanalmente
- [ ] 📈 Mejorar contenido basado en feedback
- [ ] 🎨 A/B testing de diferentes versiones
- [ ] 📱 Probar en diferentes proveedores (Gmail, Yahoo, Hotmail)

---

## 🆘 7. Troubleshooting Común

### "Los emails llegan a SPAM en Yahoo"
**Causa:** Yahoo es MUY estricto con remitentes nuevos.
**Solución:** 
1. Usar dominio propio (no Gmail)
2. Configurar DMARC con `p=quarantine`
3. Esperar 2-3 semanas para construir reputación
4. Enviar volúmenes bajos al principio (< 100/día)

### "Algunos emails no llegan"
**Causa:** Hard bounce o soft bounce.
**Solución:** 
1. Revisar Brevo Dashboard → Logs
2. Verificar que los emails son válidos
3. Implementar validación de email en frontend

### "Gmail marca como SPAM"
**Causa:** Falta configuración DNS o contenido sospechoso.
**Solución:**
1. Verificar SPF, DKIM, DMARC
2. Usar Mail Tester para identificar problemas
3. Evitar palabras spam en subject/body

### "Hotmail bloquea todos los emails"
**Causa:** IP de Brevo en blacklist de Hotmail.
**Solución:**
1. Usar IP dedicada en Brevo (plan premium)
2. Reportar a Brevo vía soporte
3. Usar dominio propio verificado

---

## 📈 8. Mejora Progresiva de Reputación

### Warm-up del Dominio (Primera Semana):
- **Día 1-2:** Envía 10-20 emails/día
- **Día 3-4:** Envía 50 emails/día
- **Día 5-7:** Envía 100 emails/día
- **Semana 2+:** Volumen normal

### Señales Positivas:
- ✅ Tasa de apertura > 20%
- ✅ Tasa de clic > 2%
- ✅ Pocos reportes de spam (< 0.1%)
- ✅ Pocos bounces (< 5%)

### Señales Negativas:
- ❌ Tasa de apertura < 10%
- ❌ Muchos bounces (> 10%)
- ❌ Reportes de spam (> 1%)
- ❌ Engagement bajo

---

## 🎓 9. Recursos Adicionales

### Documentación Oficial:
- Brevo: https://help.brevo.com/hc/en-us/sections/360001294980
- Gmail: https://support.google.com/mail/answer/81126
- Yahoo: https://senders.yahooinc.com/best-practices/

### Herramientas Gratuitas:
- Mail Tester: https://www.mail-tester.com
- MXToolbox: https://mxtoolbox.com
- Google Postmaster: https://postmaster.google.com

### Tutoriales:
- SPF/DKIM/DMARC: https://www.cloudflare.com/learning/dns/dns-records/
- Email Deliverability: https://sendgrid.com/blog/email-deliverability-guide/

---

## 📝 10. Próximos Pasos Recomendados

1. **HOY:** Probar email actual con Mail Tester
2. **ESTA SEMANA:** Configurar dominio propio en Brevo
3. **ESTE MES:** Monitorear métricas y ajustar

¿Necesitas ayuda con algún paso? ¡Avísame! 🚀
