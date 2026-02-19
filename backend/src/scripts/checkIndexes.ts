import mongoose from 'mongoose';
import Person from '../models/Person.model';
import Role from '../models/Role.model';
import Program from '../models/Program.model';
import Church from '../models/Church.model';
import ActivityType from '../models/ActivityType.model';
import PersonStatus from '../models/PersonStatus.model';
import dotenv from 'dotenv';

dotenv.config();

const checkAndCreateIndexes = async () => {
  try {
    console.log('🔍 Conectando a MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/church-program-manager';
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado\n');

    console.log('📊 Verificando índices...\n');

    // Person
    console.log('👤 Person:');
    const personIndexes = await Person.collection.getIndexes();
    console.log(`   Índices existentes: ${Object.keys(personIndexes).join(', ')}`);
    await Person.ensureIndexes();
    console.log('   ✓ Índices verificados\n');

    // Role
    console.log('🎭 Role:');
    const roleIndexes = await Role.collection.getIndexes();
    console.log(`   Índices existentes: ${Object.keys(roleIndexes).join(', ')}`);
    await Role.ensureIndexes();
    console.log('   ✓ Índices verificados\n');

    // Program
    console.log('📅 Program:');
    const programIndexes = await Program.collection.getIndexes();
    console.log(`   Índices existentes: ${Object.keys(programIndexes).join(', ')}`);
    await Program.ensureIndexes();
    console.log('   ✓ Índices verificados\n');

    // Church
    console.log('⛪ Church:');
    const churchIndexes = await Church.collection.getIndexes();
    console.log(`   Índices existentes: ${Object.keys(churchIndexes).join(', ')}`);
    await Church.ensureIndexes();
    console.log('   ✓ Índices verificados\n');

    // ActivityType
    console.log('🎪 ActivityType:');
    const activityIndexes = await ActivityType.collection.getIndexes();
    console.log(`   Índices existentes: ${Object.keys(activityIndexes).join(', ')}`);
    await ActivityType.ensureIndexes();
    console.log('   ✓ Índices verificados\n');

    // PersonStatus
    console.log('📋 PersonStatus:');
    const statusIndexes = await PersonStatus.collection.getIndexes();
    console.log(`   Índices existentes: ${Object.keys(statusIndexes).join(', ')}`);
    await PersonStatus.ensureIndexes();
    console.log('   ✓ Índices verificados\n');

    console.log('✅ Todos los índices verificados y creados exitosamente');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
    process.exit(0);
  }
};

checkAndCreateIndexes();
