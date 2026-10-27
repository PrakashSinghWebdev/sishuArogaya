// One-time: give every existing ASHA user a login username. Safe to re-run (skips users that have one).
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const AshaWorker = require('./models/AshaWorker');
const { ashaUsernameFor } = require('./utils/ashaCredentials');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  await User.syncIndexes(); // creates the unique username index

  const users = await User.find({ role: 'asha', username: { $exists: false } });
  for (const user of users) {
    const asha = await AshaWorker.findOne({ userId: user._id });
    user.username = await ashaUsernameFor(asha?.ashaId);
    await user.save({ validateBeforeSave: false });
    console.log(`${user.name} (${asha?.ashaId || 'no ASHA record'}) → username ${user.username}`);
  }
  console.log(`Done: ${users.length} ASHA user(s) updated`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
