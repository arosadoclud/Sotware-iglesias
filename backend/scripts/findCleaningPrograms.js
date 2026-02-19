require('dotenv').config();
const mongoose = require('mongoose');

async function findCleaningPrograms() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    const db = mongoose.connection.db;
    
    // Buscar programas que contengan "limpieza" en el nombre
    const programsWithCleaning = await db.collection('programs').find({
      'activityType.name': { $regex: /limpieza/i }
    }).sort({ programDate: -1 }).limit(10).toArray();
    
    console.log('═════════════════════════════════════════════════════════════');
    console.log(`   🔍 BÚSQUEDA DE PROGRAMAS DE LIMPIEZA                      `);
    console.log('═════════════════════════════════════════════════════════════\n');
    console.log(`Programas encontrados con "limpieza" en el nombre: ${programsWithCleaning.length}\n`);
    
    if (programsWithCleaning.length === 0) {
      console.log('⚠️  No se encontraron programas de limpieza\n');
    } else {
      programsWithCleaning.forEach((prog, idx) => {
        const dateStr = new Date(prog.programDate).toLocaleDateString('es-DO', { 
          weekday: 'short', 
          day: 'numeric', 
          month: 'short',
          year: 'numeric'
        });
        
        console.log(`\n📋 Programa ${idx + 1}:`);
        console.log(`   ID: ${prog._id}`);
        console.log(`   Actividad: ${prog.activityType?.name}`);
        console.log(`   Fecha: ${dateStr}`);
        console.log(`   Estado: ${prog.status}`);
        console.log(`   generationType: ${prog.generationType || '❌ NO DEFINIDO'}`);
        console.log(`   assignedGroupNumber: ${prog.assignedGroupNumber || '❌ NO DEFINIDO'}`);
        console.log(`   totalGroups: ${prog.totalGroups || '❌ NO DEFINIDO'}`);
        console.log(`   cleaningMembers: ${prog.cleaningMembers?.length || 0} personas`);
        console.log(`   assignments: ${prog.assignments?.length || 0} asignaciones`);
        
        if (prog.cleaningMembers && prog.cleaningMembers.length > 0) {
          console.log('\n   👥 Miembros del grupo:');
          prog.cleaningMembers.slice(0, 3).forEach((m, i) => {
            console.log(`      ${i + 1}. ${m.name}`);
          });
          if (prog.cleaningMembers.length > 3) {
            console.log(`      ... y ${prog.cleaningMembers.length - 3} más`);
          }
        }
      });
      
      console.log('\n═════════════════════════════════════════════════════════════');
      console.log('   📊 ESTADÍSTICAS                                           ');
      console.log('═════════════════════════════════════════════════════════════\n');
      
      const withGenerationType = programsWithCleaning.filter(p => p.generationType === 'cleaning_groups').length;
      const withMembers = programsWithCleaning.filter(p => p.cleaningMembers && p.cleaningMembers.length > 0).length;
      const withGroupNumber = programsWithCleaning.filter(p => p.assignedGroupNumber).length;
      
      console.log(`Programas con generationType correcto: ${withGenerationType}/${programsWithCleaning.length}`);
      console.log(`Programas con cleaningMembers: ${withMembers}/${programsWithCleaning.length}`);
      console.log(`Programas con assignedGroupNumber: ${withGroupNumber}/${programsWithCleaning.length}\n`);
    }
    
    // También buscar todos los programas recientes para contexto
    const totalPrograms = await db.collection('programs').countDocuments();
    const recentPrograms = await db.collection('programs').find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    console.log('═════════════════════════════════════════════════════════════');
    console.log('   📈 CONTEXTO GENERAL                                        ');
    console.log('═════════════════════════════════════════════════════════════\n');
    console.log(`Total de programas en la base de datos: ${totalPrograms}\n`);
    
    if (recentPrograms.length > 0) {
      console.log('Últimos 5 programas creados:\n');
      recentPrograms.forEach((prog, idx) => {
        const dateStr = new Date(prog.programDate).toLocaleDateString('es-DO');
        console.log(`${idx + 1}. ${prog.activityType?.name} - ${dateStr} - ${prog.status}`);
      });
    }
    
    console.log('');
    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

findCleaningPrograms();
