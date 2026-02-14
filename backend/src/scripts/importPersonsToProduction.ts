import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import envConfig from '../config/env';
import Person from '../models/Person.model';
import Church from '../models/Church.model';

async function importPersonsToProduction() {
  try {
    // Leer archivo exportado
    const exportPath = path.join(__dirname, 'persons-export.json');
    
    if (!fs.existsSync(exportPath)) {
      console.log('❌ No se encontró el archivo de personas');
      console.log('   Ejecuta primero: npx ts-node src/scripts/exportPersons.ts');
      process.exit(1);
    }

    const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));
    console.log('✅ Archivo de personas cargado');
    console.log(`📅 Exportado desde: ${exportData.sourceChurch}`);
    console.log(`🕒 Fecha: ${exportData.exportedAt}`);
    console.log(`👥 Personas a importar: ${exportData.count}`);

    // Conectar a producción
    await mongoose.connect(envConfig.mongoUri);
    console.log('\n✅ Conectado a MongoDB de PRODUCCIÓN');

    // Obtener la iglesia de producción
    const prodChurch = await Church.findOne();
    if (!prodChurch) {
      console.log('❌ No se encontró ninguna iglesia en producción');
      process.exit(1);
    }

    console.log(`✅ Iglesia de producción: ${prodChurch.name}`);

    // ═══════════════════════════════════════════════════════════════
    // IMPORTAR PERSONAS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n👥 Importando Personas...');
    let personsCreated = 0;
    let personsSkipped = 0;
    let personsUpdated = 0;

    for (const personData of exportData.persons) {
      try {
        // Buscar si ya existe por email o nombre completo
        const exists = await Person.findOne({
          $or: [
            { email: personData.email, churchId: prodChurch._id },
            { 
              firstName: personData.firstName, 
              lastName: personData.lastName,
              churchId: prodChurch._id
            }
          ]
        });

        if (!exists) {
          // Crear nueva persona
          await Person.create({
            ...personData,
            churchId: prodChurch._id
          });
          console.log(`   ✓ ${personData.firstName} ${personData.lastName}`);
          personsCreated++;
        } else {
          console.log(`   ⊙ ${personData.firstName} ${personData.lastName} (ya existe)`);
          personsSkipped++;
        }
      } catch (error: any) {
        console.log(`   ✗ Error con ${personData.firstName} ${personData.lastName}: ${error.message}`);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // RESUMEN FINAL
    // ═══════════════════════════════════════════════════════════════
    console.log('\n' + '='.repeat(60));
    console.log('✅ IMPORTACIÓN DE PERSONAS COMPLETADA');
    console.log('='.repeat(60));
    console.log('\n📊 Resumen:');
    console.log(`   ✓ Creadas: ${personsCreated}`);
    console.log(`   ⊙ Ya existían: ${personsSkipped}`);
    console.log(`   👥 Total en BD: ${await Person.countDocuments({ churchId: prodChurch._id })}`);
    console.log('\n' + '='.repeat(60));

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error importando personas:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

importPersonsToProduction();
