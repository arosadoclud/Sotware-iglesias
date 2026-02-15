import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import Church from '../src/models/Church.model';

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../.env') });

const DEFAULT_PASSWORD = 'admin123';

async function setupModuleProtection() {
  try {
    console.log('🔌 Conectando a MongoDB Atlas...');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI no está definida en las variables de entorno');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB Atlas');

    // Hashear la contraseña con bcrypt
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    console.log(`🔐 Contraseña hasheada: ${hashedPassword.substring(0, 20)}...`);

    // Buscar la iglesia (asumiendo que solo hay una)
    const church = await Church.findOne();
    
    if (!church) {
      console.log('❌ No se encontró ninguna iglesia en la base de datos');
      console.log('ℹ️  Ejecuta primero el script de seed para crear una iglesia');
      process.exit(1);
    }

    console.log(`📍 Iglesia encontrada: ${church.name}`);

    // Actualizar la configuración de módulos protegidos
    church.settings.moduleProtection = {
      enabled: true,
      password: hashedPassword,
      modules: ['finances', 'settings', 'audit', 'users'],
      autoLockMinutes: 30,
    };

    await church.save();
    
    console.log('✅ Configuración de módulos protegidos actualizada correctamente');
    console.log('\n📋 Detalles de la configuración:');
    console.log(`   🔐 Contraseña: ${DEFAULT_PASSWORD}`);
    console.log(`   ✨ Módulos protegidos: ${church.settings.moduleProtection.modules.join(', ')}`);
    console.log(`   ⏰ Auto-bloqueo después de: ${church.settings.moduleProtection.autoLockMinutes} minutos`);
    console.log(`   🔓 Estado: ${church.settings.moduleProtection.enabled ? 'Habilitado' : 'Deshabilitado'}`);
    
    console.log('\n🎉 ¡Listo! La contraseña "admin123" está ahora configurada en MongoDB Atlas');
    console.log('💡 Puedes cambiarla desde la página de Configuración en el frontend');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Desconectado de MongoDB');
    process.exit(0);
  }
}

// Ejecutar el script
setupModuleProtection();
