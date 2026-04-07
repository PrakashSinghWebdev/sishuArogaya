const mongoose = require('mongoose');

const connectDB = async () => {
  try {
const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/sishuarogaya';
const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
// process.exit(1); // commented for dev - server continues without DB
  }
};

module.exports = connectDB;
