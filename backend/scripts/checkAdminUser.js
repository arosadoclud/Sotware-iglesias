const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/church-manager';

async function checkAdminUser() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const User = mongoose.connection.collection('users');
    const adminUser = await User.findOne({ email: 'admin@iglesia.com' });

    if (!adminUser) {
      console.log('❌ No se encontró usuario admin@iglesia.com');
      process.exit(1);
    }

    console.log('👤 INFORMACIÓN COMPLETA DEL USUARIO:');
    console.log('=====================================');
    console.log('Email:', adminUser.email);
    console.log('Nombre completo:', adminUser.fullName);
    console.log('ROL ACTUAL:', adminUser.role);
    console.log('isActive:', adminUser.isActive);
    console.log('isEmailVerified:', adminUser.isEmailVerified);
    console.log('churchId:', adminUser.churchId);
    console.log('_id:', adminUser._id);
    console.log('=====================================\n');

    if (adminUser.role !== 'SUPER_ADMIN') {
      console.log('⚠️ EL ROL NO ES SUPER_ADMIN!');
      console.log('Actualizando ahora...');
      
      await User.updateOne(
        { email: 'admin@iglesia.com' },
        { $set: { role: 'SUPER_ADMIN' } }
      );
      
      console.log('✅ Actualizado a SUPER_ADMIN');
    } else {
      console.log('✅ El usuario YA tiene rol SUPER_ADMIN');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

checkAdminUser();
