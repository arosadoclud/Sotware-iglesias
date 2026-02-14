import mongoose from 'mongoose';
import User from '../models/User.model';
import Program from '../models/Program.model';

const LOCAL_MONGO_URI = 'mongodb://localhost:27017/church-program-manager';

async function checkUserPrograms() {
  try {
    await mongoose.connect(LOCAL_MONGO_URI);
    
    const user = await User.findOne({ email: 'admin@software.com' });
    const allPrograms = await Program.find();
    const userPrograms = await Program.find({ createdBy: user?._id });
    
    console.log('Total programas en LOCAL:', allPrograms.length);
    console.log('Programas del usuario admin@software.com:', userPrograms.length);
    
    if (userPrograms.length > 0) {
      console.log('\nDetalle de programas:');
      userPrograms.forEach(p => {
        console.log(`  - ID: ${p._id}`);
        console.log(`    Título: ${(p as any).title || 'N/A'}`);
        console.log(`    Creado: ${p.createdAt}`);
      });
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error: any) {
    console.error('Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

checkUserPrograms();
