import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Course from '../models/Course.js';
import Department from '../models/Department.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedAllCourses = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const cseDept = await Department.findOne({ code: 'CSE' });
        if (!cseDept) {
            console.error('CSE Department not found!');
            process.exit(1);
        }

        const courses = [
            // Semester 2
            { name: 'Engineering Physics', code: 'BT-201', credits: 4, semester: 2, type: 'THEORY' },
            { name: 'Mathematics-II', code: 'BT-202', credits: 4, semester: 2, type: 'THEORY' },
            { name: 'Basic Mechanical Engineering', code: 'BT-203', credits: 3, semester: 2, type: 'THEORY' },
            { name: 'Basic Civil Engineering', code: 'BT-204', credits: 3, semester: 2, type: 'THEORY' },
            { name: 'Basic Computer Engineering', code: 'BT-205', credits: 3, semester: 2, type: 'THEORY' },

            // Semester 3
            { name: 'Mathematics-III', code: 'BT-301', credits: 4, semester: 3, type: 'THEORY' },
            { name: 'Data Structures', code: 'BT-302', credits: 4, semester: 3, type: 'THEORY' },
            { name: 'Digital Systems', code: 'BT-303', credits: 3, semester: 3, type: 'THEORY' },
            { name: 'Computer Organization', code: 'BT-304', credits: 3, semester: 3, type: 'THEORY' },
            { name: 'Discrete Mathematics', code: 'BT-305', credits: 4, semester: 3, type: 'THEORY' },

            // Semester 4
            { name: 'Analysis & Design of Algorithms', code: 'BT-401', credits: 4, semester: 4, type: 'THEORY' },
            { name: 'Operating Systems', code: 'BT-402', credits: 4, semester: 4, type: 'THEORY' },
            { name: 'Software Engineering', code: 'BT-403', credits: 3, semester: 4, type: 'THEORY' },
            { name: 'Theory of Computation', code: 'BT-404', credits: 3, semester: 4, type: 'THEORY' },
            { name: 'Database Management Systems', code: 'BT-405', credits: 4, semester: 4, type: 'THEORY' },

            // Semester 5
            { name: 'Computer Networks', code: 'BT-501', credits: 4, semester: 5, type: 'THEORY' },
            { name: 'Compiler Design', code: 'BT-502', credits: 3, semester: 5, type: 'THEORY' },
            { name: 'Machine Learning / AI', code: 'BT-503', credits: 4, semester: 5, type: 'THEORY' },
            { name: 'Open Elective-I', code: 'BT-OE1', credits: 3, semester: 5, type: 'THEORY' },
            { name: 'Department Elective-I', code: 'BT-DE1', credits: 3, semester: 5, type: 'THEORY' },

            // Semester 6
            { name: 'Cloud Computing', code: 'BT-601', credits: 4, semester: 6, type: 'THEORY' },
            { name: 'Information Security', code: 'BT-602', credits: 3, semester: 6, type: 'THEORY' },
            { name: 'Data Mining / Big Data', code: 'BT-603', credits: 3, semester: 6, type: 'THEORY' },
            { name: 'Open Elective-II', code: 'BT-OE2', credits: 3, semester: 6, type: 'THEORY' },
            { name: 'Department Elective-II', code: 'BT-DE2', credits: 3, semester: 6, type: 'THEORY' },

            // Semester 7
            { name: 'Artificial Intelligence', code: 'BT-701', credits: 4, semester: 7, type: 'THEORY' },
            { name: 'Blockchain / IoT (Elective)', code: 'BT-DE3', credits: 3, semester: 7, type: 'THEORY' },
            { name: 'Major Project - Phase 1', code: 'BT-PROJ1', credits: 4, semester: 7, type: 'PRACTICAL' },
            { name: 'Industrial Training', code: 'BT-TRAIN', credits: 2, semester: 7, type: 'PRACTICAL' },

            // Semester 8
            { name: 'Major Project - Phase 2', code: 'BT-PROJ2', credits: 6, semester: 8, type: 'PRACTICAL' },
            { name: 'Seminar', code: 'BT-SEM', credits: 1, semester: 8, type: 'THEORY' },
            { name: 'Internship / Industry Work', code: 'BT-INTERN', credits: 4, semester: 8, type: 'PRACTICAL' },
        ];

        for (const c of courses) {
            await Course.findOneAndUpdate(
                { code: c.code },
                { ...c, department: cseDept._id },
                { upsert: true, new: true }
            );
            console.log(`✅ Seeded: ${c.code} - ${c.name} (Semester ${c.semester})`);
        }

        console.log('\n✅ Comprehensive Curriculum Successfully Seeded to Atlas!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding Error:', err);
        process.exit(1);
    }
};

seedAllCourses();
