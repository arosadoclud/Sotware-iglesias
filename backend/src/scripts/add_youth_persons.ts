import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Person from '../models/Person.model';
import Role from '../models/Role.model';
import Church from '../models/Church.model';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/church-program-manager';

const persons = [
  { name: 'Andy Rosado', status: 'ACTIVE', roles: 'ALL' },
  { name: 'Mayelin Suarez', status: 'ACTIVE', roles: 'ALL' },
  { name: 'Alba Luz', status: 'ACTIVE', roles: 'ALL' },
  { name: 'Ashanty', status: 'ACTIVE', roles: 'ALL' },
  { name: 'Cristopher', status: 'ACTIVE', roles: 'ALL' },
  { name: 'Orbits', status: 'ACTIVE', roles: 'ALL' },
  { name: 'Noria', status: 'ACTIVE', roles: 'ALL' },
  { name: 'Deboria', status: 'INACTIVE', roles: 'ALL' },
  { name: 'Emilis', status: 'INACTIVE', roles: 'ALL' },
  { name: 'Genesis Fajardo', status: 'INACTIVE', roles: 'ALL' },
  { name: 'Genesis Esther', status: 'INACTIVE', roles: 'ALL' },
  { name: 'Yoyner Fajardo', status: 'ACTIVE', roles: 'ALL' },
  { name: 'Hairo Tejeda', status: 'ACTIVE', roles: 'ALL' },
  { name: 'Holly', status: 'ACTIVE', roles: ['Adoración'] },
  { name: 'Jeison Ferreras', status: 'ACTIVE', roles: 'ALL' },
  { name: 'Luciana', status: 'ACTIVE', roles: 'ALL' },
  { name: 'Elizabeth Mendez', status: 'ACTIVE', roles: 'ALL' },
  { name: 'Steven Felix', status: 'ACTIVE', roles: 'ALL' },
  { name: 'Victor Manuel', status: 'INACTIVE', roles: 'ALL' },
  { name: 'Virginia', status: 'ACTIVE', roles: 'ALL' },
  { name: 'Marialis', status: 'ACTIVE', roles: 'ALL' },
  { name: 'Rafael', status: 'ACTIVE', roles: 'ALL' },
];

async function main() {
  await mongoose.connect(MONGO_URI);
  const church = await Church.findOne();
  if (!church) throw new Error('No church found');
  const allRoles = await Role.find({ churchId: church._id });

  for (const p of persons) {
    let personRoles = [];
    if (p.roles === 'ALL') {
      personRoles = allRoles.map(r => ({ roleId: r._id, roleName: r.name }));
    } else {
      personRoles = allRoles.filter(r => p.roles.includes(r.name)).map(r => ({ roleId: r._id, roleName: r.name }));
    }
    await Person.create({
      churchId: church._id,
      fullName: p.name,
      ministry: 'Jóvenes',
      status: p.status,
      roles: personRoles,
    });
    console.log(`Creada: ${p.name} (${p.status})`);
  }
  await mongoose.disconnect();
}

main().catch(console.error);
