const mongoose = require('mongoose');
const Badge = require('./server/models/Badge');
require('dotenv').config();

const seedBadges = async () => {
  await mongoose.connect('mongodb://localhost:27017/lms');
  
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
  console.log("Neural Badge Manifest Deployed.");
  process.exit();
};

seedBadges();
