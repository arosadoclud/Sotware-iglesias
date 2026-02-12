# Church Program Manager — v3.0 (MEJORADO) 🚀

Sistema de gestión de programas de oportunidades para iglesias con UI/UX moderna y mejoras de performance.

## ✨ Nuevas Mejoras Implementadas (v3.0)

### 🎨 Frontend — UI/UX Modernizado

#### 1. **Sistema de Diseño Profesional**
- ✅ Componentes base con Radix UI (Dialog, Dropdown, Toast, Label)
- ✅ Variantes de componentes con Class Variance Authority
- ✅ Paleta de colores extendida (primary, success, warning, danger, neutral)
- ✅ Sombras y bordes mejorados
- ✅ Variables CSS para theming

#### 2. **Componentes Reutilizables**
```
src/components/ui/
├── button.tsx          # Button con variantes (default, destructive, outline, ghost)
├── card.tsx            # Card, CardHeader, CardContent, CardFooter
├── dialog.tsx          # Modal dialogs con animaciones
├── input.tsx           # Input mejorado con focus states
├── label.tsx           # Label accesible
├── skeleton.tsx        # Loading placeholders
└── empty-state.tsx     # Estados vacíos con iconos y acciones
```

#### 3. **Nuevas Librerías Instaladas**
- `framer-motion` - Animaciones fluidas
- `react-hot-toast` - Notificaciones mejoradas
- `@tanstack/react-table` - Tablas de datos avanzadas
- `recharts` - Gráficos y dashboards
- `class-variance-authority` - Variantes de componentes tipadas
- `@radix-ui/*` - Componentes accesibles primitivos

#### 4. **LoginPage Mejorado**
- Diseño moderno con gradientes
- Animaciones de entrada con Framer Motion
- Validación en tiempo real con feedback visual
- Iconos en inputs
- Card con glassmorphism
- Estados de error mejorados

### ⚙️ Backend — Performance y Validación

#### 1. **Validación Robusta con DTOs**
```typescript
// Nuevos DTOs con class-validator
src/dto/
├── person.dto.ts       # CreatePersonDto, UpdatePersonDto
├── program.dto.ts      # CreateProgramDto (próximamente)
└── auth.dto.ts         # LoginDto, RegisterDto (próximamente)
```

#### 2. **Paginación Cursor-based**
```typescript
// utils/pagination.ts
- paginateResults() - Cursor pagination para listas grandes
- paginateWithOffset() - Offset pagination tradicional
```

#### 3. **Nuevas Dependencias Backend**
- `class-validator` - Validación de DTOs
- `class-transformer` - Transformación de objetos
- `dataloader` - Resolver N+1 queries (próximamente)
- `socket.io` - WebSockets para real-time (próximamente)
- `speakeasy` - 2FA authentication (próximamente)

### 🔧 Configuración Mejorada

#### Tailwind CSS
```javascript
// Paleta extendida con semantic colors
colors: {
  primary: { 50-950 },
  success: { 50-900 },
  warning: { 50-900 },
  danger: { 50-900 },
  neutral: { 50-950 }
}

// Sombras mejoradas
boxShadow: {
  'sm', 'md', 'lg', 'xl', '2xl'
}
```

## 📦 Instalación

### Prerrequisitos
- Node.js >= 20.0.0
- MongoDB >= 6.0
- npm >= 10.0.0

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus valores

# Crear índices en MongoDB
npm run ensure-indexes

# Crear usuario admin inicial
npm run create-admin

# Iniciar en desarrollo
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🚀 Nuevas Features Disponibles

### 1. Componentes UI Modernos
```tsx
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

// Uso
<Button variant="default" size="lg">Guardar</Button>
<Button variant="destructive">Eliminar</Button>
<Button variant="outline">Cancelar</Button>
```

### 2. Empty States
```tsx
import { EmptyState } from '@/components/ui/empty-state'
import { Users, Plus } from 'lucide-react'

<EmptyState
  icon={Users}
  title="No hay personas registradas"
  description="Comienza agregando personas a tu iglesia"
  action={{
    label: "Agregar persona",
    onClick: () => setShowModal(true),
    icon: Plus
  }}
/>
```

### 3. Skeleton Loaders
```tsx
import { Skeleton } from '@/components/ui/skeleton'

{loading ? (
  <div className="space-y-3">
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-12 w-full" />
  </div>
) : (
  <Table>...</Table>
)}
```

### 4. Validación con DTOs (Backend)
```typescript
import { validateDto } from '@/middleware/validate.middleware'
import { CreatePersonDto } from '@/dto/person.dto'

router.post('/persons',
  authenticate,
  validateDto(CreatePersonDto),
  personController.create
)
```

### 5. Paginación Cursor-based (Backend)
```typescript
import { paginateResults } from '@/utils/pagination'

const result = await paginateResults(
  Person,
  { churchId },
  { cursor: req.query.cursor, limit: 20 }
)

res.json({
  success: true,
  data: result.data,
  pagination: {
    nextCursor: result.nextCursor,
    hasMore: result.hasMore
  }
})
```

## 🎯 Roadmap de Implementación

### ✅ Fase 1 — Completada
- [x] Sistema de diseño base (Shadcn/UI)
- [x] Paleta de colores extendida
- [x] Componentes UI básicos
- [x] LoginPage mejorado
- [x] DTOs con validación
- [x] Paginación cursor-based

### 🚧 Fase 2 — En Progreso
- [ ] DashboardLayout con sidebar colapsable
- [ ] PersonsPage con DataTable
- [ ] Gráficos en Dashboard (Recharts)
- [ ] Multi-step forms
- [ ] Toast notifications mejorados

### 📋 Fase 3 — Próximamente
- [ ] WebSockets con Socket.io
- [ ] Real-time updates
- [ ] DataLoader para N+1 queries
- [ ] Tests unitarios con Jest
- [ ] Audit logs

### 🔮 Fase 4 — Futuro
- [ ] Internacionalización (i18n)
- [ ] PWA con Service Workers
- [ ] 2FA Authentication
- [ ] Monitoring con Sentry

## 📝 Guía de Uso Rápido

### Crear un nuevo componente UI
```tsx
// 1. Usar componentes base
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// 2. Aplicar animaciones
import { motion } from 'framer-motion'

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
>
  <Card>...</Card>
</motion.div>
```

### Validar datos en backend
```typescript
// 1. Crear DTO
export class CreateItemDto {
  @IsString()
  @MinLength(3)
  name: string;
}

// 2. Aplicar en ruta
router.post('/', validateDto(CreateItemDto), controller.create)
```

### Implementar paginación
```typescript
// Backend
const result = await paginateResults(Model, query, { 
  cursor: req.query.cursor,
  limit: 20 
})

// Frontend
const [cursor, setCursor] = useState<string | null>(null)

const loadMore = () => {
  fetchData({ cursor }).then(result => {
    setCursor(result.nextCursor)
  })
}
```

## 🔒 Seguridad

- ✅ Helmet para headers seguros
- ✅ Rate limiting (200 req/min)
- ✅ CORS configurado
- ✅ Validación de DTOs
- ✅ JWT con refresh tokens
- ✅ RBAC de 6 niveles
- ✅ Multi-tenancy con tenant guard

## 📊 Performance

### Optimizaciones Implementadas
1. **MongoDB Indexes** - Queries optimizadas
2. **Cursor Pagination** - Listas grandes eficientes
3. **Lean Queries** - Menos overhead de Mongoose
4. **Connection Pooling** - Reuso de conexiones

### Optimizaciones Próximas
1. **Redis Caching** - Cache de queries frecuentes
2. **DataLoader** - Batching de queries
3. **Compression** - Respuestas comprimidas
4. **CDN** - Assets estáticos

## 🧪 Testing

```bash
# Backend
cd backend
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

# Frontend (próximamente)
cd frontend
npm test
```

## 🐛 Troubleshooting

### Error: "Module not found @radix-ui/..."
```bash
cd frontend
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
```

### Error: "class-validator decorators not working"
```bash
cd backend
npm install reflect-metadata
# Agregar en src/server.ts: import 'reflect-metadata'
```

### Error: "Tailwind classes not working"
```bash
# Verificar que tailwindcss-animate está instalado
cd frontend
npm install -D tailwindcss-animate
```

## 📚 Documentación Adicional

- [Componentes UI](./docs/components.md) (próximamente)
- [API Reference](./docs/api.md) (próximamente)
- [Guía de Estilo](./docs/style-guide.md) (próximamente)
- [Arquitectura](./ARQUITECTURA.md)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.

## 👨‍💻 Autor

**Andy** - Systems Engineer

## 🙏 Agradecimientos

- Shadcn/UI por los componentes base
- Radix UI por los primitivos accesibles
- Framer Motion por las animaciones
- La comunidad de React y TypeScript

---

**¿Preguntas?** Abre un issue o contacta al equipo de desarrollo.

**Versión:** 3.0.0  
**Última actualización:** Febrero 2024
