import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function debugUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const roles = ['student', 'teacher', 'admin', 'hod'];
        for (const role of roles) {
            const count = await User.countDocuments({ role });
            const sample = await User.findOne({ role }).select('name email role department');
            console.log(`Role: ${role}, Count: ${count}`);
            if (sample) {
                console.log(`Sample: ${JSON.stringify(sample, null, 2)}`);
            }
            console.log('---');
        }
        
        // Specifically look for teachers without department or with unexpected department values
        const teachers = await User.find({ role: 'teacher' }).limit(5).select('name role department');
        console.log('Sample Teachers:', JSON.stringify(teachers, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugUsers();
