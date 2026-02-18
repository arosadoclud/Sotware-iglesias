/**
 * Script para establecer un usuario como superusuario EN PRODUCCIÓN
 * 
 * Uso: 
 * npx ts-node scripts/setSuperUserProduction.ts <email> <mongoUri>
 * 
 * Ejemplo:
 * npx ts-node scripts/setSuperUserProduction.ts admin@iglesia.com "mongodb+srv://..."
 */

import mongoose from 'mongoose';
import User from '../src/models/User.model';

async function setSuperUserProduction(email: string, mongoUri: string) {
  try {
    console.log('🔄 Conectando a MongoDB de PRODUCCIÓN...');
    
    // Conectar a la base de datos de producción
    await mongoose.connect(mongoUri);
    console.log('✓ Conectado a MongoDB de producción\n');

    // Buscar el usuario por email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.error(`✗ Usuario con email "${email}" no encontrado`);
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log('📋 Usuario encontrado:');
    console.log(`  Email: ${user.email}`);
    console.log(`  Nombre: ${user.fullName}`);
    console.log(`  Rol: ${user.role}`);
    console.log(`  SuperUsuario ANTES: ${user.isSuperUser || false}\n`);

    // Actualizar a superusuario
    user.isSuperUser = true;
    await user.save();

    console.log('✅ Usuario actualizado exitosamente');
    console.log('═════════════════════════════════════');
    console.log(`  Email: ${user.email}`);
    console.log(`  Nombre: ${user.fullName}`);
    console.log(`  Rol: ${user.role}`);
    console.log(`  SuperUsuario DESPUÉS: ${user.isSuperUser}`);
    console.log(`  Iglesia: ${user.churchId}`);
    console.log('═════════════════════════════════════\n');

    // Verificar que se guardó correctamente
    const verifyUser = await User.findOne({ email: email.toLowerCase() });
    if (verifyUser?.isSuperUser) {
      console.log('✅ VERIFICADO: El cambio se guardó correctamente en la base de datos');
      console.log('   El usuario ahora es SUPERUSUARIO en producción\n');
      console.log('🔴 IMPORTANTE: Para que el cambio tome efecto:');
      console.log('   1. Cierra sesión en https://sotware-iglesias.vercel.app/');
      console.log('   2. Vuelve a iniciar sesión con las mismas credenciales');
      console.log('   3. Los botones de editar/eliminar deberían aparecer\n');
    } else {
      console.error('❌ ERROR: El cambio NO se guardó correctamente');
    }

    await mongoose.disconnect();
    console.log('✓ Desconectado de MongoDB');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Obtener argumentos de línea de comandos
const email = process.argv[2];
const mongoUri = process.argv[3];

if (!email || !mongoUri) {
  console.error('❌ Faltan argumentos');
  console.log('\nUso:');
  console.log('  npx ts-node scripts/setSuperUserProduction.ts <email> <mongoUri>\n');
  console.log('Ejemplo:');
  console.log('  npx ts-node scripts/setSuperUserProduction.ts admin@iglesia.com "mongodb+srv://user:pass@cluster.mongodb.net/dbname"\n');
  process.exit(1);
}

console.log('═══════════════════════════════════════');
console.log('🚀 ACTUALIZAR SUPERUSUARIO EN PRODUCCIÓN');
console.log('═══════════════════════════════════════\n');

setSuperUserProduction(email, mongoUri);
