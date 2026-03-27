import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function checkDepts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const teachers = await User.find({ role: 'teacher' }).select('name email department');
        console.log(`Total Teachers: ${teachers.length}`);
        
        const counts = {};
        teachers.forEach(t => {
            const d = t.department || 'MISSING';
            counts[d] = (counts[d] || 0) + 1;
        });
        console.log('Department Counts:', counts);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkDepts();
