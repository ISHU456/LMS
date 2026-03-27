import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();

const students = [
  {
    name: 'Krish Joshi',
    email: 'krish@lms.com',
    password: 'student123',
    role: 'student',
    rollNumber: 'CS24001',
    semester: 4,
    department: 'Computer Science',
    enrollmentNumber: 'ENR24001',
    cgpa: 8.5,
    securityQuestion: 'What is your favorite color?',
    securityAnswer: 'Blue'
  },
  {
    name: 'Shreya Sharma',
    email: 'shreya@lms.com',
    password: 'student123',
    role: 'student',
    rollNumber: 'CS24002',
    semester: 4,
    department: 'Computer Science',
    enrollmentNumber: 'ENR24002',
    cgpa: 9.1,
    securityQuestion: 'What is your favorite color?',
    securityAnswer: 'Pink'
  },
  {
    name: 'Soham Malhotra',
    email: 'soham@lms.com',
    password: 'student123',
    role: 'student',
    rollNumber: 'CS24003',
    semester: 4,
    department: 'Computer Science',
    enrollmentNumber: 'ENR24003',
    cgpa: 7.8,
    securityQuestion: 'What is your favorite color?',
    securityAnswer: 'Green'
  },
  {
    name: 'Ananya Iyer',
    email: 'ananya@lms.com',
    password: 'student123',
    role: 'student',
    rollNumber: 'ME24001',
    semester: 4,
    department: 'Mechanical',
    enrollmentNumber: 'ENR24004',
    cgpa: 8.2,
    securityQuestion: 'What is your favorite color?',
    securityAnswer: 'Purple'
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    // Remove existing students with these emails to avoid duplication
    const emails = students.map(s => s.email);
    await User.deleteMany({ email: { $in: emails } });
    console.log('Cleaned up existing students');

    for (let s of students) {
      // Password hashing is handled by the pre-save hook in User model
      await User.create(s);
    }

    console.log('Successfully seeded 4 students with password: student123');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
