require('dotenv').config();
const mongoose = require('mongoose');

async function checkDifferentDatabases() {
  // Bases de datos a verificar
  const databases = [
    'mongodb://localhost:27017/church-program-manager',      // Sin -dev
    'mongodb://localhost:27017/church-program-manager-dev',  // Con -dev (actual)
    'mongodb://localhost:27017/sotware-iglesias',            // Nombre del proyecto
    'mongodb://localhost:27017/iglesia',                      // Nombre simple
  ];
  
  for (const uri of databases) {
    try {
      console.log(`\n🔍 Verificando: ${uri}`);
      
      await mongoose.connect(uri);
      const db = mongoose.connection.db;
      
      const collections = await db.listCollections().toArray();
      console.log(`📁 Colecciones (${collections.length}):`, collections.map(c => c.name).join(', '));
      
      // Buscar personas
      const possiblePersonCollections = ['persons', 'users', 'people', 'Person', 'User'];
      for (const collName of possiblePersonCollections) {
        try {
          const count = await db.collection(collName).countDocuments();
          if (count > 0) {
            console.log(`✅ ¡ENCONTRADAS! ${count} personas en "${collName}"`);
            
            // Usar esta base de datos
            console.log(`\n🎯 Base de datos correcta encontrada: ${uri}`);
            console.log(`📝 Actualiza tu .env.local con: MONGODB_URI=${uri}`);
            
            await mongoose.disconnect();
            return uri;
          }
        } catch (e) {
          // Colección no existe
        }
      }
      
      await mongoose.disconnect();
      
    } catch (e) {
      console.log(`❌ Error conectando a ${uri}:`, e.message);
    }
  }
  
  console.log('\n❌ No se encontraron personas en ninguna base de datos local');
  console.log('💡 Sugerencias:');
  console.log('   1. Verifica que MongoDB esté corriendo: net start MongoDB');
  console.log('   2. Importa datos desde un backup');  
  console.log('   3. Usa la aplicación web para crear personas');
}

checkDifferentDatabases().catch(console.error);