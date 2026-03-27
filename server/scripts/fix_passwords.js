import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function fixPasswords() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for password fix...');

        const users = await User.find({ role: 'student' });
        console.log(`Found ${users.length} student accounts...`);

        const salt = await bcrypt.genSalt(10);

        for (let user of users) {
             // If it's the plain text 'hello@123', hash it manually and save.
             // This bypasses the model's pre('save') hook if we avoid triggers, 
             // but we'll use a manually generated hash to be safe.
             if (user.password === 'hello@123') {
                 const hashed = await bcrypt.hash('hello@123', salt);
                 // Direct update to avoids Mongoose re-hashing in the hook
                 await User.updateOne({ _id: user._id }, { password: hashed });
             }
        }

        console.log('✅ Student passwords have been successfully hashed and secured in the database.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during password fix:', err);
        process.exit(1);
    }
}

fixPasswords();
