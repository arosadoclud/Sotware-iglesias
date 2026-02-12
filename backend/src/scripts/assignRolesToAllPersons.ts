import mongoose from 'mongoose';
import Person from '../models/Person.model';
import Role from '../models/Role.model';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/church-manager';

// Roles a excluir
const EXCLUDE = ['Mensaje', 'Grupo de Adoracion', 'Ministerio de las Calles'];

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Conectado a MongoDB');

  // Buscar todos los roles excepto los excluidos
  const dbRoles = await Role.find({ name: { $nin: EXCLUDE } });
  if (!dbRoles.length) {
    console.error('No hay roles válidos en la base de datos.');
    process.exit(1);
  }

  // Buscar todas las personas activas
  const persons = await Person.find({ status: 'ACTIVE' });
  if (!persons.length) {
    console.error('No hay personas activas.');
    process.exit(1);
  }

  for (const person of persons) {
    person.roles = dbRoles.map(r => ({ roleId: r._id, roleName: r.name }));
    await person.save();
    console.log(`Roles asignados a: ${person.fullName}`);
  }
  console.log('Todos los roles asignados a todas las personas activas (excepto los excluidos).');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
