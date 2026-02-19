/**
 * Test rápido de creación de programa de limpieza
 * Sin dependencias de modelos TypeScript
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/church-program-manager';

console.log('🔌 Conectando a MongoDB...');
console.log('   URI:', MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@'));

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Conectado a MongoDB\n');

    try {
      // Usar el modelo Program directamente desde la conexión
      const Program = mongoose.connection.collection('programs');
      const ActivityType = mongoose.connection.collection('activitytypes');
      const Church = mongoose.connection.collection('churches');
      const Person = mongoose.connection.collection('persons');

      // 1. Buscar iglesia
      const church = await Church.findOne();
      if (!church) {
        console.log('❌ No hay iglesias en la base de datos');
        process.exit(1);
      }
      console.log('🏛️  Iglesia:', church.name, `(${church._id})`);

      // 2. Buscar actividad de limpieza
      const activity = await ActivityType.findOne({ 
        churchId: church._id,
        generationType: 'cleaning_groups'
      });
      
      if (!activity) {
        console.log('❌ No hay actividad de limpieza configurada');
        process.exit(1);
      }
      console.log('🧹 Actividad:', activity.name, `(${activity._id})\n`);

      // 3. Buscar miembros activos
      const members = await Person.find({
        churchId: church._id,
        status: 'ACTIVE'
      }).limit(8).toArray();

      if (members.length === 0) {
        console.log('❌ No hay personas activas');
        process.exit(1);
      }

      console.log(`👥 Miembros encontrados: ${members.length}`);
      console.log('   Primeros 3:', members.slice(0, 3).map(m => m.name).join(', '), '\n');

      // 4. Preparar datos
      const cleaningMembers = members.map(m => ({
        id: m._id,
        name: m.name,
        phone: m.phone || ''
      }));

      const programData = {
        _id: new mongoose.Types.ObjectId(),
        churchId: church._id,
        activityType: { 
          id: activity._id, 
          name: activity.name 
        },
        programDate: new Date('2026-03-05T12:00:00'),
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
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('📋 CREANDO PROGRAMA:');
      console.log('   ID:', programData._id.toString());
      console.log('   Actividad:', programData.activityType.name);
      console.log('   Fecha:', programData.programDate.toISOString());
      console.log('   Grupo:', programData.assignedGroupNumber, '/', programData.totalGroups);
      console.log('   Miembros:', programData.cleaningMembers.length);
      console.log('   GenerationType:', programData.generationType);
      console.log('');

      // 5. INSERTAR documento directamente
      const insertResult = await Program.insertOne(programData);
      console.log('✅ insertOne() completado');
      console.log('   Acknowledged:', insertResult.acknowledged);
      console.log('   InsertedId:', insertResult.insertedId.toString());
      console.log('');

      // 6. VERIFICACIÓN INMEDIATA
      console.log('🔍 VERIFICACIÓN INMEDIATA:');
      const immediateCheck = await Program.findOne({ _id: programData._id });
      if (immediateCheck) {
        console.log('   ✅ Programa encontrado en DB');
        console.log('   - GenerationType:', immediateCheck.generationType);
        console.log('   - Grupo:', immediateCheck.assignedGroupNumber, '/', immediateCheck.totalGroups);
        console.log('   - Miembros:', immediateCheck.cleaningMembers?.length || 0);
        if (immediateCheck.cleaningMembers && immediateCheck.cleaningMembers.length > 0) {
          console.log('   - Primer miembro:', immediateCheck.cleaningMembers[0].name);
        }
      } else {
        console.log('   ❌ NO ENCONTRADO - ¡BUG CRÍTICO!');
      }
      console.log('');

      // 7. ESPERAR 2 SEGUNDOS
      console.log('⏱️  Esperando 2 segundos...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('🔍 VERIFICACIÓN DESPUÉS DE 2 SEGUNDOS:');
      const delayedCheck = await Program.findOne({ _id: programData._id });
      if (delayedCheck) {
        console.log('   ✅ Programa SIGUE en DB');
        console.log('   - Miembros:', delayedCheck.cleaningMembers?.length || 0);
      } else {
        console.log('   ❌ Programa DESAPARECIÓ - Algo lo está borrando');
      }
      console.log('');

      // 8. CONTEO TOTAL
      const totalCleaning = await Program.countDocuments({
        churchId: church._id,
        generationType: 'cleaning_groups'
      });
      console.log('📊 TOTAL de programas de limpieza en DB:', totalCleaning);
      console.log('');

      // 9. LISTAR TODOS
      const allCleaning = await Program.find({
        churchId: church._id,
        generationType: 'cleaning_groups'
      }).toArray();

      console.log('📋 TODOS los programas de limpieza:');
      if (allCleaning.length === 0) {
        console.log('   ⚠️  NINGUNO');
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
        console.log('✅ FUNCIONA CORRECTAMENTE');
        console.log('   El programa se creó y persistió');
      } else if (immediateCheck && !delayedCheck) {
        console.log('⚠️  PROBLEMA: El programa se crea pero DESAPARECE');
        console.log('   Posible causa: Hook o proceso que borra documentos');
      } else if (!immediateCheck) {
        console.log('❌ PROBLEMA: El programa NO SE CREA');
        console.log('   Posible causa: Error en inserción o validación');
      } else if (totalCleaning === 0) {
        console.log('❌ PROBLEMA: Conteo es cero pero verificación dice que existe');
        console.log('   Posible causa: Filtros incorrectos o problema de índices');
      }
      console.log('═══════════════════════════════════════════════════════');

    } catch (error) {
      console.error('\n❌ ERROR:');
      console.error('   Mensaje:', error.message);
      console.error('   Stack:', error.stack);
    } finally {
      await mongoose.connection.close();
      console.log('\n✅ Desconectado');
      process.exit(0);
    }
  })
  .catch((err) => {
    console.error('❌ Error de conexión:', err.message);
    process.exit(1);
  });
