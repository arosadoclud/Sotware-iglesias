const mongoose = require('mongoose');
require('dotenv').config();

// Conectar a MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/church-manager';

async function updateAdminRole() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Buscar usuario admin@iglesia.com
    const User = mongoose.connection.collection('users');
    const adminUser = await User.findOne({ email: 'admin@iglesia.com' });

    if (!adminUser) {
      console.log('❌ No se encontró usuario admin@iglesia.com');
      process.exit(1);
    }

    console.log('📋 Usuario encontrado:', {
      email: adminUser.email,
      fullName: adminUser.fullName,
      roleActual: adminUser.role,
      isActive: adminUser.isActive,
      isEmailVerified: adminUser.isEmailVerified
    });

    // Actualizar rol a SUPER_ADMIN
    const result = await User.updateOne(
      { email: 'admin@iglesia.com' },
      { 
        $set: { 
          role: 'SUPER_ADMIN',
          isActive: true,
          isEmailVerified: true
        } 
      }
    );

    if (result.modifiedCount > 0) {
      console.log('✅ Rol actualizado exitosamente a SUPER_ADMIN');
      
      // Verificar actualización
      const updatedUser = await User.findOne({ email: 'admin@iglesia.com' });
      console.log('📋 Usuario actualizado:', {
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        roleNuevo: updatedUser.role,
        isActive: updatedUser.isActive,
        isEmailVerified: updatedUser.isEmailVerified
      });
    } else {
      console.log('⚠️ No se modificó el usuario (ya tenía SUPER_ADMIN?)');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Conexión cerrada');
    process.exit(0);
  }
}

// Ejecutar
updateAdminRole();
