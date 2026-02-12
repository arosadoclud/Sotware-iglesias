# Church Program Manager - Backend

Sistema de gestión de programas semanales para iglesias con asignación inteligente de participantes, generación de PDFs y plantillas de cartas.

## 🚀 Tecnologías

- **Node.js 20+** - Runtime de JavaScript
- **TypeScript** - Superset tipado de JavaScript
- **Express** - Framework web
- **MongoDB** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticación
- **Puppeteer** - Generación de PDFs
- **Winston** - Logging

## 📋 Requisitos Previos

- Node.js >= 20.0.0
- npm >= 10.0.0
- MongoDB (local o Atlas)

## 🛠️ Instalación

### 1. Clonar el repositorio (si aplica)

```bash
cd church-program-manager/backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

Edita `.env` y configura tus variables:

```env
# Base de datos
MONGODB_URI=mongodb://localhost:27017/church-program-manager

# O MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/church-program-manager

# JWT
JWT_SECRET=tu_super_secreto_jwt_min_32_caracteres_aqui
JWT_REFRESH_SECRET=tu_super_secreto_refresh_jwt_aqui

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Cloudinary (opcional, para producción)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### 4. Iniciar en modo desarrollo

```bash
npm run dev
```

El servidor estará disponible en: `http://localhost:5000`

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── config/          # Configuración (DB, env, etc.)
│   ├── middleware/      # Middleware de Express
│   ├── models/          # Modelos de Mongoose
│   ├── modules/         # Módulos de la aplicación
│   │   ├── auth/        # Autenticación
│   │   ├── persons/     # Gestión de personas
│   │   ├── programs/    # Generación de programas
│   │   ├── activities/  # Tipos de actividades
│   │   ├── letters/     # Plantillas y cartas
│   │   └── reports/     # Reportes y estadísticas
│   ├── types/           # Tipos de TypeScript
│   ├── utils/           # Utilidades
│   ├── templates/       # Plantillas de PDF
│   ├── app.ts           # Configuración de Express
│   └── server.ts        # Punto de entrada
├── uploads/             # Archivos generados
├── tests/               # Tests
├── .env.example         # Ejemplo de variables de entorno
├── package.json
└── tsconfig.json
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo (con hot reload)
npm run dev

# Compilar TypeScript
npm run build

# Producción
npm start

# Tests
npm test
npm run test:watch

# Linting
npm run lint
npm run lint:fix

# Formateo de código
npm run format
```

## 🗄️ Modelos de Datos

### Church (Iglesia)
- Información de la iglesia
- Configuración global
- Settings (timezone, rotación, etc.)

### User (Usuarios)
- Administradores, editores, viewers
- Autenticación con JWT
- Roles: ADMIN, EDITOR, VIEWER

### Person (Participantes)
- Personas que participan en actividades
- Roles permitidos
- Disponibilidad/no disponibilidad
- Historial de participaciones

### Role (Roles)
- Roles disponibles (Predicador, Músico, etc.)
- requiresSkill flag

### ActivityType (Tipos de Actividad)
- Adoración, Culto Evangelístico, etc.
- Configuración de roles por actividad
- Secciones y cantidad de personas

### Program (Programas)
- Programas generados por fecha
- Asignaciones de personas a roles
- Estados: DRAFT, PUBLISHED, COMPLETED
- Generación de PDFs

### LetterTemplate (Plantillas de Cartas)
- Plantillas con variables dinámicas
- Categorías
- Editor TipTap

### GeneratedLetter (Cartas Generadas)
- Historial de cartas emitidas
- Variables usadas
- PDFs generados

## 🔐 Autenticación

El sistema usa JWT (JSON Web Tokens) con:
- Access Token (15 minutos)
- Refresh Token (7 días)

### Flujo de autenticación:

1. Login: `POST /api/v1/auth/login`
2. Obtener tokens
3. Incluir Access Token en headers: `Authorization: Bearer <token>`
4. Refrescar token: `POST /api/v1/auth/refresh`

## 📊 API Endpoints (Planificados)

### Auth
- `POST /api/v1/auth/login` - Iniciar sesión
- `POST /api/v1/auth/logout` - Cerrar sesión
- `POST /api/v1/auth/refresh` - Refrescar token
- `GET /api/v1/auth/me` - Obtener usuario actual

### Persons
- `GET /api/v1/persons` - Listar personas
- `POST /api/v1/persons` - Crear persona
- `GET /api/v1/persons/:id` - Obtener persona
- `PATCH /api/v1/persons/:id` - Actualizar persona
- `DELETE /api/v1/persons/:id` - Desactivar persona

### Programs
- `GET /api/v1/programs` - Listar programas
- `POST /api/v1/programs/generate` - **Generar programa**
- `GET /api/v1/programs/:id` - Obtener programa
- `PATCH /api/v1/programs/:id` - Actualizar programa
- `GET /api/v1/programs/:id/pdf` - Descargar PDF

### Activities
- `GET /api/v1/activity-types` - Listar actividades
- `POST /api/v1/activity-types` - Crear actividad
- `PATCH /api/v1/activity-types/:id` - Actualizar actividad

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Con coverage
npm test -- --coverage

# Modo watch
npm run test:watch
```

## 📝 Logging

El sistema usa Winston para logging con diferentes niveles:
- `error` - Errores críticos
- `warn` - Advertencias
- `info` - Información general
- `debug` - Información de debugging

Los logs se guardan en:
- Consola (desarrollo)
- `logs/error.log` (producción)
- `logs/combined.log` (producción)

## 🚀 Despliegue

### Railway / Render

1. Crear cuenta en Railway o Render
2. Conectar repositorio
3. Configurar variables de entorno
4. Deploy automático desde `main` branch

### Variables de entorno necesarias en producción:
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `FRONTEND_URL`
- `NODE_ENV=production`
- `CLOUDINARY_*` (si usas Cloudinary)

## 🐛 Debugging

Para debugging con VSCode, crea `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/backend/src/server.ts",
      "preLaunchTask": "tsc: build - backend/tsconfig.json",
      "outFiles": ["${workspaceFolder}/backend/dist/**/*.js"]
    }
  ]
}
```

## 📚 Recursos

- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Express Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

## 👨‍💻 Autor

Andy - Systems Engineer & Full-Stack Developer

## 📄 Licencia

MIT

---

## ⏭️ Próximos Pasos

1. ✅ Setup inicial y modelos
2. 🔨 Implementar módulo de autenticación
3. 🔨 Implementar CRUD de personas
4. 🔨 Implementar algoritmo de generación de programas
5. 🔨 Implementar generación de PDFs
6. 🔨 Implementar módulo de cartas
7. 🔨 Tests unitarios e integración
8. 🔨 Documentación con Swagger

---

**Estado:** ✅ Configuración inicial completa
