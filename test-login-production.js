/**
 * Script de prueba para verificar que el login devuelve correctamente isSuperUser
 */

const axios = require('axios');

const API_URL = 'https://sotware-iglesias.onrender.com/api/v1';

async function testLogin() {
  try {
    console.log('🔍 Probando login en producción...\n');
    
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@iglesia.com',
      password: process.argv[2] || 'tu-password-aqui'
    });

    const { user, accessToken } = response.data.data;

    console.log('✅ Login exitoso\n');
    console.log('═══════════════════════════════════════');
    console.log('📊 DATOS DEL USUARIO');
    console.log('═══════════════════════════════════════');
    console.log(`Email: ${user.email}`);
    console.log(`Nombre: ${user.fullName}`);
    console.log(`Rol: ${user.role}`);
    console.log(`ChurchId: ${user.churchId}`);
    console.log(`\n🔑 isSuperUser: ${user.isSuperUser} ${user.isSuperUser ? '✅' : '❌'}`);
    console.log(`\n📝 Permisos (${user.permissions?.length || 0}):`);
    
    if (user.permissions && user.permissions.length > 0) {
      // Mostrar algunos permisos relevantes
      const relevantPerms = user.permissions.filter(p => 
        p.includes('finances:') || p.includes('users:manage')
      );
      relevantPerms.forEach(p => console.log(`   • ${p}`));
      
      // Verificar permisos específicos de finanzas
      const hasFinancesEdit = user.permissions.includes('finances:edit');
      const hasFinancesDelete = user.permissions.includes('finances:delete');
      
      console.log('\n───────────────────────────────────────');
      console.log('🎯 PERMISOS CRÍTICOS:');
      console.log(`   finances:edit   → ${hasFinancesEdit ? '✅ SÍ' : '❌ NO'}`);
      console.log(`   finances:delete → ${hasFinancesDelete ? '✅ SÍ' : '❌ NO'}`);
      console.log('───────────────────────────────────────');
    } else {
      console.log('   ⚠️  Sin permisos');
    }

    console.log(`\n🔐 Token: ${accessToken.substring(0, 50)}...`);
    console.log('═══════════════════════════════════════\n');

    // Diagnóstico
    if (!user.isSuperUser) {
      console.log('⚠️  PROBLEMA: isSuperUser es false');
      console.log('   La base de datos podría no tener el campo actualizado');
      console.log('   O el backend no lo está enviando correctamente\n');
    }

    if (!user.permissions || user.permissions.length === 0) {
      console.log('⚠️  PROBLEMA: No hay permisos');
      console.log('   El usuario no puede hacer nada en el sistema\n');
    }

 const hasRequiredPerms = user.permissions?.includes('finances:edit') && 
                             user.permissions?.includes('finances:delete');
    
    if (user.isSuperUser || hasRequiredPerms) {
      console.log('✅ TODO CORRECTO - Los botones deberían aparecer');
    } else {
      console.log('❌ PROBLEMA - Los botones NO aparecerán porque faltan permisos');
    }

  } catch (error) {
    if (error.response) {
      console.error('❌ Error de autenticación:');
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Mensaje: ${error.response.data?.message || 'Error desconocido'}`);
    } else {
      console.error('❌ Error de conexión:', error.message);
      console.error('   Verifica que el backend esté funcionando');
      console.error('   URL:', API_URL);
    }
  }
}

console.log('═══════════════════════════════════════');
console.log('🧪 TEST DE LOGIN EN PRODUCCIÓN');
console.log('═══════════════════════════════════════\n');

if (!process.argv[2]) {
  console.log('⚠️  No proporcionaste password');
  console.log('Uso: node test-login-production.js <password>\n');
  console.log('Intentando con password de ejemplo...\n');
}

testLogin();
