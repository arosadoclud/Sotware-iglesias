import mongoose from 'mongoose';
import envConfig from '../config/env';

async function listDatabases() {
  try {
    await mongoose.connect(envConfig.mongoUri);
    console.log('✅ Conectado a MongoDB de PRODUCCIÓN\n');

    const admin = mongoose.connection.db.admin();
    const { databases } = await admin.listDatabases();

    console.log('📊 BASES DE DATOS EN EL CLUSTER:');
    console.log('═'.repeat(50));
    
    for (const db of databases) {
      console.log(`\n📁 Base de datos: ${db.name}`);
      console.log(`   Tamaño: ${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   Vacía: ${db.empty ? 'Sí' : 'No'}`);
    }

    console.log('\n' + '═'.repeat(50));
    console.log(`\n🔍 Base de datos actual en uso:`);
    console.log(`   Nombre: ${mongoose.connection.db.databaseName}`);
    console.log(`\n💡 Asegúrate de que Render use la base de datos correcta en MONGODB_URI`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

listDatabases();
