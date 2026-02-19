/**
 * Script para probar la creación de UN SOLO programa de limpieza
 * Esto nos ayuda a aislar el problema del batch y verificar si 
 * Program.create() realmente funciona.
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/church-program-manager')
  .then(async () => {
    console.log('✅ Conectado a MongoDB\n');

    // Importar el modelo
    const Program = require('../src/models/Program.model').default;
    const ActivityType = require('../src/models/ActivityType.model').default;
    const Person = require('../src/models/Person.model').default;
    const Church = require('../src/models/Church.model').default;

    try {
      // 1. Obtener la primera iglesia
      const church = await Church.findOne();
      if (!church) {
        console.log('❌ No hay iglesias en la base de datos');
        process.exit(1);
      }
      console.log('🏛️  Iglesia encontrada:', church.name, `(${church._id})`);

      // 2. Buscar actividad de limpieza
      const activity = await ActivityType.findOne({ 
        churchId: church._id,
        generationType: 'cleaning_groups'
      });
      
      if (!activity) {
        console.log('⚠️  No hay actividad de limpieza configurada');
        console.log('   Usando actividad genérica...\n');
        
        // Crear una actividad de prueba
        const testActivity = await ActivityType.create({
          churchId: church._id,
          name: 'TEST Limpieza Semanal',
          generationType: 'cleaning_groups',
          dayOfWeek: 6, // Sábado
          daysOfWeek: [6],
          defaultTime: '10:00',
          isActive: true
        });
        console.log('✅ Actividad de prueba creada:', testActivity.name);
      } else {
        console.log('🧹 Actividad de limpieza encontrada:', activity.name, `(${activity._id})\n`);
      }

      const activityToUse = activity || await ActivityType.findOne({ churchId: church._id, generationType: 'cleaning_groups' });

      // 3. Obtener algunos miembros activos
      const members = await Person.find({
        churchId: church._id,
        status: 'ACTIVE'
      }).limit(8).lean();

      if (members.length === 0) {
        console.log('❌ No hay personas activas en la iglesia');
        process.exit(1);
      }

      console.log(`👥 Miembros activos encontrados: ${members.length}`);
      console.log('   Primeros 3:', members.slice(0, 3).map(m => m.name).join(', '), '\n');

      // 4. Preparar datos del grupo
      const cleaningMembers = members.map(m => ({
        id: m._id,
        name: m.name,
        phone: m.phone || ''
      }));

      // 5. Crear el programa
      console.log('🔄 Intentando crear programa de limpieza...\n');
      
      const programData = {
        churchId: church._id,
        activityType: { 
          id: activityToUse._id, 
          name: activityToUse.name 
        },
        programDate: new Date('2026-03-01T12:00:00'),
        status: 'DRAFT',
        generationType: 'cleaning_groups',
        assignedGroupNumber: 1,
        totalGroups: 1,
        cleaningMembers: cleaningMembers,
        assignments: [],
        churchName: church.name || '',
        churchSub: church.subTitle || '',
        location: church.location || '',
        logoUrl: church.logoUrl || '',
        programTime: '10:00 AM',
        defaultTime: '10:00 AM',
        verse: 'Juan 3:16',
        verseText: 'Porque de tal manera amó Dios al mundo...',
        generatedBy: { 
          id: new mongoose.Types.ObjectId(), 
          name: 'Test Script' 
        },
        generatedAt: new Date(),
      };

      console.log('📋 Datos del programa:');
      console.log('   - Actividad:', programData.activityType.name);
      console.log('   - Fecha:', programData.programDate.toISOString());
      console.log('   - Grupo:', programData.assignedGroupNumber, 'de', programData.totalGroups);
      console.log('   - Miembros:', programData.cleaningMembers.length);
      console.log('   - GenerationType:', programData.generationType);
      console.log('');

      // Crear el programa
      const program = await Program.create(programData);
      
      console.log('✅ Program.create() completado exitosamente!');
      console.log('   ID retornado:', program._id.toString());
      console.log('   GenerationType:', program.generationType);
      console.log('   Grupo:', program.assignedGroupNumber, 'de', program.totalGroups);
      console.log('   Miembros en documento:', program.cleaningMembers?.length || 0);
      console.log('');

      // 6. VERIFICACIÓN INMEDIATA
      console.log('🔍 VERIFICACIÓN INMEDIATA:');
      const immediateCheck = await Program.findById(program._id);
      if (immediateCheck) {
        console.log('   ✅ Programa encontrado en DB inmediatamente después de create()');
        console.log('   - ID:', immediateCheck._id.toString());
        console.log('   - GenerationType:', immediateCheck.generationType);
        console.log('   - Miembros:', immediateCheck.cleaningMembers?.length || 0);
      } else {
        console.log('   ❌ NO ENCONTRADO - Este es el problema!');
      }
      console.log('');

      // 7. ESPERAR 2 SEGUNDOS Y VERIFICAR DE NUEVO
      console.log('⏱️  Esperando 2 segundos...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('🔍 VERIFICACIÓN DESPUÉS DE 2 SEGUNDOS:');
      const delayedCheck = await Program.findById(program._id);
      if (delayedCheck) {
        console.log('   ✅ Programa SIGUE existiendo');
        console.log('   - Miembros:', delayedCheck.cleaningMembers?.length || 0);
      } else {
        console.log('   ❌ Programa DESAPARECIÓ - ¡BUG CONFIRMADO!');
      }
      console.log('');

      // 8. VERIFICAR CONTEO TOTAL
      const totalCleaning = await Program.countDocuments({
        churchId: church._id,
        generationType: 'cleaning_groups'
      });
      console.log('📊 CONTEO TOTAL de programas de limpieza:', totalCleaning);
      console.log('');

      // 9. MOSTRAR TODOS LOS PROGRAMAS DE LIMPIEZA
      const allCleaning = await Program.find({
        churchId: church._id,
        generationType: 'cleaning_groups'
      }).lean();

      console.log('📋 Todos los programas de limpieza en DB:');
      if (allCleaning.length === 0) {
        console.log('   ⚠️  NINGUNO (¡El programa no persistió!)');
      } else {
        allCleaning.forEach((p, idx) => {
          console.log(`   ${idx + 1}. ${p.activityType?.name} - ${p.programDate?.toLocaleDateString()} - Grupo ${p.assignedGroupNumber} (${p.cleaningMembers?.length || 0} miembros)`);
        });
      }
      console.log('');

      // CONCLUSIÓN
      console.log('═══════════════════════════════════════════════════════');
      console.log('CONCLUSIÓN:');
      if (immediateCheck && delayedCheck && totalCleaning > 0) {
        console.log('✅ El programa SE CREÓ Y PERSISTIÓ correctamente');
        console.log('   El problema podría estar en el batch o en otra parte');
      } else if (immediateCheck && !delayedCheck) {
        console.log('⚠️  El programa se crea pero DESAPARECE después');
        console.log('   Posible causa: Hook o proceso que borra documentos');
      } else if (!immediateCheck) {
        console.log('❌ El programa NO SE CREA en absoluto');
        console.log('   Posible causa: Error silencioso en create() o validación');
      }
      console.log('═══════════════════════════════════════════════════════');

    } catch (error) {
      console.error('\n❌ ERROR durante la ejecución:');
      console.error('   Mensaje:', error.message);
      console.error('   Stack:', error.stack);
    } finally {
      await mongoose.connection.close();
      console.log('\n✅ Desconectado de MongoDB');
      process.exit(0);
    }
  })
  .catch((err) => {
    console.error('❌ Error al conectar a MongoDB:', err);
    process.exit(1);
  });
