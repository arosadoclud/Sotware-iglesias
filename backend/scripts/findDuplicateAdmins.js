const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/church-manager';

async function findDuplicateAdmins() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const User = mongoose.connection.collection('users');
    
    // Buscar TODOS los usuarios con admin@iglesia.com
    const adminUsers = await User.find({ email: 'admin@iglesia.com' }).toArray();

    console.log(`🔍 USUARIOS ENCONTRADOS: ${adminUsers.length}\n`);
    console.log('=====================================');
    
    adminUsers.forEach((user, index) => {
      console.log(`\n👤 USUARIO ${index + 1}:`);
      console.log('_id:', user._id);
      console.log('Email:', user.email);
      console.log('Nombre:', user.fullName);
      console.log('Rol:', user.role);
      console.log('isActive:', user.isActive);
      console.log('isEmailVerified:', user.isEmailVerified);
      console.log('Creado:', user.createdAt);
    });
    
    console.log('\n=====================================\n');

    if (adminUsers.length > 1) {
      console.log('⚠️  HAY USUARIOS DUPLICADOS!');
      console.log('¿Cuál deseas conservar?');
      console.log('Voy a conservar el que tiene rol SUPER_ADMIN y eliminar los demás...\n');
      
      // Buscar el que tiene SUPER_ADMIN
      const superAdmin = adminUsers.find(u => u.role === 'SUPER_ADMIN');
      const toDelete = adminUsers.filter(u => u._id.toString() !== superAdmin?._id.toString());
      
      if (superAdmin) {
        console.log('✅ Conservando:', {
          _id: superAdmin._id,
          role: superAdmin.role,
          createdAt: superAdmin.createdAt
        });
        
        for (const user of toDelete) {
          console.log('🗑️  Eliminando:', {
            _id: user._id,
            role: user.role,
            createdAt: user.createdAt
          });
          await User.deleteOne({ _id: user._id });
        }
        
        console.log(`\n✅ Eliminados ${toDelete.length} usuario(s) duplicado(s)`);
      } else {
        console.log('❌ No hay usuario con rol SUPER_ADMIN, no se elimina nada');
      }
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

findDuplicateAdmins();
