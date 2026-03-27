import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Attendance from '../models/Attendance.js';
import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lms';

const maleFirstNames = [
  "Aarav", "Vihaan", "Vivaan", "Ananya", "Diya", "Advik", "Kabir", "Rohan", "Arjun", "Sai",
  "Shaurya", "Aryan", "Aditya", "Dhruv", "Krish", "Kiaan", "Reyansh", "Ayaan", "Atharv", "Pranav",
  "Rohan", "Soham", "Vedant", "Shivansh", "Yash", "Rudra", "Ansh", "Dev", "Ishaan", "Kartik",
  "Laksh", "Naitik", "Om", "Parth", "Raghav", "Samarth", "Tanay", "Uday", "Vansh", "Yuvraj"
];

const femaleFirstNames = [
  "Priya", "Ananya", "Sneha", "Divya", "Kavya", "Ishita", "Aanya", "Anika", "Aadhya", "Navya",
  "Myra", "Kiara", "Sara", "Riya", "Siya", "Anvi", "Iyer", "Jia", "Prisha", "Advika",
  "Diya", "Pari", "Ira", "Shanaya", "Tanvi", "Tanya", "Naina", "Shreya", "Khushi", "Pooja",
  "Neha", "Meera", "Nisha", "Kiran", "Deepa", "Swati", "Aarti", "Anita", "Sunita"
];

const lastNames = [
  "Sharma", "Verma", "Gupta", "Singh", "Patel", "Kumar", "Reddy", "Rao", "Yadav", "Mehta",
  "Choudhary", "Mishra", "Tiwari", "Joshi", "Nair", "Menon", "Shah", "Desai", "Kaur", "Malhotra",
  "Agarwal", "Khanna", "Saxena", "Kapoor", "Bhatia", "Grover", "Ahuja", "Sethi", "Kohli", "Arora"
];

const branches = ["CSE", "IT", "ECE", "ME", "CE"];
const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const generateStudents = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`Connected to MongoDB: ${mongoose.connection.host}/${mongoose.connection.name}`);

    // Clear existing students
    console.log('Cleaning existing students...');
    const deleteResult = await User.deleteMany({ role: 'student' });
    console.log(`Deleted ${deleteResult.deletedCount} existing students.`);

    const students = [];
    const usedEmails = new Set();
    
    for (const sem of semesters) {
      console.log(`Generating students for Semester ${sem}...`);
      
      for (const branch of branches) {
        let count = 0;
        if (branch === "CSE") count = 15;
        else if (branch === "IT") count = 12;
        else if (branch === "ECE") count = 10;
        else count = 8; // ME, CE

        const branchStudents = [];
        for (let i = 1; i <= count; i++) {
          const isFemale = Math.random() > 0.6;
          const firstName = isFemale ? getRandom(femaleFirstNames) : getRandom(maleFirstNames);
          const lastName = getRandom(lastNames);
          const name = `${firstName} ${lastName}`;
          const emailBase = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
          let email = `${emailBase}@${branch.toLowerCase()}.edu`;
          if (usedEmails.has(email)) {
             email = `${emailBase}${i}@${branch.toLowerCase()}.edu`;
          }
          usedEmails.add(email);

          branchStudents.push({
            name,
            email,
            password: 'hello@123',
            role: 'student',
            semester: sem,
            branch: branch,
            department: branch,
            section: "A",
            batch: `${2026 - Math.ceil(sem/2)}-${2026 - Math.ceil(sem/2) + 4}`,
            isActive: true,
            securityQuestion: "Default?",
            securityAnswer: "Yes"
          });
        }

        // Sort students by name before assigning roll numbers
        branchStudents.sort((a, b) => a.name.localeCompare(b.name));

        // Assign roll numbers in order
        branchStudents.forEach((student, index) => {
          const semString = sem.toString();
          const semDoubleString = sem.toString().padStart(2, '0');
          const serialString = (index + 1).toString().padStart(3, '0');
          const rollNumber = `${branch}${semString}${semDoubleString}${serialString}`;
          
          student.rollNumber = rollNumber;
          student.enrollmentNumber = `ENR${rollNumber}`;
          students.push(student);
        });
      }
    }

    console.log(`Inserting ${students.length} students...`);
    const createdStudents = await User.create(students);

    console.log('✅ Base Seeding Completed!');
    
    // Seed Attendance and Results for Semester 3
    console.log('Generating Attendance & Performance Data for Sem 3...');
    const sem3Students = createdStudents.filter(s => s.semester === 3);
    const sem3Courses = await Course.find({ semester: 3 });

    if (sem3Students.length > 0 && sem3Courses.length > 0) {
      for (const student of sem3Students) {
        // Find relevant courses for this student's department
        const relevantCourses = sem3Courses.filter(c => 
          c.department?.name === student.department || c.department?.code === student.department
        );

        for (const course of relevantCourses) {
          // 1. Generate Attendance (15-20 days)
          const attendanceRecords = [];
          for (let i = 0; i < 20; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            attendanceRecords.push({
              course: course._id,
              student: student._id,
              date: date,
              status: Math.random() > 0.1 ? 'present' : 'absent',
              semester: 3,
              markedBy: course.facultyAssigned?.[0] || student._id, // Fallback
              entryWindowExpiresAt: new Date()
            });
          }
          await Attendance.insertMany(attendanceRecords);

          // 2. Generate Results (Assignments)
          // Find or Create an Assignment for this course
          let assignment = await Assignment.findOne({ course: course._id });
          if (!assignment) {
            assignment = await Assignment.create({
              title: `Continuous Assessment - ${course.code}`,
              description: 'Automatic evaluation of subject competency.',
              type: 'assignment',
              course: course._id,
              faculty: course.facultyAssigned?.[0] || student._id,
              dueDate: new Date(),
              totalMarks: 100
            });
          }

          // Create a graded submission
          await Submission.create({
            assignment: assignment._id,
            student: student._id,
            status: 'graded',
            submittedAt: new Date(),
            marksObtained: Math.floor(Math.random() * 40) + 60, // 60-100
            facultyFeedback: 'Excellent performance in matrix evaluation.',
            gradedBy: assignment.faculty,
            gradedAt: new Date()
          });
        }
      }
      console.log('✅ Sem 3 Performance Analytics Synchronized!');
    }

    console.log(`Final Total Students: ${createdStudents.length}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding students:', err);
    process.exit(1);
  }
};

generateStudents();
