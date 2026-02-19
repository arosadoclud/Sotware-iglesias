require('dotenv').config();
const mongoose = require('mongoose');

async function verifyCleaningPrograms() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    const db = mongoose.connection.db;
    
    // Buscar programas de limpieza
    const cleaningPrograms = await db.collection('programs').find({
      generationType: 'cleaning_groups'
    }).sort({ programDate: 1 }).toArray();
    
    console.log('═════════════════════════════════════════════════════════════');
    console.log(`   📊 VERIFICACIÓN DE PROGRAMAS DE LIMPIEZA                  `);
    console.log('═════════════════════════════════════════════════════════════\n');
    console.log(`Total de programas de limpieza encontrados: ${cleaningPrograms.length}\n`);
    
    if (cleaningPrograms.length === 0) {
      console.log('⚠️  No hay programas de limpieza en la base de datos\n');
      await mongoose.disconnect();
      return;
    }
    
    let programsWithMembers = 0;
    let programsWithoutMembers = 0;
    const problemPrograms = [];
    
    cleaningPrograms.forEach((prog, idx) => {
      const dateStr = new Date(prog.programDate).toLocaleDateString('es-DO', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
      
      const memberCount = prog.cleaningMembers?.length || 0;
      const hasMembers = memberCount > 0;
      
      if (hasMembers) {
        programsWithMembers++;
      } else {
        programsWithoutMembers++;
        problemPrograms.push({
          id: prog._id,
          date: dateStr,
          status: prog.status,
          groupNumber: prog.assignedGroupNumber
        });
      }
      
      const statusIcon = hasMembers ? '✅' : '❌';
      const statusText = hasMembers ? `${memberCount} miembros` : 'SIN MIEMBROS';
      
      console.log(`${statusIcon} ${dateStr} - Grupo ${prog.assignedGroupNumber} - ${statusText} - Estado: ${prog.status}`);
    });
    
    console.log('\n═════════════════════════════════════════════════════════════');
    console.log('   📈 RESUMEN                                                 ');
    console.log('═════════════════════════════════════════════════════════════\n');
    console.log(`✅ Programas con miembros asignados: ${programsWithMembers}`);
    console.log(`❌ Programas SIN miembros asignados: ${programsWithoutMembers}\n`);
    
    if (problemPrograms.length > 0) {
      console.log('⚠️  PROGRAMAS CON PROBLEMAS:\n');
      problemPrograms.forEach(p => {
        console.log(`   - ID: ${p.id}`);
        console.log(`     Fecha: ${p.date}`);
        console.log(`     Grupo: ${p.groupNumber}`);
        console.log(`     Estado: ${p.status}\n`);
      });
      
      console.log('💡 RECOMENDACIÓN:');
      console.log('   Los programas sin miembros deben ser eliminados y regenerados.');
      console.log('   Puedes usar el endpoint DELETE /programs para eliminarlos\n');
    } else {
      console.log('🎉 ¡Todos los programas de limpieza tienen miembros asignados!\n');
    }
    
    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyCleaningPrograms();
