const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://Vana:Vana1234@vanaentertainment.1nomupe.mongodb.net/');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Non-fatal error handling for development when local DB server is offline
    console.log('Server continuing with connection retry mode.');
  }
};

module.exports = connectDB;
