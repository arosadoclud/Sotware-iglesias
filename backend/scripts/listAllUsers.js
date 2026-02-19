const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/church-manager';

async function listAllUsers() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const User = mongoose.connection.collection('users');
    
    // Contar todos los usuarios
    const totalUsers = await User.countDocuments();
    console.log(`📊 TOTAL DE USUARIOS EN LA BASE DE DATOS: ${totalUsers}\n`);
    
    // Obtener TODOS los usuarios
    const allUsers = await User.find({}).toArray();
    
    console.log('='.repeat(80));
    console.log('LISTA COMPLETA DE USUARIOS:\n');
    
    allUsers.forEach((user, index) => {
      console.log(`👤 USUARIO ${index + 1}:`);
      console.log(`   ID: ${user._id.toString()}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Nombre: ${user.fullName}`);
      console.log(`   Rol: ${user.role}`);
      console.log(`   Activo: ${user.isActive}`);
      console.log(`   Email Verificado: ${user.isEmailVerified}`);
      console.log(`   Creado: ${user.createdAt}`);
      console.log('   ' + '-'.repeat(70));
    });
    
    console.log('='.repeat(80));

    // Verificar duplicados por email
    console.log('\n🔍 Verificando duplicados por email...\n');
    const duplicates = await User.aggregate([
      { $group: { _id: '$email', count: { $sum: 1 }, ids: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    if (duplicates.length > 0) {
      console.log('⚠️  EMAILS DUPLICADOS ENCONTRADOS:');
      duplicates.forEach(dup => {
        console.log(`   Email: ${dup._id}`);
        console.log(`   Cantidad: ${dup.count}`);
        console.log(`   IDs: ${dup.ids.map(id => id.toString()).join(', ')}`);
      });
    } else {
      console.log('✅ No hay emails duplicados en la base de datos');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Conexión cerrada');
    process.exit(0);
  }
}

listAllUsers();
