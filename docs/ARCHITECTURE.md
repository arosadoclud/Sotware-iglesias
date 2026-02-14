# 🏗️ Arquitectura del Sistema

Documentación técnica de la arquitectura de Church Manager v4.

## 📋 Tabla de Contenidos

- [Visión General](#visión-general)
- [Arquitectura de Alto Nivel](#arquitectura-de-alto-nivel)
- [Backend](#backend)
- [Frontend](#frontend)
- [Base de Datos](#base-de-datos)
- [Seguridad](#seguridad)
- [Escalabilidad](#escalabilidad)

---

## Visión General

Church Manager v4 es una aplicación fullstack construida con arquitectura de 3 capas:

1. **Frontend**: SPA React con TypeScript
2. **Backend**: API REST Node.js con Express
3. **Base de Datos**: MongoDB con Mongoose ODM

### Características Arquitectónicas

- ✅ **Multi-tenant**: Aislamiento completo entre iglesias
- ✅ **RESTful API**: Comunicación estándar HTTP/JSON
- ✅ **Real-time**: WebSockets con Socket.io
- ✅ **Cache**: Redis para rendimiento
- ✅ **Queues**: Bull para procesamiento asíncrono
- ✅ **Microservices-ready**: Módulos desacoplados

---

## Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │   React SPA (TypeScript + Vite)                  │   │
│  │   • React Router v6 (Routing)                    │   │
│  │   • Zustand (State Management)                   │   │
│  │   • React Query (Data Fetching)                  │   │
│  │   • TailwindCSS + Radix UI (Styling)             │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS/WSS
                       │ (JWT Bearer Token)
┌──────────────────────▼──────────────────────────────────┐
│                   API GATEWAY LAYER                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │   Express Middleware Stack                       │   │
│  │   • Helmet (Security Headers)                    │   │
│  │   • CORS (Cross-Origin)                          │   │
│  │   • Rate Limiting                                │   │
│  │   • Morgan (Logging)                             │   │
│  │   • Auth Middleware (JWT Verification)           │   │
│  │   • Tenant Middleware (Multi-tenancy)            │   │
│  │   • RBAC Middleware (Authorization)              │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                 APPLICATION LAYER                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │   Controllers (Request Handling)                 │   │
│  │   ├── Auth Controller                            │   │
│  │   ├── Persons Controller                         │   │
│  │   ├── Programs Controller                        │   │
│  │   ├── Churches Controller                        │   │
│  │   └── ...                                        │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │   Business Logic Layer                           │   │
│  │   ├── AssignmentEngine (Program Generation)      │   │
│  │   ├── FairnessCalculator (Scoring)               │   │
│  │   ├── HistoryAnalyzer (Statistics)               │   │
│  │   ├── NotificationService (Emails/WhatsApp)      │   │
│  │   └── PDFService (Document Generation)           │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   DATA LAYER                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │   Mongoose Models (ORM/ODM)                      │   │
│  │   ├── Church Model                               │   │
│  │   ├── User Model                                 │   │
│  │   ├── Person Model                               │   │
│  │   ├── Program Model                              │   │
│  │   └── ...                                        │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              INFRASTRUCTURE LAYER                       │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐  │
│  │  MongoDB    │  │   Redis     │  │   Bull Queue   │  │
│  │  (Primary)  │  │  (Cache)    │  │   (Jobs)       │  │
│  └─────────────┘  └─────────────┘  └────────────────┘  │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐  │
│  │  Cloudinary │  │   Twilio    │  │   SMTP/Email   │  │
│  │  (Images)   │  │  (WhatsApp) │  │   Service      │  │
│  └─────────────┘  └─────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Backend

### Estructura de Módulos

```
backend/src/
├── config/                 # Configuraciones
│   ├── database.ts        # MongoDB config
│   └── env.ts             # Environment variables
│
├── middleware/            # Express middlewares
│   ├── auth.middleware.ts           # JWT verification
│   ├── tenant.middleware.ts         # Multi-tenancy enforcement
│   ├── rbac.middleware.ts           # Role-based access
│   ├── validate.middleware.ts       # Request validation
│   └── errorHandler.middleware.ts   # Global error handling
│
├── models/                # Mongoose models
│   ├── Church.model.ts
│   ├── User.model.ts
│   ├── Person.model.ts
│   ├── Program.model.ts
│   ├── Role.model.ts
│   └── index.ts
│
├── modules/               # Feature modules
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.routes.ts
│   ├── persons/
│   │   ├── persons.controller.ts
│   │   ├── persons.service.ts
│   │   └── persons.routes.ts
│   ├── programs/
│   │   ├── programs.controller.ts
│   │   ├── programs.service.ts
│   │   ├── programs.routes.ts
│   │   └── engine/
│   │       ├── AssignmentEngine.ts
│   │       ├── FairnessCalculator.ts
│   │       └── HistoryAnalyzer.ts
│   └── ...
│
├── infrastructure/        # External services
│   ├── cache/
│   │   └── CacheAdapter.ts
│   ├── queue/
│   │   └── QueueManager.ts
│   └── email/
│       └── EmailService.ts
│
├── utils/                 # Utilities
│   ├── errors.ts
│   ├── logger.ts
│   └── pagination.ts
│
├── app.ts                 # Express app setup
└── server.ts              # Server entry point
```

### Flujo de Request

```
1. Client Request
   ↓
2. Express Middleware Stack
   ├── Helmet (Security)
   ├── CORS
   ├── Rate Limiting
   ├── Body Parser
   ├── Morgan (Logging)
   ↓
3. Auth Middleware
   ├── Verify JWT Token
   ├── Decode user info
   └── Attach to req.user
   ↓
4. Tenant Middleware
   ├── Extract churchId from JWT
   ├── Validate church exists & active
   ├── Apply plan limits
   └── Inject churchId in req
   ↓
5. RBAC Middleware (if protected resource)
   ├── Check user role
   ├── Check required permissions
   └── Allow/Deny access
   ↓
6. Validation Middleware
   ├── Validate request body
   ├── Validate params
   └── Sanitize inputs
   ↓
7. Controller
   ├── Parse request
   ├── Call service layer
   └── Format response
   ↓
8. Service Layer
   ├── Business logic
   ├── Data validation
   ├── Call models
   └── Return result
   ↓
9. Model/Database
   ├── Query MongoDB
   ├── Apply indexes
   └── Return data
   ↓
10. Response sent to client
```

### Multi-Tenancy

#### Estrategia: Filter-Based (Shared Database)

```typescript
// Tenant Middleware
export const tenantMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Church ID siempre viene del JWT (nunca del body)
  const churchId = req.user!.churchId;
  
  // Validar iglesia existe y está activa
  const church = await getChurch(churchId); // Con cache Redis
  
  if (!church || !church.isActive) {
    throw new ForbiddenError('Church not active');
  }
  
  // Inyectar en request
  req.churchId = churchId;
  req.church = church;
  
  // Sobreescribir cualquier churchId en el body
  if (req.body && req.body.churchId) {
    req.body.churchId = churchId;
  }
  
  next();
};
```

#### Seguridad Multi-Tenant

1. **JWT contiene churchId**: Imposible falsificar
2. **Validation en middleware**: Antes de llegar a controllers
3. **Queries filtradas**: Todos los modelos incluyen `churchId`
4. **Índices MongoDB**: Optimización con `{ churchId: 1, ... }`

```typescript
// Todos los schemas incluyen churchId
const personSchema = new Schema({
  churchId: {
    type: Schema.Types.ObjectId,
    ref: 'Church',
    required: true,
    index: true  // ← Índice para rendimiento
  },
  // ... otros campos
});

// Todas las queries incluyen filtro
const persons = await Person.find({
  churchId: req.churchId,  // ← Siempre filtrado
  status: 'active'
});
```

### RBAC (Role-Based Access Control)

#### Jerarquía de Roles

```
SUPER_ADMIN (100)
    ↓
PASTOR (80)
    ↓
ADMIN (60)
    ↓
MINISTRY_LEADER (40)
    ↓
EDITOR (20)
    ↓
VIEWER (10)
```

#### Permisos por Recurso

```typescript
const permissions = {
  persons: {
    create: ['ADMIN', 'PASTOR', 'SUPER_ADMIN'],
    read: ['VIEWER', 'EDITOR', 'MINISTRY_LEADER', 'ADMIN', 'PASTOR'],
    update: ['EDITOR', 'MINISTRY_LEADER', 'ADMIN', 'PASTOR'],
    delete: ['ADMIN', 'PASTOR', 'SUPER_ADMIN']
  },
  programs: {
    create: ['MINISTRY_LEADER', 'ADMIN', 'PASTOR'],
    read: ['VIEWER', 'EDITOR', 'MINISTRY_LEADER', 'ADMIN', 'PASTOR'],
    update: ['MINISTRY_LEADER', 'ADMIN', 'PASTOR'],
    delete: ['ADMIN', 'PASTOR', 'SUPER_ADMIN'],
    publish: ['ADMIN', 'PASTOR']
  }
};
```

#### Uso en Routes

```typescript
router.get(
  '/persons',
  auth,                          // JWT verification
  tenant,                        // Multi-tenancy
  rbac('persons', 'read'),       // RBAC check
  personsController.getAll
);
```

### Algoritmo de Asignación

#### AssignmentEngine

```typescript
class AssignmentEngine {
  async generateProgram(
    churchId: string,
    activities: Activity[],
    options: GenerateOptions
  ): Promise<Program> {
    // 1. Cargar historial en memoria
    const history = await this.historyAnalyzer.analyze(
      churchId,
      options.lookbackMonths
    );
    
    // 2. Para cada actividad
    for (const activity of activities) {
      // 3. Obtener candidatos elegibles
      const candidates = await this.getCandidates(
        churchId,
        activity.requiredRole,
        programDate
      );
      
      // 4. Calcular score de equidad para cada candidato
      const scoredCandidates = candidates.map(candidate => ({
        person: candidate,
        score: this.fairnessCalculator.calculate(
          candidate,
          history,
          activity
        )
      }));
      
      // 5. Ordenar por score (menor participación = mayor prioridad)
      scoredCandidates.sort((a, b) => b.score - a.score);
      
      // 6. Asignar el mejor candidato
      const assignment = {
        activity: activity._id,
        assignedPerson: scoredCandidates[0].person._id,
        score: scoredCandidates[0].score
      };
      
      assignments.push(assignment);
    }
    
    // 7. Crear programa
    return await Program.create({
      churchId,
      programDate,
      assignments,
      status: 'draft'
    });
  }
}
```

#### FairnessCalculator

Score de equidad basado en 3 componentes:

```typescript
class FairnessCalculator {
  calculate(
    person: Person,
    history: ParticipationHistory,
    activity: Activity
  ): number {
    // Componente 1: Frecuencia (0-40 pts)
    // Menos participación = más puntos
    const totalParticipations = history.get(person._id)?.total || 0;
    const frequencyScore = Math.max(0, 40 - totalParticipations);
    
    // Componente 2: Recencia (0-35 pts)
    // Más tiempo sin participar = más puntos
    const daysSinceLast = history.get(person._id)?.daysSinceLast || 999;
    const recencyScore = Math.min(35, daysSinceLast / 2);
    
    // Componente 3: Balance de roles (0-25 pts)
    // Menos veces en este rol = más puntos
    const roleParticipations = history.get(person._id)?.byRole[activity.requiredRole] || 0;
    const balanceScore = Math.max(0, 25 - roleParticipations * 5);
    
    // Score total (0-100)
    return frequencyScore + recencyScore + balanceScore;
  }
}
```

### Cache Strategy

```typescript
class CacheAdapter {
  private client: Redis | Map<string, any>;
  
  async get(key: string): Promise<any> {
    // Intentar Redis
    if (this.isRedisAvailable()) {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    }
    
    // Fallback a Map en memoria
    return this.memoryCache.get(key);
  }
  
  async set(key: string, value: any, ttl: number): Promise<void> {
    if (this.isRedisAvailable()) {
      await this.client.setex(key, ttl, JSON.stringify(value));
    } else {
      this.memoryCache.set(key, value);
      setTimeout(() => this.memoryCache.delete(key), ttl * 1000);
    }
  }
}

// Uso en aplicación
const church = await cache.get(`church:${churchId}`);
if (!church) {
  const church = await Church.findById(churchId);
  await cache.set(`church:${churchId}`, church, 300); // 5 min TTL
}
```

---

## Frontend

### Estructura de Componentes

```
frontend/src/
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx         # Layout principal
│   │   ├── Sidebar.tsx           # Navegación
│   │   └── Header.tsx
│   └── ui/                       # Componentes reutilizables
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       └── ...
│
├── pages/                        # Páginas/Rutas
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   ├── persons/
│   │   ├── PersonsPage.tsx
│   │   ├── PersonDetailPage.tsx
│   │   └── CreatePersonPage.tsx
│   ├── programs/
│   │   ├── ProgramsPage.tsx
│   │   ├── GenerateProgramPage.tsx
│   │   └── ProgramDetailPage.tsx
│   └── DashboardPage.tsx
│
├── hooks/                        # Custom hooks
│   ├── useAuth.ts
│   ├── usePersons.ts
│   ├── usePrograms.ts
│   └── index.ts
│
├── lib/                          # Utilidades
│   ├── api.ts                    # API client (axios)
│   └── utils.ts                  # Helpers
│
├── store/                        # Estado global (Zustand)
│   └── authStore.ts
│
├── App.tsx                       # App root
└── main.tsx                      # Entry point
```

### State Management

#### Global State (Zustand)

```typescript
// authStore.ts
interface AuthState {
  user: User | null;
  tokens: Tokens | null;
  isAuthenticated: boolean;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,
  
  login: async (credentials) => {
    const response = await api.login(credentials);
    set({
      user: response.user,
      tokens: response.tokens,
      isAuthenticated: true
    });
  },
  
  logout: () => {
    set({ user: null, tokens: null, isAuthenticated: false });
  }
}));
```

#### Server State (React Query)

```typescript
// usePersons hook
export function usePersons(filters?: PersonFilters) {
  return useQuery({
    queryKey: ['persons', filters],
    queryFn: () => api.getPersons(filters),
    staleTime: 5 * 60 * 1000, // 5 min
    cacheTime: 10 * 60 * 1000  // 10 min
  });
}

// Uso en componente
const PersonsList = () => {
  const { data, isLoading, error } = usePersons({ status: 'active' });
  
  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  
  return (
    <div>
      {data.persons.map(person => (
        <PersonCard key={person._id} person={person} />
      ))}
    </div>
  );
};
```

### Routing

```typescript
// App.tsx
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/persons" element={<PersonsPage />} />
            <Route path="/persons/:id" element={<PersonDetailPage />} />
            <Route path="/programs" element={<ProgramsPage />} />
            <Route path="/programs/generate" element={<GenerateProgramPage />} />
          </Route>
        </Route>
        
        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Base de Datos

### Modelo de Datos

```
┌─────────────────┐
│   Church        │
│  _id            │◄───┐
│  name           │    │
│  plan           │    │ churchId (FK)
│  settings       │    │
└─────────────────┘    │
                       │
       ┌───────────────┴──────────────┐
       │                              │
┌──────▼────────┐            ┌────────▼──────┐
│   User        │            │   Person      │
│  _id          │            │  _id          │
│  churchId     │            │  churchId     │
│  email        │            │  firstName    │
│  role         │            │  roles[]      │
└───────────────┘            │  availability │
                             └────────┬──────┘
                                      │
                                      │ personId (FK)
                                      │
                             ┌────────▼──────┐
                             │   Program     │
                             │  _id          │
                             │  churchId     │
                             │  programDate  │
                             │  assignments[]│
                             │    ├─activity │
                             │    └─person   │
                             └───────────────┘
```

### Índices Críticos

```typescript
// Program - Para lookback del motor
programSchema.index({ 
  churchId: 1, 
  programDate: -1, 
  status: 1 
});

// Person - Para búsqueda de candidatos
personSchema.index({ 
  churchId: 1, 
  'roles.roleId': 1, 
  status: 1 
});

// User - Para autenticación
userSchema.index({ 
  email: 1 
}, { unique: true });

// Program assignments - Para historial
programSchema.index({ 
  'assignments.assignedPerson': 1,
  programDate: -1
});
```

---

## Seguridad

### Autenticación (JWT)

```typescript
// Token contiene:
{
  userId: string,
  churchId: string,
  role: string,
  iat: number,
  exp: number
}

// Access token: 15 min
// Refresh token: 7 días
```

### Protección de Rutas

```typescript
// Backend
router.get('/persons',
  auth,           // JWT verification
  tenant,         // Multi-tenancy check
  rbac('persons', 'read'),  // Authorization
  controller.getAll
);

// Frontend
<Route element={<ProtectedRoute requiredRole="ADMIN" />}>
  <Route path="/settings" element={<SettingsPage />} />
</Route>
```

### Validación de Datos

```typescript
// class-validator
class CreatePersonDto {
  @IsString()
  @MinLength(2)
  firstName: string;
  
  @IsEmail()
  email: string;
  
  @IsPhoneNumber()
  phone: string;
}
```

---

## Escalabilidad

### Horizontal Scaling

- **Stateless Backend**: Múltiples instancias sin estado compartido
- **Redis Sessions**: Sesiones en Redis, no memoria
- **Load Balancer**: Nginx/HAProxy para distribuir carga
- **MongoDB Replica Set**: Alta disponibilidad

### Vertical Scaling

- **Índices optimizados**: Queries rápidas
- **Paginación**: Limitar resultados
- **Caching**: Redis para datos frecuentes
- **CDN**: Assets estáticos

### Performance Optimizations

```typescript
// 1. Batch operations
await Person.insertMany(persons);

// 2. Projection (select only needed fields)
await Person.find({ churchId }).select('firstName lastName email');

// 3. Lean queries (plain objects, no Mongoose overhead)
await Person.find({ churchId }).lean();

// 4. Pagination
const persons = await Person.find({ churchId })
  .skip((page - 1) * limit)
  .limit(limit);

// 5. Indexes
await Person.find({ churchId, status: 'active' }); // ← Usa índice
```

---

## Diagrama de Deployment

```
┌──────────────────────────────────────────────┐
│              LOAD BALANCER                   │
│              (Nginx/HAProxy)                 │
└────────┬──────────────────┬──────────────────┘
         │                  │
    ┌────▼────┐        ┌────▼────┐
    │ Backend │        │ Backend │
    │ Node 1  │        │ Node 2  │
    └────┬────┘        └────┬────┘
         │                  │
         └────────┬─────────┘
                  │
         ┌────────▼────────┐
         │  Redis Cluster  │
         │  (Cache/Queue)  │
         └─────────────────┘
                  
         ┌─────────────────┐
         │  MongoDB        │
         │  Replica Set    │
         │  (3 nodes)      │
         └─────────────────┘
```

---

## Conclusión

Church Manager v4 está diseñado con:
- ✅ Seguridad robusta (JWT, RBAC, Multi-tenant)
- ✅ Escalabilidad (Horizontal y vertical)
- ✅ Mantenibilidad (Código modular, bien documentado)
- ✅ Performance (Cache, índices, optimizaciones)

---

**Documentación mantenida por:** Andy Rodriguez  
**Última actualización:** Febrero 2026
