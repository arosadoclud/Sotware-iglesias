import mongoose from 'mongoose';
import envConfig from '../config/env';
import Church from '../models/Church.model';
import User from '../models/User.model';
import ActivityType from '../models/ActivityType.model';
import Role from '../models/Role.model';
import PersonStatus from '../models/PersonStatus.model';
import Person from '../models/Person.model';
import Program from '../models/Program.model';

async function checkProductionData() {
  try {
    await mongoose.connect(envConfig.mongoUri);
    console.log('✅ Conectado a MongoDB de PRODUCCIÓN\n');

    const church = await Church.findOne();
    console.log('🏛️  IGLESIA');
    console.log(`   Nombre: ${church?.name || 'N/A'}`);
    console.log(`   Plan: ${church?.plan || 'N/A'}`);
    console.log(`   ID: ${church?._id || 'N/A'}`);

    const userCount = await User.countDocuments();
    console.log(`\n👤 USUARIOS: ${userCount}`);
    const users = await User.find().select('fullName email role');
    users.forEach(u => {
      console.log(`   - ${u.fullName} (${u.email}) - ${u.role}`);
    });

    const activityTypeCount = await ActivityType.countDocuments();
    console.log(`\n📋 TIPOS DE ACTIVIDADES: ${activityTypeCount}`);

    const roleCount = await Role.countDocuments();
    console.log(`👥 ROLES MINISTERIALES: ${roleCount}`);

    const statusCount = await PersonStatus.countDocuments();
    console.log(`📊 ESTADOS DE PERSONAS: ${statusCount}`);

    const personCount = await Person.countDocuments();
    console.log(`🙋 PERSONAS: ${personCount}`);

    const programCount = await Program.countDocuments();
    console.log(`📅 PROGRAMAS CREADOS: ${programCount}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ BASE DE DATOS LISTA PARA USAR');
    console.log('='.repeat(60));
    console.log('\n🌐 Frontend: https://software-iglesias-frontend.vercel.app');
    console.log('🔗 Backend API: https://sotware-iglesias.onrender.com');
    console.log('\n📧 Credenciales de acceso:');
    console.log('   Email: admin@software.com');
    console.log('   Password: Pass1234');
    console.log('='.repeat(60) + '\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkProductionData();
