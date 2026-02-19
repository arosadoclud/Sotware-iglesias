const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/church-program-manager')
  .then(async () => {
    console.log('✅ Conectado\n');

    const ActivityType = mongoose.connection.collection('activitytypes');
    const activities = await ActivityType.find().toArray();

    console.log(`📋 Total de actividades: ${activities.length}\n`);

    activities.forEach((act, idx) => {
      console.log(`${idx + 1}. ${act.name}`);
      console.log(`   ID: ${act._id}`);
      console.log(`   GenerationType: ${act.generationType || 'NO DEFINIDO'}`);
      console.log(`   IsActive: ${act.isActive}`);
      console.log(`   DayOfWeek: ${act.dayOfWeek}`);
      console.log(`   DaysOfWeek: ${JSON.stringify(act.daysOfWeek || [])}`);
      console.log('');
    });

    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(console.error);
