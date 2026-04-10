import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
};

const partitionStudents = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to Sector Matrix for Partitioning...");

        const students = await User.find({ role: 'student' });
        
        // Group by Semester and Department
        const groups = {};
        students.forEach(s => {
            const key = `${s.department}_${s.semester}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(s);
        });

        const ops = [];
        for (const key in groups) {
            const group = groups[key];
            shuffleArray(group);
            
            const half = Math.ceil(group.length / 2);
            group.forEach((s, idx) => {
                const section = idx < half ? 'A' : 'B';
                ops.push(User.findByIdAndUpdate(s._id, { section }));
            });
        }

        if (ops.length > 0) {
            await Promise.all(ops);
            console.log(`Successfully partitioned ${ops.length} students into Alpha-Bravo sections.`);
        }
        
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

partitionStudents();
