import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const checkUsersRoleCount = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const roles = ['student', 'teacher', 'admin', 'hod', 'librarian', 'parent'];
        console.log(`Database Name: ${mongoose.connection.name}`);
        for (const role of roles) {
            const count = await User.countDocuments({ role });
            console.log(`${role.toUpperCase()}: ${count}`);
        }
        process.exit(0);
    } catch (er) {
        console.error(er);
        process.exit(1);
    }
};

checkUsersRoleCount();
