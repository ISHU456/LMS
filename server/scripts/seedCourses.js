import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Course from '../models/Course.js';
import Department from '../models/Department.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedCourses = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get CSE department or create it
    let cse = await Department.findOne({ code: 'CSE' });

    if (!cse) {
      console.log('CSE Department not found. Creating it...');
      cse = await Department.create({
        name: 'Computer Science and Engineering',
        code: 'CSE',
        tagline: 'Innovating the Future of Computing',
        description: 'The Department of Computer Science and Engineering is dedicated to excellence in teaching and research.'
      });
    }

    // Ensure other departments exist for the gateway
    const otherDepts = [
      { name: 'Electronics and Communication', code: 'ECE' },
      { name: 'Mechanical Engineering', code: 'ME' },
      { name: 'Civil Engineering', code: 'CE' },
      { name: 'Electrical Engineering', code: 'EE' }
    ];

    for (const d of otherDepts) {
      await Department.findOneAndUpdate({ code: d.code }, d, { upsert: true, new: true });
    }

    const coursesData = [
      // Semester 1
      { code: 'CH101', name: 'Applied Chemistry', credits: 4, semester: 1, type: 'theory', department: cse._id, description: 'Fundamentals of chemistry for engineers.' },
      { code: 'MA101', name: 'Applied Mathematics 1', credits: 4, semester: 1, type: 'theory', department: cse._id, description: 'Calculus and linear algebra.' },
      { code: 'EE101', name: 'Basic Electronics', credits: 3, semester: 1, type: 'theory', department: cse._id, description: 'Introduction to electronic devices.' },
      { code: 'HU101', name: 'English for Communication', credits: 2, semester: 1, type: 'theory', department: cse._id, description: 'Professional communication skills.' },
      
      // Semester 2
      { code: 'CS102', name: 'Computer Programming', credits: 3, semester: 2, type: 'theory', department: cse._id, description: 'Introduction to C/C++ programming.' },
      { code: 'MA102', name: 'Applied Mathematics 2', credits: 4, semester: 2, type: 'theory', department: cse._id, description: 'Differential equations and vector calculus.' },
      { code: 'PH102', name: 'Applied Physics', credits: 4, semester: 2, type: 'theory', department: cse._id, description: 'Optics, quantum mechanics and solid state physics.' },
      { code: 'CS102L', name: 'Programming Lab', credits: 1, semester: 2, type: 'lab', department: cse._id, description: 'Practical implementation of C++ programs.' },
      
      // Semester 3
      { code: 'CS301', name: 'Data Structures', credits: 4, semester: 3, type: 'theory', department: cse._id, description: 'Core concepts of data organization and management.' },
      { code: 'CS302', name: 'Digital Logic Design', credits: 3, semester: 3, type: 'theory', department: cse._id, description: 'Study of digital circuits and Boolean algebra.' },
      { code: 'CS303', name: 'Discrete Mathematics', credits: 4, semester: 3, type: 'theory', department: cse._id, description: 'Set theory, graph theory and combinatorics.' },
      { code: 'CS301L', name: 'Data Structures Lab', credits: 1, semester: 3, type: 'lab', department: cse._id, description: 'Implementation of stacks, queues, and trees.' },
      
      // Semester 4
      { code: 'CS401', name: 'Operating Systems', credits: 3, semester: 4, type: 'theory', department: cse._id, description: 'Process management, memory and file systems.' },
      { code: 'CS402', name: 'Computer Organization', credits: 3, semester: 4, type: 'theory', department: cse._id, description: 'Architecture of modern computer systems.' },
      { code: 'CS403', name: 'Database Management', credits: 4, semester: 4, type: 'theory', department: cse._id, description: 'Relational databases and SQL.' },
      { code: 'CS403L', name: 'DBMS Lab', credits: 1, semester: 4, type: 'lab', department: cse._id, description: 'SQL query practice and database design.' },
      
      // Semester 5
      { code: 'CS501', name: 'Theory of Computation', credits: 4, semester: 5, type: 'theory', department: cse._id, description: 'Automata theory and formal languages.' },
      { code: 'CS502', name: 'Software Engineering', credits: 3, semester: 5, type: 'theory', department: cse._id, description: 'Software development life cycle and methodologies.' },
      { code: 'CS503', name: 'Computer Networks', credits: 4, semester: 5, type: 'theory', department: cse._id, description: 'OSI model, TCP/IP and network protocols.' },
      
      // Semester 6
      { code: 'CS601', name: 'Compiler Design', credits: 4, semester: 6, type: 'theory', department: cse._id, description: 'Principles and practice of compiler construction.' },
      { code: 'CS602', name: 'Artificial Intelligence', credits: 3, semester: 6, type: 'theory', department: cse._id, description: 'Search algorithms, neural networks and logic.' },
      { code: 'CS603', name: 'Cloud Computing', credits: 3, semester: 6, type: 'theory', department: cse._id, description: 'AWS, Azure and distributed systems.' },
      
      // Semester 7
      { code: 'CS701', name: 'Machine Learning', credits: 4, semester: 7, type: 'theory', department: cse._id, description: 'Supervised and unsupervised learning techniques.' },
      { code: 'CS702', name: 'Cyber Security', credits: 3, semester: 7, type: 'theory', department: cse._id, description: 'Cryptography and network security.' },
      { code: 'CS703P', name: 'Major Project Phase 1', credits: 2, semester: 7, type: 'project', department: cse._id, description: 'Initial design and research for senior project.' },
      
      // Semester 8
      { code: 'CS801', name: 'Internet of Things', credits: 3, semester: 8, type: 'theory', department: cse._id, description: 'Embedded systems and sensor networks.' },
      { code: 'CS802P', name: 'Major Project Phase 2', credits: 6, semester: 8, type: 'project', department: cse._id, description: 'Final implementation and defense of senior project.' }
    ];

    await Course.deleteMany({});
    await Course.insertMany(coursesData);

    console.log('CSE Courses seeded successfully! Other departments left empty.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedCourses();
