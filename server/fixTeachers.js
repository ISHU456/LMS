import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  const result = await User.updateMany(
    { role: 'teacher', department: 'CSE' },
    { $set: { assignedSemesters: [1,2,3,4,5,6,7,8] } }
  );
  console.log(`Updated ${result.nModified || result.modifiedCount} CSE teachers.`);
  process.exit();
}
fix();
