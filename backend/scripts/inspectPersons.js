require('dotenv').config();
const mongoose = require('mongoose');

async function inspectPersons() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  console.log('👥 Inspeccionando personas en la base de datos...\n');
  
  // Contar total de personas
  const totalPersons = await db.collection('persons').countDocuments();
  console.log(`📊 Total de personas en la BD: ${totalPersons}\n`);
  
  if (totalPersons === 0) {
    console.log('❌ No hay personas en la base de datos');
    await mongoose.disconnect();
    return;
  }
  
  // Ver diferentes status
  const statusAgg = await db.collection('persons').aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]).toArray();
  
  console.log('📋 Distribución por status:');
  statusAgg.forEach(stat => {
    console.log(`   ${stat._id || 'undefined/null'}: ${stat.count} personas`);
  });
  
  console.log('\n👤 Ejemplos de personas (primeras 5):');
  const samples = await db.collection('persons').find({}).limit(5).toArray();
  samples.forEach((person, idx) => {
    const name = person.fullName || person.firstName || person.name || 'Sin nombre';
    const status = person.status || 'sin status';
    const rolesCount = (person.roles || []).length;
    console.log(`   ${idx + 1}. ${name} | Status: ${status} | Roles: ${rolesCount}`);
  });
  
  // Intentar con diferentes criterios de "activo"
  console.log('\n🔍 Buscando personas con diferentes criterios:');
  
  const criteria = [
    { name: 'Sin status INACTIVO', query: { status: { $nin: ['INACTIVO', 'INACTIVE', 'inactivo', 'inactive'] } } },
    { name: 'Status ACTIVO', query: { status: { $in: ['ACTIVO', 'ACTIVE', 'activo', 'active'] } } },
    { name: 'Status true', query: { status: true } },
    { name: 'isActive true', query: { isActive: true } },
    { name: 'Todas las personas', query: {} }
  ];
  
  for (const criterion of criteria) {
    const count = await db.collection('persons').countDocuments(criterion.query);
    console.log(`   ${criterion.name}: ${count} personas`);
  }
  
  await mongoose.disconnect();
}

inspectPersons().catch(e => {
  console.log('❌ Error:', e);
  process.exit(1);
});