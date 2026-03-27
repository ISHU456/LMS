import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
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
const semesters = [2, 4, 6, 8];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const generateStudents = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB...');

    // Clear existing students
    console.log('Cleaning existing students...');
    const deleteResult = await User.deleteMany({ role: 'student' });
    console.log(`Deleted ${deleteResult.deletedCount} existing students.`);

    const students = [];
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('hello@123', salt);

    for (const sem of semesters) {
      console.log(`Generating students for Semester ${sem}...`);
      
      for (const branch of branches) {
        let count = 0;
        if (branch === "CSE") count = 15;
        else if (branch === "IT") count = 12;
        else if (branch === "ECE") count = 10;
        else count = 8; // ME, CE

        for (let i = 1; i <= count; i++) {
          const isFemale = Math.random() > 0.6;
          const firstName = isFemale ? getRandom(femaleFirstNames) : getRandom(maleFirstNames);
          const lastName = getRandom(lastNames);
          const name = `${firstName} ${lastName}`;
          
          // Roll Number Logic: BRANCH + SEM + SEM (2 digits) + SERIAL (3 digits)
          // e.g. CSE202001
          const semString = sem.toString();
          const semDoubleString = sem.toString().padStart(2, '0');
          const serialString = i.toString().padStart(3, '0');
          const rollNumber = `${branch}${semString}${semDoubleString}${serialString}`;
          
          const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${branch.toLowerCase()}.edu`;
          
          students.push({
            name,
            email,
            password: hashedPassword, // Using pre-hashed for speed since User model also hashes (wait, User model hashes on save)
            // If User model hashes on save, I should provide plain text if I want the hook to work.
            // But User model check `isModified('password')`. 
            // If I provide hashed, it might re-hash. 
            // Let's provide 'hello@123' and let the hook handle it.
            role: 'student',
            semester: sem,
            branch: branch,
            department: branch, // Map branch to department
            rollNumber,
            enrollmentNumber: `ENR${rollNumber}`,
            section: "A",
            batch: `${2026 - sem/2}-${2026 - sem/2 + 4}`, // Realistic batch
            isActive: true,
            securityQuestion: "Default?",
            securityAnswer: "Yes"
          });
        }
      }
    }

    // Since we have 'hello@123' as plain text, we don't need hashedPassword here if we use .save()
    // But for bulk insertion, we should probably hash manually or use insertMany and disable hook (if possible)
    // Actually, I'll just use User.create(students) which triggers hooks.
    
    console.log(`Inserting ${students.length} students...`);
    // Provide plain text password so User model hook hashes it correctly
    students.forEach(s => s.password = 'hello@123');

    await User.insertMany(students);

    console.log('✅ Seeding Completed!');
    console.log(`Total Students: ${students.length}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding students:', err);
    process.exit(1);
  }
};

generateStudents();
