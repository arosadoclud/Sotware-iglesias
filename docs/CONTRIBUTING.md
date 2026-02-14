# 🤝 Guía de Contribución

¡Gracias por tu interés en contribuir a Church Manager v4! Este documento proporciona las pautas para contribuir al proyecto.

## 📋 Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [Cómo Contribuir](#cómo-contribuir)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Configuración del Entorno](#configuración-del-entorno)
- [Estándares de Código](#estándares-de-código)
- [Proceso de Pull Request](#proceso-de-pull-request)
- [Reportar Bugs](#reportar-bugs)
- [Sugerir Mejoras](#sugerir-mejoras)

---

## Código de Conducta

Este proyecto sigue un código de conducta estricto. Al participar, te comprometes a mantener un ambiente respetuoso y constructivo.

### Nuestros Compromisos

- Usar lenguaje inclusivo y acogedor
- Respetar diferentes puntos de vista y experiencias
- Aceptar críticas constructivas con gracia
- Enfocarse en lo mejor para la comunidad
- Mostrar empatía hacia otros miembros

---

## Cómo Contribuir

### Formas de Contribuir

1. **Código**
   - Nuevas características
   - Correcciones de bugs
   - Mejoras de rendimiento
   - Refactorización

2. **Documentación**
   - Mejorar documentación existente
   - Traducir a otros idiomas
   - Agregar ejemplos y tutoriales
   - Corregir typos

3. **Testing**
   - Escribir tests unitarios
   - Tests de integración
   - Tests end-to-end
   - Reportar bugs

4. **Diseño**
   - Mejorar UI/UX
   - Crear iconos o assets
   - Diseñar nuevas funcionalidades

---

## Estructura del Proyecto

```
church-manager-v4/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuraciones
│   │   ├── middleware/      # Middlewares Express
│   │   ├── models/          # Modelos Mongoose
│   │   ├── modules/         # Módulos de la aplicación
│   │   ├── utils/           # Utilidades
│   │   └── scripts/         # Scripts de mantenimiento
│   ├── templates/           # Plantillas Handlebars
│   └── uploads/             # Archivos subidos
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── pages/           # Páginas
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Librerías y utils
│   │   └── store/           # Estado global (Zustand)
│   └── public/              # Assets públicos
└── docs/                    # Documentación
```

---

## Configuración del Entorno

### 1. Fork y Clone

```bash
# Fork el repositorio en GitHub
# Luego clona tu fork
git clone https://github.com/TU_USUARIO/Sotware-iglesias.git
cd Sotware-iglesias

# Agregar upstream
git remote add upstream https://github.com/arosadoclud/Sotware-iglesias.git
```

### 2. Instalar Dependencias

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Configurar Entorno

```bash
# Backend
cd backend
cp .env.example .env
# Edita .env con tus valores locales

# Frontend
cd ../frontend
cp .env.example .env
```

### 4. Crear Branch

```bash
# Actualizar main
git checkout main
git pull upstream main

# Crear branch para tu feature
git checkout -b feature/nombre-descriptivo
# O para bugfixes
git checkout -b fix/nombre-del-bug
```

---

## Estándares de Código

### TypeScript

```typescript
// ✅ BIEN: Interfaces claras, tipos explícitos
interface CreatePersonDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

async function createPerson(data: CreatePersonDto): Promise<Person> {
  // implementación
}

// ❌ MAL: any, sin tipos
async function createPerson(data: any) {
  // implementación
}
```

### Naming Conventions

```typescript
// Componentes: PascalCase
export const PersonCard: React.FC<Props> = () => {};

// Funciones: camelCase
function calculateFairnessScore(person: Person): number {}

// Constantes: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;

// Interfaces: PascalCase con prefijo I (opcional)
interface Person {}
// o
interface IPerson {}

// Types: PascalCase
type PersonStatus = 'active' | 'inactive';
```

### Comentarios

```typescript
// ✅ BIEN: Comentarios útiles
/**
 * Calcula el score de equidad para asignación de programas.
 * 
 * @param person - La persona a evaluar
 * @param lookbackMonths - Meses a considerar en historial
 * @returns Score normalizado entre 0-100
 */
function calculateFairnessScore(
  person: Person, 
  lookbackMonths: number
): number {
  // Algoritmo basado en 3 componentes:
  // 1. Frecuencia de participación
  // 2. Tiempo desde última participación
  // 3. Balance de roles
}

// ❌ MAL: Comentarios obvios o innecesarios
// Suma dos números
function add(a: number, b: number) {
  return a + b; // retorna la suma
}
```

### Estructura de Archivos

```typescript
// ✅ Imports ordenados
// 1. Librerías externas
import React from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Imports internos
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

// 3. Tipos e interfaces
import type { Person } from '@/types';

// 4. Estilos (si aplica)
import styles from './PersonCard.module.css';

// Componente
export const PersonCard: React.FC<Props> = ({ person }) => {
  // ...
};
```

### React Best Practices

```typescript
// ✅ BIEN: Hooks en orden, memoización cuando necesario
const PersonList: React.FC = () => {
  // 1. Hooks de estado
  const [filter, setFilter] = useState('');
  
  // 2. Hooks de contexto
  const { user } = useAuth();
  
  // 3. Hooks de queries
  const { data, isLoading } = useQuery({
    queryKey: ['persons', filter],
    queryFn: () => getPersons(filter)
  });
  
  // 4. Efectos
  useEffect(() => {
    // ...
  }, [filter]);
  
  // 5. Memoización si es necesario
  const filteredPersons = useMemo(
    () => data?.filter(p => p.status === 'active'),
    [data]
  );
  
  // 6. Render
  return <div>{/* ... */}</div>;
};
```

### Error Handling

```typescript
// ✅ BIEN: Manejo apropiado de errores
try {
  const result = await api.createPerson(data);
  toast.success('Persona creada exitosamente');
  return result;
} catch (error) {
  if (error instanceof ValidationError) {
    toast.error(`Error de validación: ${error.message}`);
  } else if (error instanceof NetworkError) {
    toast.error('Error de conexión. Intenta de nuevo.');
  } else {
    logger.error('Error inesperado:', error);
    toast.error('Ocurrió un error inesperado');
  }
  throw error;
}

// ❌ MAL: Ignorar errores o manejarlos mal
try {
  await api.createPerson(data);
} catch (error) {
  console.log('error'); // No informativo
}
```

---

## Proceso de Pull Request

### 1. Antes de Crear el PR

- [ ] Código compilado sin errores
- [ ] Tests pasando
- [ ] Linter sin errores
- [ ] Documentación actualizada
- [ ] Commits descriptivos

```bash
# Verificar todo
npm run lint
npm run test
npm run build
```

### 2. Commit Messages

Usar [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Formato
<type>(<scope>): <description>

# Tipos
feat:     Nueva funcionalidad
fix:      Corrección de bug
docs:     Cambios en documentación
style:    Formato, punto y coma, etc (no cambia código)
refactor: Refactorización de código
perf:     Mejora de rendimiento
test:     Agregar o corregir tests
chore:    Cambios en build, dependencias, etc

# Ejemplos
feat(persons): agregar filtro por ministerio
fix(programs): corregir algoritmo de asignación
docs(api): actualizar documentación de endpoints
refactor(auth): simplificar lógica de JWT
test(persons): agregar tests para CRUD
```

### 3. Crear Pull Request

1. Push tu branch:
```bash
git push origin feature/nombre-descriptivo
```

2. En GitHub, crea el Pull Request

3. Completa la plantilla:
```markdown
## Descripción
Breve descripción de los cambios

## Tipo de cambio
- [ ] Bug fix
- [ ] Nueva funcionalidad
- [ ] Breaking change
- [ ] Documentación

## ¿Cómo se ha probado?
Describe las pruebas que realizaste

## Checklist
- [ ] Mi código sigue el estilo del proyecto
- [ ] He realizado self-review
- [ ] He comentado código complejo
- [ ] He actualizado la documentación
- [ ] Los tests pasan
```

### 4. Code Review

- Responde a comentarios de manera constructiva
- Realiza los cambios solicitados
- Mantén la discusión enfocada y profesional

---

## Reportar Bugs

### Antes de Reportar

1. Busca en [issues existentes](https://github.com/arosadoclud/Sotware-iglesias/issues)
2. Verifica usar la última versión
3. Intenta reproducir el bug

### Template de Bug Report

```markdown
**Describe el bug**
Descripción clara del problema

**Pasos para reproducir**
1. Ve a '...'
2. Click en '...'
3. Observa el error

**Comportamiento esperado**
Qué debería pasar

**Comportamiento actual**
Qué pasa realmente

**Screenshots**
Si aplica, agrega capturas

**Entorno:**
 - OS: [e.g. Windows 11]
 - Browser: [e.g. Chrome 120]
 - Version: [e.g. 4.0.0]
 - Node: [e.g. 18.17.0]

**Información adicional**
Contexto adicional del problema
```

---

## Sugerir Mejoras

### Template de Feature Request

```markdown
**¿Tu solicitud está relacionada con un problema?**
Descripción clara del problema

**Describe la solución que te gustaría**
Cómo te gustaría resolver el problema

**Describe alternativas consideradas**
Otras soluciones que consideraste

**Contexto adicional**
Cualquier información adicional, mockups, etc
```

---

## Testing

### Escribir Tests

```typescript
// Example: persona.test.ts
describe('Person Service', () => {
  describe('createPerson', () => {
    it('should create a person with valid data', async () => {
      const data = {
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan@example.com'
      };
      
      const person = await personService.create(data);
      
      expect(person).toBeDefined();
      expect(person.firstName).toBe('Juan');
    });
    
    it('should throw error with invalid email', async () => {
      const data = {
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'invalid-email'
      };
      
      await expect(personService.create(data))
        .rejects.toThrow('Invalid email');
    });
  });
});
```

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Con coverage
npm test -- --coverage

# Watch mode
npm test -- --watch

# Test específico
npm test persona.test.ts
```

---

## Scripts Útiles

```bash
# Desarrollo
npm run dev              # Iniciar servidor dev

# Build
npm run build            # Compilar TypeScript

# Calidad de código
npm run lint             # Ejecutar ESLint
npm run lint:fix         # Arreglar auto
npm run format           # Prettier

# Base de datos
npm run ensure-indexes   # Crear índices
npm run seed             # Datos de prueba

# Tests
npm test                 # Ejecutar tests
npm run test:watch       # Watch mode
npm run test:coverage    # Con coverage
```

---

## Recursos

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Express Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)

---

## Preguntas

¿Tienes preguntas sobre cómo contribuir?

- **Discussions**: https://github.com/arosadoclud/Sotware-iglesias/discussions
- **Email**: arosadoclud@gmail.com

---

¡Gracias por contribuir! 🙏
