import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Enrollment from '../models/Enrollment.js';
import User from '../models/User.js';
import Course from '../models/Course.js';

dotenv.config();

const seedEnrollments = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms');
    console.log('Connected to MongoDB');

    const students = await User.find({ role: 'student' });
    const courses = await Course.find();

    if (!students.length || !courses.length) {
      console.log('Seed users and courses first.');
      process.exit();
    }

    const enrollments = [];

    students.forEach(student => {
      // Find courses matching student's semester and department
      const matchingCourses = courses.filter(c => 
        c.semester === student.semester && 
        (c.department.toString() === student.department?.toString() || !student.department)
      );

      matchingCourses.forEach(course => {
        enrollments.push({
          student: student._id,
          course: course._id,
          semester: course.semester,
          academicYear: '2023-24'
        });
      });
    });

    if (enrollments.length > 0) {
      await Enrollment.deleteMany({}); // Clear old
      await Enrollment.insertMany(enrollments);
      console.log(`Successfully enrolled students in ${enrollments.length} matching courses.`);
    } else {
      console.log('No matching courses found for students.');
    }

    process.exit();
  } catch (error) {
    console.error('Error seeding enrollments:', error);
    process.exit(1);
  }
};

seedEnrollments();
