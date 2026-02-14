import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import ActivityType from '../models/ActivityType.model';
import Role from '../models/Role.model';
import PersonStatus from '../models/PersonStatus.model';
import Person from '../models/Person.model';
import Church from '../models/Church.model';
import User from '../models/User.model';
import bcrypt from 'bcryptjs';

// URI DIRECTO A MONGODB ATLAS (PRODUCCIÓN)
const MONGODB_ATLAS_URI = 'mongodb+srv://sotwareiglesiav1:y9dG4RpjSNdpeo5x@software-iglesia.e4pdeui.mongodb.net/church-program-manager?retryWrites=true&w=majority';

async function importToAtlas() {
  try {
    console.log('🌐 Conectando a MongoDB Atlas...');
    await mongoose.connect(MONGODB_ATLAS_URI);
    console.log('✅ Conectado a MongoDB Atlas de PRODUCCIÓN\n');

    // ═══════════════════════════════════════════════════════════════
    // PASO 1: CREAR IGLESIA
    // ═══════════════════════════════════════════════════════════════
    console.log('🏛️  Creando iglesia...');
    
    let church = await Church.findOne();
    if (!church) {
      church = await Church.create({
        name: 'IGLESIA DIOS FUERTE ARCA EVANGELICA',
        address: {
          street: 'Calle Principal',
          city: 'Santo Domingo',
          state: 'Distrito Nacional',
          country: 'República Dominicana',
          postalCode: '10000',
        },
        phone: '',
        email: '',
        plan: 'FREE',
        maxUsers: 5,
        features: {
          programs: true,
          letters: true,
          reports: true,
          whatsapp: true,
          email: false,
          customTemplates: true,
        },
        isActive: true,
      });
      console.log(`   ✅ Iglesia creada: ${church.name}`);
    } else {
      console.log(`   ℹ️  Iglesia ya existe: ${church.name}`);
    }

    // ═══════════════════════════════════════════════════════════════
    // PASO 2: CREAR USUARIO ADMIN
    // ═══════════════════════════════════════════════════════════════
    console.log('\n👤 Creando usuario admin...');
    
    const adminEmail = 'admin@iglesia.com';
    let admin = await User.findOne({ email: adminEmail }).select('+passwordHash');
    
    if (!admin) {
      admin = await User.create({
        churchId: church._id,
        email: adminEmail,
        passwordHash: 'password123', // El pre-save hook lo hasheará
        fullName: 'Lider de Alabanza y Adoracion | Andy Rosado',
        role: 'ADMIN',
        isActive: true,
        useCustomPermissions: false,
        permissions: [],
      });
      console.log(`   ✅ Usuario creado: ${admin.email}`);
    } else {
      console.log(`   ℹ️  Usuario ya existe: ${admin.email}`);
    }

    // ═══════════════════════════════════════════════════════════════
    // PASO 3: IMPORTAR DATOS DESDE JSON
    // ═══════════════════════════════════════════════════════════════
    
    // Leer archivo de datos
    const dataPath = path.join(__dirname, 'local-data-export.json');
    if (fs.existsSync(dataPath)) {
      const exportData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
      
      console.log('\n📋 Importando Activity Types...');
      let created = 0;
      for (const item of exportData.activityTypes) {
        const exists = await ActivityType.findOne({ name: item.name, churchId: church._id });
        if (!exists) {
          await ActivityType.create({ ...item, churchId: church._id });
          created++;
        }
      }
      console.log(`   ✅ Creados: ${created} | Omitidos: ${exportData.activityTypes.length - created}`);

      console.log('\n👥 Importando Roles...');
      created = 0;
      for (const item of exportData.roles) {
        const exists = await Role.findOne({ name: item.name, churchId: church._id });
        if (!exists) {
          await Role.create({ ...item, churchId: church._id });
          created++;
        }
      }
      console.log(`   ✅ Creados: ${created} | Omitidos: ${exportData.roles.length - created}`);

      console.log('\n📊 Importando Person Statuses...');
      created = 0;
      for (const item of exportData.personStatuses) {
        const exists = await PersonStatus.findOne({ name: item.name, churchId: church._id });
        if (!exists) {
          await PersonStatus.create({ ...item, churchId: church._id });
          created++;
        }
      }
      console.log(`   ✅ Creados: ${created} | Omitidos: ${exportData.personStatuses.length - created}`);
    }

    // Importar personas
    const personsPath = path.join(__dirname, 'persons-export.json');
    if (fs.existsSync(personsPath)) {
      const personsData = JSON.parse(fs.readFileSync(personsPath, 'utf-8'));
      
      console.log('\n🙋 Importando Personas...');
      let created = 0;
      for (const person of personsData.persons) {
        const exists = await Person.findOne({ 
          churchId: church._id,
          fullName: person.fullName,
        });
        
        if (!exists) {
          // Limpiar roles inválidos
          const cleanedPerson = {
            ...person,
            churchId: church._id,
            roles: person.roles ? person.roles.filter((r: any) => r.roleId && r.roleName) : [],
          };
          
          await Person.create(cleanedPerson);
          created++;
        }
      }
      console.log(`   ✅ Creados: ${created} | Omitidos: ${personsData.persons.length - created}`);
    }

    // ═══════════════════════════════════════════════════════════════
    // RESUMEN FINAL
    // ═══════════════════════════════════════════════════════════════
    console.log('\n' + '═'.repeat(60));
    console.log('✅ IMPORTACIÓN A MONGODB ATLAS COMPLETADA');
    console.log('═'.repeat(60));

    const stats = {
      users: await User.countDocuments(),
      churches: await Church.countDocuments(),
      activityTypes: await ActivityType.countDocuments(),
      roles: await Role.countDocuments(),
      personStatuses: await PersonStatus.countDocuments(),
      persons: await Person.countDocuments(),
    };

    console.log('\n📊 Estadísticas finales en Atlas:');
    console.log(`   Iglesias: ${stats.churches}`);
    console.log(`   Usuarios: ${stats.users}`);
    console.log(`   Activity Types: ${stats.activityTypes}`);
    console.log(`   Roles: ${stats.roles}`);
    console.log(`   Person Statuses: ${stats.personStatuses}`);
    console.log(`   Personas: ${stats.persons}`);

    console.log('\n🔐 Credenciales de acceso:');
    console.log(`   📧 Email: admin@iglesia.com`);
    console.log(`   🔑 Password: password123`);
    console.log('\n🌐 URL Frontend: https://software-iglesias-frontend.vercel.app');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

importToAtlas();
