/**
 * Script de prueba de conexión a MongoDB
 * Ejecutar con: node test-db-connection.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/church-program-manager';

async function testConnection() {
  console.log('🔍 Probando conexión a MongoDB...');
  console.log('📍 URI:', MONGODB_URI);
  
  try {
    // Conectar
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ Conexión exitosa a MongoDB');
    console.log('📊 Base de datos:', mongoose.connection.name);
    console.log('🖥️  Host:', mongoose.connection.host);
    console.log('🔢 Puerto:', mongoose.connection.port);
    
    // Obtener estadísticas de la base de datos
    const stats = await mongoose.connection.db.stats();
    console.log('\n📈 Estadísticas de la base de datos:');
    console.log('   - Colecciones:', stats.collections);
    console.log('   - Documentos:', stats.objects);
    console.log('   - Tamaño de datos:', (stats.dataSize / 1024 / 1024).toFixed(2), 'MB');
    console.log('   - Tamaño de almacenamiento:', (stats.storageSize / 1024 / 1024).toFixed(2), 'MB');
    
    // Listar colecciones
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📚 Colecciones encontradas:', collections.length);
    collections.forEach(col => {
      console.log('   -', col.name);
    });
    
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('\n🔌 Conexión cerrada correctamente');
    
  } catch (error) {
    console.error('\n❌ Error al conectar a MongoDB:');
    console.error('   Mensaje:', error.message);
    console.error('   Código:', error.code);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Sugerencia: MongoDB no está corriendo. Inicia el servicio de MongoDB.');
    } else if (error.message.includes('authentication')) {
      console.error('\n💡 Sugerencia: Verifica las credenciales de autenticación.');
    }
    
    process.exit(1);
  }
}

testConnection();
