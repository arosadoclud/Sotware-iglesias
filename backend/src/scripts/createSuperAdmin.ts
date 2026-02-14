import mongoose from 'mongoose';
import User from '../models/User.model';
import Church from '../models/Church.model';
import bcrypt from 'bcryptjs';
import envConfig from '../config/env';

async function createSuperAdmin() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(envConfig.mongoUri);
    console.log('✅ Conectado a MongoDB');

    // Verificar si ya existe el admin
    const email = 'admin@software.com';
    const password = 'Pass1234';
    
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log(`⚠️  El usuario ${email} ya existe, actualizando contraseña...`);
      
      // Actualizar contraseña (el pre-save hook la hasheará automáticamente)
      existingAdmin.passwordHash = password;
      existingAdmin.isActive = true;
      await existingAdmin.save();
      console.log('✅ Contraseña actualizada');
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 Password: ${password}`);
      process.exit(0);
    }

    // Crear iglesia por defecto
    let church = await Church.findOne({ name: 'Iglesia Principal' });
    
    if (!church) {
      church = new Church({
        name: 'Iglesia Principal',
        address: { city: 'Ciudad', country: 'País' },
        settings: {
          timezone: 'America/New_York',
          rotationWeeks: 4,
          allowRepetitions: false,
          dateFormat: 'DD/MM/YYYY',
          whatsappEnabled: true,
        },
        plan: 'PRO',
        isActive: true,
      });
      await church.save();
      console.log('✅ Iglesia creada:', church._id);
    } else {
      console.log('✅ Usando iglesia existente:', church._id);
    }

    // Crear usuario SUPER_ADMIN (el pre-save hook hasheará la contraseña)
    const admin = new User({
      email,
      passwordHash: password, // Se hasheará automáticamente
      fullName: 'Administrador Principal',
      role: 'SUPER_ADMIN',
      churchId: church._id,
      isActive: true,
    });

    await admin.save();
    console.log('✅ Usuario SUPER_ADMIN creado exitosamente');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log('🏛️  ChurchId:', church._id);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createSuperAdmin();
