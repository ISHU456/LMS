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
        const teachers = await User.find({ role: 'teacher' });
        console.log('Teachers Found:', teachers.length);
        teachers.forEach(t => {
            console.log(`- ${t.name} (${t.email}), Dept: ${t.department}`);
        });

        const courses = await Course.find().populate('facultyAssigned', 'name email');
        console.log('\nCourse Assignments:');
        courses.forEach(c => {
            console.log(`- Course: ${c.code} (${c.name})`);
            console.log(`  Assigned Faculty: ${c.facultyAssigned.map(f => f.name + ' (' + f.email + ')').join(', ')}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkTeachers();
