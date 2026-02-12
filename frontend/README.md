# Church Program Manager - Frontend

Sistema de gestión de programas para iglesias - Interfaz de usuario

## Stack Tecnológico

- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router DOM
- React Query (TanStack Query)
- Zustand (State Management)
- React Hook Form + Zod
- Axios

## Instalación

```bash
npm install
```

## Configuración

Crear archivo `.env`:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

## Desarrollo

```bash
npm run dev
```

El frontend estará disponible en: http://localhost:5173

## Compilar

```bash
npm run build
```

## Características

- ✅ Autenticación con JWT
- ✅ Dashboard con estadísticas
- ✅ Gestión de personas
- ✅ Gestión de actividades
- ✅ Generación de programas
- ✅ Calendario
- ✅ Plantillas de cartas
- ✅ Configuración

## Estructura

```
src/
├── components/       # Componentes reutilizables
│   └── layout/       # Layouts (Auth, Dashboard)
├── pages/            # Páginas de la aplicación
├── lib/              # Configuración (API, utils)
├── store/            # Estado global (Zustand)
├── App.tsx           # Componente principal
└── main.tsx          # Punto de entrada
```
