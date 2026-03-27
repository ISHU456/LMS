import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import { getUsers } from './controllers/adminController.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function testFilter() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log('Testing with role=teacher, dept=all, semester=all...');
        const req1 = { query: { role: 'teacher', dept: 'all', semester: 'all' } };
        const res1 = { json: (data) => console.log(`Results: ${data.length}`) };
        await getUsers(req1, res1);

        console.log('\nTesting with role=teacher, dept=all, semester=1...');
        const req2 = { query: { role: 'teacher', dept: 'all', semester: '1' } };
        const res2 = { json: (data) => console.log(`Results: ${data.length}`) };
        await getUsers(req2, res2);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testFilter();
