import mongoose from 'mongoose';

const gpsConfigSchema = new mongoose.Schema({
  center: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  radius: { type: Number, required: true, default: 100 }, // meters
  label: { type: String, default: 'Main Campus' },
  isActive: { type: Boolean, default: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

const GPSConfig = mongoose.model('GPSConfig', gpsConfigSchema);
export default GPSConfig;
