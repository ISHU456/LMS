import mongoose from 'mongoose';

const prizeCatalogSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  requiredCoins: { type: Number, required: true },
  type: { type: String, enum: ['badge', 'coupon', 'physical'], required: true },
  imageUrl: { type: String },
  couponCode: { type: String }, // Optional, for digital prizes
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const PrizeCatalog = mongoose.model('PrizeCatalog', prizeCatalogSchema);
export default PrizeCatalog;
