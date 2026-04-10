import mongoose from 'mongoose';

const quizAttemptSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  score: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  timeTaken: { type: Number, required: true }, // In seconds
  coinsEarned: { type: Number, required: true },
  answers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId },
    selectedOption: { type: Number },
    isCorrect: { type: Boolean }
  }],
  rank: { type: Number },
  tabSwitches: { type: Number, default: 0 }, // Simple anti-cheat
  submittedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['completed', 'failed'], default: 'completed' }
}, { timestamps: true });

const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);
export default QuizAttempt;
