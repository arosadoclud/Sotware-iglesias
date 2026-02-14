# 🚀 Workflow de Desarrollo

## Branch por Defecto: main

Este proyecto usa **`main`** como branch por defecto en GitHub.

### Configuración Actual

- **Branch local**: `claude/zen-moser` (worktree de Claude)
- **Branch remoto principal**: `origin/main` ✅ (por defecto)
- **Push automático**: Todos los cambios van directo a `main`

### Comandos Rápidos

```bash
# Agregar cambios
git add .

# Commit
git commit -m "tu mensaje"

# Push automático a main
git push
```

### Notas Técnicas

El proyecto usa worktrees de Claude, por lo que el branch local mantiene el nombre del worktree,
pero todos los push van directamente al branch `main` del repositorio remoto.

---

**Última actualización**: Febrero 2026
