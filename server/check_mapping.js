import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Department from './models/Department.js';
import User from './models/User.js';
import Course from './models/Course.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function checkMapping() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log('--- DEPARTMENTS ---');
        const depts = await Department.find().select('name code');
        depts.forEach(d => console.log(`ID: ${d._id}, Name: ${d.name}, Code: ${d.code}`));

        console.log('\n--- SAMPLE COURSE ---');
        const course = await Course.findOne().populate('department');
        if (course) {
            console.log(`Course: ${course.name}, Code: ${course.code}, Dept Name: ${course.department.name}, Dept Code: ${course.department.code}, Sem: ${course.semester}`);
            
            console.log('\n--- MATCHING STUDENTS ---');
            const students = await User.countDocuments({
                role: 'student',
                semester: course.semester,
                $or: [
                  { department: course.department.name },
                  { department: course.department.code }
                ]
            });
            console.log(`Total students matched for this course: ${students}`);
            
            const firstStudent = await User.findOne({ role: 'student' }).select('name department semester');
            console.log(`First Student Example: Name: ${firstStudent?.name}, Dept: ${firstStudent?.department}, Sem: ${firstStudent?.semester}`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkMapping();
