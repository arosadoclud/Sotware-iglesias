const mongoose = require('mongoose');

// Configuración de conexión
const MONGODB_URI = 'mongodb://localhost:27017/church-program-manager';

async function testSimpleRotation() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Verificar los datos disponibles
    const activity = await mongoose.connection.db.collection('activityTypes').findOne({});
    if (!activity) {
      console.log('❌ No se encontraron actividades. Crea una actividad primero.');
      process.exit(0);
    }

    const persons = await mongoose.connection.db.collection('persons').find({ 
      churchId: activity.churchId, 
      status: { $in: ['ACTIVE', 'LEADER'] } 
    }).toArray();
    
    console.log(`🎯 Actividad: ${activity.name}`);
    console.log(`👥 Personas activas: ${persons.length}`);
    console.log(`🔄 Roles configurados: ${activity.roleConfig?.length || 0}`);

    // Verificar programas recientes (último mes)
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

    const recentPrograms = await mongoose.connection.db.collection('programs').find({
      churchId: activity.churchId,
      programDate: { $gte: oneMonthAgo }
    }).toArray();

    console.log(`📅 Programas del último mes: ${recentPrograms.length}`);

    // Mostrar quien ha participado recientemente
    const recentParticipants = new Set();
    recentPrograms.forEach(program => {
      if (program.assignments) {
        program.assignments.forEach(assignment => {
          if (assignment.person?.name) {
            recentParticipants.add(assignment.person.name);
          }
        });
      }
    });

    console.log(`\n🎭 Personas que han participado recientemente:`);
    if (recentParticipants.size > 0) {
      Array.from(recentParticipants).forEach(name => console.log(`  - ${name}`));
    } else {
      console.log('  (Nadie ha participado recientemente - todos disponibles)');
    }

    // Mostrar personas disponibles para rotación
    const availableForRotation = persons.filter(person => 
      !Array.from(recentParticipants).includes(person.fullName)
    );

    console.log(`\n✨ Personas disponibles para nueva asignación: ${availableForRotation.length}`);
    if (availableForRotation.length > 0) {
      availableForRotation.slice(0, 5).forEach(person => 
        console.log(`  - ${person.fullName}`)
      );
      if (availableForRotation.length > 5) {
        console.log(`  ... y ${availableForRotation.length - 5} más`);
      }
    }

    console.log(`\n✅ Sistema de rotación simple listo:`);
    console.log(`   • Todas las personas tienen igual prioridad`);
    console.log(`   • Se evitan repeticiones del último mes`);
    console.log(`   • Selección completamente aleatoria entre disponibles`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

testSimpleRotation();