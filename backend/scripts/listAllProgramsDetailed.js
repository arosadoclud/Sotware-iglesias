require('dotenv').config();
const mongoose = require('mongoose');

async function listAllPrograms() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    const db = mongoose.connection.db;
    
    // Buscar TODOS los programas, sin filtro
    const allPrograms = await db.collection('programs')
      .find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();
    
    console.log('═════════════════════════════════════════════════════════════');
    console.log(`   📊 TODOS LOS PROGRAMAS EN LA BASE DE DATOS                `);
    console.log('═════════════════════════════════════════════════════════════\n');
    console.log(`Total de programas encontrados: ${allPrograms.length}\n`);
    
    if (allPrograms.length === 0) {
      console.log('⚠️  La base de datos está VACÍA\n');
    } else {
      allPrograms.forEach((prog, idx) => {
        const dateStr = new Date(prog.programDate).toLocaleDateString('es-DO', { 
          weekday: 'short', 
          day: 'numeric', 
          month: 'short',
          year: 'numeric'
        });
        
        const createdStr = prog.createdAt 
          ? new Date(prog.createdAt).toLocaleString('es-DO')
          : 'NO REGISTRADO';
        
        console.log(`\n${'═'.repeat(65)}`);
        console.log(`📋 PROGRAMA ${idx + 1}:`);
        console.log(`${'─'.repeat(65)}`);
        console.log(`   ID: ${prog._id}`);
        console.log(`   Actividad: ${prog.activityType?.name || 'NO DEFINIDO'}`);
        console.log(`   Fecha programa: ${dateStr}`);
        console.log(`   Estado: ${prog.status}`);
        console.log(`   Creado: ${createdStr}`);
        console.log(`   churchId: ${prog.churchId || '❌ NO DEFINIDO'}`);
        console.log(`\n   CAMPOS CRÍTICOS:`);
        console.log(`   ├─ generationType: ${prog.generationType || '❌ NO DEFINIDO (debería ser cleaning_groups)'}`);
        console.log(`   ├─ assignedGroupNumber: ${prog.assignedGroupNumber || '❌ NO DEFINIDO'}`);
        console.log(`   ├─ totalGroups: ${prog.totalGroups || '❌ NO DEFINIDO'}`);
        console.log(`   ├─ cleaningMembers: ${prog.cleaningMembers?.length || 0} personas`);
        console.log(`   └─ assignments: ${prog.assignments?.length || 0} asignaciones`);
        
        if (prog.cleaningMembers && prog.cleaningMembers.length > 0) {
          console.log(`\n   👥 CLEANING MEMBERS (primeros 5):`);
          prog.cleaningMembers.slice(0, 5).forEach((m, i) => {
            console.log(`      ${i + 1}. ${m.name || 'SIN NOMBRE'} ${m.phone ? `(${m.phone})` : ''}`);
            if (i === 0) {
              // Mostrar estructura del primer miembro
              console.log(`         Estructura: id=${m.id ? '✅' : '❌'}, name=${m.name ? '✅' : '❌'}, phone=${m.phone ? '✅' : '❌'}`);
            }
          });
          if (prog.cleaningMembers.length > 5) {
            console.log(`      ... y ${prog.cleaningMembers.length - 5} más`);
          }
        } else {
          console.log(`\n   ⚠️  SIN CLEANING MEMBERS (array vacío o undefined)`);
        }
        
        if (prog.assignments && prog.assignments.length > 0) {
          console.log(`\n   📝 ASSIGNMENTS (primeros 3):`);
          prog.assignments.slice(0, 3).forEach((a, i) => {
            console.log(`      ${i + 1}. ${a.roleName || 'Sin rol'} → ${a.person?.name || 'Sin asignar'}`);
          });
        }
      });
    }
    
    console.log('\n═════════════════════════════════════════════════════════════');
    console.log('   📈 RESUMEN POR TIPO                                       ');
    console.log('═════════════════════════════════════════════════════════════\n');
    
    const byType = {};
    allPrograms.forEach(p => {
      const type = p.generationType || 'standard';
      byType[type] = (byType[type] || 0) + 1;
    });
    
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} programa(s)`);
    });
    
    const withMembers = allPrograms.filter(p => p.cleaningMembers && p.cleaningMembers.length > 0).length;
    const withoutMembers = allPrograms.filter(p => 
      (p.generationType === 'cleaning_groups' || p.activityType?.name?.toLowerCase().includes('limpieza')) &&
      (!p.cleaningMembers || p.cleaningMembers.length === 0)
    ).length;
    
    console.log(`\n   ✅ Con cleaningMembers: ${withMembers}`);
    console.log(`   ❌ Sin cleaningMembers (limpieza): ${withoutMembers}\n`);
    
    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

listAllPrograms();
