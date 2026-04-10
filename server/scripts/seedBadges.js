import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import Badge from '../models/Badge.js';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedBadges = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/lms';
    await mongoose.connect(mongoURI);
    console.log("Connected to Cognitive Database Segment...");

    const badges = [
      {
        name: "Neural Pioneer",
        description: "First Quiz Completion",
        category: "Quiz-Based",
        criteria: { type: "quizCount", value: 1 },
        icon: "https://cdn-icons-png.flaticon.com/512/10433/10433048.png"
      },
      {
        name: "Cognitive Dominant",
        description: "Maintain 90%+ in 5 Quizzes",
        category: "Quiz-Based",
        criteria: { type: "averageScore", value: 90 },
        icon: "https://cdn-icons-png.flaticon.com/512/10433/10433054.png"
      },
      {
        name: "Chrono-Learner",
        description: "10 Hours Platform Usage",
        category: "Time-Spent",
        criteria: { type: "usageHours", value: 10 },
        icon: "https://cdn-icons-png.flaticon.com/512/10433/10433060.png"
      },
      {
        name: "Velocity Architect",
        description: "Complete a Quiz in under 2 minutes",
        category: "Quiz-Based",
        criteria: { type: "speed", value: 120 },
        icon: "https://cdn-icons-png.flaticon.com/512/10433/10433066.png"
      },
      {
        name: "Node Master",
        description: "Complete All Course Modules",
        category: "Full Site Completion",
        criteria: { type: "completionPercentage", value: 100 },
        icon: "https://cdn-icons-png.flaticon.com/512/10433/10433072.png"
      }
    ];

    await Badge.deleteMany({});
    await Badge.insertMany(badges);
    console.log("Neural Badge Manifest Deployed Successfully.");
  } catch (err) {
    console.error("Neural Node Deployment Failure:", err);
  } finally {
    process.exit();
  }
};

seedBadges();
