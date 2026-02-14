require('dotenv').config();
const mongoose = require('mongoose');

async function generateCleaningPrograms() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  // Config
  const NUM_GROUPS = 6;
  const START_DATE = '2026-02-13';
  const END_DATE = '2026-02-28';
  
  // Get data
  const activity = await db.collection('activityTypes').findOne({name: 'Grupo Limpieza de la iglesia en GENERAL'});
  const church = await db.collection('churches').findOne({});
  const user = await db.collection('users').findOne({});
  
  if (!activity) {
    console.log('Error: No se encontró la actividad de limpieza');
    process.exit(1);
  }
  
  // Get active persons (exclude inactive)
  const persons = await db.collection('persons').find({
    status: { $nin: ['INACTIVO', 'INACTIVE', 'inactivo', 'inactive'] }
  }).toArray();
  
  console.log('Total personas activas:', persons.length);
  console.log('Dividiendo en', NUM_GROUPS, 'grupos...\n');
  
  // Shuffle persons (Fisher-Yates)
  const shuffled = [...persons];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  // Divide into groups equitably
  const groups = Array.from({ length: NUM_GROUPS }, () => []);
  shuffled.forEach((person, idx) => {
    const groupIdx = idx % NUM_GROUPS;
    groups[groupIdx].push({
      id: person._id,
      name: person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim(),
      phone: person.phone || ''
    });
  });
  
  // Print groups
  console.log('═════════════════════════════════════════════════════════════');
  console.log('                     DISTRIBUCIÓN DE GRUPOS                  ');
  console.log('═════════════════════════════════════════════════════════════\n');
  groups.forEach((g, i) => {
    console.log(`▶ GRUPO ${i + 1} (${g.length} personas):`);
    g.forEach((m, j) => console.log(`   ${j + 1}. ${m.name}${m.phone ? ' - ' + m.phone : ''}`));
    console.log('');
  });
  
  // Generate dates based on activity daysOfWeek
  const start = new Date(START_DATE + 'T12:00:00');
  const end = new Date(END_DATE + 'T12:00:00');
  const daysSet = new Set(activity.daysOfWeek || [0,1,2,3,4,5,6]);
  const dates = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    if (daysSet.has(cursor.getDay())) {
      const d = new Date(cursor);
      d.setHours(0, 0, 0, 0);
      dates.push(d);
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  
  console.log('═════════════════════════════════════════════════════════════');
  console.log(`     Generando ${dates.length} programas de limpieza...      `);
  console.log('═════════════════════════════════════════════════════════════\n');
  
  // Create programs with rotating group assignment
  let created = 0;
  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const groupIndex = i % NUM_GROUPS;
    const groupNumber = groupIndex + 1;
    
    const program = {
      churchId: church._id,
      activityType: { id: activity._id, name: activity.name },
      programDate: date,
      status: 'DRAFT',
      generationType: 'cleaning_groups',
      assignedGroupNumber: groupNumber,
      totalGroups: NUM_GROUPS,
      cleaningMembers: groups[groupIndex],
      assignments: [],
      churchName: church.name || '',
      churchSub: church.subTitle || '',
      location: church.address ? [church.address.city, church.address.state].filter(Boolean).join(', ') : '',
      logoUrl: church.logoUrl || '',
      programTime: activity.defaultTime || '10:00',
      ampm: 'AM',
      generatedBy: { id: user._id, name: user.fullName || 'Sistema' },
      generatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection('programs').insertOne(program);
    
    const dateStr = date.toLocaleDateString('es-DO', { weekday: 'short', day: 'numeric', month: 'short' });
    console.log(`✓ ${dateStr} → Grupo ${groupNumber} (${groups[groupIndex].length} personas)`);
    created++;
  }
  
  console.log('\n═════════════════════════════════════════════════════════════');
  console.log(`   ✅ COMPLETADO: ${created} programas de limpieza creados`);
  console.log('═════════════════════════════════════════════════════════════');
  
  await mongoose.disconnect();
}

generateCleaningPrograms().catch(e => {
  console.log('Error:', e);
  process.exit(1);
});
