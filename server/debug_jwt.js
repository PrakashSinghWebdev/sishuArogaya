const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('./models/User');

async function debug() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sishu-arogaya');
    
    const parent = await User.findOne({ role: 'parent' });
    console.log('Parent user ID:', parent._id);
    console.log('Parent user ID toString():', parent._id.toString());
    
    // Create token like the test does
    const token = jwt.sign(
      { id: parent._id.toString(), email: parent.email, role: parent.role },
      process.env.JWT_SECRET || 'test-secret-key',
      { expiresIn: '1h' }
    );
    
    // Decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret-key');
    console.log('Decoded token:', decoded);
    console.log('Decoded id:', decoded.id);
    console.log('typeof decoded.id:', typeof decoded.id);
    
    // Try to find user like the middleware does
    const foundUser = await User.findById(decoded.id).select('-password -otp');
    console.log('Found user:', foundUser ? 'YES' : 'NO');
    if (foundUser) {
      console.log('Found user details:', {
        _id: foundUser._id,
        email: foundUser.email,
        isActive: foundUser.isActive
      });
    }
    
    // Try other methods
    const foundUser2 = await User.findById(new mongoose.Types.ObjectId(decoded.id)).select('-password -otp');
    console.log('Found user (with ObjectId conversion):', foundUser2 ? 'YES' : 'NO');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

debug();
