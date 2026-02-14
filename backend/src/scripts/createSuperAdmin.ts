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
    const existingAdmin = await User.findOne({ email: 'superadmin@iglesia.com' });
    if (existingAdmin) {
      console.log('⚠️  El usuario superadmin@iglesia.com ya existe');
      
      // Actualizar contraseña (el pre-save hook la hasheará automáticamente)
      existingAdmin.passwordHash = 'Admin123456';
      existingAdmin.isActive = true;
      await existingAdmin.save();
      console.log('✅ Contraseña actualizada');
      console.log('📧 Email: superadmin@iglesia.com');
      console.log('🔑 Password: Admin123456');
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
      email: 'superadmin@iglesia.com',
      passwordHash: 'Admin123456', // Se hasheará automáticamente
      fullName: 'Super Administrador',
      role: 'SUPER_ADMIN',
      churchId: church._id,
      isActive: true,
    });

    await admin.save();
    console.log('✅ Usuario SUPER_ADMIN creado exitosamente');
    console.log('📧 Email: superadmin@iglesia.com');
    console.log('🔑 Password: Admin123456');
    console.log('🏛️  ChurchId:', church._id);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createSuperAdmin();
