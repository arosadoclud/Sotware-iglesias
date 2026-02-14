# 📘 Manual de Usuario

Guía completa para usar Church Manager v4.

## 📋 Tabla de Contenidos

- [Introducción](#introducción)
- [Primeros Pasos](#primeros-pasos)
- [Dashboard](#dashboard)
- [Gestión de Personas](#gestión-de-personas)
- [Gestión de Programas](#gestión-de-programas)
- [Ministerios y Roles](#ministerios-y-roles)
- [Cartas y Documentos](#cartas-y-documentos)
- [Configuración](#configuración)
- [Preguntas Frecuentes](#preguntas-frecuentes)

---

## Introducción

Church Manager v4 es un sistema completo diseñado para ayudar a las iglesias a administrar:

- 👥 **Miembros y Participantes**: Base de datos completa
- 📅 **Programas de Culto**: Generación automática inteligente
- 👔 **Ministerios y Roles**: Organización flexible
- 📄 **Cartas y Documentos**: Personalizados y profesionales
- 📧 **Notificaciones**: Email y WhatsApp automatizadas
- 📊 **Estadísticas**: Reportes y métricas en tiempo real

---

## Primeros Pasos

### Registro de la Iglesia

1. Ve a la página de registro: `https://tudominio.com/register`

2. Completa la información de la iglesia:
   - **Nombre de la Iglesia**: Ej. "Iglesia Bautista Central"
   - **Dirección**: Calle y número
   - **Teléfono**: Número de contacto
   - **Email**: Email oficial de la iglesia

3. Crea tu cuenta de administrador:
   - **Nombre**: Tu nombre completo
   - **Email**: Tu email personal
   - **Contraseña**: Mínimo 8 caracteres, con mayúsculas y números
   - **Teléfono**: Tu número de contacto

4. Click en "Registrar Iglesia"

5. Recibirás un email de confirmación

### Primer Inicio de Sesión

1. Ve a: `https://tudominio.com/login`

2. Ingresa tus credenciales:
   - Email
   - Contraseña

3. Click en "Iniciar Sesión"

4. Serás redirigido al Dashboard

### Configuración Inicial

Una vez dentro, te recomendamos:

1. **Actualizar información de la iglesia**
   - Ve a Configuración → Iglesia
   - Sube el logo
   - Personaliza colores
   - Configura información del pastor

2. **Crear roles necesarios**
   - Ve a Configuración → Roles
   - Crea: Predicador, Músico, Ujier, etc.

3. **Registrar primeros miembros**
   - Ve a Personas → Nueva Persona
   - Comienza con el equipo de liderazgo

---

## Dashboard

El Dashboard es tu vista principal con información clave:

### Métricas Principales

```
┌─────────────────────────────────────────────────┐
│  📊 DASHBOARD                                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  👥 Total Miembros: 145                         │
│  ✅ Miembros Activos: 132                       │
│  📅 Programas Este Mes: 8                       │
│  📈 Participación Promedio: 87%                 │
│                                                 │
├─────────────────────────────────────────────────┤
│  🗓️ PRÓXIMOS PROGRAMAS                          │
│                                                 │
│  • Culto Dominical - 16 Feb 2026               │
│    5 asignaciones, estado: Publicado           │
│                                                 │
│  • Vigilia de Oración - 18 Feb 2026            │
│    3 asignaciones, estado: Borrador            │
│                                                 │
├─────────────────────────────────────────────────┤
│  📈 ESTADÍSTICAS                                │
│  [Gráfico de participación mensual]            │
│  [Gráfico de distribución por roles]            │
└─────────────────────────────────────────────────┘
```

### Acciones Rápidas

- **Generar Programa**: Crear nuevo programa de culto
- **Nueva Persona**: Registrar nuevo miembro
- **Ver Calendario**: Vista mensual de programas
- **Ver Reportes**: Estadísticas detalladas

---

## Gestión de Personas

### Listar Personas

1. Ve a **Personas** en el menú lateral

2. Verás la lista de todos los miembros:

```
┌─────────────────────────────────────────────────┐
│  👥 PERSONAS                    [+ Nueva Persona]│
├─────────────────────────────────────────────────┤
│  🔍 Buscar: [____________]  Rol: [Todos ▼]      │
│     Estado: [Activos ▼]                         │
├─────────────────────────────────────────────────┤
│                                                 │
│  📷  Juan Pérez                    Activo       │
│      juan@example.com            🎤 Predicador │
│                                  🎵 Músico     │
│                                                 │
│  📷  María López                   Activo       │
│      maria@example.com           👔 Ujier      │
│                                                 │
│  📷  Pedro García                  Inactivo     │
│      pedro@example.com           🎤 Predicador │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Filtros Disponibles

- **Búsqueda**: Por nombre, email o teléfono
- **Por Rol**: Filtrar por ministerio específico
- **Por Estado**: Activos, Inactivos, Todos
- **Ordenar**: Por nombre, fecha de registro, etc.

### Crear Nueva Persona

1. Click en **"+ Nueva Persona"**

2. Completa el formulario:

#### Información Básica
- **Nombres**: Nombre(s) de la persona
- **Apellidos**: Apellido(s)
- **Email**: Correo electrónico (opcional)
- **Teléfono**: Número de contacto
- **Fecha de Nacimiento**: Para estadísticas
- **Género**: Masculino / Femenino

#### Información Adicional
- **Dirección**: Domicilio
- **Foto**: Subir foto de perfil
- **Estado Civil**: Soltero, Casado, etc.
- **Notas**: Información adicional

#### Roles y Ministerios
- Click en **"+ Agregar Rol"**
- Selecciona el rol (Predicador, Músico, etc.)
- Indica nivel de experiencia:
  - Principiante
  - Intermedio
  - Avanzado
- Marca si el rol está activo

#### Disponibilidad
Marca los días en que la persona puede servir:
- ☑ Domingo
- ☐ Lunes
- ☐ Martes
- ☑ Miércoles
- ☐ Jueves
- ☑ Viernes
- ☐ Sábado

3. Click en **"Guardar Persona"**

### Editar Persona

1. Click sobre la persona en la lista

2. Verás su perfil completo:

```
┌─────────────────────────────────────────────────┐
│  JUAN PÉREZ                        [Editar]     │
│  📷 [Foto]                                      │
├─────────────────────────────────────────────────┤
│  📧 juan@example.com                            │
│  📱 +1234567890                                 │
│  📍 Calle Principal 123                         │
│  🎂 15 Enero 1985 (41 años)                     │
├─────────────────────────────────────────────────┤
│  ROLES Y MINISTERIOS                            │
│  🎤 Predicador (Intermedio) ✅ Activo           │
│  🎵 Músico (Avanzado)      ✅ Activo           │
├─────────────────────────────────────────────────┤
│  DISPONIBILIDAD                                 │
│  Dom ✅  Lun ❌  Mar ❌  Mié ✅  Jue ❌         │
│  Vie ✅  Sáb ❌                                 │
├─────────────────────────────────────────────────┤
│  ESTADÍSTICAS                                   │
│  • Total Participaciones: 24                    │
│  • Última Participación: 2 Feb 2026             │
│  • Participaciones como Predicador: 12          │
│  • Participaciones como Músico: 12              │
├─────────────────────────────────────────────────┤
│  HISTORIAL                                      │
│  📅 16 Feb 2026 - Predicación                   │
│  📅 2 Feb 2026 - Música                         │
│  📅 26 Ene 2026 - Predicación                   │
└─────────────────────────────────────────────────┘
```

3. Click en **"Editar"** para modificar información

### Marcar como Inactivo

Cuando una persona no puede servir temporalmente:

1. Abre su perfil
2. Click en el menú (⋮)
3. Selecciona **"Marcar como Inactivo"**
4. (Opcional) Agrega una nota explicando el motivo
5. Las personas inactivas no aparecerán en la generación de programas

### Eliminar Persona

1. Abre su perfil
2. Click en el menú (⋮)
3. Selecciona **"Eliminar"**
4. Confirma la acción

> ⚠️ **Nota**: Esto es un eliminado suave. Los datos se conservan para estadísticas históricas.

---

## Gestión de Programas

### Listar Programas

1. Ve a **Programas** en el menú

2. Verás todos los programas:

```
┌─────────────────────────────────────────────────┐
│  📅 PROGRAMAS              [+ Generar Programa]  │
├─────────────────────────────────────────────────┤
│  Filtros:                                       │
│  Estado: [Todos ▼]  Mes: [Febrero ▼]           │
├─────────────────────────────────────────────────┤
│                                                 │
│  📅 Culto Dominical                             │
│     16 Feb 2026, 10:00 AM                       │
│     Estado: Publicado ✅                        │
│     5 asignaciones                              │
│     [Ver] [PDF] [Editar]                        │
│                                                 │
│  📅 Vigilia de Oración                          │
│     18 Feb 2026, 7:00 PM                        │
│     Estado: Borrador 📝                         │
│     3 asignaciones                              │
│     [Ver] [Editar] [Publicar]                   │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Generar Nuevo Programa

#### Paso 1: Información Básica

1. Click en **"+ Generar Programa"**

2. Completa:
   - **Fecha y Hora**: Cuándo será el culto
   - **Título**: Ej. "Culto Dominical"
   - **Tema**: Ej. "El Amor de Dios"
   - **Descripción**: Detalles adicionales

#### Paso 2: Seleccionar Actividades

3. Selecciona las actividades necesarias:

```
┌─────────────────────────────────────────────────┐
│  ACTIVIDADES                                    │
├─────────────────────────────────────────────────┤
│  ☑ Bienvenida                                   │
│     Rol requerido: Predicador                   │
│                                                 │
│  ☑ Alabanza y Adoración                         │
│     Rol requerido: Músico                       │
│     Notas: [Incluir coros nuevos]               │
│                                                 │
│  ☑ Predicación                                  │
│     Rol requerido: Predicador                   │
│                                                 │
│  ☑ Ofrenda                                      │
│     Rol requerido: Ujier                        │
│                                                 │
│  ☐ Oración                                      │
│     Rol requerido: Líder de Oración             │
└─────────────────────────────────────────────────┘
```

#### Paso 3: Opciones de Generación

4. Configura opciones:

```
┌─────────────────────────────────────────────────┐
│  OPCIONES DE GENERACIÓN                         │
├─────────────────────────────────────────────────┤
│  Período de historial: [3 meses ▼]             │
│  Preferir experimentados: ☑                     │
│  Balance de género: ☐                           │
│  Solo disponibles en esta fecha: ☑              │
└─────────────────────────────────────────────────┘
```

5. Click en **"Generar Programa"**

#### Paso 4: Revisar Asignaciones

6. El sistema muestra las asignaciones:

```
┌─────────────────────────────────────────────────┐
│  ASIGNACIONES PROPUESTAS                        │
├─────────────────────────────────────────────────┤
│  Bienvenida                                     │
│  👤 Pedro García                                │
│     📊 Score: 85/100                            │
│     ⏱️ Última participación: hace 14 días       │
│     [Cambiar]                                   │
│                                                 │
│  Alabanza y Adoración                           │
│  👤 María López                                 │
│     📊 Score: 92/100                            │
│     ⏱️ Última participación: hace 21 días       │
│     [Cambiar]                                   │
│                                                 │
│  ⚠️ ADVERTENCIAS                                │
│  • Juan Pérez tiene 3 participaciones este mes  │
│  • Considerar agregar más músicos               │
└─────────────────────────────────────────────────┘
```

7. Puedes:
   - **Aceptar**: Guardar como está
   - **Cambiar**: Seleccionar otra persona
   - **Editar**: Modificar detalles

8. Click en **"Guardar como Borrador"**

### Estados de Programa

Un programa pasa por estos estados:

1. **Borrador** 📝
   - Recién creado
   - Puedes editarlo libremente
   - No se envían notificaciones

2. **Publicado** ✅
   - Listo para el culto
   - Se envían notificaciones automáticas
   - Los participantes pueden confirmar

3. **Completado** ✔️
   - El culto ya pasó
   - Se registra en el historial
   - Ya no se puede editar

### Publicar Programa

Cuando el programa está listo:

1. Abre el programa
2. Click en **"Publicar"**
3. Confirma:
   - ☑ Enviar notificaciones por email
   - ☑ Enviar notificaciones por WhatsApp
4. Click en **"Publicar Programa"**

Las personas asignadas recibirán:
- **Email** con los detalles
- **WhatsApp** con recordatorio
- **Notificación** en la plataforma

### Editar Programa

1. Abre el programa
2. Click en **"Editar"**
3. Modifica lo necesario:
   - Cambiar fecha/hora
   - Cambiar asignaciones
   - Agregar/quitar actividades
   - Actualizar tema
4. Click en **"Guardar Cambios"**

> 💡 **Tip**: Si el programa ya está publicado, se enviará una notificación de cambio a los afectados.

### Descargar PDF

Para imprimir o compartir el programa:

1. Abre el programa
2. Click en **"Descargar PDF"**
3. El PDF incluirá:
   - Logo de la iglesia
   - Información del culto
   - Todas las asignaciones
   - Tema y detalles
   - Firma del pastor (si está configurada)

### Vista de Calendario

Para ver todos los programas en calendario:

1. Ve a **Programas** → **Calendario**
2. Verás una vista mensual:

```
       FEBRERO 2026
┌──┬──┬──┬──┬──┬──┬──┐
│Do│Lu│Ma│Mi│Ju│Vi│Sa│
├──┼──┼──┼──┼──┼──┼──┤
│  │  │  │  │  │  │ 1│
├──┼──┼──┼──┼──┼──┼──┤
│ 2│ 3│ 4│ 5│ 6│ 7│ 8│
├──┼──┼──┼──┼──┼──┼──┤
│ 9│10│11│12│13│14│15│
├──┼──┼──┼──┼──┼──┼──┤
│16│17│18│19│20│21│22│
│📅│  │📅│  │  │  │  │
│10│  │19│  │  │  │  │
│AM│  │ PM│  │  │  │  │
└──┴──┴──┴──┴──┴──┴──┘
```

3. Click en un día para ver detalles
4. Click en un programa para editarlo

---

## Ministerios y Roles

### Crear Rol

1. Ve a **Configuración** → **Roles**
2. Click en **"+ Nuevo Rol"**
3. Completa:
   - **Nombre**: Ej. "Predicador"
   - **Descripción**: "Encargado de la predicación principal"
   - **Requisitos**: "Experiencia en predicación, conocimiento bíblico"
   - **Color**: Para identificación visual
4. Click en **"Guardar"**

### Roles Comunes

Te sugerimos crear estos roles:

- 🎤 **Predicador**: Mensaje principal
- 🎵 **Músico**: Alabanza y adoración
- 🎸 **Baterista**: Batería
- 🎹 **Pianista**: Piano/teclado
- 🎤 **Corista**: Coros
- 👔 **Ujier**: Bienvenida y ofrenda
- 📖 **Lector**: Lectura bíblica
- 🙏 **Intercesor**: Oración
- 🎥 **Multimedia**: Proyección/sonido
- 👶 **Maestro**: Escuela dominical

### Editar Rol

1. Click sobre el rol en la lista
2. Modifica la información
3. Click en **"Guardar Cambios"**

### Desactivar Rol

Para roles que ya no se usan:

1. Click en el rol
2. Desmarca **"Activo"**
3. El rol no aparecerá al crear personas nuevas
4. Las personas con ese rol lo conservan en su historial

---

## Cartas y Documentos

### Plantillas de Cartas

El sistema incluye plantillas para:
- 📄 Carta de Bienvenida
- 📜 Certificado de Membresía
- 🎓 Certificado de Curso
- 💌 Carta de Recomendación
- 📋 Carta General

### Generar Carta Individual

1. Ve a **Personas**
2. Selecciona una persona
3. Click en **"Generar Carta"**
4. Selecciona la plantilla
5. Personaliza el mensaje (opcional)
6. Click en **"Generar"**
7. Descarga el PDF

### Generar Cartas Masivas

Para enviar cartas a varios miembros:

1. Ve a **Cartas** → **Generar Masiva**
2. Selecciona plantilla
3. Filtrar destinatarios:
   - Por rol
   - Por estado
   - Por ministerio
4. Personalizar mensaje global
5. Click en **"Generar Todas"**
6. Descargar ZIP con todos los PDFs

### Personalización

Las cartas incluyen automáticamente:
- Logo de la iglesia
- Nombre de la persona
- Fecha actual
- Información de la iglesia
- Firma del pastor

---

## Configuración

### Configuración de la Iglesia

Ve a **Configuración** → **Iglesia**:

#### Información Básica
- **Nombre**: Nombre de la iglesia
- **Dirección**: Ubicación física
- **Teléfono**: Número principal
- **Email**: Email de contacto
- **Sitio Web**: URL (opcional)

#### Branding
- **Logo**: Sube el logo (PNG, JPG, max 2MB)
- **Color Principal**: Para PDFs y documentos
- **Color Secundario**: Acentos

#### Pastor/Líder
- **Nombre del Pastor**: Para cartas y documentos
- **Firma Digital**: Sube imagen de firma (PNG transparente)

#### Configuración de Notificaciones
- ☑ **Habilitar Email**: Enviar notificaciones por correo
- ☑ **Habilitar WhatsApp**: Enviar por WhatsApp
- **Días de anticipación**: Cuántos días antes del culto notificar (default: 2)
- **Hora de envío**: A qué hora enviar (default: 9:00 AM)

### Configuración de Email

Ve a **Configuración** → **Email**:

```
┌─────────────────────────────────────────────────┐
│  CONFIGURACIÓN DE EMAIL                         │
├─────────────────────────────────────────────────┤
│  Proveedor: [Gmail ▼]                           │
│                                                 │
│  Host SMTP: [smtp.gmail.com]                    │
│  Puerto: [587]                                  │
│  Usuario: [tu_email@gmail.com]                  │
│  Contraseña: [••••••••••]                       │
│  Email remitente: [noreply@iglesia.com]         │
│                                                 │
│  [Probar Conexión] [Guardar]                    │
└─────────────────────────────────────────────────┘
```

### Configuración de WhatsApp

Requiere cuenta de Twilio:

1. Ve a **Configuración** → **WhatsApp**
2. Ingresa credenciales de Twilio:
   - Account SID
   - Auth Token
   - Número de WhatsApp
3. Click en **"Verificar"**
4. Habilita notificaciones de WhatsApp

### Usuarios y Permisos

Ve a **Configuración** → **Usuarios**:

#### Roles de Usuario

- **Pastor**: Acceso completo
- **Administrador**: Gestión completa excepto configuración crítica
- **Líder de Ministerio**: Gestión de su ministerio
- **Editor**: Crear y editar programas
- **Visor**: Solo lectura

#### Crear Usuario

1. Click en **"+ Nuevo Usuario"**
2. Completa:
   - **Nombre**
   - **Email**
   - **Contraseña temporal**
   - **Rol**
3. Click en **"Crear"**
4. El usuario recibirá un email con instrucciones

---

## Preguntas Frecuentes

### General

**¿Cuántas iglesias puedo administrar?**
- Cada iglesia es independiente. Si administras varias, necesitas una cuenta por iglesia.

**¿Hay límite de miembros?**
- Plan FREE: 100 miembros
- Plan PRO: 500 miembros
- Plan ENTERPRISE: Ilimitado

**¿Los datos están seguros?**
- Sí. Usamos encriptación SSL, backups diarios y cumplimos con estándares de seguridad.

### Programas

**¿Cómo funciona la generación automática?**
- El sistema usa un algoritmo que considera:
  1. Participación histórica
  2. Tiempo desde última participación
  3. Disponibilidad
  4. Balance de carga

**¿Puedo hacer cambios después de publicar?**
- Sí, pero se notificará a los afectados por el cambio.

**¿Cómo evito que alguien sea asignado muy seguido?**
- El algoritmo automáticamente balancea. También puedes marcar a la persona como "No disponible" temporalmente.

### Notificaciones

**¿Cuándo se envían las notificaciones?**
- Al publicar el programa
- 48 horas antes del culto (recordatorio)
- Al hacer cambios a un programa publicado

**¿Qué pasa si no tengo WhatsApp configurado?**
- El sistema solo enviará emails. WhatsApp es opcional.

**¿Puedo personalizar los mensajes?**
- Sí, en Configuración → Notificaciones → Plantillas.

### Problemas Técnicos

**No puedo iniciar sesión**
1. Verifica tu email y contraseña
2. Intenta "Olvidé mi contraseña"
3. Contacta al administrador de tu iglesia

**No aparecen los miembros al generar programa**
1. Verifica que tengan roles asignados
2. Verifica que estén marcados como "Activos"
3. Verifica disponibilidad en la fecha

**El PDF no se genera**
1. Verifica tu conexión a internet
2. Intenta de nuevo en unos minutos
3. Contacta soporte si persiste

---

## Soporte

### Canales de Ayuda

- 📧 **Email**: arosadoclud@gmail.com
- 🐛 **Reportar Bug**: [GitHub Issues](https://github.com/arosadoclud/Sotware-iglesias/issues)
- 📚 **Documentación**: [Docs completa](https://github.com/arosadoclud/Sotware-iglesias/tree/main/docs)

### Videos Tutoriales

Próximamente disponibles en nuestro canal de YouTube:
- Configuración inicial
- Generación de programas
- Gestión de miembros
- Y más...

---

## Glosario

- **Programa**: Orden de culto con asignaciones
- **Asignación**: Persona asignada a una actividad específica
- **Rol**: Función que una persona puede desempeñar (Predicador, Músico, etc.)
- **Ministerio**: Grupo de roles relacionados
- **Score**: Puntaje de equidad para determinar quién debe participar
- **Multi-tenant**: Múltiples iglesias en el mismo sistema, con datos aislados

---

¡Esperamos que disfrutes usando Church Manager v4! 🎉

Si tienes sugerencias para mejorar esta guía, por favor contáctanos.
