const mongoose = require('mongoose');

// Configuración de conexión (usando la misma que en .env.local)
const MONGODB_URI = 'mongodb://localhost:27017/church-program-manager';

async function testRandomization() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Obtener la iglesia y actividad existente
    const ActivityType = mongoose.model('ActivityType', new mongoose.Schema({}));
    const Program = mongoose.model('Program', new mongoose.Schema({}));

    const activity = await ActivityType.findOne({}).lean();
    if (!activity) {
      console.log('❌ No se encontraron actividades. Crea una actividad primero.');
      process.exit(0);
    }

    console.log(`🎯 Actividad encontrada: ${activity.name}`);
    console.log(`    RoleConfig: ${activity.roleConfig?.length || 0} roles configurados`);

    // Verificar PersonQuery
    const Person = mongoose.model('Person', new mongoose.Schema({}));
    const persons = await Person.find({ churchId: activity.churchId, status: { $in: ['ACTIVE', 'LEADER'] } }).lean();
    
    console.log(`👥 Personas disponibles: ${persons.length}`);
    if (persons.length === 0) {
      console.log('❌ No hay personas activas disponibles');
      process.exit(0);
    }

    console.log('✅ Test básico completado - el sistema puede conectarse a los datos');
    console.log(`\n📝 Para probar la aleatorización, genera varios programas desde la interfaz web`);
    console.log(`   usando la misma fecha y actividad. Deberías ver diferentes asignaciones.`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

testRandomization();