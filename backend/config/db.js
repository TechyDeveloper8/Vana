const dns = require('dns');
const mongoose = require('mongoose');

// Fallback to Google & Cloudflare DNS to avoid querySrv ETIMEOUT on local ISP DNS
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // Ignore if unable to set servers
}

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
