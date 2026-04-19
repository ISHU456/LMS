import mongoose from 'mongoose';

const studentPrizeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  prize: { type: mongoose.Schema.Types.ObjectId, ref: 'PrizeCatalog' },
  monthlyPrize: { type: mongoose.Schema.Types.ObjectId, ref: 'MonthlyPrize' },
  unlockedAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'accepted', 'delivered', 'rejected'], 
    default: 'pending' 
  },
  isClaimed: { type: Boolean, default: false }, // Keep for backward compatibility/quick filters
  claimedAt: { type: Date }
}, { timestamps: true });

const StudentPrize = mongoose.model('StudentPrize', studentPrizeSchema);
export default StudentPrize;
