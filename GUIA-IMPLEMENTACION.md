# 🚀 GUÍA DE IMPLEMENTACIÓN PASO A PASO

Esta guía te ayudará a implementar todas las mejoras en tu proyecto existente o usar la versión mejorada.

## 📋 Opción 1: Usar el Proyecto Mejorado (Recomendado)

### Paso 1: Descomprimir y Explorar
```bash
# Descomprimir el ZIP
unzip church-manager-improved.zip
cd church-manager-improved
```

### Paso 2: Instalar Dependencias

#### Backend
```bash
cd backend
npm install

# Si hay errores con dependencias opcionales:
npm install --legacy-peer-deps
```

#### Frontend
```bash
cd frontend
npm install

# Instalar dependencia faltante de Tailwind
npm install -D tailwindcss-animate
```

### Paso 3: Configurar Variables de Entorno

#### Backend (.env)
```bash
cd backend
cp .env.example .env
```

Editar `.env` con tus valores:
```env
# Base de datos
MONGODB_URI=mongodb://localhost:27017/church_program_manager

# JWT
JWT_SECRET=tu_secreto_super_seguro_minimo_32_caracteres_aqui
JWT_REFRESH_SECRET=otro_secreto_diferente_para_refresh_tokens

# Servidor
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=200

# Opcional: Redis (para caché)
REDIS_URL=redis://localhost:6379

# Opcional: Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_app_password

# Opcional: Cloudinary (para imágenes)
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

#### Frontend (.env)
```bash
cd frontend
echo "VITE_API_URL=http://localhost:5000/api/v1" > .env
```

### Paso 4: Inicializar Base de Datos

```bash
cd backend

# Crear índices en MongoDB
npm run ensure-indexes

# Crear usuario administrador inicial
npm run create-admin

# Opcional: Poblar con datos de prueba
npm run seed
```

### Paso 5: Iniciar Servidores

#### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

Deberías ver:
```
🚀 Server running on http://localhost:5000
📦 MongoDB connected successfully
✅ Church Program Manager API — Ready
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

Deberías ver:
```
  VITE v5.0.11  ready in 324 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Paso 6: Acceder a la Aplicación

1. Abrir navegador en `http://localhost:5173`
2. Usar credenciales de prueba:
   - Email: `admin@iglesia.com`
   - Password: `password123`

---

## 📋 Opción 2: Migrar tu Proyecto Existente

Si prefieres migrar tu proyecto actual, sigue estos pasos:

### Fase 1: Backend — Validación y DTOs

#### 1.1 Instalar Dependencias
```bash
cd backend
npm install class-validator class-transformer reflect-metadata
npm install @types/speakeasy dataloader socket.io --save-dev
```

#### 1.2 Crear Carpeta de DTOs
```bash
mkdir -p src/dto
```

#### 1.3 Copiar Archivos
Copiar estos archivos del proyecto mejorado:
- `backend/src/dto/person.dto.ts`
- `backend/src/middleware/validate.middleware.ts`
- `backend/src/utils/pagination.ts`

#### 1.4 Actualizar `server.ts`
Agregar al inicio:
```typescript
import 'reflect-metadata';
```

#### 1.5 Aplicar Validación en Rutas
```typescript
// Ejemplo: src/modules/persons/person.routes.ts
import { validateDto } from '../../middleware/validate.middleware';
import { CreatePersonDto } from '../../dto/person.dto';

router.post('/', 
  authenticate,
  tenantGuard,
  validateDto(CreatePersonDto),  // ← NUEVO
  personController.create
);
```

### Fase 2: Frontend — Sistema de Diseño

#### 2.1 Instalar Dependencias UI
```bash
cd frontend
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-label @radix-ui/react-select
npm install @radix-ui/react-separator @radix-ui/react-slot
npm install @radix-ui/react-toast @radix-ui/react-tooltip
npm install @radix-ui/react-avatar
npm install @tanstack/react-table
npm install class-variance-authority
npm install framer-motion
npm install react-hot-toast
npm install recharts
npm install socket.io-client
npm install -D tailwindcss-animate
```

#### 2.2 Actualizar Tailwind Config
Reemplazar `tailwind.config.js` con el del proyecto mejorado o agregar:

```javascript
module.exports = {
  plugins: [require("tailwindcss-animate")],
  theme: {
    extend: {
      colors: {
        // Copiar del proyecto mejorado
        success: { /* ... */ },
        warning: { /* ... */ },
        danger: { /* ... */ },
        neutral: { /* ... */ },
      }
    }
  }
}
```

#### 2.3 Actualizar `index.css`
Reemplazar con el contenido del proyecto mejorado que incluye:
- Variables CSS
- Estilos base mejorados
- Scrollbar personalizada

#### 2.4 Crear Componentes UI
```bash
mkdir -p src/components/ui
```

Copiar estos archivos del proyecto mejorado:
- `src/components/ui/button.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/skeleton.tsx`
- `src/components/ui/empty-state.tsx`
- `src/lib/utils.ts`

#### 2.5 Actualizar LoginPage
Opción A - Reemplazar completo:
```bash
cp LoginPage-improved.tsx src/pages/auth/LoginPage.tsx
```

Opción B - Migrar gradualmente:
1. Importar componentes nuevos
2. Agregar animaciones con Framer Motion
3. Mejorar validación visual
4. Aplicar nuevos estilos

### Fase 3: Implementar Componentes Mejorados

#### 3.1 Ejemplo: Mejorar PersonsPage

```tsx
// Antes
<div className="card">
  {loading ? (
    <div className="spinner">Cargando...</div>
  ) : (
    <table>...</table>
  )}
</div>

// Después
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'

<Card>
  <CardHeader>
    <CardTitle>Personas</CardTitle>
  </CardHeader>
  <CardContent>
    {loading ? (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    ) : persons.length === 0 ? (
      <EmptyState
        icon={Users}
        title="No hay personas"
        description="Comienza agregando la primera persona"
        action={{
          label: "Agregar persona",
          onClick: () => setShowModal(true)
        }}
      />
    ) : (
      <table>...</table>
    )}
  </CardContent>
</Card>
```

#### 3.2 Reemplazar Toast System

```tsx
// Antes
import { toast } from 'sonner'

// Después  
import toast from 'react-hot-toast'

// Uso mejorado
toast.success('Guardado exitosamente', {
  icon: '✅',
  style: {
    background: '#22c55e',
    color: '#fff',
  },
})
```

Actualizar `App.tsx`:
```tsx
import { Toaster } from 'react-hot-toast'

function App() {
  return (
    <>
      <BrowserRouter>
        {/* rutas */}
      </BrowserRouter>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: 'system-ui, sans-serif',
          },
        }}
      />
    </>
  )
}
```

### Fase 4: Testing

#### 4.1 Verificar Backend
```bash
cd backend

# Test de salud
curl http://localhost:5000/health

# Test de login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@iglesia.com","password":"password123"}'
```

#### 4.2 Verificar Frontend
1. Login funciona
2. Dashboard carga
3. Componentes UI se ven correctos
4. Toast notifications funcionan
5. Modals se abren/cierran
6. Formularios validan

---

## 🐛 Solución de Problemas Comunes

### Error: "Cannot find module '@/...'"

**Solución:** Verificar `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Y `vite.config.ts`:
```typescript
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### Error: "Tailwind classes not applying"

**Solución:**
```bash
npm install -D tailwindcss-animate
```

Agregar al `tailwind.config.js`:
```javascript
plugins: [require("tailwindcss-animate")],
```

### Error: "Class-validator decorators not working"

**Solución:** Agregar en `backend/src/server.ts`:
```typescript
import 'reflect-metadata';
```

Y en `tsconfig.json`:
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### Error: "MongoDB connection failed"

**Solución:**
1. Verificar que MongoDB está corriendo:
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

2. Verificar URI en `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/church_program_manager
```

### Error: "Port 5000 already in use"

**Solución:** Cambiar puerto en `.env`:
```env
PORT=5001
```

Y actualizar frontend `.env`:
```env
VITE_API_URL=http://localhost:5001/api/v1
```

---

## ✅ Checklist de Implementación

### Backend
- [ ] Dependencias instaladas
- [ ] `.env` configurado
- [ ] MongoDB corriendo
- [ ] Índices creados (`npm run ensure-indexes`)
- [ ] Admin creado (`npm run create-admin`)
- [ ] Servidor inicia sin errores
- [ ] DTOs implementados
- [ ] Validación funcionando

### Frontend
- [ ] Dependencias instaladas
- [ ] `.env` configurado
- [ ] Tailwind configurado correctamente
- [ ] Componentes UI creados
- [ ] `@/` alias funcionando
- [ ] LoginPage mejorado
- [ ] Toast system actualizado
- [ ] Aplicación carga sin errores

### Testing
- [ ] Login funciona
- [ ] CRUD de personas funciona
- [ ] Validaciones funcionan
- [ ] UI se ve correcta
- [ ] No hay errores en consola

---

## 🎓 Próximos Pasos

Una vez implementado todo:

1. **Personalizar tema**: Ajustar colores en `tailwind.config.js`
2. **Agregar más páginas**: Usar componentes UI en otras secciones
3. **Implementar gráficos**: Agregar Recharts en Dashboard
4. **Añadir tests**: Escribir tests para componentes críticos
5. **Optimizar performance**: Implementar paginación en todas las listas
6. **Añadir features**: WebSockets, 2FA, etc.

---

¿Necesitas ayuda? Revisa los archivos de ejemplo en el proyecto mejorado o consulta la documentación de cada librería.
