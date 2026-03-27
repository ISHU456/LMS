import mongoose from 'mongoose';

const codingLeaderboardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contestId: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingContest', required: true },
  totalScore: { type: Number, default: 0 },
  rank: { type: Number },
  penaltyTime: { type: Number, default: 0 }, // in minutes
  problemsSolved: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CodingProblem' }],
  submissionsCount: { type: Number, default: 0 }
}, { timestamps: true });

const CodingLeaderboard = mongoose.model('CodingLeaderboard', codingLeaderboardSchema);
export default CodingLeaderboard;
