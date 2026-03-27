import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function seedAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        let u = await User.findOne({ email: 'admin@gmail.com' });
        if (!u) {
            u = new User({ 
                name: 'System Admin', 
                email: 'admin@gmail.com', 
                password: 'admin@123', 
                role: 'admin', 
                isActive: true,
                securityQuestion: 'System code?',
                securityAnswer: '999'
            });
            await u.save();
            console.log('Admin created: admin@gmail.com');
        } else {
            u.password = 'admin@123';
            u.role = 'admin';
            await u.save();
            console.log('Admin updated: admin@gmail.com');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedAdmin();
