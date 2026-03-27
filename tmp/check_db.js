import mongoose from 'mongoose';
import dotenv from 'dotenv';
// Use absolute paths to be safe
import User from 'C:/Users/Ishu Anand Malviya/OneDrive/Documents/coding/LMS/server/models/User.js';
import Course from 'C:/Users/Ishu Anand Malviya/OneDrive/Documents/coding/LMS/server/models/Course.js';
import Department from 'C:/Users/Ishu Anand Malviya/OneDrive/Documents/coding/LMS/server/models/Department.js';

dotenv.config({ path: 'C:/Users/Ishu Anand Malviya/OneDrive/Documents/coding/LMS/server/.env' });

async function checkData() {
    try {
        console.log('Connecting to:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected');

        const studentCount = await User.countDocuments({ role: 'student' });
        console.log('Total Students:', studentCount);

        const students = await User.find({ role: 'student' }).limit(5);
        students.forEach(s => {
            console.log(`Student: ${s.name}, Dept: ${s.department}, Sem: ${s.semester}`);
        });

        const courseCount = await Course.countDocuments();
        console.log('Total Courses:', courseCount);

        const courses = await Course.find().populate('department').limit(5);
        courses.forEach(c => {
            console.log(`Course: ${c.code}, Dept Name: ${c.department?.name}, Dept Code: ${c.department?.code}, Sem: ${c.semester}`);
        });

        process.exit(0);
    } catch (err) {
        console.error('Error during execution:', err);
        process.exit(1);
    }
}

checkData();
