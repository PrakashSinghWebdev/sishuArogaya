const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const AshaWorker = require('./models/AshaWorker');

dotenv.config();

const seedUsers = [
  {
    name: 'Admin User',
    email: 'admin@sishu.gov.in',
    phone: '9000000001',
    password: 'Admin@123',
    role: 'admin',
  },
  {
    name: 'Priya Sharma (ASHA)',
    email: 'asha@sishu.gov.in',
    phone: '9000000002',
    password: 'Asha@123',
    role: 'asha',
    ashaId: 'ASHA-UK-001',
    district: 'Dehradun',
    block: 'Vikasnagar',
  },
  {
    name: 'Ramesh Kumar (Parent)',
    email: 'parent@sishu.gov.in',
    phone: '9000000003',
    password: 'Parent@123',
    role: 'parent',
  },
];

async function seed() {
  try {
const connectDB = require('./config/db');
await connectDB();
    console.log('MongoDB connected');

    for (const u of seedUsers) {
      const exists = await User.findOne({ email: u.email });
      if (exists) {
        console.log(`  [skip] ${u.email} already exists`);
        continue;
      }

      const user = await User.create({
        name: u.name,
        email: u.email,
        phone: u.phone,
        password: u.password,
        role: u.role,
      });

      if (u.role === 'asha') {
        await AshaWorker.create({
          userId: user._id,
          ashaId: u.ashaId,
          district: u.district,
          block: u.block,
        });
      }

      console.log(`  [created] ${u.role.padEnd(6)} → ${u.email}  password: ${u.password}`);
    }

    console.log('\nSeed complete. Test credentials:');
    console.log('  Admin  : admin@sishu.gov.in  / Admin@123');
    console.log('  ASHA   : asha@sishu.gov.in   / Asha@123');
    console.log('  Parent : parent@sishu.gov.in / Parent@123');
  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
