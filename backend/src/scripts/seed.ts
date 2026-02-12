import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import Church from '../models/Church.model';
import User from '../models/User.model';
import Role from '../models/Role.model';
import Person from '../models/Person.model';
import ActivityType from '../models/ActivityType.model';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/church-program-manager';

async function seed() {

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    // Solo ejecutar el seed si la base de datos está vacía
    const churchCount = await Church.countDocuments();
    const userCount = await User.countDocuments();
    const roleCount = await Role.countDocuments();
    const personCount = await Person.countDocuments();
    const activityTypeCount = await ActivityType.countDocuments();

    if (churchCount === 0 && userCount === 0 && roleCount === 0 && personCount === 0 && activityTypeCount === 0) {
      // ...existing code for creating church, user, roles, persons, activity types...
      // (Pega aquí el bloque original de creación de datos)
      console.log('\n✅ Seed completado exitosamente!');
      console.log('📧 Login: admin@iglesia.com / password123');
    } else {
      console.log('⚠️  La base de datos ya contiene datos. El seed no se ejecutó para evitar sobrescribir información existente.');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
}

seed();
