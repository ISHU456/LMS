import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Result from '../models/Result.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Department from '../models/Department.js';

dotenv.config();

const seedResults = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/lms');
    console.log('Connected to MongoDB');

    const students = await User.find({ role: 'student' }).limit(10);
    const teacher = await User.findOne({ role: 'teacher' });
    const hod = await User.findOne({ role: 'hod' });
    const course = await Course.findOne();

    if (!students.length || !teacher || !course) {
      console.log('Missing data for seeding. Please seed users and courses first.');
      process.exit();
    }

    const results = students.map(student => ({
      student: student._id,
      course: course._id,
      semester: course.semester,
      academicYear: '2023-24',
      marks: {
        mst1: Math.floor(Math.random() * 20),
        mst2: Math.floor(Math.random() * 20),
        mst3: Math.floor(Math.random() * 20),
        endSem: Math.floor(Math.random() * 70),
      },
      status: 'published',
      createdBy: teacher._id,
      approvedBy: hod ? hod._id : teacher._id,
    }));

    await Result.insertMany(results);
    console.log('Demo results seeded successfully');
    process.exit();
  } catch (error) {
    console.error('Error seeding results', error);
    process.exit(1);
  }
};

seedResults();
