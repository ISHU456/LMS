import mongoose from 'mongoose';

const teacherAttendanceSchema = new mongoose.Schema({
  teacher: { 
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
    enum: ['present', 'absent', 'late', 'on_leave'], 
    default: 'present' 
  },
  markedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true // Admin who marked it
  },
  checkInTime: {
    type: String // 09:00 AM
  },
  checkOutTime: {
    type: String // 05:00 PM
  },
  remarks: { 
    type: String 
  }
}, { 
  timestamps: true 
});

// Ensure unique attendance entry for a teacher on a specific date
teacherAttendanceSchema.index({ teacher: 1, date: 1 }, { unique: true });

const TeacherAttendance = mongoose.model('TeacherAttendance', teacherAttendanceSchema);

export default TeacherAttendance;
