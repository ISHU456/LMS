import mongoose from 'mongoose';

const codingContestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  problems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CodingProblem' }],
  status: { type: String, enum: ['scheduled', 'live', 'ended'], default: 'scheduled' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  scoringRules: {
    correctnessWeight: { type: Number, default: 0.7 },
    performanceWeight: { type: Number, default: 0.3 }
  },
  prizes: [{
    title: String,
    image: String,
    description: String,
    eligibility: String // e.g., 'Top 3', 'Top 10'
  }]
}, { timestamps: true });

const CodingContest = mongoose.model('CodingContest', codingContestSchema);
export default CodingContest;
