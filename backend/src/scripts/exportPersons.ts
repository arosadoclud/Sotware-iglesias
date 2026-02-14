import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import Person from '../models/Person.model';
import Church from '../models/Church.model';

// Base de datos LOCAL
const LOCAL_MONGO_URI = 'mongodb://localhost:27017/church-program-manager';

async function exportPersons() {
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

    // Exportar Personas (sin el churchId, sin las fechas, sin __v)
    const persons = await Person.find({ churchId: localChurch._id })
      .select('-_id -churchId -createdAt -updatedAt -__v')
      .lean();
    
    console.log(`👥 Personas encontradas: ${persons.length}`);

    // Crear objeto de datos
    const exportData = {
      persons,
      exportedAt: new Date().toISOString(),
      sourceChurch: localChurch.name,
      count: persons.length
    };

    // Guardar a archivo JSON
    const exportPath = path.join(__dirname, 'persons-export.json');
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2), 'utf-8');

    console.log('\n✅ Personas exportadas exitosamente!');
    console.log(`📁 Archivo: ${exportPath}`);
    console.log(`👥 Total: ${persons.length} personas`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error exportando personas:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

exportPersons();
