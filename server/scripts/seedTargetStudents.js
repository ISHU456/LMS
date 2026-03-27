import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGODB_URI;

const targetStudents = [
  // ================= SEMESTER 1 =================
  {"name":"Aarav Sharma","email":"202601001@college.com","password":"hello@123","enrollmentNo":"202601001","rollNo":"CSE1A01","semester":1,"branch":"CSE","section":"A","attendance":92,"mstMarks":24,"endSemMarks":68,"grade":"A","progress":"Excellent"},
  {"name":"Vivaan Singh","email":"202601002@college.com","password":"hello@123","enrollmentNo":"202601002","rollNo":"CSE1A02","semester":1,"branch":"CSE","section":"A","attendance":85,"mstMarks":21,"endSemMarks":60,"grade":"B","progress":"Good"},
  {"name":"Aditya Verma","email":"202601003@college.com","password":"hello@123","enrollmentNo":"202601003","rollNo":"CSE1A03","semester":1,"branch":"CSE","section":"A","attendance":78,"mstMarks":18,"endSemMarks":55,"grade":"B","progress":"Good"},
  {"name":"Krishna Patel","email":"202601004@college.com","password":"hello@123","enrollmentNo":"202601004","rollNo":"CSE1A04","semester":1,"branch":"CSE","section":"A","attendance":70,"mstMarks":16,"endSemMarks":50,"grade":"C","progress":"Average"},
  {"name":"Arjun Gupta","email":"202601005@college.com","password":"hello@123","enrollmentNo":"202601005","rollNo":"CSE1A05","semester":1,"branch":"CSE","section":"A","attendance":88,"mstMarks":23,"endSemMarks":65,"grade":"A","progress":"Excellent"},
  {"name":"Sai Kumar","email":"202601006@college.com","password":"hello@123","enrollmentNo":"202601006","rollNo":"CSE1A06","semester":1,"branch":"CSE","section":"A","attendance":82,"mstMarks":20,"endSemMarks":58,"grade":"B","progress":"Good"},
  {"name":"Rohan Das","email":"202601007@college.com","password":"hello@123","enrollmentNo":"202601007","rollNo":"CSE1A07","semester":1,"branch":"CSE","section":"A","attendance":75,"mstMarks":17,"endSemMarks":52,"grade":"C","progress":"Average"},
  {"name":"Kunal Mehta","email":"202601008@college.com","password":"hello@123","enrollmentNo":"202601008","rollNo":"CSE1A08","semester":1,"branch":"CSE","section":"A","attendance":90,"mstMarks":25,"endSemMarks":70,"grade":"A","progress":"Excellent"},
  {"name":"Yash Thakur","email":"202601009@college.com","password":"hello@123","enrollmentNo":"202601009","rollNo":"CSE1A09","semester":1,"branch":"CSE","section":"A","attendance":80,"mstMarks":19,"endSemMarks":57,"grade":"B","progress":"Good"},
  {"name":"Manish Yadav","email":"202601010@college.com","password":"hello@123","enrollmentNo":"202601010","rollNo":"CSE1A10","semester":1,"branch":"CSE","section":"A","attendance":68,"mstMarks":15,"endSemMarks":48,"grade":"C","progress":"Needs Improvement"},

  // ================= SEMESTER 3 =================
  {"name":"Rahul Mishra","email":"202603001@college.com","password":"hello@123","enrollmentNo":"202603001","rollNo":"CSE3A01","semester":3,"branch":"CSE","section":"A","attendance":91,"mstMarks":23,"endSemMarks":67,"grade":"A","progress":"Excellent"},
  {"name":"Amit Tiwari","email":"202603002@college.com","password":"hello@123","enrollmentNo":"202603002","rollNo":"CSE3A02","semester":3,"branch":"CSE","section":"A","attendance":84,"mstMarks":20,"endSemMarks":61,"grade":"B","progress":"Good"},
  {"name":"Sandeep Jain","email":"202603003@college.com","password":"hello@123","enrollmentNo":"202603003","rollNo":"CSE3A03","semester":3,"branch":"CSE","section":"A","attendance":79,"mstMarks":19,"endSemMarks":56,"grade":"B","progress":"Good"},
  {"name":"Deepak Verma","email":"202603004@college.com","password":"hello@123","enrollmentNo":"202603004","rollNo":"CSE3A04","semester":3,"branch":"CSE","section":"A","attendance":72,"mstMarks":16,"endSemMarks":51,"grade":"C","progress":"Average"},
  {"name":"Vikas Yadav","email":"202603005@college.com","password":"hello@123","enrollmentNo":"202603005","rollNo":"CSE3A05","semester":3,"branch":"CSE","section":"A","attendance":87,"mstMarks":22,"endSemMarks":66,"grade":"A","progress":"Excellent"},
  {"name":"Nitin Gupta","email":"202603006@college.com","password":"hello@123","enrollmentNo":"202603006","rollNo":"CSE3A06","semester":3,"branch":"CSE","section":"A","attendance":81,"mstMarks":21,"endSemMarks":59,"grade":"B","progress":"Good"},
  {"name":"Pankaj Singh","email":"202603007@college.com","password":"hello@123","enrollmentNo":"202603007","rollNo":"CSE3A07","semester":3,"branch":"CSE","section":"A","attendance":76,"mstMarks":17,"endSemMarks":53,"grade":"C","progress":"Average"},
  {"name":"Gaurav Sharma","email":"202603008@college.com","password":"hello@123","enrollmentNo":"202603008","rollNo":"CSE3A08","semester":3,"branch":"CSE","section":"A","attendance":89,"mstMarks":24,"endSemMarks":71,"grade":"A","progress":"Excellent"},
  {"name":"Ankit Patel","email":"202603009@college.com","password":"hello@123","enrollmentNo":"202603009","rollNo":"CSE3A09","semester":3,"branch":"CSE","section":"A","attendance":83,"mstMarks":20,"endSemMarks":58,"grade":"B","progress":"Good"},
  {"name":"Ravi Chauhan","email":"202603010@college.com","password":"hello@123","enrollmentNo":"202603010","rollNo":"CSE3A10","semester":3,"branch":"CSE","section":"A","attendance":69,"mstMarks":15,"endSemMarks":49,"grade":"C","progress":"Needs Improvement"},

  // ================= SEMESTER 5 =================
  {"name":"Mohit Saxena","email":"202605001@college.com","password":"hello@123","enrollmentNo":"202605001","rollNo":"CSE5A01","semester":5,"branch":"CSE","section":"A","attendance":93,"mstMarks":25,"endSemMarks":72,"grade":"A","progress":"Excellent"},
  {"name":"Sumit Agarwal","email":"202605002@college.com","password":"hello@123","enrollmentNo":"202605002","rollNo":"CSE5A02","semester":5,"branch":"CSE","section":"A","attendance":86,"mstMarks":22,"endSemMarks":64,"grade":"A","progress":"Excellent"},
  {"name":"Lokesh Sharma","email":"202605003@college.com","password":"hello@123","enrollmentNo":"202605003","rollNo":"CSE5A03","semester":5,"branch":"CSE","section":"A","attendance":80,"mstMarks":20,"endSemMarks":60,"grade":"B","progress":"Good"},
  {"name":"Tarun Jain","email":"202605004@college.com","password":"hello@123","enrollmentNo":"202605004","rollNo":"CSE5A04","semester":5,"branch":"CSE","section":"A","attendance":75,"mstMarks":18,"endSemMarks":55,"grade":"B","progress":"Good"},
  {"name":"Ajay Verma","email":"202605005@college.com","password":"hello@123","enrollmentNo":"202605005","rollNo":"CSE5A05","semester":5,"branch":"CSE","section":"A","attendance":88,"mstMarks":23,"endSemMarks":67,"grade":"A","progress":"Excellent"},
  {"name":"Ritesh Singh","email":"202605006@college.com","password":"hello@123","enrollmentNo":"202605006","rollNo":"CSE5A06","semester":5,"branch":"CSE","section":"A","attendance":82,"mstMarks":21,"endSemMarks":59,"grade":"B","progress":"Good"},
  {"name":"Harsh Gupta","email":"202605007@college.com","password":"hello@123","enrollmentNo":"202605007","rollNo":"CSE5A07","semester":5,"branch":"CSE","section":"A","attendance":77,"mstMarks":19,"endSemMarks":54,"grade":"C","progress":"Average"},
  {"name":"Dinesh Patel","email":"202605008@college.com","password":"hello@123","enrollmentNo":"202605008","rollNo":"CSE5A08","semester":5,"branch":"CSE","section":"A","attendance":90,"mstMarks":24,"endSemMarks":70,"grade":"A","progress":"Excellent"},
  {"name":"Vivek Yadav","email":"202605009@college.com","password":"hello@123","enrollmentNo":"202605009","rollNo":"CSE5A09","semester":5,"branch":"CSE","section":"A","attendance":84,"mstMarks":22,"endSemMarks":61,"grade":"B","progress":"Good"},
  {"name":"Prakash Mishra","email":"202605010@college.com","password":"hello@123","enrollmentNo":"202605010","rollNo":"CSE5A10","semester":5,"branch":"CSE","section":"A","attendance":70,"mstMarks":16,"endSemMarks":50,"grade":"C","progress":"Needs Improvement"},

  // ================= SEMESTER 7 =================
  {"name":"Abhishek Sharma","email":"202607001@college.com","password":"hello@123","enrollmentNo":"202607001","rollNo":"CSE7A01","semester":7,"branch":"CSE","section":"A","attendance":94,"mstMarks":25,"endSemMarks":74,"grade":"A","progress":"Excellent"},
  {"name":"Karan Singh","email":"202607002@college.com","password":"hello@123","enrollmentNo":"202607002","rollNo":"CSE7A02","semester":7,"branch":"CSE","section":"A","attendance":88,"mstMarks":23,"endSemMarks":66,"grade":"A","progress":"Excellent"},
  {"name":"Rohit Verma","email":"202607003@college.com","password":"hello@123","enrollmentNo":"202607003","rollNo":"CSE7A03","semester":7,"branch":"CSE","section":"A","attendance":82,"mstMarks":21,"endSemMarks":62,"grade":"B","progress":"Good"},
  {"name":"Suresh Patel","email":"202607004@college.com","password":"hello@123","enrollmentNo":"202607004","rollNo":"CSE7A04","semester":7,"branch":"CSE","section":"A","attendance":78,"mstMarks":20,"endSemMarks":58,"grade":"B","progress":"Good"},
  {"name":"Neeraj Gupta","email":"202607005@college.com","password":"hello@123","enrollmentNo":"202607005","rollNo":"CSE7A05","semester":7,"branch":"CSE","section":"A","attendance":86,"mstMarks":22,"endSemMarks":65,"grade":"A","progress":"Excellent"},
  {"name":"Akhil Jain","email":"202607006@college.com","password":"hello@123","enrollmentNo":"202607006","rollNo":"CSE7A06","semester":7,"branch":"CSE","section":"A","attendance":81,"mstMarks":20,"endSemMarks":60,"grade":"B","progress":"Good"},
  {"name":"Manoj Yadav","email":"202607007@college.com","password":"hello@123","enrollmentNo":"202607007","rollNo":"CSE7A07","semester":7,"branch":"CSE","section":"A","attendance":76,"mstMarks":18,"endSemMarks":55,"grade":"C","progress":"Average"},
  {"name":"Sunil Mishra","email":"202607008@college.com","password":"hello@123","enrollmentNo":"202607008","rollNo":"CSE7A08","semester":7,"branch":"CSE","section":"A","attendance":90,"mstMarks":24,"endSemMarks":71,"grade":"A","progress":"Excellent"},
  {"name":"Rajesh Tiwari","email":"202607009@college.com","password":"hello@123","enrollmentNo":"202607009","rollNo":"CSE7A09","semester":7,"branch":"CSE","section":"A","attendance":84,"mstMarks":22,"endSemMarks":63,"grade":"B","progress":"Good"},
  {"name":"Anil Chauhan","email":"202607010@college.com","password":"hello@123","enrollmentNo":"202607010","rollNo":"CSE7A10","semester":7,"branch":"CSE","section":"A","attendance":72,"mstMarks":17,"endSemMarks":52,"grade":"C","progress":"Needs Improvement"}
];

const seedTargetStudents = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB cluster...');

        const studentsToCreate = targetStudents.map(s => ({
            name: s.name,
            email: s.email,
            password: 'hello@123', // User model hook will hash this
            role: 'student',
            enrollmentNumber: s.enrollmentNo,
            rollNumber: s.rollNo,
            semester: s.semester,
            department: s.branch,
            batch: '2024-2028',
            section: s.section,
            securityQuestion: 'Place of Birth?',
            securityAnswer: 'India',
            isActive: true
        }));

        console.log(`Clearing existing overlapping emails...`);
        const emails = studentsToCreate.map(s => s.email);
        await User.deleteMany({ email: { $in: emails } });

        console.log(`Inserting ${studentsToCreate.length} target students...`);
        await User.create(studentsToCreate);

        console.log('✅ Target Students Seeded Successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error seeding target students:', err);
        process.exit(1);
    }
};

seedTargetStudents();
