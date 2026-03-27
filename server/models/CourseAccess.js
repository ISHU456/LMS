import mongoose from 'mongoose';

const courseAccessSchema = new mongoose.Schema({
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
  accessState: { 
    type: String, 
    enum: ['ACTIVE', 'RESTRICTED', 'BLOCKED'], 
    default: 'ACTIVE' 
  },
  reason: { 
    type: String 
  },
  updatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  restrictionHistory: [{
    state: String,
    reason: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now }
  }],
  autoRestricted: {
    type: Boolean,
    default: false
  },
  attendancePercent: {
    type: Number,
    default: 100
  }
}, { 
  timestamps: true 
});

// Ensure unique access status for a student per course
courseAccessSchema.index({ course: 1, student: 1 }, { unique: true });

const CourseAccess = mongoose.model('CourseAccess', courseAccessSchema);

export default CourseAccess;
