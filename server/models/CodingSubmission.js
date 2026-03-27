import mongoose from 'mongoose';

const codingSubmissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contestId: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingContest', required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingProblem', required: true },
  code: { type: String, required: true },
  language: { type: String, default: 'javascript' },
  status: { type: String, enum: ['Accepted', 'Partially Accepted', 'Wrong Answer', 'Runtime Error', 'Time Limit Exceeded', 'Internal Error'], default: 'Accepted' },
  executionTime: { type: Number, default: 0 },
  memoryUsed: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  testCasesPassed: { type: Number, default: 0 },
  totalTestCases: { type: Number, default: 0 },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const CodingSubmission = mongoose.model('CodingSubmission', codingSubmissionSchema);
export default CodingSubmission;
