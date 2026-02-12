
import mongoose from 'mongoose';
import ActivityType from '../models/ActivityType.model';
import Role from '../models/Role.model';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/church-manager';

const ROLES = [
  { sectionName: 'Dirección', sectionOrder: 1, roleName: 'Dirección' },
  { sectionName: 'Adoración', sectionOrder: 2, roleName: 'Adoración' },
  { sectionName: 'Devocional', sectionOrder: 3, roleName: 'Devocional' },
  { sectionName: 'Coro de Ofrendas', sectionOrder: 4, roleName: 'Coro de Ofrendas' },
  { sectionName: 'Mensaje', sectionOrder: 5, roleName: 'Mensaje' },
];

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Conectado a MongoDB');

  // Busca el ActivityType que quieres actualizar (ajusta el filtro si es necesario)
  const activity = await ActivityType.findOne({ name: /joven|culto/i });
  if (!activity) {
    console.error('No se encontró la actividad.');
    process.exit(1);
  }


  // Busca los roles en la colección de roles
  const dbRoles = await Role.find({ name: { $in: ROLES.map(r => r.roleName) }, churchId: activity.churchId });
  const roleMap = Object.fromEntries(dbRoles.map(r => [r.name, r]));

  // Crear los roles que faltan, usando el mismo churchId de la actividad
  for (const r of ROLES) {
    if (!roleMap[r.roleName]) {
      const newRole = await Role.create({ name: r.roleName, churchId: activity.churchId });
      roleMap[r.roleName] = newRole;
      console.log(`Rol creado: ${r.roleName}`);
    }
  }

  // Construye el nuevo roleConfig
  activity.roleConfig = ROLES.map(r => ({
    sectionName: r.sectionName,
    sectionOrder: r.sectionOrder,
    role: {
      id: roleMap[r.roleName]._id,
      name: r.roleName,
    },
    peopleNeeded: 1,
    isRequired: true,
  }));

  await activity.save();
  console.log('roleConfig actualizado correctamente.');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
