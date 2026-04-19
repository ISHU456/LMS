import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true }, // e.g., 'CSE', 'General'
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  questions: [{
    text: { type: String, required: true },
    type: { type: String, enum: ['mcq', 'truefalse', 'coding'], default: 'mcq' },
    options: [{ type: String }],
    correctAnswer: { type: String }, // Optional for coding questions (uses test cases instead)
    codingLanguage: { type: String }, // e.g., 'python', 'javascript'
    starterCode: { type: String },
    testCases: [{
      input: { type: String },
      expectedOutput: { type: String }
    }],
    explanation: { type: String }

  }],
  timeLimit: { type: Number, required: true }, // In minutes
  totalPoints: { type: Number, required: true },
  rewardCoins: { type: Number, default: 50 }, // Base reward
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;

