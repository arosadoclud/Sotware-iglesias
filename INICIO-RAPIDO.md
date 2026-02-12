# 🚀 INICIO RÁPIDO - Church Manager v3.0

## ✨ VERSIÓN LISTA PARA USAR

Este proyecto **YA TIENE TODAS LAS MEJORAS ACTIVADAS**. No necesitas renombrar archivos.

---

## 📦 Instalación (5 minutos)

### 1️⃣ **Backend**

```bash
cd backend
npm install
cp .env.example .env
```

**Edita `.env` con tus valores:**
```env
MONGODB_URI=mongodb://localhost:27017/church_program_manager
JWT_SECRET=tu_secreto_super_seguro_minimo_32_caracteres_aqui
JWT_REFRESH_SECRET=otro_secreto_diferente_para_refresh_tokens
PORT=5000
FRONTEND_URL=http://localhost:5173
```

**Inicializa la base de datos:**
```bash
npm run ensure-indexes
npm run create-admin
```

**Inicia el servidor:**
```bash
npm run dev
```

✅ Deberías ver: `🚀 Server running on http://localhost:5000`

---

### 2️⃣ **Frontend** (nueva terminal)

```bash
cd frontend
npm install
npm install -D tailwindcss-animate
```

**Crea archivo `.env`:**
```bash
echo "VITE_API_URL=http://localhost:5000/api/v1" > .env
```

**Inicia la app:**
```bash
npm run dev
```

✅ Deberías ver: `➜  Local:   http://localhost:5173/`

---

## 🎯 **Acceder a la Aplicación**

1. Abre tu navegador en: **http://localhost:5173**

2. **Credenciales de prueba:**
   - Email: `admin@iglesia.com`
   - Password: `password123`

---

## ✨ **Qué Verás (MEJORAS YA ACTIVAS)**

### 🎨 **LoginPage** (`/login`)
- ✅ Diseño moderno con gradientes
- ✅ Logo grande centrado con animación
- ✅ Iconos en inputs (📧 Mail, 🔒 Lock)
- ✅ Validación visual con errores animados
- ✅ Transiciones suaves con Framer Motion

### 📊 **Dashboard** (`/`)
- ✅ **3 gráficos interactivos con Recharts:**
  - LineChart (participación mensual)
  - PieChart (distribución por ministerio)  
  - BarChart (top 5 participantes)
- ✅ Cards de estadísticas con tendencias (+12%, +8%)
- ✅ Timeline de actividad reciente
- ✅ Animaciones de entrada

### 👥 **PersonsPage** (`/persons`)
- ✅ **DataTable profesional con TanStack Table:**
  - Búsqueda en tiempo real
  - Paginación (10, 20, 30, 50, 100 filas)
  - Ordenamiento por columnas (click en headers)
  - Navegación completa de páginas
- ✅ Avatar con iniciales en cada fila
- ✅ Badges de colores (🟢 Activo, ⚪ Inactivo)
- ✅ DropdownMenu (⋮) para acciones
- ✅ Modal mejorado con Dialog
- ✅ Select components en formularios

### 🎛️ **Sidebar** (todas las páginas)
- ✅ **Colapsable** con botón ◀
- ✅ Animación suave al expandir/colapsar
- ✅ Menú móvil responsive con overlay
- ✅ DropdownMenu de perfil de usuario
- ✅ Estados de navegación activa (azul)

---

## 🎨 **Componentes UI Disponibles (13 total)**

```typescript
// En cualquier componente puedes usar:
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DataTable } from '@/components/ui/data-table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
```

---

## 🎣 **Hooks Personalizados**

```typescript
import { 
  useFetch,        // Fetch con loading/error
  useDebounce,     // Debounce de valores
  usePermissions,  // Verificar roles
  useMediaQuery,   // Responsive
  useLocalStorage  // localStorage tipado
} from '@/hooks'
```

---

## 📋 **Constantes Centralizadas**

```typescript
import { 
  PERSON_STATUS,      // Estados con variantes
  ROUTES,             // Rutas centralizadas
  VALIDATION_MESSAGES // Mensajes consistentes
} from '@/constants'
```

---

## 🐛 **Solución de Problemas**

### Error: "Cannot find module '@/...'"
```bash
# Verifica vite.config.ts tenga el alias configurado
# Ya está incluido, pero si hay problemas:
cd frontend
npm install
```

### Error: "Tailwind classes not working"
```bash
cd frontend
npm install -D tailwindcss-animate
```

### Error: "MongoDB connection failed"
```bash
# Asegúrate que MongoDB esté corriendo:
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
# Windows: net start MongoDB
```

### Error: "Port 5000 already in use"
```bash
# Cambia el puerto en backend/.env
PORT=5001

# Y actualiza frontend/.env
VITE_API_URL=http://localhost:5001/api/v1
```

---

## 📚 **Documentación Adicional**

- **README-IMPROVED.md** - Documentación técnica completa
- **GUIA-IMPLEMENTACION.md** - Guía de implementación detallada
- **FASES-FINALES-COMPLETADAS.md** - Resumen de mejoras implementadas
- **RESUMEN-IMPLEMENTACION.md** - Resumen ejecutivo

---

## 🎯 **Próximos Pasos Opcionales**

Ahora que tienes el proyecto funcionando, puedes:

1. ✅ Personalizar colores en `tailwind.config.js`
2. ✅ Agregar más datos de prueba con `npm run seed`
3. ✅ Crear nuevos roles y ministerios desde la UI
4. ✅ Explorar el código de los componentes UI
5. ✅ Generar tu primer programa desde `/programs/generate`

---

## ✅ **Checklist de Verificación**

- [ ] Backend corriendo en http://localhost:5000
- [ ] Frontend corriendo en http://localhost:5173
- [ ] Login funciona con admin@iglesia.com
- [ ] Dashboard muestra 3 gráficos
- [ ] PersonsPage tiene DataTable con búsqueda
- [ ] Sidebar se puede colapsar
- [ ] Badges tienen colores (verde, gris, etc.)
- [ ] Avatar muestra iniciales

---

## 🆘 **Necesitas Ayuda?**

1. Revisa la consola del navegador (F12)
2. Revisa la consola del backend
3. Verifica que MongoDB esté corriendo
4. Verifica que las variables de entorno estén bien

---

## 🎉 **¡Listo!**

Tu proyecto está completamente configurado y listo para usar.

**Versión:** 3.0 (Mejorada)  
**Fecha:** Febrero 2024  
**Mejoras:** 13 componentes UI + Gráficos + DataTable + Sidebar colapsable
