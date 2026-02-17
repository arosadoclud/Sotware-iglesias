/**
 * Script para establecer un usuario como superusuario
 * 
 * Uso: 
 * npx ts-node scripts/setSuperUser.ts <email>
 * 
 * Ejemplo:
 * npx ts-node scripts/setSuperUser.ts admin@iglesia.com
 */

import mongoose from 'mongoose';
import User from '../src/models/User.model';
import envConfig from '../src/config/env';

async function setSuperUser(email: string) {
  try {
    // Conectar a la base de datos
    await mongoose.connect(envConfig.mongoUri);
    console.log('✓ Conectado a MongoDB');

    // Buscar el usuario por email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.error(`✗ Usuario con email "${email}" no encontrado`);
      process.exit(1);
    }

    // Actualizar a superusuario
    user.isSuperUser = true;
    await user.save();

    console.log('✓ Usuario actualizado exitosamente');
    console.log('─────────────────────────────────────');
    console.log(`  Email: ${user.email}`);
    console.log(`  Nombre: ${user.fullName}`);
    console.log(`  Rol: ${user.role}`);
    console.log(`  SuperUsuario: ${user.isSuperUser}`);
    console.log(`  Iglesia: ${user.churchId}`);
    console.log('─────────────────────────────────────');
    console.log('');
    console.log('Este usuario ahora puede:');
    console.log('  • Gestionar permisos de todos los usuarios');
    console.log('  • Asignar permisos personalizados');
    console.log('  • Controlar acceso completo al sistema');

  } catch (error: any) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n✓ Desconectado de MongoDB');
    process.exit(0);
  }
}

// Obtener email de argumentos de línea de comandos
const email = process.argv[2];

if (!email) {
  console.error('✗ Error: Debe proporcionar un email');
  console.log('');
  console.log('Uso: npx ts-node scripts/setSuperUser.ts <email>');
  console.log('');
  console.log('Ejemplo:');
  console.log('  npx ts-node scripts/setSuperUser.ts admin@iglesia.com');
  process.exit(1);
}

setSuperUser(email);
