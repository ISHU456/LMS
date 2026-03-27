import 'dotenv/config';
import mongoose from 'mongoose';
import Department from './models/Department.js';
import Course from './models/Course.js';

const checkData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const depts = await Department.find();
    console.log(`Departments found: ${depts.length}`);
    depts.forEach(d => console.log(` - ${d.name} (${d.code})`));
    
    const courses = await Course.find();
    console.log(`Courses found: ${courses.length}`);
    courses.forEach(c => console.log(` - ${c.name} (${c.code})`));
    
    process.exit(0);
  } catch (err) {
    console.error('Check failed:', err);
    process.exit(1);
  }
};

checkData();
