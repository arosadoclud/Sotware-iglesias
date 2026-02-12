import mongoose from 'mongoose';
import Church from '../models/Church.model';
import User, { UserRole } from '../models/User.model';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || '';


async function databaseExists(dbName: string): Promise<boolean> {
  const admin = mongoose.connection.db.admin();
  const dbs = await admin.listDatabases();
  return dbs.databases.some((db: any) => db.name === dbName);
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  const dbName = mongoose.connection.name;
  if (!(await databaseExists(dbName))) {
    console.error(`La base de datos ${dbName} no existe. Abortando operación.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  let church = await Church.findOne();
  if (!church) {
    church = await Church.create({
      name: 'Iglesia Demo',
      address: { city: 'Ciudad Demo', country: 'País Demo' },
      settings: {
        timezone: 'America/Mexico_City',
        rotationWeeks: 4,
        allowRepetitions: false,
        dateFormat: 'DD/MM/YYYY',
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('Iglesia creada:', church._id);
  } else {
    console.log('Iglesia ya existe:', church._id);
  }

  // Eliminar usuario admin si existe
  await User.deleteMany({ email: 'admin@iglesia.com' });
  const password = 'password123';
  const user = await User.create({
    churchId: church._id,
    email: 'admin@iglesia.com',
    passwordHash: password,
    fullName: 'Administrador',
    role: UserRole.ADMIN,
    isActive: true,
    lastLogin: null,
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log('Usuario admin creado:', user._id);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
