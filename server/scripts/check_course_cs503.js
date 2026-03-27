import mongoose from 'mongoose';
import Course from '../models/Course.js';
import Department from '../models/Department.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkCourse() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const course = await Course.findOne({ code: 'CS503' }).populate('department');
        console.log(JSON.stringify(course, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkCourse();
