import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true }, // e.g., 'CSE', 'General', 'Logic'
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  questions: [{
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: Number, required: true }, // Index of option
    explanation: { type: String }
  }],
  timeLimit: { type: Number, required: true }, // In minutes
  idealTime: { type: Number }, // Ideal completion time for bonus coins
  totalPoints: { type: Number, required: true },
  coinsReward: {
    base: { type: Number, default: 10 },
    fullMarksBonus: { type: Number, default: 20 },
    speedBonusMultiplier: { type: Number, default: 1.5 }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;
