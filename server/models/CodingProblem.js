import mongoose from 'mongoose';

const codingProblemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' },
  points: { type: Number, default: 10 },
  testCases: [{
    input: { type: String, required: true },
    output: { type: String, required: true },
    isHidden: { type: Boolean, default: true }
  }],
  sampleInput: { type: String },
  sampleOutput: { type: String },
  constraints: { type: String },
  timeLimit: { type: Number, default: 1.0 }, // in seconds
  memoryLimit: { type: Number, default: 256 }, // in MB
  tags: [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const CodingProblem = mongoose.model('CodingProblem', codingProblemSchema);
export default CodingProblem;
