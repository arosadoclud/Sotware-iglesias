require('dotenv').config();
const mongoose = require('mongoose');

async function listAllRoles() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  console.log('📋 Listando todos los roles en la base de datos:\n');
  
  const roles = await db.collection('activityroles').find({}).toArray();
  
  if (roles.length === 0) {
    console.log('❌ No se encontraron roles en la colección "activityroles"');
  } else {
    console.log(`✅ Roles encontrados: ${roles.length}\n`);
    roles.forEach((role, index) => {
      console.log(`${index + 1}. "${role.name}" (ID: ${role._id})`);
    });
  }
  
  await mongoose.disconnect();
}

listAllRoles().catch(e => {
  console.log('❌ Error:', e);
  process.exit(1);
});
