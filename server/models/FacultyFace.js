import mongoose from 'mongoose';

const facultyFaceSchema = new mongoose.Schema(
  {
    facultyId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true // Fast lookup
    },
    faceDescriptors: [
      {
        descriptor: { type: [Number], required: true }, // 128-dimensional array
        createdAt: { type: Date, default: Date.now },
        quality: { type: Number, min: 0, max: 100 } // 0-100 Quality check
      }
    ],
    registeredAt: { type: Date, default: Date.now },
    lastUsed: { type: Date },
  },
  {
    timestamps: true, // This will handle updatedAt
  }
);

const FacultyFace = mongoose.model('FacultyFace', facultyFaceSchema);
export default FacultyFace;
