import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Course from '../models/Course.js';
import Department from '../models/Department.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedCourses = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB...');

        const cseDept = await Department.findOne({ code: 'CSE' });
        if (!cseDept) {
            console.error('CSE Department not found!');
            process.exit(1);
        }

        const sem1Courses = [
            { name: 'Engineering Chemistry', code: 'BT-101', credits: 4, department: cseDept._id, semester: 1, type: 'THEORY', description: 'Core chemistry for engineers' },
            { name: 'Mathematics-I', code: 'BT-102', credits: 4, department: cseDept._id, semester: 1, type: 'THEORY', description: 'Calculus and Linear Algebra' },
            { name: 'English for Communication', code: 'BT-103', credits: 3, department: cseDept._id, semester: 1, type: 'THEORY', description: 'English proficiency' },
            { name: 'Basic Electrical & Electronics Engineering', code: 'BT-104', credits: 4, department: cseDept._id, semester: 1, type: 'THEORY', description: 'Fundamentals of EE and EC' },
            { name: 'Engineering Graphics', code: 'BT-105', credits: 3, department: cseDept._id, semester: 1, type: 'PRACTICAL', description: 'CAD and drawing fundamentals' },
            { name: 'Manufacturing Practices (Lab)', code: 'BT-106', credits: 2, department: cseDept._id, semester: 1, type: 'PRACTICAL', description: 'Workshop laboratory' },
            { name: 'English Language / Communication Lab', code: 'BT-CLAB', credits: 2, department: cseDept._id, semester: 1, type: 'PRACTICAL', description: 'Language and soft skills lab' },
        ];

        for (const c of sem1Courses) {
            await Course.findOneAndUpdate(
                { code: c.code },
                c,
                { upsert: true, new: true }
            );
            console.log(`✅ Seeded: ${c.code} - ${c.name}`);
        }

        console.log('\n✅ All Semester 1 Courses Successfully Seeded to Atlas!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding Error:', err);
        process.exit(1);
    }
};

seedCourses();
