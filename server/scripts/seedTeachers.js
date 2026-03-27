import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Department from '../models/Department.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const teachersData = [
  // CSE (10)
  { name: "Dr. Aniruddh Gupta", dept: "CSE", email: "aniruddh.gupta@university.edu.in" },
  { name: "Prof. Sunita Verma", dept: "CSE", email: "sunita.verma@university.edu.in" },
  { name: "Dr. Vikram Seth", dept: "CSE", email: "vikram.seth@university.edu.in" },
  { name: "Prof. Rajesh Kumar", dept: "CSE", email: "rajesh.kumar@university.edu.in" },
  { name: "Dr. Shalini Singh", dept: "CSE", email: "shalini.singh@university.edu.in" },
  { name: "Prof. Manoj Tiwari", dept: "CSE", email: "manoj.tiwari@university.edu.in" },
  { name: "Dr. Preeti Sharma", dept: "CSE", email: "preeti.sharma@university.edu.in" },
  { name: "Prof. Amit Bansal", dept: "CSE", email: "amit.bansal@university.edu.in" },
  { name: "Dr. Neerja Rao", dept: "CSE", email: "neerja.rao@university.edu.in" },
  { name: "Prof. Sandeep Mishra", dept: "CSE", email: "sandeep.mishra@university.edu.in" },
  // OTHERS (5)
  { name: "Dr. Ravi Teja", dept: "ECE", email: "ravi.teja@university.edu.in" },
  { name: "Prof. Kavita Rao", dept: "ECE", email: "kavita.rao@university.edu.in" },
  { name: "Dr. Ashok Gehlot", dept: "ME", email: "ashok.gehlot@university.edu.in" },
  { name: "Prof. Smriti Irani", dept: "CE", email: "smriti.irani@university.edu.in" },
  { name: "Dr. Manmohan Singh", dept: "IT", email: "manmohan.singh@university.edu.in" }
];

const seedTeachers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for teacher seeding...');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('teacher@123', salt);

        const teacherUsers = [];
        for (const t of teachersData) {
            let user = await User.findOne({ email: t.email });
            if (!user) {
                user = new User({
                    name: t.name,
                    email: t.email,
                    password: 'teacher@123', // User model hooks will hash it
                    role: 'teacher',
                    department: t.dept,
                    isActive: true,
                    employeeId: `FAC${Math.floor(Math.random() * 9000) + 1000}`,
                    securityQuestion: 'Favorite color?',
                    securityAnswer: 'Blue'
                });
                await user.save();
                console.log(`Created teacher: ${t.name}`);
            }
            teacherUsers.push(user);
        }

        // Assign subjects to teachers (each 2 courses minimum)
        const courses = await Course.find();
        console.log(`\nAssigning subjects (Total Courses: ${courses.length})...`);

        if (courses.length < teacherUsers.length * 2) {
            console.log("Not enough courses to assign 2 per teacher. Just distributing existing ones...");
        }

        for (let i = 0; i < teacherUsers.length; i++) {
            const faculty = teacherUsers[i];
            const assignedCourses = courses.filter((_, idx) => idx % teacherUsers.length === i || idx % teacherUsers.length === (i + 1) % teacherUsers.length);
            
            for (const course of assignedCourses) {
                if (!course.facultyAssigned.includes(faculty._id)) {
                    course.facultyAssigned.push(faculty._id);
                    await course.save();
                    console.log(`- Assigned ${faculty.name} to ${course.code}`);
                }
            }
        }

        console.log('\n✅ Teacher Seeding Completed Successfully!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedTeachers();
