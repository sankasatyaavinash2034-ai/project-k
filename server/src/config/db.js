import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from both root and server/.env
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), 'server', '.env') });

export const connectDB = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI ||
      'mongodb+srv://sankasatyaavinash2034_db_user:QUw5DavNmgMDbYoA@cluster0.2a4k4jq.mongodb.net/aarohan_db?retryWrites=true&w=majority';

    mongoose.set('bufferCommands', false);

    // Force IPv4 lookup for Windows DNS SRV compatibility
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      family: 4,
    });

    global.isMongoConnected = true;
    console.log(`[MongoDB Atlas] Connected successfully to Cloud Cluster: ${conn.connection.host}`);
  } catch (error) {
    global.isMongoConnected = false;
    console.warn(`[MongoDB Atlas Warning]: ${error.message}`);
    console.log('[Aarohan Engine] Running in Resilient Data Store Mode (Zero-Interruption Local Execution).');
  }
};
