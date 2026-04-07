const mongoose   = require('mongoose');
const dotenv     = require('dotenv');
const Hospital   = require('./models/Hospital');
const HOSPITALS  = require('./data/hospitalData');

dotenv.config();

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    const existing = await Hospital.countDocuments();
    if (existing > 0) {
      console.log(`[skip] ${existing} hospitals already in DB. Run with --force to re-seed.`);
      if (!process.argv.includes('--force')) {
        await mongoose.disconnect();
        return;
      }
      await Hospital.deleteMany({});
      console.log('[cleared] existing hospital records deleted');
    }

    const inserted = await Hospital.insertMany(HOSPITALS);
    console.log(`\n[done] Inserted ${inserted.length} hospitals into the database.`);
  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
