# 🔌 Documentación de API

Documentación completa de la API REST de Church Manager v4.

## 📋 Tabla de Contenidos

- [Información General](#información-general)
- [Autenticación](#autenticación)
- [Endpoints](#endpoints)
  - [Auth](#auth)
  - [Churches](#churches)
  - [Persons](#persons)
  - [Programs](#programs)
  - [Roles](#roles)
  - [Letters](#letters)
  - [Activities](#activities)
  - [Notifications](#notifications)
- [Códigos de Estado](#códigos-de-estado)
- [Errores](#errores)

---

## Información General

**Base URL:** `http://localhost:5000/api/v1`

**Formato de Respuesta:** JSON

**Autenticación:** JWT Bearer Token

**Versión API:** 1.0

---

## Autenticación

### Registro e Inicio de Sesión

#### POST /auth/register

Registrar una nueva iglesia y usuario administrador.

**Request:**
```json
{
  "church": {
    "name": "Iglesia Ejemplo",
    "address": "Calle Principal 123",
    "phone": "+1234567890",
    "email": "info@iglesiaejemplo.com"
  },
  "user": {
    "firstName": "Juan",
    "lastName": "Pérez",
    "email": "admin@iglesiaejemplo.com",
    "password": "Password123!",
    "phone": "+1234567890"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Iglesia y usuario creados exitosamente",
  "data": {
    "church": {
      "_id": "65abc123...",
      "name": "Iglesia Ejemplo",
      "plan": "FREE",
      "isActive": true
    },
    "user": {
      "_id": "65abc456...",
      "email": "admin@iglesiaejemplo.com",
      "role": "PASTOR"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
}
```

---

#### POST /auth/login

Iniciar sesión.

**Request:**
```json
{
  "email": "admin@iglesiaejemplo.com",
  "password": "Password123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "65abc456...",
      "email": "admin@iglesiaejemplo.com",
      "firstName": "Juan",
      "lastName": "Pérez",
      "role": "PASTOR",
      "churchId": "65abc123..."
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
  }
}
```

---

#### POST /auth/refresh

Renovar token de acceso.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

#### POST /auth/logout

Cerrar sesión y invalidar tokens.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Sesión cerrada exitosamente"
}
```

---

## Churches

### GET /churches/me

Obtener información de la iglesia actual (del token JWT).

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65abc123...",
    "name": "Iglesia Ejemplo",
    "address": "Calle Principal 123",
    "phone": "+1234567890",
    "email": "info@iglesiaejemplo.com",
    "plan": "FREE",
    "brandColor": "#3B82F6",
    "logoUrl": "https://...",
    "pastorName": "Pastor Juan",
    "signatureUrl": "https://...",
    "isActive": true,
    "settings": {
      "emailEnabled": true,
      "whatsappEnabled": false,
      "defaultProgramTime": "10:00",
      "autoNotifyDays": 2
    }
  }
}
```

---

### PATCH /churches/me

Actualizar información de la iglesia.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "name": "Nueva Iglesia Ejemplo",
  "brandColor": "#10B981",
  "settings": {
    "emailEnabled": true,
    "whatsappEnabled": true
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Iglesia actualizada exitosamente",
  "data": { /* iglesia actualizada */ }
}
```

---

## Persons

### GET /persons

Listar personas de la iglesia.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
```
?page=1
&limit=10
&search=juan
&roleId=65abc789...
&status=active
&sortBy=firstName
&sortOrder=asc
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "persons": [
      {
        "_id": "65abc789...",
        "firstName": "Juan",
        "lastName": "García",
        "email": "juan@example.com",
        "phone": "+1234567890",
        "birthDate": "1990-01-15",
        "gender": "male",
        "photoUrl": "https://...",
        "status": "active",
        "roles": [
          {
            "roleId": {
              "_id": "65abc...",
              "name": "Predicador"
            },
            "isActive": true,
            "level": "intermediate"
          }
        ],
        "availability": {
          "sunday": true,
          "wednesday": true
        },
        "notes": "Disponible los domingos"
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 10,
      "pages": 5
    }
  }
}
```

---

### POST /persons

Crear una nueva persona.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "firstName": "María",
  "lastName": "López",
  "email": "maria@example.com",
  "phone": "+1234567891",
  "birthDate": "1995-05-20",
  "gender": "female",
  "address": "Calle 456",
  "status": "active",
  "roles": [
    {
      "roleId": "65abc789...",
      "isActive": true,
      "level": "beginner"
    }
  ],
  "availability": {
    "sunday": true,
    "monday": false,
    "tuesday": false,
    "wednesday": true,
    "thursday": false,
    "friday": false,
    "saturday": false
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Persona creada exitosamente",
  "data": { /* persona creada */ }
}
```

---

### GET /persons/:id

Obtener una persona específica.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    /* datos de la persona */
    "stats": {
      "totalParticipations": 12,
      "lastParticipation": "2026-02-01T10:00:00Z",
      "participationsByRole": {
        "Predicador": 5,
        "Músico": 7
      }
    }
  }
}
```

---

### PATCH /persons/:id

Actualizar una persona.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "status": "inactive",
  "notes": "De vacaciones hasta marzo"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Persona actualizada exitosamente",
  "data": { /* persona actualizada */ }
}
```

---

### DELETE /persons/:id

Eliminar una persona (soft delete).

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Persona eliminada exitosamente"
}
```

---

## Programs

### GET /programs

Listar programas.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
```
?page=1
&limit=10
&status=published
&startDate=2026-02-01
&endDate=2026-02-28
&sortBy=programDate
&sortOrder=desc
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "programs": [
      {
        "_id": "65abc890...",
        "programDate": "2026-02-16T10:00:00Z",
        "title": "Culto Dominical",
        "theme": "La Fe que Mueve Montañas",
        "status": "published",
        "assignments": [
          {
            "activity": {
              "_id": "65abc...",
              "name": "Predicación",
              "type": "predication"
            },
            "assignedPerson": {
              "_id": "65abc...",
              "firstName": "Juan",
              "lastName": "García"
            },
            "confirmedAt": "2026-02-14T08:30:00Z"
          }
        ],
        "createdBy": {
          "_id": "65abc...",
          "firstName": "Admin"
        },
        "notificationsSent": true,
        "notificationsSentAt": "2026-02-14T09:00:00Z"
      }
    ],
    "pagination": {
      "total": 24,
      "page": 1,
      "limit": 10,
      "pages": 3
    }
  }
}
```

---

### POST /programs/generate

Generar un nuevo programa automáticamente.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "programDate": "2026-02-23T10:00:00Z",
  "title": "Culto Dominical",
  "theme": "El Amor de Dios",
  "activities": [
    {
      "activityId": "65abc...",
      "notes": "Incluir alabanza especial"
    },
    {
      "activityId": "65abd..."
    }
  ],
  "options": {
    "lookbackMonths": 3,
    "preferExperienced": true,
    "balanceGender": false
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Programa generado exitosamente",
  "data": {
    "program": { /* programa generado */ },
    "warnings": [
      "No hay suficientes músicos disponibles"
    ],
    "suggestions": [
      "Considerar agregar más roles de música"
    ]
  }
}
```

---

### GET /programs/:id

Obtener un programa específico.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    /* programa completo con todas las relaciones pobladas */
  }
}
```

---

### PATCH /programs/:id

Actualizar un programa.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "status": "published",
  "theme": "Nuevo tema actualizado",
  "assignments": [
    {
      "activity": "65abc...",
      "assignedPerson": "65abd..."
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Programa actualizado exitosamente",
  "data": { /* programa actualizado */ }
}
```

---

### POST /programs/:id/publish

Publicar un programa y enviar notificaciones.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Programa publicado y notificaciones enviadas",
  "data": {
    "program": { /* programa publicado */ },
    "notifications": {
      "sent": 5,
      "failed": 0,
      "emails": 3,
      "whatsapp": 2
    }
  }
}
```

---

### GET /programs/:id/pdf

Descargar programa en PDF.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="programa-2026-02-16.pdf"

[PDF Binary Data]
```

---

### GET /programs/:id/pdf/preview

Vista previa HTML del PDF.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```html
<!DOCTYPE html>
<html>
  <head>...</head>
  <body>
    <!-- Vista previa del programa -->
  </body>
</html>
```

---

## Roles

### GET /roles

Listar roles disponibles.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65abc...",
      "name": "Predicador",
      "description": "Encargado de la predicación",
      "isActive": true,
      "requirements": "Experiencia en predicación",
      "color": "#3B82F6"
    }
  ]
}
```

---

### POST /roles

Crear un nuevo rol.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "name": "Coordinador de Alabanza",
  "description": "Lidera el equipo de alabanza",
  "isActive": true,
  "requirements": "Conocimiento musical",
  "color": "#10B981"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Rol creado exitosamente",
  "data": { /* rol creado */ }
}
```

---

## Letters

### GET /letters/templates

Listar plantillas de cartas.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65abc...",
      "name": "Carta de Bienvenida",
      "category": "membership",
      "subject": "Bienvenido a {{churchName}}",
      "content": "<p>Estimado {{firstName}}...</p>",
      "isActive": true
    }
  ]
}
```

---

### POST /letters/generate

Generar carta personalizada.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Request:**
```json
{
  "templateId": "65abc...",
  "personId": "65abd...",
  "variables": {
    "additionalMessage": "Esperamos verte pronto"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Carta generada exitosamente",
  "data": {
    "_id": "65abe...",
    "pdfUrl": "https://...",
    "generatedAt": "2026-02-13T..."
  }
}
```

---

## Activities

### GET /activities

Listar tipos de actividades.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65abc...",
      "name": "Predicación",
      "description": "Mensaje principal del culto",
      "requiredRole": {
        "_id": "65abd...",
        "name": "Predicador"
      },
      "estimatedDuration": 30,
      "isActive": true,
      "order": 1
    }
  ]
}
```

---

## Notifications

### GET /notifications

Obtener notificaciones del usuario.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Query Parameters:**
```
?page=1
&limit=20
&status=unread
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "_id": "65abc...",
        "type": "program_assignment",
        "title": "Nueva asignación",
        "message": "Has sido asignado para predicar el 2026-02-16",
        "status": "unread",
        "createdAt": "2026-02-13T...",
        "data": {
          "programId": "65abd...",
          "activityName": "Predicación"
        }
      }
    ],
    "pagination": { /* paginación */ }
  }
}
```

---

### PATCH /notifications/:id/read

Marcar notificación como leída.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Notificación marcada como leída"
}
```

---

## Códigos de Estado

| Código | Descripción |
|--------|-------------|
| 200    | Éxito |
| 201    | Creado exitosamente |
| 204    | Sin contenido (éxito) |
| 400    | Solicitud incorrecta |
| 401    | No autenticado |
| 403    | Sin permisos |
| 404    | No encontrado |
| 409    | Conflicto (duplicado) |
| 422    | Error de validación |
| 429    | Demasiadas solicitudes |
| 500    | Error del servidor |

---

## Errores

### Formato de Error

```json
{
  "success": false,
  "error": {
    "message": "Descripción del error",
    "code": "ERROR_CODE",
    "details": {
      /* información adicional */
    }
  }
}
```

### Ejemplos de Errores

#### Error de Validación (422)
```json
{
  "success": false,
  "error": {
    "message": "Error de validación",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "Email inválido"
      },
      {
        "field": "password",
        "message": "La contraseña debe tener al menos 8 caracteres"
      }
    ]
  }
}
```

#### Error de Autenticación (401)
```json
{
  "success": false,
  "error": {
    "message": "Token inválido o expirado",
    "code": "INVALID_TOKEN"
  }
}
```

#### Error de Permisos (403)
```json
{
  "success": false,
  "error": {
    "message": "No tienes permisos para realizar esta acción",
    "code": "FORBIDDEN",
    "details": {
      "requiredRole": "ADMIN",
      "currentRole": "VIEWER"
    }
  }
}
```

---

## Rate Limiting

La API tiene límites de tasa para prevenir abuso:

- **Límite general**: 100 solicitudes por 15 minutos
- **Login**: 5 intentos por 15 minutos por IP
- **Registro**: 3 registros por hora por IP

Headers de rate limit:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1707854400
```

---

## Paginación

Todos los endpoints que retornan listas soportan paginación:

**Query Parameters:**
```
?page=1        # Página actual (default: 1)
&limit=10      # Items por página (default: 10, max: 100)
```

**Response:**
```json
{
  "data": [ /* items */ ],
  "pagination": {
    "total": 150,      # Total de items
    "page": 1,         # Página actual
    "limit": 10,       # Items por página
    "pages": 15        # Total de páginas
  }
}
```

---

## Webhooks

Church Manager puede enviar webhooks para eventos importantes:

### Configurar Webhook

```http
POST /api/v1/webhooks
Content-Type: application/json

{
  "url": "https://tu-servidor.com/webhook",
  "events": ["program.published", "person.created"],
  "secret": "tu_secreto_para_verificar"
}
```

### Eventos Disponibles

- `program.created`
- `program.published`
- `program.completed`
- `person.created`
- `person.updated`
- `letter.generated`
- `notification.sent`

### Formato de Payload

```json
{
  "event": "program.published",
  "timestamp": "2026-02-13T...",
  "data": {
    /* objeto relacionado */
  }
}
```

---

## Soporte

Para más información o reportar problemas con la API:

- **Issues**: https://github.com/arosadoclud/Sotware-iglesias/issues
- **Email**: arosadoclud@gmail.com

---

**Última actualización**: Febrero 2026  
**Versión**: 1.0
