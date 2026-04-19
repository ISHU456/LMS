import mongoose from 'mongoose';

const monthlyPrizeSchema = new mongoose.Schema({
  rank: { type: Number, required: true },
  month: { type: Number, required: true }, // 0-11
  year: { type: Number, required: true },
  imageUrl: { type: String, required: true },
  requiredCoins: { type: Number, required: true },
  rewardName: { type: String, required: true } // e.g. "Diamond Elite Prize"
}, { timestamps: true });

// Ensure unique rank per month/year
monthlyPrizeSchema.index({ rank: 1, month: 1, year: 1 }, { unique: true });

const MonthlyPrize = mongoose.model('MonthlyPrize', monthlyPrizeSchema);
export default MonthlyPrize;
