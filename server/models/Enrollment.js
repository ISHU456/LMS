import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    semester: {
      type: Number,
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['enrolled', 'completed', 'dropped'],
      default: 'enrolled',
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a student can only be enrolled in a course once per semester/year
enrollmentSchema.index({ student: 1, course: 1, semester: 1, academicYear: 1 }, { unique: true });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
export default Enrollment;
