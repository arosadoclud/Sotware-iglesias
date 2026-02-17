// Script específico para asignar roles usando la base correcta
const mongoose = require('mongoose');

async function assignRolesToExistingPersons() {
  // URI de la base con las personas reales
  const CORRECT_URI = 'mongodb://localhost:27017/church-program-manager';
  
  await mongoose.connect(CORRECT_URI);
  const db = mongoose.connection.db;
  
  console.log(`🔍 Conectado a: ${CORRECT_URI}\n`);
  
  // Roles necesarios
  const requiredRoles = [
    'Limpieza',
    'Limpieza de Iglesia', 
    'Adoración'
  ];
  
  console.log('🔧 Creando/verificando roles...');
  const createdRoles = [];
  
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
      console.log(`   ✓ Rol creado: "${roleName}"`);
    } else {
      console.log(`   ✓ Rol existente: "${roleName}"`);
    }
    
    createdRoles.push({ id: role._id, name: role.name });
  }
  
  // Obtener todas las personas
  const persons = await db.collection('persons').find({}).toArray();
  console.log(`\n👥 Personas encontradas: ${persons.length}`);
  
  // Asignar roles
  console.log(`\n📝 Asignando roles...\n`);
  let totalAssigned = 0;
  
  for (const person of persons) {
    let personUpdated = false;
    const personName = person.fullName || person.firstName || person.name || person.email || 'Sin nombre';
    
    // Verificar si la persona está activa
    const isActive = !person.status || 
                    !['INACTIVO', 'INACTIVE', 'inactivo', 'inactive', false].includes(person.status);
    
    if (!isActive) {
      console.log(`  ⏸️  ${personName}: Persona inactiva - omitida`);
      continue;
    }
    
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

assignRolesToExistingPersons().catch(e => {
  console.log('❌ Error:', e);
  process.exit(1);
});