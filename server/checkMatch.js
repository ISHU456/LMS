import mongoose from 'mongoose';
import Course from './models/Course.js';
import Department from './models/Department.js';
import User from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const course = await Course.findOne().populate('department');
  console.log('Sample Course:', course.name, 'Code:', course.code, 'Semester:', course.semester);
  console.log('Course Dept Name:', course.department.name, 'Code:', course.department.code);
  
  const teacher = await User.findOne({role: 'teacher', department: 'CSE'});
  console.log('Sample Teacher:', teacher.name, 'Dept:', teacher.department);
  process.exit();
}
check();
