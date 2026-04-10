import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true }, // URL to icon image
  category: { type: String, enum: ['Quiz', 'Time', 'Streak', 'Special', 'SiteCompletion'], required: true },
  criteria: {
    type: { type: String, enum: ['QuizCount', 'QuizScore', 'TimeSpent', 'StreakCount', 'TotalCourses'], required: true },
    threshold: { type: mongoose.Schema.Types.Mixed, required: true }, // e.g., 10 (quizzes), 100 (score), 50 (hours)
  },
  reward: {
    coins: { type: Number, default: 0 },
    multiplier: { type: Number, default: 1.0 }
  }
}, { timestamps: true });

const Badge = mongoose.model('Badge', badgeSchema);
export default Badge;
