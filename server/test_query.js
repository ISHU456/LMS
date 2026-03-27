import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const test = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        const role = 'all';
        const dept = 'all';
        const semester = 'all';

        const filter = {};
        if (role && role !== 'all') filter.role = role;
        if (dept && dept !== 'all' && dept !== 'undefined' && dept !== '') filter.department = dept;
        if (semester && semester !== 'all' && semester !== 'undefined' && semester !== '') {
            const semNum = parseInt(semester);
            if (!isNaN(semNum)) filter.semester = semNum;
        }

        console.log('Filter:', filter);
        const users = await User.find(filter).select('-password');
        console.log('Found:', users.length);
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

test();
