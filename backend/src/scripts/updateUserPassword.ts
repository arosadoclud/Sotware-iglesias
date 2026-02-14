import mongoose from 'mongoose';
import envConfig from '../config/env';
import User from '../models/User.model';

async function updateUserPassword() {
  try {
    await mongoose.connect(envConfig.mongoUri);
    console.log('✅ Conectado a MongoDB de PRODUCCIÓN');

    // Obtener el usuario con el campo passwordHash incluido
    const user = await User.findOne({ email: 'admin@iglesia.com' }).select('+passwordHash');
    
    if (!user) {
      console.log('❌ Usuario admin@iglesia.com no encontrado');
      process.exit(1);
    }

    console.log(`✅ Usuario encontrado: ${user.fullName}`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`👤 Rol: ${user.role}`);

    // Establecer la nueva contraseña en texto plano
    // El hook pre.save() la hasheará automáticamente
    user.passwordHash = 'password123';
    user.markModified('passwordHash'); // Forzar que mongoose detecte el cambio
    user.isActive = true;
    
    await user.save();

    console.log('\n✅ Contraseña actualizada exitosamente!');
    console.log('\n📋 Credenciales de acceso:');
    console.log('   📧 Email: admin@iglesia.com');
    console.log('   🔑 Password: password123');
    console.log('\n🌐 URL: https://software-iglesias-frontend.vercel.app');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

updateUserPassword();
