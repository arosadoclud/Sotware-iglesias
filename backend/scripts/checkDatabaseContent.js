const mongoose = require('mongoose');

// Configuración de conexión
const MONGODB_URI = 'mongodb://localhost:27017/church-program-manager';

async function checkDatabase() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Listar todas las colecciones
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log('\n📁 Colecciones encontradas:');
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });

    // Verificar contenido de algunas colecciones importantes
    if (collections.find(c => c.name === 'activitytypes')) {
      const activityCount = await mongoose.connection.db.collection('activitytypes').countDocuments();
      console.log(`\n🎯 ActivityTypes: ${activityCount} documentos`);
      
      if (activityCount > 0) {
        const sample = await mongoose.connection.db.collection('activitytypes').findOne({});
        console.log('Ejemplo de ActivityType:');
        console.log(`  - ID: ${sample._id}`);
        console.log(`  - Nombre: ${sample.name}`);
        console.log(`  - Church ID: ${sample.churchId}`);
        console.log(`  - RoleConfig: ${sample.roleConfig?.length || 0} roles`);
      }
    }

    if (collections.find(c => c.name === 'persons')) {
      const personCount = await mongoose.connection.db.collection('persons').countDocuments();
      console.log(`\n👥 Persons: ${personCount} documentos`);
      
      const activeCount = await mongoose.connection.db.collection('persons').countDocuments({ 
        status: { $in: ['ACTIVE', 'LEADER'] } 
      });
      console.log(`    - Activos: ${activeCount}`);
    }

    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

checkDatabase();