import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Course from '../models/Course.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkTeachers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({ role: { $in: ['teacher', 'hod', 'admin'] } });
        console.log('--- USERS (Teacher/HOD/Admin) ---');
        users.forEach(u => {
            console.log(`Role: ${u.role}, Name: ${u.name}, Email: ${u.email}`);
        });

        const courses = await Course.find().populate('facultyAssigned', 'name email');
        console.log('\n--- COURSE ASSIGNMENTS ---');
        courses.forEach(c => {
            console.log(`Course: ${c.code} (${c.name})`);
            console.log(`  Faculty: ${c.facultyAssigned.map(f => f.email).join(', ') || 'NONE'}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkTeachers();
