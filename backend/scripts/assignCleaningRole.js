require('dotenv').config();
const mongoose = require('mongoose');

async function assignCleaningRole() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  const roleId = new mongoose.Types.ObjectId('699012aaeaea2d5b79ac463b');
  const roleName = 'Limpieza Iglesia';
  
  // Get active persons
  const persons = await db.collection('persons').find({
    status: { $nin: ['INACTIVO', 'INACTIVE', 'inactivo', 'inactive'] }
  }).toArray();
  
  console.log('Personas activas:', persons.length);
  
  let updated = 0;
  for (const person of persons) {
    const roles = person.roles || [];
    const hasRole = roles.some(r => 
      r.id?.toString() === roleId.toString() || 
      r.roleId?.toString() === roleId.toString()
    );
    
    if (!hasRole) {
      await db.collection('persons').updateOne(
        { _id: person._id },
        { $push: { roles: { id: roleId, name: roleName, assignedAt: new Date() } } }
      );
      console.log('+ Agregado a:', person.fullName || person.firstName);
      updated++;
    } else {
      console.log('= Ya tiene rol:', person.fullName || person.firstName);
    }
  }
  
  console.log('\n✅ Rol "Limpieza Iglesia" asignado a', updated, 'personas');
  await mongoose.disconnect();
}

assignCleaningRole().catch(e => {
  console.log('Error:', e);
  process.exit(1);
});
