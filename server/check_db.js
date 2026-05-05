const mongoose = require('mongoose');
require('dotenv').config();

const Child = require('./models/Child');
const GrowthRecord = require('./models/GrowthRecord');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sishu-arogaya')
  .then(() => {
    console.log('✓ MongoDB connected');
    return Promise.all([
      Child.countDocuments(),
      GrowthRecord.countDocuments()
    ]);
  })
  .then(([childCount, recordCount]) => {
    console.log(`✓ Found ${childCount} children and ${recordCount} growth records`);
    if (childCount > 0) {
      return Child.findOne().select('_id name gender dob');
    }
  })
  .then(child => {
    if (child) {
      console.log('Sample child:', JSON.stringify(child, null, 2));
    } else {
      console.log('No children found in database');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
