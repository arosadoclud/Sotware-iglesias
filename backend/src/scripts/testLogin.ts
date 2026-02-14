import mongoose from 'mongoose';
import User from '../models/User.model';
import envConfig from '../config/env';

async function testLogin() {
  try {
    await mongoose.connect(envConfig.mongoUri);
    console.log('✅ Conectado a MongoDB');

    const email = 'admin@software.com';
    const password = 'Pass1234';

    const user = await User.findOne({ email }).select('+passwordHash');
    
    if (!user) {
      console.log(`❌ Usuario ${email} no encontrado`);
      process.exit(1);
    }

    console.log('✅ Usuario encontrado:', user.email);
    console.log('🔒 Hash almacenado:', user.passwordHash);
    console.log('👤 Rol:', user.role);
    console.log('🏛️  ChurchId:', user.churchId);
    console.log('✓ Activo:', user.isActive);

    // Probar contraseña
    const isMatch = await user.comparePassword(password);
    console.log(`\n🔑 Contraseña "${password}" coincide:`, isMatch);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testLogin();
