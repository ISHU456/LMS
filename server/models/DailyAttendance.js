import mongoose from 'mongoose';

const dailyAttendanceSchema = new mongoose.Schema({
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
  entry: {
    time: Date,
    location: {
      lat: Number,
      lng: Number
    },
    faceVerified: {
      type: Boolean,
      default: false
    }
  },
  exit: {
    time: Date,
    location: {
      lat: Number,
      lng: Number
    },
    faceVerified: {
      type: Boolean,
      default: false
    }
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'incomplete'],
    default: 'incomplete'
  }
}, {
  timestamps: true
});

// Ensure one record per student per day
dailyAttendanceSchema.index({ student: 1, date: 1 }, { unique: true });

const DailyAttendance = mongoose.model('DailyAttendance', dailyAttendanceSchema);
export default DailyAttendance;
