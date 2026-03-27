import mongoose from 'mongoose';

const codingRewardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contestId: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingContest' },
  coinsEarned: { type: Number, required: true },
  reason: { type: String, required: true }, // e.g. 'Rank 1', 'Fastest Correct Submission'
  badgeEarned: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingBadge' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const CodingReward = mongoose.model('CodingReward', codingRewardSchema);
export default CodingReward;
