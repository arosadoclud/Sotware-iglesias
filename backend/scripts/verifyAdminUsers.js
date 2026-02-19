const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/church-manager';

async function verifyAllAdminUsers() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const User = mongoose.connection.collection('users');
    
    // Buscar TODOS los usuarios con email que contenga 'admin' y 'iglesia'
    console.log('🔍 Buscando TODOS los usuarios con admin e iglesia en el email...\n');
    
    const adminUsers = await User.find({ 
      email: { $regex: /admin.*iglesia|iglesia.*admin/i } 
    }).toArray();

    console.log(`📊 TOTAL DE USUARIOS ENCONTRADOS: ${adminUsers.length}\n`);
    console.log('='.repeat(60));
    
    adminUsers.forEach((user, index) => {
      console.log(`\n👤 USUARIO ${index + 1}:`);
      console.log('  _id:', user._id.toString());
      console.log('  Email:', user.email);
      console.log('  Nombre completo:', user.fullName);
      console.log('  Rol:', user.role);
      console.log('  isActive:', user.isActive);
      console.log('  isEmailVerified:', user.isEmailVerified);
      console.log('  churchId:', user.churchId);
      console.log('  Creado:', user.createdAt);
      console.log('  Última actualización:', user.updatedAt);
    });
    
    console.log('\n' + '='.repeat(60));

    // Buscar específicamente admin@iglesia.com (normalizado)
    console.log('\n🔎 Buscando EXACTAMENTE "admin@iglesia.com"...\n');
    const exactMatch = await User.find({ email: 'admin@iglesia.com' }).toArray();
    
    console.log(`📊 USUARIOS CON EXACTAMENTE "admin@iglesia.com": ${exactMatch.length}\n`);
    
    if (exactMatch.length > 1) {
      console.log('⚠️  ¡HAY DUPLICADOS!');
      console.log('IDs de los duplicados:');
      exactMatch.forEach((user, i) => {
        console.log(`  ${i + 1}. ${user._id.toString()} - ${user.role} - Creado: ${user.createdAt}`);
      });
    } else {
      console.log('✅ No hay duplicados');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Conexión cerrada');
    process.exit(0);
  }
}

verifyAllAdminUsers();
