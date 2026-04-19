import mongoose from 'mongoose';

const codingChallengeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  problemStatement: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' },
  category: { type: String, default: 'General' },
  points: { type: Number, default: 100 },
  constraints: [String],
  examples: [{
    input: String,
    output: String,
    explanation: String
  }],
  starterCode: {
    javascript: String,
    python: String,
    java: String,
    cpp: String
  },
  testCases: [{
    input: String,
    expectedOutput: String,
    isPublic: { type: Boolean, default: false }
  }],
  allowedLanguages: {
    type: [String],
    default: ['javascript', 'python', 'java', 'cpp', 'c', 'csharp', 'go']
  },
  isWeeklyTest: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const CodingChallenge = mongoose.model('CodingChallenge', codingChallengeSchema);
export default CodingChallenge;
