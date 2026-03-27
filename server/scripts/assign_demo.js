import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Course from '../models/Course.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function assignDemo() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const demo = await User.findOne({ email: 'demo@university.edu.in' });
        if (!demo) {
            console.log('Demo user not found');
            process.exit(1);
        }

        const courses = await Course.find({});
        for (const course of courses) {
            if (!course.facultyAssigned.includes(demo._id)) {
                course.facultyAssigned.push(demo._id);
                await course.save();
                console.log(`Assigned '${demo.name}' to ${course.code}`);
            }
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

assignDemo();
