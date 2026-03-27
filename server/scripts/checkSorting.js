import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGODB_URI;

const checkSorting = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        const students = await User.find({ role: 'student', semester: 4 }).limit(10).sort({ name: 1 });
        students.forEach((s, idx) => {
            console.log(`${idx + 1}. Name: ${s.name}, Roll: ${s.rollNumber}`);
        });
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

checkSorting();
