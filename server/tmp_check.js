import mongoose from 'mongoose';
import Course from './models/Course.js';
import dotenv from 'dotenv';
dotenv.config();

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const courses = await Course.find({}, {name: 1, code: 1});
        console.log(courses);
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
check();
