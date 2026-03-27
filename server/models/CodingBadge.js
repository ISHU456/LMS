import mongoose from 'mongoose';

const codingBadgeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contestId: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingContest' },
  badgeType: { 
    type: String, 
    enum: ['Weekly Winner', 'Top 3 Performer', 'Top 10 Coder', 'Problem Solver', 'Speed Coder'], 
    required: true 
  },
  title: { type: String, required: true },
  icon: { type: String, default: '🏅' },
  rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary'], default: 'common' },
  earnedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const CodingBadge = mongoose.model('CodingBadge', codingBadgeSchema);
export default CodingBadge;
