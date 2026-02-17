require('dotenv').config();
const mongoose = require('mongoose');

async function inspectCollections() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  console.log('🔍 Inspeccionar colecciones relacionadas con roles...\n');
  
  // Listar todas las colecciones
  const collections = await db.listCollections().toArray();
  console.log('📁 Colecciones encontradas:');
  collections.forEach(col => {
    if (col.name.toLowerCase().includes('role') || col.name.toLowerCase().includes('activity')) {
      console.log(`  ✓ ${col.name}`);
    }
  });
  
  // Buscar en diferentes posibles colecciones
  const possibleCollections = ['roles', 'activityroles', 'activitytypes', 'Role', 'ActivityRole'];
  
  for (const collName of possibleCollections) {
    try {
      const count = await db.collection(collName).countDocuments();
      if (count > 0) {
        console.log(`\n📋 Colección: ${collName} (${count} documentos)`);
        const samples = await db.collection(collName).find({}).limit(5).toArray();
        samples.forEach((doc, idx) => {
          console.log(`  ${idx + 1}. ${JSON.stringify(doc, null, 2)}`);
        });
      }
    } catch (e) {
      // Colección no existe
    }
  }
  
  await mongoose.disconnect();
}

inspectCollections().catch(e => {
  console.log('❌ Error:', e);
  process.exit(1);
});