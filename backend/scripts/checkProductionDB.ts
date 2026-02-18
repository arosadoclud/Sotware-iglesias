/**
 * Script para verificar el estado de la base de datos de producción
 * y mostrar qué necesita ser migrado
 * 
 * Uso: 
 * npx ts-node scripts/checkProductionDB.ts
 */

import mongoose from 'mongoose';
import User from '../src/models/User.model';
import { FinanceCategory } from '../src/models/FinanceCategory.model';
import { FinanceTransaction } from '../src/models/FinanceTransaction.model';
import Church from '../src/models/Church.model';
import envConfig from '../src/config/env';

async function checkProductionDB() {
  try {
    console.log('🔍 Verificando estado de la base de datos de producción...\n');
    
    // Conectar a MongoDB
    await mongoose.connect(envConfig.mongoUri);
    console.log('✓ Conectado a MongoDB Atlas');
    console.log(`📍 Base de datos: ${mongoose.connection.name}\n`);

    // ==========================================
    // 1. VERIFICAR USUARIOS
    // ==========================================
    console.log('═══════════════════════════════════════');
    console.log('👥 USUARIOS');
    console.log('═══════════════════════════════════════');
    
    const totalUsers = await User.countDocuments();
    const usersWithSuperUser = await User.countDocuments({ isSuperUser: { $exists: true } });
    const usersWithoutSuperUser = totalUsers - usersWithSuperUser;
    const superUsers = await User.countDocuments({ isSuperUser: true });
    
    console.log(`Total usuarios: ${totalUsers}`);
    console.log(`Usuarios con campo isSuperUser: ${usersWithSuperUser}`);
    console.log(`Usuarios SIN campo isSuperUser: ${usersWithoutSuperUser} ${usersWithoutSuperUser > 0 ? '❌ NECESITA MIGRACIÓN' : '✓'}`);
    console.log(`Super usuarios activos: ${superUsers}`);
    
    if (superUsers > 0) {
      console.log('\nSuper usuarios encontrados:');
      const superUsersList = await User.find({ isSuperUser: true }, 'email fullName role churchId');
      superUsersList.forEach(user => {
        console.log(`  • ${user.email} - ${user.fullName} (${user.role})`);
      });
    }
    
    // ==========================================
    // 2. VERIFICAR CATEGORÍAS
    // ==========================================
    console.log('\n═══════════════════════════════════════');
    console.log('💰 CATEGORÍAS DE FINANZAS');
    console.log('═══════════════════════════════════════');
    
    const totalCategories = await FinanceCategory.countDocuments();
    const categoriesWithColor = await FinanceCategory.countDocuments({ color: { $exists: true } });
    const categoriesWithoutColor = totalCategories - categoriesWithColor;
    const incomeCategories = await FinanceCategory.countDocuments({ type: 'INCOME' });
    const expenseCategories = await FinanceCategory.countDocuments({ type: 'EXPENSE' });
    
    console.log(`Total categorías: ${totalCategories}`);
    console.log(`Categorías con campo color: ${categoriesWithColor}`);
    console.log(`Categorías SIN campo color: ${categoriesWithoutColor} ${categoriesWithoutColor > 0 ? '❌ NECESITA MIGRACIÓN' : '✓'}`);
    console.log(`Categorías de ingreso: ${incomeCategories}`);
    console.log(`Categorías de gasto: ${expenseCategories}`);
    
    if (categoriesWithoutColor > 0) {
      console.log('\nCategorías sin color:');
      const categoriesNoColor = await FinanceCategory.find({ color: { $exists: false } }, 'name code type');
      categoriesNoColor.forEach(cat => {
        console.log(`  • ${cat.name} (${cat.code || 'sin código'}) - Tipo: ${cat.type}`);
      });
    }

    // ==========================================
    // 3. VERIFICAR TRANSACCIONES
    // ==========================================
    console.log('\n═══════════════════════════════════════');
    console.log('💵 TRANSACCIONES DE FINANZAS');
    console.log('═══════════════════════════════════════');
    
    const totalTransactions = await FinanceTransaction.countDocuments();
    const incomeTransactions = await FinanceTransaction.countDocuments({ type: 'INCOME' });
    const expenseTransactions = await FinanceTransaction.countDocuments({ type: 'EXPENSE' });
    
    console.log(`Total transacciones: ${totalTransactions}`);
    console.log(`Transacciones de ingreso: ${incomeTransactions}`);
    console.log(`Transacciones de gasto: ${expenseTransactions}`);

    // ==========================================
    // 4. VERIFICAR IGLESIAS
    // ==========================================
    console.log('\n═══════════════════════════════════════');
    console.log('⛪ IGLESIAS');
    console.log('═══════════════════════════════════════');
    
    const totalChurches = await Church.countDocuments();
    console.log(`Total iglesias: ${totalChurches}`);
    
    if (totalChurches > 0) {
      const churches = await Church.find({}, 'name plan');
      churches.forEach(church => {
        console.log(`  • ${church.name} - Plan: ${(church as any).plan || 'FREE'}`);
      });
    }

    // ==========================================
    // RESUMEN
    // ==========================================
    console.log('\n═══════════════════════════════════════');
    console.log('📊 RESUMEN DE MIGRACIÓN NECESARIA');
    console.log('═══════════════════════════════════════\n');
    
    const needsMigration = usersWithoutSuperUser > 0 || categoriesWithoutColor > 0;
    
    if (needsMigration) {
      console.log('❌ LA BASE DE DATOS NECESITA MIGRACIÓN\n');
      console.log('Acciones requeridas:');
      
      if (usersWithoutSuperUser > 0) {
        console.log(`  • Agregar campo isSuperUser a ${usersWithoutSuperUser} usuarios`);
      }
      
      if (categoriesWithoutColor > 0) {
        console.log(`  • Agregar campo color a ${categoriesWithoutColor} categorías`);
      }
      
      console.log('\n🔧 Para aplicar la migración ejecute:');
      console.log('   npx ts-node scripts/migrateProductionDB.ts\n');
    } else {
      console.log('✅ LA BASE DE DATOS ESTÁ ACTUALIZADA\n');
      console.log('No se requiere migración.\n');
      
      if (superUsers === 0) {
        console.log('⚠️  ADVERTENCIA: No hay super usuarios configurados\n');
        console.log('Para asignar un super usuario ejecute:');
        console.log('   npx ts-node scripts/setSuperUser.ts <email>\n');
      }
    }

  } catch (error: any) {
    console.error('❌ Error al verificar la base de datos:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✓ Desconectado de MongoDB\n');
  }
}

// Ejecutar verificación
checkProductionDB();
