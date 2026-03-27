import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, './.env') });

async function testLogin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const email = 'vansh.kapoor@cse.edu';
        const password = 'hello@123';
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log('User not found');
            process.exit(1);
        }

        const isMatch = await user.matchPassword(password);
        console.log(`Login test for ${email}: ${isMatch ? 'SUCCESS' : 'FAILURE'}`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testLogin();
