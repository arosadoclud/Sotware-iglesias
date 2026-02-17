require('dotenv').config();
const mongoose = require('mongoose');

async function findPersonsAndAssignRoles() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  console.log(`🔍 Conectado a: ${process.env.MONGODB_URI}\n`);
  
  // Listar todas las colecciones
  const collections = await db.listCollections().toArray();
  console.log('📁 Todas las colecciones disponibles:');
  collections.forEach(col => console.log(`   - ${col.name}`));
  
  // Buscar colecciones que puedan contener personas
  const possiblePersonCollections = ['persons', 'users', 'people', 'Person', 'User'];
  let personsCollection = null;
  let personsData = [];
  
  for (const collName of possiblePersonCollections) {
    try {
      const count = await db.collection(collName).countDocuments();
      if (count > 0) {
        console.log(`\n✅ Encontrada colección "${collName}" con ${count} documentos`);
        const sample = await db.collection(collName).findOne();
        console.log('📄 Muestra de documento:', JSON.stringify(sample, null, 2));
        
        if (!personsCollection) {
          personsCollection = collName;
          personsData = await db.collection(collName).find({}).toArray();
        }
      }
    } catch (e) {
      // Colección no existe
    }
  }
  
  if (!personsCollection) {
    console.log('\n❌ No se encontraron personas en ninguna colección estándar');
    await mongoose.disconnect();
    return;
  }
  
  console.log(`\n🎯 Usando colección: "${personsCollection}"`);
  console.log(`👥 Total de personas encontradas: ${personsData.length}`);
  
  // Crear los roles necesarios
  const requiredRoles = [
    'Limpieza',
    'Limpieza de Iglesia', 
    'Adoración'
  ];
  
  console.log('\n🔧 Creando/verificando roles...');
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
  
  // Asignar roles a todas las personas
  console.log(`\n📝 Asignando roles a personas...\n`);
  let totalAssigned = 0;
  
  for (const person of personsData) {
    let personUpdated = false;
    const personName = person.fullName || person.firstName || person.name || person.email || 'Sin nombre';
    
    // Verificar si la persona está activa (diferentes posibles campos)
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
        await db.collection(personsCollection).updateOne(
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
  console.log(`   - Personas procesadas: ${personsData.length}`);
  
  await mongoose.disconnect();
}

findPersonsAndAssignRoles().catch(e => {
  console.log('❌ Error:', e);
  process.exit(1);
});