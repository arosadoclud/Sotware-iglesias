const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/church-manager';

async function cleanupAndFixAdmin() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const User = mongoose.connection.collection('users');
    
    // 1. ELIMINAR el usuario con TYPO (admin@INglesia.com)
    console.log('🗑️  PASO 1: Eliminando usuario con typo...');
    const typoUser = await User.findOne({ email: 'admin@inglesia.com' });
    
    if (typoUser) {
      console.log('   Encontrado:', {
        _id: typoUser._id,
        email: typoUser.email,
        role: typoUser.role
      });
      
      await User.deleteOne({ _id: typoUser._id });
      console.log('   ✅ Eliminado: admin@INglesia.com (typo)\n');
    } else {
      console.log('   ℹ️  No se encontró usuario con typo\n');
    }

    // 2. ACTUALIZAR el usuario correcto a SUPER_ADMIN
    console.log('⚡ PASO 2: Actualizando admin@iglesia.com a SUPER_ADMIN...');
    const correctUser = await User.findOne({ email: 'admin@iglesia.com' });
    
    if (correctUser) {
      console.log('   Encontrado:', {
        _id: correctUser._id,
        email: correctUser.email,
        roleActual: correctUser.role,
        isActive: correctUser.isActive
      });

      await User.updateOne(
        { _id: correctUser._id },
        { 
          $set: { 
            role: 'SUPER_ADMIN',
            isActive: true,
            isEmailVerified: true
          } 
        }
      );

      const updated = await User.findOne({ _id: correctUser._id });
      console.log('   ✅ Actualizado:', {
        _id: updated._id,
        email: updated.email,
        roleNuevo: updated.role,
        isActive: updated.isActive
      });
    } else {
      console.log('   ❌ No se encontró admin@iglesia.com');
    }

    // 3. VERIFICACIÓN FINAL
    console.log('\n📋 VERIFICACIÓN FINAL:');
    console.log('='.repeat(60));
    
    const allAdminUsers = await User.find({ 
      email: { $in: ['admin@inglesia.com', 'admin@iglesia.com'] } 
    }).toArray();

    console.log(`Total de usuarios admin: ${allAdminUsers.length}`);
    allAdminUsers.forEach(user => {
      console.log(`\n   Email: ${user.email}`);
      console.log(`   Rol: ${user.role}`);
      console.log(`   Activo: ${user.isActive}`);
    });
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Conexión cerrada');
    process.exit(0);
  }
}

cleanupAndFixAdmin();
