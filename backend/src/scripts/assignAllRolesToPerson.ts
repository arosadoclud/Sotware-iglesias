import mongoose from 'mongoose';
import Person from '../models/Person.model';
import Role from '../models/Role.model';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/church-manager';

// Nombres de roles a asignar (ajusta según tus roles existentes)
const ROLES = [
  'Dirección',
  'Adoración',
  'Devocional',
  'Coro de Ofrendas',
  'Mensaje',
];

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Conectado a MongoDB');

  // Busca los roles en la base de datos
  const dbRoles = await Role.find({ name: { $in: ROLES } });
  if (dbRoles.length !== ROLES.length) {
    console.error('Faltan roles en la base de datos:', ROLES.filter(r => !dbRoles.find(dr => dr.name === r)));
    process.exit(1);
  }

  // Busca una persona activa (ajusta el filtro si quieres crear una nueva)
  let person = await Person.findOne({ status: 'ACTIVE' });
  if (!person) {
    console.error('No hay personas activas. Crea una persona primero.');
    process.exit(1);
  }

  // Asigna todos los roles a la persona
  person.roles = dbRoles.map(r => ({ roleId: r._id, roleName: r.name }));
  await person.save();
  console.log('Roles asignados correctamente a la persona:', person.fullName);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
