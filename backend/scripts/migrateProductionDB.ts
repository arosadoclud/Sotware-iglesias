/**
 * Script de migración para actualizar la base de datos de producción
 * con todos los cambios implementados:
 * 
 * 1. Agregar campo 'color' a categorías de finanzas existentes
 * 2. Verificar campo 'isSuperUser' en usuarios
 * 3. Actualizar estructura de datos según nuevos modelos
 * 
 * Uso: 
 * npx ts-node scripts/migrateProductionDB.ts
 */

import mongoose from 'mongoose';
import User from '../src/models/User.model';
import { FinanceCategory } from '../src/models/FinanceCategory.model';
import envConfig from '../src/config/env';

// Colores por defecto para categorías según su código
const DEFAULT_COLORS: Record<string, string> = {
  // Ingresos
  'ING-01': '#22c55e', // Diezmos - Verde
  'ING-02': '#3b82f6', // Ofrendas - Azul
  'ING-03': '#8b5cf6', // Ofrendas Especiales - Púrpura
  'ING-04': '#f59e0b', // Otros Ingresos - Ámbar
  
  // Gastos
  'GAS-01': '#ef4444', // Pago del Local - Rojo
  'GAS-02': '#f97316', // Servicios Básicos - Naranja
  'GAS-03': '#84cc16', // Mantenimiento - Lima
  'GAS-04': '#06b6d4', // Ministerios - Cian
  'GAS-05': '#a855f7', // Otros Gastos - Violeta
};

// Color por defecto según el tipo si no hay código específico
const DEFAULT_COLOR_BY_TYPE: Record<string, string> = {
  'INCOME': '#10b981', // Verde para ingresos
  'EXPENSE': '#ef4444', // Rojo para gastos
};

async function migrateProductionDB() {
  try {
    console.log('🚀 Iniciando migración de base de datos de producción...\n');
    
    // Conectar a MongoDB
    await mongoose.connect(envConfig.mongoUri);
    console.log('✓ Conectado a MongoDB Atlas\n');

    // ==========================================
    // 1. MIGRAR USUARIOS - Agregar campo isSuperUser
    // ==========================================
    console.log('📋 1. Migrando usuarios...');
    
    const usersWithoutSuperUser = await User.countDocuments({ 
      isSuperUser: { $exists: false } 
    });
    
    if (usersWithoutSuperUser > 0) {
      await User.updateMany(
        { isSuperUser: { $exists: false } },
        { $set: { isSuperUser: false } }
      );
      console.log(`   ✓ Actualizado campo isSuperUser en ${usersWithoutSuperUser} usuarios`);
    } else {
      console.log('   ✓ Todos los usuarios ya tienen el campo isSuperUser');
    }

    // Mostrar usuarios actuales
    const totalUsers = await User.countDocuments();
    const superUsers = await User.countDocuments({ isSuperUser: true });
    console.log(`   📊 Total usuarios: ${totalUsers}`);
    console.log(`   📊 Super usuarios: ${superUsers}\n`);

    // ==========================================
    // 2. MIGRAR CATEGORÍAS - Agregar campo color
    // ==========================================
    console.log('📋 2. Migrando categorías de finanzas...');
    
    const categoriesWithoutColor = await FinanceCategory.countDocuments({
      color: { $exists: false }
    });
    
    if (categoriesWithoutColor > 0) {
      const categories = await FinanceCategory.find({ color: { $exists: false } });
      
      let updated = 0;
      for (const category of categories) {
        let color: string;
        
        // Intentar asignar color según código
        if (category.code && DEFAULT_COLORS[category.code]) {
          color = DEFAULT_COLORS[category.code];
        } 
        // Si no, asignar según tipo
        else if (category.type && DEFAULT_COLOR_BY_TYPE[category.type]) {
          color = DEFAULT_COLOR_BY_TYPE[category.type];
        } 
        // Color por defecto
        else {
          color = '#6b7280'; // Gris neutro
        }
        
        await FinanceCategory.updateOne(
          { _id: category._id },
          { $set: { color } }
        );
        
        updated++;
        console.log(`   ✓ Categoría "${category.name}" - Color: ${color}`);
      }
      
      console.log(`   ✓ Actualizado campo color en ${updated} categorías\n`);
    } else {
      console.log('   ✓ Todas las categorías ya tienen el campo color\n');
    }

    // Mostrar resumen de categorías
    const totalCategories = await FinanceCategory.countDocuments();
    const incomeCategories = await FinanceCategory.countDocuments({ type: 'INCOME' });
    const expenseCategories = await FinanceCategory.countDocuments({ type: 'EXPENSE' });
    console.log(`   📊 Total categorías: ${totalCategories}`);
    console.log(`   📊 Categorías de ingreso: ${incomeCategories}`);
    console.log(`   📊 Categorías de gasto: ${expenseCategories}\n`);

    // ==========================================
    // 3. VERIFICAR ÍNDICES
    // ==========================================
    console.log('📋 3. Verificando índices de base de datos...');
    
    // Verificar índices de User
    const userIndexes = await User.collection.getIndexes();
    console.log(`   ✓ Índices en colección 'users': ${Object.keys(userIndexes).length}`);
    
    // Verificar índices de FinanceCategory
    const categoryIndexes = await FinanceCategory.collection.getIndexes();
    console.log(`   ✓ Índices en colección 'financecategories': ${Object.keys(categoryIndexes).length}\n`);

    // ==========================================
    // RESUMEN FINAL
    // ==========================================
    console.log('═══════════════════════════════════════');
    console.log('✅ MIGRACIÓN COMPLETADA EXITOSAMENTE');
    console.log('═══════════════════════════════════════\n');
    console.log('Cambios aplicados:');
    console.log('  ✓ Campo isSuperUser agregado a usuarios');
    console.log('  ✓ Campo color agregado a categorías de finanzas');
    console.log('  ✓ Índices verificados\n');
    console.log('⚠️  IMPORTANTE:');
    console.log('  • Para asignar superusuario a un usuario específico:');
    console.log('    npx ts-node scripts/setSuperUser.ts <email>\n');
    console.log('  • Reiniciar el servidor backend para aplicar cambios\n');

  } catch (error: any) {
    console.error('❌ Error durante la migración:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✓ Desconectado de MongoDB\n');
  }
}

// Ejecutar migración
migrateProductionDB();
