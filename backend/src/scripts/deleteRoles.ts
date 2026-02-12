import mongoose from 'mongoose';
import Role from '../models/Role.model';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/church-manager';

const ROLES_TO_DELETE = [
  'Culto General',
  'Culto de Damas',
  'Culto de Jovenes',
];

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Conectado a MongoDB');

  const result = await Role.deleteMany({ name: { $in: ROLES_TO_DELETE } });
  console.log(`Roles eliminados: ${result.deletedCount}`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
