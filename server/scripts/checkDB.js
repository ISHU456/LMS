import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGODB_URI;

const checkDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        const count = await User.countDocuments({ role: 'student' });
        console.log(`Successfully connected to: ${mongoose.connection.host}`);
        console.log(`Database Name: ${mongoose.connection.name}`);
        console.log(`Total Student Count: ${count}`);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

checkDB();
