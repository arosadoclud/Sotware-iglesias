const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/church-manager';

async function checkAndFixIndexes() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Ver índices actuales
    console.log('📋 ÍNDICES ACTUALES EN users:');
    console.log('=====================================');
    const indexes = await usersCollection.indexes();
    indexes.forEach(index => {
      console.log('Índice:', index.name);
      console.log('Campos:', JSON.stringify(index.key));
      console.log('Único:', index.unique || false);
      console.log('---');
    });
    console.log('=====================================\n');

    // Verificar si existe índice único en email
    const emailIndex = indexes.find(idx => idx.key && idx.key.email);
    
    if (!emailIndex) {
      console.log('⚠️  NO HAY ÍNDICE EN email, creando...');
      await usersCollection.createIndex({ email: 1 }, { unique: true });
      console.log('✅ Índice único creado en email');
    } else if (!emailIndex.unique) {
      console.log('⚠️  EL ÍNDICE EN email NO ES ÚNICO, recreando...');
      await usersCollection.dropIndex('email_1');
      await usersCollection.createIndex({ email: 1 }, { unique: true });
      console.log('✅ Índice único recreado en email');
    } else {
      console.log('✅ El índice único en email ya existe correctamente');
    }

    // Verificar duplicados después de crear índice
    console.log('\n🔍 Verificando duplicados en users...');
    const duplicates = await usersCollection.aggregate([
      { $group: { _id: '$email', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    if (duplicates.length > 0) {
      console.log('⚠️  DUPLICADOS ENCONTRADOS:');
      duplicates.forEach(dup => {
        console.log(`Email: ${dup._id}, Cantidad: ${dup.count}`);
      });
    } else {
      console.log('✅ No hay emails duplicados');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Conexión cerrada');
    process.exit(0);
  }
}

checkAndFixIndexes();
