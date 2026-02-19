const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/church-manager';

async function resetAdminUser() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const User = mongoose.connection.collection('users');
    const Person = mongoose.connection.collection('persons');
    
    console.log('🗑️  ELIMINANDO usuario admin@iglesia.com y datos relacionados...\n');
    
    // 1. Buscar usuario actual
    const adminUser = await User.findOne({ email: 'admin@iglesia.com' });
    
    if (adminUser) {
      console.log('Usuario encontrado:');
      console.log('  Email:', adminUser.email);
      console.log('  Rol:', adminUser.role);
      console.log('  ID:', adminUser._id);
      
      // 2. Eliminar Person vinculada (si existe)
      const linkedPerson = await Person.findOne({ userId: adminUser._id });
      if (linkedPerson) {
        await Person.deleteOne({ _id: linkedPerson._id });
        console.log('\n  ✅ Person vinculada eliminada');
      }
      
      // 3. Eliminar usuario
      await User.deleteOne({ _id: adminUser._id });
      console.log('  ✅ Usuario eliminado\n');
      
      console.log('='.repeat(60));
      console.log('✅ LIMPIEZA COMPLETA');
      console.log('='.repeat(60));
      console.log('\n📋 SIGUIENTE PASO:');
      console.log('   1. Limpia el navegador con: localStorage.clear()');
      console.log('   2. Recarga la página (F5)');
      console.log('   3. Ve a REGISTRO');
      console.log('   4. Registra: admin@iglesia.com');
      console.log('   5. El sistema lo detectará como SUPER_ADMIN automáticamente');
      console.log('   6. Login directo al dashboard con todos los permisos\n');
      
    } else {
      console.log('❌ No se encontró usuario admin@iglesia.com');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Conexión cerrada');
    process.exit(0);
  }
}

resetAdminUser();
