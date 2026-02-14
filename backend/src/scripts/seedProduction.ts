import mongoose from 'mongoose';
import envConfig from '../config/env';
import ActivityType from '../models/ActivityType.model';
import Role from '../models/Role.model';
import Church from '../models/Church.model';

async function seedProduction() {
  try {
    await mongoose.connect(envConfig.mongoUri);
    console.log('✅ Conectado a MongoDB de producción');

    // Obtener la iglesia existente (creada al registrar el admin)
    const church = await Church.findOne();
    if (!church) {
      console.log('❌ No se encontró ninguna iglesia. Ejecuta createSuperAdmin primero.');
      process.exit(1);
    }

    console.log(`✅ Usando iglesia: ${church.name} (${church._id})`);

    // ═══════════════════════════════════════════════════════════════
    // TIPOS DE ACTIVIDADES
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📋 Creando tipos de actividades...');
    
    const activityTypes = [
      { name: 'Alabanza', description: 'Cántico de alabanza congregacional', churchId: church._id, isActive: true },
      { name: 'Adoración', description: 'Momento de adoración profunda', churchId: church._id, isActive: true },
      { name: 'Oración', description: 'Tiempo de oración', churchId: church._id, isActive: true },
      { name: 'Bienvenida', description: 'Saludo y bienvenida a los asistentes', churchId: church._id, isActive: true },
      { name: 'Predicación', description: 'Mensaje principal del servicio', churchId: church._id, isActive: true },
      { name: 'Ofrendas', description: 'Momento de ofrendas y diezmos', churchId: church._id, isActive: true },
      { name: 'Testimonios', description: 'Testimonios de los hermanos', churchId: church._id, isActive: true },
      { name: 'Lectura Bíblica', description: 'Lectura de pasaje bíblico', churchId: church._id, isActive: true },
      { name: 'Santa Cena', description: 'Celebración de la Santa Cena', churchId: church._id, isActive: true },
      { name: 'Ministerio Infantil', description: 'Actividades para niños', churchId: church._id, isActive: true },
      { name: 'Ministerio Juvenil', description: 'Actividades para jóvenes', churchId: church._id, isActive: true },
      { name: 'Anuncios', description: 'Anuncios e información general', churchId: church._id, isActive: true },
      { name: 'Bendición Final', description: 'Oración de bendición y despedida', churchId: church._id, isActive: true },
    ];

    for (const actType of activityTypes) {
      const exists = await ActivityType.findOne({ 
        name: actType.name, 
        churchId: church._id 
      });
      
      if (!exists) {
        await ActivityType.create(actType);
        console.log(`   ✓ ${actType.name}`);
      } else {
        console.log(`   ⊙ ${actType.name} (ya existe)`);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // ROLES MINISTERIALES
    // ═══════════════════════════════════════════════════════════════
    console.log('\n👥 Creando roles ministeriales...');
    
    const roles = [
      { name: 'Pastor', description: 'Pastor principal', churchId: church._id, isActive: true },
      { name: 'Co-Pastor', description: 'Pastor asociado', churchId: church._id, isActive: true },
      { name: 'Anciano', description: 'Líder de la iglesia', churchId: church._id, isActive: true },
      { name: 'Diácono', description: 'Servidor de la iglesia', churchId: church._id, isActive: true },
      { name: 'Maestro', description: 'Maestro de escuela dominical', churchId: church._id, isActive: true },
      { name: 'Líder de Alabanza', description: 'Dirige la alabanza', churchId: church._id, isActive: true },
      { name: 'Músico', description: 'Instrumentista', churchId: church._id, isActive: true },
      { name: 'Vocalista', description: 'Cantante del grupo de alabanza', churchId: church._id, isActive: true },
      { name: 'Ujier', description: 'Recepcionista y organizador', churchId: church._id, isActive: true },
      { name: 'Tesorero', description: 'Encargado de finanzas', churchId: church._id, isActive: true },
      { name: 'Secretario', description: 'Registro y documentación', churchId: church._id, isActive: true },
      { name: 'Líder de Jóvenes', description: 'Ministerio juvenil', churchId: church._id, isActive: true },
      { name: 'Líder de Niños', description: 'Ministerio infantil', churchId: church._id, isActive: true },
      { name: 'Intercesión', description: 'Equipo de oración', churchId: church._id, isActive: true },
      { name: 'Evangelismo', description: 'Equipo evangelístico', churchId: church._id, isActive: true },
      { name: 'Sonido', description: 'Encargado de audio', churchId: church._id, isActive: true },
      { name: 'Multimedia', description: 'Proyección y video', churchId: church._id, isActive: true },
      { name: 'Limpieza', description: 'Mantenimiento del templo', churchId: church._id, isActive: true },
      { name: 'Seguridad', description: 'Seguridad del templo', churchId: church._id, isActive: true },
      { name: 'Parqueo', description: 'Organización de estacionamiento', churchId: church._id, isActive: true },
    ];

    for (const role of roles) {
      const exists = await Role.findOne({ 
        name: role.name, 
        churchId: church._id 
      });
      
      if (!exists) {
        await Role.create(role);
        console.log(`   ✓ ${role.name}`);
      } else {
        console.log(`   ⊙ ${role.name} (ya existe)`);
      }
    }

    console.log('\n✅ Seed de producción completado exitosamente!');
    console.log(`📊 Estadísticas:`);
    console.log(`   - Tipos de actividades: ${await ActivityType.countDocuments({ churchId: church._id })}`);
    console.log(`   - Roles ministeriales: ${await Role.countDocuments({ churchId: church._id })}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error en seed:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedProduction();
