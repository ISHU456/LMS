import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './server/models/User.js';
import Course from './server/models/Course.js';

dotenv.config({ path: './server/.env' });

async function checkTeachers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const teachers = await User.find({ role: 'teacher' });
        console.log('Teachers Found:', teachers.length);
        teachers.forEach(t => {
            console.log(`- ${t.name} (${t.email}), ID: ${t._id}`);
        });

        const courses = await Course.find();
        console.log('\nCourses Found:', courses.length);
        courses.forEach(c => {
            console.log(`- ${c.name} (${c.code}), Faculty: ${c.facultyAssigned}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkTeachers();
