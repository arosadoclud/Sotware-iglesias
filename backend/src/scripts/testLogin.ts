import mongoose from 'mongoose';
import User from '../models/User.model';
import envConfig from '../config/env';

async function testLogin() {
  try {
    await mongoose.connect(envConfig.mongoUri);
    console.log('✅ Conectado a MongoDB');

    const user = await User.findOne({ email: 'superadmin@iglesia.com' }).select('+passwordHash');
    
    if (!user) {
      console.log('❌ Usuario no encontrado');
      process.exit(1);
    }

    console.log('✅ Usuario encontrado:', user.email);
    console.log('🔒 Hash almacenado:', user.passwordHash);
    console.log('👤 Rol:', user.role);
    console.log('🏛️  ChurchId:', user.churchId);
    console.log('✓ Activo:', user.isActive);

    // Probar contraseña
    const isMatch = await user.comparePassword('Admin123456');
    console.log('\n🔑 Contraseña "Admin123456" coincide:', isMatch);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testLogin();
