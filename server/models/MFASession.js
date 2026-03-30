import mongoose from 'mongoose';

const mfaSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tempToken: { 
    type: String, 
    required: true, 
    unique: true 
  },
  isVerified: { 
    type: Boolean, 
    default: false 
  },
  expiresAt: { 
    type: Date, 
    required: true 
  },
  // Captures GPS status during MFA login phase
  lastVerifiedLocation: {
    lat: { type: Number },
    lng: { type: Number },
    verifiedAt: { type: Date }
  }
}, {
  timestamps: true
});

// TTL index to automatically remove expired sessions
mfaSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const MFASession = mongoose.model('MFASession', mfaSessionSchema);
export default MFASession;
