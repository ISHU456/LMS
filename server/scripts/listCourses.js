import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Course from '../models/Course.js';
import Department from '../models/Department.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGODB_URI;

const listCourses = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        const courses = await Course.find({}).populate('department', 'name code');
        courses.forEach(c => {
            console.log(`Course: ${c.name} (${c.code}), Sem: ${c.semester}, Dept: ${c.department?.name}`);
        });
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

listCourses();
