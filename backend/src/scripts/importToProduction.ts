import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import envConfig from '../config/env';
import ActivityType from '../models/ActivityType.model';
import Role from '../models/Role.model';
import PersonStatus from '../models/PersonStatus.model';
import Church from '../models/Church.model';

async function importToProduction() {
  try {
    // Leer archivo exportado
    const exportPath = path.join(__dirname, 'local-data-export.json');
    
    if (!fs.existsSync(exportPath)) {
      console.log('❌ No se encontró el archivo de exportación');
      console.log('   Ejecuta primero: npm run export-local-data');
      process.exit(1);
    }

    const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));
    console.log('✅ Archivo de datos cargado');
    console.log(`📅 Exportado desde: ${exportData.sourceChurch}`);
    console.log(`🕒 Fecha: ${exportData.exportedAt}`);

    // Conectar a producción
    await mongoose.connect(envConfig.mongoUri);
    console.log('\n✅ Conectado a MongoDB de PRODUCCIÓN');

    // Obtener la iglesia de producción
    const prodChurch = await Church.findOne();
    if (!prodChurch) {
      console.log('❌ No se encontró ninguna iglesia en producción');
      console.log('   Ejecuta primero createSuperAdmin para crear la iglesia');
      process.exit(1);
    }

    console.log(`✅ Iglesia de producción: ${prodChurch.name}`);

    // ═══════════════════════════════════════════════════════════════
    // IMPORTAR ACTIVITY TYPES
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📋 Importando Activity Types...');
    let activityTypesCreated = 0;
    let activityTypesSkipped = 0;

    for (const actType of exportData.activityTypes) {
      const exists = await ActivityType.findOne({
        name: actType.name,
        churchId: prodChurch._id
      });

      if (!exists) {
        await ActivityType.create({
          ...actType,
          churchId: prodChurch._id
        });
        console.log(`   ✓ ${actType.name}`);
        activityTypesCreated++;
      } else {
        console.log(`   ⊙ ${actType.name} (ya existe)`);
        activityTypesSkipped++;
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // IMPORTAR ROLES
    // ═══════════════════════════════════════════════════════════════
    console.log('\n👥 Importando Roles...');
    let rolesCreated = 0;
    let rolesSkipped = 0;

    for (const role of exportData.roles) {
      const exists = await Role.findOne({
        name: role.name,
        churchId: prodChurch._id
      });

      if (!exists) {
        await Role.create({
          ...role,
          churchId: prodChurch._id
        });
        console.log(`   ✓ ${role.name}`);
        rolesCreated++;
      } else {
        console.log(`   ⊙ ${role.name} (ya existe)`);
        rolesSkipped++;
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // IMPORTAR PERSON STATUSES
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📊 Importando Person Statuses...');
    let statusesCreated = 0;
    let statusesSkipped = 0;

    for (const status of exportData.personStatuses) {
      const exists = await PersonStatus.findOne({
        name: status.name,
        churchId: prodChurch._id
      });

      if (!exists) {
        await PersonStatus.create({
          ...status,
          churchId: prodChurch._id
        });
        console.log(`   ✓ ${status.name} (${status.code})`);
        statusesCreated++;
      } else {
        console.log(`   ⊙ ${status.name} (ya existe)`);
        statusesSkipped++;
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // RESUMEN FINAL
    // ═══════════════════════════════════════════════════════════════
    console.log('\n' + '='.repeat(60));
    console.log('✅ IMPORTACIÓN COMPLETADA');
    console.log('='.repeat(60));
    console.log('\n📊 Resumen de importación:');
    console.log(`\nActivity Types:`);
    console.log(`   ✓ Creados: ${activityTypesCreated}`);
    console.log(`   ⊙ Ya existían: ${activityTypesSkipped}`);
    console.log(`   📋 Total en BD: ${await ActivityType.countDocuments({ churchId: prodChurch._id })}`);
    
    console.log(`\nRoles:`);
    console.log(`   ✓ Creados: ${rolesCreated}`);
    console.log(`   ⊙ Ya existían: ${rolesSkipped}`);
    console.log(`   👥 Total en BD: ${await Role.countDocuments({ churchId: prodChurch._id })}`);
    
    console.log(`\nPerson Statuses:`);
    console.log(`   ✓ Creados: ${statusesCreated}`);
    console.log(`   ⊙ Ya existían: ${statusesSkipped}`);
    console.log(`   📊 Total en BD: ${await PersonStatus.countDocuments({ churchId: prodChurch._id })}`);

    console.log('\n' + '='.repeat(60));

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error importando datos:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

importToProduction();
