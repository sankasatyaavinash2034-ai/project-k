import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import dns from 'dns';

// Configure fallback DNS servers (Google & Cloudflare) for reliable MongoDB Atlas SRV resolution
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // Gracefully fallback to OS default DNS if prohibited
}

// Load environment variables from both root and server/.env
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), 'server', '.env') });

export const connectDB = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI ||
      'mongodb+srv://sankasatyaavinash2034_db_user:QUw5DavNmgMDbYoA@cluster0.2a4k4jq.mongodb.net/aarohan_db?retryWrites=true&w=majority';

    mongoose.set('bufferCommands', false);

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
    });

    global.isMongoConnected = true;
    console.log(`[MongoDB Atlas] Connected successfully to Cloud Cluster: ${conn.connection.host}`);
  } catch (error) {
    global.isMongoConnected = false;
    console.warn(`[MongoDB Atlas Warning]: ${error.message}`);
    console.log('[Aarohan Engine] Running in Resilient Data Store Mode (Zero-Interruption Local Execution).');
  }
};
