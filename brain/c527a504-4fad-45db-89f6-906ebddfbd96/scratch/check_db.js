import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '../server/.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/LMS';

const UserSchema = new mongoose.Schema({
    role: String
}, { strict: false });

const User = mongoose.model('User', UserSchema);

async function check() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');
        const teacherCount = await User.countDocuments({ role: 'teacher' });
        const hodCount = await User.countDocuments({ role: 'hod' });
        const total = await User.countDocuments({});
        console.log(`Teachers: ${teacherCount}`);
        console.log(`HODs: ${hodCount}`);
        console.log(`Total Users: ${total}`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
