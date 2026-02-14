import mongoose from 'mongoose';
import envConfig from '../config/env';
import User from '../models/User.model';

async function simulateLogin() {
  try {
    await mongoose.connect(envConfig.mongoUri);
    console.log('✅ Conectado a MongoDB de PRODUCCIÓN\n');

    // Simular exactamente lo que hace el endpoint de login
    const email = 'admin@iglesia.com';
    const password = 'password123';

    console.log('🔍 Buscando usuario con email:', email);
    console.log('   Email normalizado:', email.toLowerCase());

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    
    if (!user) {
      console.log('\n❌ Usuario NO encontrado');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('\n✅ Usuario encontrado:');
    console.log('   ID:', user._id);
    console.log('   Nombre:', user.fullName);
    console.log('   Email:', user.email);
    console.log('   Rol:', user.role);
    console.log('   Activo:', user.isActive);
    console.log('   ChurchId:', user.churchId);

    console.log('\n🔑 Verificando contraseña...');
    console.log('   Password a probar:', password);
    console.log('   Hash almacenado:', user.passwordHash.substring(0, 30) + '...');

    const passwordMatch = await user.comparePassword(password);
    
    console.log('\n📊 Resultado de comparePassword:', passwordMatch ? '✅ COINCIDE' : '❌ NO COINCIDE');

    if (!passwordMatch) {
      console.log('\n❌ La contraseña NO coincide - LOGIN FALLARÍA');
    } else {
      console.log('\n✅ La contraseña COINCIDE - LOGIN SERÍA EXITOSO');
      
      if (!user.isActive) {
        console.log('⚠️  Pero el usuario está INACTIVO');
      } else {
        console.log('✅ Y el usuario está ACTIVO');
      }
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

simulateLogin();
