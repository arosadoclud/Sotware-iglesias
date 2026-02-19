const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/church-manager';

async function findByExactIds() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const User = mongoose.connection.collection('users');
    
    // IDs de las screenshots
    const id1 = '6995f12708366dba4c4acaf5'; // admin@INglesia.com (con typo)
    const id2 = '6995ff3caec2c20f2f3a0329'; // admin@iglesia.com (correcto)
    
    console.log('🔍 Buscando usuarios por IDs exactos de las screenshots...\n');
    console.log('='.repeat(70));
    
    // Buscar por ID 1
    console.log('\n📋 Usuario 1 (ID de screenshot 1):');
    try {
      const user1 = await User.findOne({ _id: new mongoose.Types.ObjectId(id1) });
      if (user1) {
        console.log('   ✅ ENCONTRADO:');
        console.log('   Email:', user1.email);
        console.log('   Nombre:', user1.fullName);
        console.log('   Rol:', user1.role);
        console.log('   Activo:', user1.isActive);
        console.log('   Email Verificado:', user1.isEmailVerified);
      } else {
        console.log('   ❌ NO ENCONTRADO (puede haber sido eliminado)');
      }
    } catch (err) {
      console.log('   ❌ Error buscando ID:', err.message);
    }
    
    // Buscar por ID 2
    console.log('\n📋 Usuario 2 (ID de screenshot 2):');
    try {
      const user2 = await User.findOne({ _id: new mongoose.Types.ObjectId(id2) });
      if (user2) {
        console.log('   ✅ ENCONTRADO:');
        console.log('   Email:', user2.email);
        console.log('   Nombre:', user2.fullName);
        console.log('   Rol:', user2.role);
        console.log('   Activo:', user2.isActive);
        console.log('   Email Verificado:', user2.isEmailVerified);
      } else {
        console.log('   ❌ NO ENCONTRADO (puede haber sido eliminado)');
      }
    } catch (err) {
      console.log('   ❌ Error buscando ID:', err.message);
    }
    
    console.log('\n' + '='.repeat(70));
    
    // Listar TODOS los usuarios actuales
    console.log('\n📊 TODOS LOS USUARIOS ACTUALMENTE EN LA BASE DE DATOS:\n');
    const allUsers = await User.find({}).toArray();
    console.log(`Total: ${allUsers.length} usuario(s)\n`);
    
    allUsers.forEach((user, i) => {
      console.log(`${i + 1}. ${user.email} (${user.role}) - ID: ${user._id}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Conexión cerrada');
    process.exit(0);
  }
}

findByExactIds();
