import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

async function listStudents() {
  await mongoose.connect(MONGO_URI);
  const students = await User.find({ role: 'student' });
  console.log('--- STUDENT LIST ---');
  students.forEach(s => {
    console.log(`Name: ${s.name}, Email: ${s.email}, Roll: ${s.rollNumber}, Sem: ${s.semester}`);
  });
  process.exit();
}

listStudents();
