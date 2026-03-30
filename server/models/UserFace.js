import mongoose from 'mongoose';

const userFaceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Descriptors are stored as encrypted JSON payloads (iv:data)
  // Each payload contains an array of descriptors
  encryptedDescriptors: { 
    type: String, 
    required: true 
  },
  registeredAt: { 
    type: Date, 
    default: Date.now 
  },
  lastUsedByMFA: { 
    type: Date 
  },
  mfaEnabled: { 
    type: Boolean, 
    default: true 
  }
}, {
  timestamps: true
});

const UserFace = mongoose.model('UserFace', userFaceSchema);
export default UserFace;
