import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import ActivityType from '../models/ActivityType.model';
import Role from '../models/Role.model';
import PersonStatus from '../models/PersonStatus.model';
import Church from '../models/Church.model';

// Base de datos LOCAL
const LOCAL_MONGO_URI = 'mongodb://localhost:27017/church-program-manager';

async function exportLocalData() {
  try {
    await mongoose.connect(LOCAL_MONGO_URI);
    console.log('✅ Conectado a MongoDB LOCAL');

    // Obtener la iglesia local
    const localChurch = await Church.findOne();
    if (!localChurch) {
      console.log('❌ No se encontró ninguna iglesia en local');
      process.exit(1);
    }

    console.log(`✅ Iglesia local: ${localChurch.name}`);

    // Exportar Activity Types
    const activityTypes = await ActivityType.find({ churchId: localChurch._id })
      .select('-_id -churchId -createdAt -updatedAt -__v')
      .lean();
    
    console.log(`📋 Activity Types encontrados: ${activityTypes.length}`);

    // Exportar Roles
    const roles = await Role.find({ churchId: localChurch._id })
      .select('-_id -churchId -createdAt -updatedAt -__v')
      .lean();
    
    console.log(`👥 Roles encontrados: ${roles.length}`);

    // Exportar Person Status
    const personStatuses = await PersonStatus.find({ churchId: localChurch._id })
      .select('-_id -churchId -createdAt -updatedAt -__v')
      .lean();
    
    console.log(`📊 Person Statuses encontrados: ${personStatuses.length}`);

    // Crear objeto de datos
    const exportData = {
      activityTypes,
      roles,
      personStatuses,
      exportedAt: new Date().toISOString(),
      sourceChurch: localChurch.name
    };

    // Guardar a archivo JSON
    const exportPath = path.join(__dirname, 'local-data-export.json');
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2), 'utf-8');

    console.log('\n✅ Datos exportados exitosamente!');
    console.log(`📁 Archivo: ${exportPath}`);
    console.log('\n📊 Resumen:');
    console.log(`   - Activity Types: ${activityTypes.length}`);
    console.log(`   - Roles: ${roles.length}`);
    console.log(`   - Person Statuses: ${personStatuses.length}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error exportando datos:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

exportLocalData();
