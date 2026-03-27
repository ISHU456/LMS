import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const sems = await User.aggregate([
    { $match: { role: 'student', department: 'CSE' } },
    { $group: { _id: '$semester', count: { $sum: 1 } } }
  ]);
  console.log(sems);
  process.exit();
}
check();
