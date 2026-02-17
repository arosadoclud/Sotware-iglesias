require('dotenv').config();
const mongoose = require('mongoose');

async function assignMultipleRoles() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  // Roles a asignar
  const rolesToAssign = [
    { name: 'Limpieza' },
    { name: 'Limpieza de Iglesia' },
    { name: 'Limpieza Iglesia' },
    { name: 'Adoración' }
  ];
  
  console.log('🔍 Buscando roles en la base de datos...\n');
  
  // Buscar los roles en la BD
  const foundRoles = [];
  for (const roleInfo of rolesToAssign) {
    const role = await db.collection('activityroles').findOne({
      name: { $regex: new RegExp(roleInfo.name, 'i') }
    });
    
    if (role) {
      foundRoles.push({ id: role._id, name: role.name });
      console.log(`✓ Role encontrado: "${role.name}" (ID: ${role._id})`);
    } else {
      console.log(`✗ Role NO encontrado: "${roleInfo.name}"`);
    }
  }
  
  if (foundRoles.length === 0) {
    console.log('\n❌ No se encontraron roles. Verifica los nombres.');
    await mongoose.disconnect();
    return;
  }
  
  console.log(`\n📋 Se asignarán ${foundRoles.length} roles a personas activas\n`);
  
  // Get active persons
  const persons = await db.collection('persons').find({
    status: { $nin: ['INACTIVO', 'INACTIVE', 'inactivo', 'inactive'] }
  }).toArray();
  
  console.log(`👥 Personas activas encontradas: ${persons.length}\n`);
  
  let totalAssigned = 0;
  
  for (const person of persons) {
    let personUpdated = false;
    const personName = person.fullName || person.firstName || person.name || 'Sin nombre';
    
    for (const roleInfo of foundRoles) {
      const roles = person.roles || [];
      const hasRole = roles.some(r => 
        r.id?.toString() === roleInfo.id.toString() || 
        r.roleId?.toString() === roleInfo.id.toString() ||
        r.name === roleInfo.name
      );
      
      if (!hasRole) {
        await db.collection('persons').updateOne(
          { _id: person._id },
          { $push: { roles: { id: roleInfo.id, name: roleInfo.name, assignedAt: new Date() } } }
        );
        console.log(`  ✓ ${personName}: +${roleInfo.name}`);
        personUpdated = true;
        totalAssigned++;
      }
    }
    
    if (!personUpdated) {
      console.log(`  = ${personName}: Ya tiene todos los roles`);
    }
  }
  
  console.log(`\n✅ Proceso completado: ${totalAssigned} asignaciones realizadas`);
  await mongoose.disconnect();
}

assignMultipleRoles().catch(e => {
  console.log('❌ Error:', e);
  process.exit(1);
});
