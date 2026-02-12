import mongoose from 'mongoose';
import Program from '../models/Program.model';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/church-manager';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Conectado a MongoDB');

  // Ajusta estos valores según tu caso
  const activityTypeName = /joven|culto/i; // Regex para buscar la actividad
  const programDate = new Date(); // Hoy (ajusta si necesitas otra fecha)
  programDate.setHours(0, 0, 0, 0);

  // Busca el programa duplicado
  const program = await Program.findOne({ 'activityType.name': activityTypeName, programDate });
  if (!program) {
    console.log('No se encontró un programa duplicado para eliminar.');
    process.exit(0);
  }

  await Program.deleteOne({ _id: program._id });
  console.log('Programa duplicado eliminado:', program._id);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
