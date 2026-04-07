const mongoose  = require('mongoose');
const dotenv    = require('dotenv');
const GovtScheme = require('./models/GovtScheme');
const SCHEMES    = require('./data/schemesData');

dotenv.config();

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    const existing = await GovtScheme.countDocuments();
    if (existing > 0 && !process.argv.includes('--force')) {
      console.log(`[skip] ${existing} schemes already in DB. Use --force to re-seed.`);
      await mongoose.disconnect();
      return;
    }
    if (process.argv.includes('--force')) {
      await GovtScheme.deleteMany({});
      console.log('[cleared] existing schemes deleted');
    }

    const inserted = await GovtScheme.insertMany(SCHEMES);
    console.log(`\n[done] Inserted ${inserted.length} government schemes.`);
    inserted.forEach(s => console.log(`  ✓ ${s.shortName} — ${s.name}`));
  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
