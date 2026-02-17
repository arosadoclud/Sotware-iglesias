require('dotenv').config();
const mongoose = require('mongoose');

async function createRolesAndAssign() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  // Roles necesarios
  const requiredRoles = [
    'Limpieza',
    'Limpieza de Iglesia', 
    'Adoración'
  ];
  
  console.log('🔧 Creando roles necesarios...\n');
  
  const createdRoles = [];
  
  // Crear o verificar roles en activityroles
  for (const roleName of requiredRoles) {
    let role = await db.collection('activityroles').findOne({ name: roleName });
    
    if (!role) {
      const newRole = {
        _id: new mongoose.Types.ObjectId(),
        name: roleName,
        description: `Rol de ${roleName}`,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.collection('activityroles').insertOne(newRole);
      role = newRole;
      console.log(`✓ Rol creado: "${roleName}"`);
    } else {
      console.log(`✓ Rol ya existe: "${roleName}"`);
    }
    
    createdRoles.push({ id: role._id, name: role.name });
  }
  
  console.log(`\n👥 Buscando personas activas...\n`);
  
  // Get active persons
  const persons = await db.collection('persons').find({
    status: { $nin: ['INACTIVO', 'INACTIVE', 'inactivo', 'inactive'] }
  }).toArray();
  
  console.log(`✅ Personas activas encontradas: ${persons.length}\n`);
  
  let totalAssigned = 0;
  
  for (const person of persons) {
    let personUpdated = false;
    const personName = person.fullName || person.firstName || person.name || 'Sin nombre';
    
    for (const roleInfo of createdRoles) {
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
  
  console.log(`\n🎉 Proceso completado:`);
  console.log(`   - Roles creados/verificados: ${createdRoles.length}`);
  console.log(`   - Asignaciones realizadas: ${totalAssigned}`);
  console.log(`   - Personas procesadas: ${persons.length}`);
  
  await mongoose.disconnect();
}

createRolesAndAssign().catch(e => {
  console.log('❌ Error:', e);
  process.exit(1);
});