// One-off: ASHA accounts created before random passwords have guessable ones (first 4 letters of the
// name + date of birth). Make every ASHA choose a new password at next login.
// Usage: node requireAshaPasswordChange.js            (dry run: just counts)
//        node requireAshaPasswordChange.js --apply
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/sishuarogaya');
  const filter = { role: 'asha', mustChangePassword: { $ne: true } };
  const count = await User.countDocuments(filter);
  if (!process.argv.includes('--apply')) {
    console.log(`${count} ASHA account(s) would be asked to set a new password. Re-run with --apply.`);
  } else {
    const { modifiedCount } = await User.updateMany(filter, { $set: { mustChangePassword: true } });
    console.log(`${modifiedCount} ASHA account(s) must now set a new password at next login.`);
  }
  await mongoose.disconnect();
})().catch((err) => { console.error(err); process.exit(1); });
