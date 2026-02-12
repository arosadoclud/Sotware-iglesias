import mongoose from 'mongoose';
import Program from '../models/Program.model';
import Person from '../models/Person.model';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/church-manager';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Conectado a MongoDB');

  // Obtener todos los IDs válidos de personas y roles
  const validPersonIds = new Set((await Person.find({}, '_id')).map(p => p._id.toString()));

  const programs = await Program.find({});
  let totalUpdated = 0;
  for (const program of programs) {
    const originalCount = program.assignments.length;
    // Filtrar asignaciones huérfanas
    program.assignments = program.assignments.filter(a => {
      const personOk = a.person && validPersonIds.has(a.person.id.toString());
      // Permitimos que roleName sea texto, así que solo validamos persona
      return personOk;
    });
    if (program.assignments.length !== originalCount) {
      await program.save();
      totalUpdated++;
      console.log(`Programa ${program._id} limpiado (${originalCount} → ${program.assignments.length})`);
    }
  }
  console.log(`Limpieza completada. Programas actualizados: ${totalUpdated}`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
