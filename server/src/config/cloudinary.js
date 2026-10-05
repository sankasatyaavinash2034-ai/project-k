import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'kfnzglyg',
  api_key: process.env.CLOUDINARY_API_KEY || '312447248698133',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'IeklYkOPib2ndJekCyyXgPWvWMY',
  secure: true,
});

export default cloudinary;
