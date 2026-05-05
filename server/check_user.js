const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function check() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sishu-arogaya');
    
    const user = await User.findOne({ role: 'parent' });
    if (user) {
      console.log('User found:');
      console.log({
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive
      });
    } else {
      console.log('No parent user found');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

check();
