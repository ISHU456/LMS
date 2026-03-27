import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const check = async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/lms');
    const users = await User.find().select('name role department').limit(10);
    users.forEach(u => console.log(`${u.name} | ${u.role} | ${u.department}`));
    process.exit();
};
check();
