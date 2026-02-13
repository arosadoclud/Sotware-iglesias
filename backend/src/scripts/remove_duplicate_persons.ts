import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/church-program-manager';

const personSchema = new mongoose.Schema({}, { strict: false });
const Person = mongoose.model('Person', personSchema, 'persons');

async function removeDuplicates() {
  await mongoose.connect(MONGO_URI);
  console.log('Conectado a MongoDB');

  // Agrupar por churchId + fullName + ministry
  const duplicates = await Person.aggregate([
    {
      $group: {
        _id: { churchId: '$churchId', fullName: '$fullName', ministry: '$ministry' },
        ids: { $addToSet: '$_id' },
        count: { $sum: 1 }
      }
    },
    { $match: { count: { $gt: 1 } } }
  ]);

  let totalRemoved = 0;
  for (const doc of duplicates) {
    // Mantener el más antiguo (menor _id)
    const idsSorted = doc.ids.sort();
    const remove = idsSorted.slice(1); // Mantener el primero, eliminar el resto
    if (remove.length > 0) {
      const res = await Person.deleteMany({ _id: { $in: remove } });
      totalRemoved += res.deletedCount || 0;
      console.log(`Eliminados ${res.deletedCount} duplicados de ${doc._id.fullName}`);
    }
  }

  console.log(`Total duplicados eliminados: ${totalRemoved}`);
  await mongoose.disconnect();
}

removeDuplicates().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
