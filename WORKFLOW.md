# 🚀 Workflow de Desarrollo

## Push Automático Configurado

Este proyecto está configurado para subir automáticamente los cambios al branch `main` en GitHub.

### Configuración Actual

- **Branch local**: `claude/zen-moser` (worktree)
- **Branch remoto**: `origin/main`
- **Push default**: Configurado para ir automáticamente a `main`

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
