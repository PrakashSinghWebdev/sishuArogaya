const mongoose = require('mongoose');

// tries a few env var names so we don't break if someone renames the var
async function connectDB() {
  const dbUri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    'mongodb://localhost:27017/sishuarogaya';

  try {
    const connection = await mongoose.connect(dbUri);
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    // not calling process.exit here so the dev server stays alive even without DB
  }
}

module.exports = connectDB;
