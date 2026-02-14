import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import envConfig from '../config/env';
import User from '../models/User.model';

async function verifyUserPassword() {
  try {
    await mongoose.connect(envConfig.mongoUri);
    console.log('✅ Conectado a MongoDB de PRODUCCIÓN');

    // Obtener el usuario con el campo passwordHash
    const user = await User.findOne({ email: 'admin@iglesia.com' }).select('+passwordHash');
    
    if (!user) {
      console.log('❌ Usuario admin@iglesia.com no encontrado');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('\n📋 Información del Usuario:');
    console.log(`✅ Usuario: ${user.fullName}`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`👤 Rol: ${user.role}`);
    console.log(`🔓 Activo: ${user.isActive}`);
    console.log(`🔑 Hash almacenado: ${user.passwordHash.substring(0, 50)}...`);
    console.log(`   Longitud del hash: ${user.passwordHash.length} caracteres`);

    // Verificar si el hash es válido de bcrypt
    const isBcryptHash = user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$');
    console.log(`   ¿Es hash de bcrypt?: ${isBcryptHash ? '✅ Sí' : '❌ No'}`);

    // Intentar comparar con la contraseña
    const testPassword = 'password123';
    console.log(`\n🧪 Probando contraseña: "${testPassword}"`);
    
    try {
      const isMatch = await bcrypt.compare(testPassword, user.passwordHash);
      console.log(`   Resultado: ${isMatch ? '✅ COINCIDE' : '❌ NO COINCIDE'}`);
    } catch (error: any) {
      console.log(`   ❌ Error al comparar: ${error.message}`);
    }

    // Intentar con el método del modelo
    try {
      const isMatchModel = await user.comparePassword(testPassword);
      console.log(`   Resultado (método del modelo): ${isMatchModel ? '✅ COINCIDE' : '❌ NO COINCIDE'}`);
    } catch (error: any) {
      console.log(`   ❌ Error con método del modelo: ${error.message}`);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

verifyUserPassword();
