# Sistema de Superusuario

## ¿Qué es un Superusuario?

El **superusuario** es un usuario especial con privilegios absolutos sobre la gestión de permisos. A diferencia de un administrador regular, el superusuario:

- ✅ Puede gestionar permisos de **todos** los usuarios
- ✅ Puede asignar permisos personalizados
- ✅ Puede modificar configuraciones críticas del sistema
- ✅ Tiene acceso a **todas** las funcionalidades
- ❌ **NO** puede ser modificado por otros administradores
- ❌ Solo otro superusuario puede cambiar sus permisos

## Diferencias entre Roles

### SUPER_ADMIN (Rol)
- Tiene el rol más alto en la jerarquía
- Acceso a todas las funcionalidades por defecto
- Puede ser modificado por un superusuario

### SuperUsuario (Flag especial)
- Flag adicional `isSuperUser: true`
- Gestiona permisos de otros usuarios (incluyendo admins)
- Solo 1-2 por iglesia (recomendado)
- No puede ser modificado excepto por otro superusuario

## Cómo Crear un Superusuario

### Método 1: Script de Terminal (Recomendado)

```bash
# Navegar a la carpeta backend
cd backend

# Ejecutar el script con el email del usuario
npx ts-node scripts/setSuperUser.ts admin@iglesia.com
```

### Método 2: MongoDB Directo

```javascript
// Conectar a MongoDB y ejecutar:
db.users.updateOne(
  { email: "admin@iglesia.com" },
  { $set: { isSuperUser: true } }
)
```

### Método 3: Mongoose Shell

```bash
# En la terminal
mongosh

# Dentro de mongosh
use tu_base_de_datos
db.users.updateOne(
  { email: "admin@iglesia.com" },
  { $set: { isSuperUser: true } }
)
```

## Verificar Superusuario

Para verificar si un usuario es superusuario:

```bash
# MongoDB
db.users.findOne({ email: "admin@iglesia.com" }, { email: 1, fullName: 1, role: 1, isSuperUser: 1 })
```

## Casos de Uso

### Escenario 1: Pastor Principal
El pastor principal es designado como superusuario para gestionar permisos del equipo administrativo sin que otros admins puedan modificar su configuración.

### Escenario 2: Administrador de Sistemas
Un administrador técnico es designado como superusuario para controlar accesos críticos del sistema mientras permite que otros admins gestionen operaciones diarias.

### Escenario 3: Multi-sede
En iglesias con múltiples sedes, el superusuario a nivel central gestiona permisos de administradores de cada sede.

## Seguridad

⚠️ **IMPORTANTE**: 
- Solo designar 1-2 superusuarios por iglesia
- Proteger credenciales de superusuarios con contraseñas fuertes
- Revisar regularmente la lista de superusuarios
- No compartir credenciales de superusuario

## Permisos Especiales

Los superusuarios tienen acceso exclusivo a:

1. **Gestión de Permisos**
   - Asignar permisos personalizados
   - Modificar permisos de administradores
   - Ver historial de cambios de permisos

2. **Configuración de Usuarios**
   - Crear/editar/eliminar usuarios
   - Cambiar roles de usuarios
   - Activar/desactivar cuentas

3. **Auditoría Completa**
   - Ver logs de todos los usuarios
   - Exportar registros de auditoría
   - Monitorear actividad del sistema

## Preguntas Frecuentes

**P: ¿Puede un admin regular ver quién es superusuario?**
R: No, el flag de superusuario no es visible en la interfaz para usuarios regulares.

**P: ¿Qué pasa si no hay superusuarios?**
R: Los admins pueden gestionar usuarios básicamente, pero no podrán modificar permisos personalizados.

**P: ¿Puedo tener múltiples superusuarios?**
R: Sí, pero se recomienda limitar a 1-2 por iglesia por seguridad.

**P: ¿Cómo quito el flag de superusuario?**
R: Ejecuta el script con flag `false` o actualiza directamente en MongoDB:
```bash
db.users.updateOne(
  { email: "admin@iglesia.com" },
  { $set: { isSuperUser: false } }
)
```

## Soporte

Para más información o problemas con el sistema de superusuarios, contactar al equipo de desarrollo.
