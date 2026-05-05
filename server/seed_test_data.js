const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Child = require('./models/Child');
const GrowthRecord = require('./models/GrowthRecord');

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sishu-arogaya');
    console.log('✓ MongoDB connected');

    // Create test user (parent)
    const parentEmail = 'testparent@example.com';
    let parent = await User.findOne({ email: parentEmail });
    if (!parent) {
      parent = await User.create({
        email: parentEmail,
        password: await bcrypt.hash('Test123!', 10),
        name: 'Test Parent',
        role: 'parent',
        phone: '9876543210'
      });
      console.log('✓ Created test parent user');
    } else {
      console.log('✓ Test parent user already exists');
    }

    // Create test child - explicitly generate childId
    let child = await Child.findOne({ name: 'Test Child' });
    if (!child) {
      const dob = new Date(2022, 0, 1);
      const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      child = await Child.create({
        childId: `CHILD-${randomId}`,
        name: 'Test Child',
        gender: 'male',
        dob: dob,
        bloodGroup: 'O+',
        parentId: parent._id,
      });
      console.log('✓ Created test child with ID:', child._id);
    } else {
      console.log('✓ Test child already exists:', child._id);
    }

    // Create growth records
    const existingRecords = await GrowthRecord.countDocuments({ childId: child._id });
    if (existingRecords === 0) {
      const records = [
        {
          childId: child._id,
          recordedBy: parent._id,
          recordedDate: new Date(2024, 0, 15),
          ageMonths: 24,
          weight: 12.5,
          height: 88,
          wazScore: -0.5,
          hazScore: -0.3,
          whzScore: -0.4,
          prediction: 'healthy'
        },
        {
          childId: child._id,
          recordedBy: parent._id,
          recordedDate: new Date(2024, 1, 15),
          ageMonths: 25,
          weight: 12.8,
          height: 89,
          wazScore: -0.4,
          hazScore: -0.2,
          whzScore: -0.3,
          prediction: 'healthy'
        },
        {
          childId: child._id,
          recordedBy: parent._id,
          recordedDate: new Date(2024, 2, 15),
          ageMonths: 26,
          weight: 13.1,
          height: 90,
          wazScore: -0.2,
          hazScore: 0.1,
          whzScore: -0.2,
          prediction: 'healthy'
        }
      ];

      await GrowthRecord.insertMany(records);
      console.log('✓ Created 3 growth records');
    } else {
      console.log(`✓ ${existingRecords} growth records already exist`);
    }

    console.log('\n✓ Test data seeded!');
    console.log(`Child ID: ${child._id}`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

seedData();
