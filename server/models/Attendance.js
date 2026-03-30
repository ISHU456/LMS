import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  course: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  date: { 
    type: Date, 
    required: true,
    index: true
  },
  status: { 
    type: String, 
    enum: ['present', 'absent', 'late', 'excused'], 
    default: 'present' 
  },
  semester: { 
    type: Number, 
    required: true 
  },
  markedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  remarks: { 
    type: String 
  },
  entryWindowExpiresAt: {
    type: Date,
    required: true
  },
  isBiometricVerified: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true 
});

// Compound index for quick lookups as requested
attendanceSchema.index({ course: 1, student: 1 });
attendanceSchema.index({ course: 1, date: 1 });

// Ensure unique attendance entry for a student on a specific date for a subject
attendanceSchema.index({ course: 1, student: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
