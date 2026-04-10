import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema(
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
    courseType: {
      type: String,
      enum: ['THEORY', 'PRACTICAL', 'VIVA'],
      required: true,
    },
    semester: {
      type: Number,
      required: true,
      min: 1, 
      max: 8
    },
    academicYear: {
      type: String, // e.g., "2023-24"
      required: true,
    },
    marks: {
      // For THEORY
      mst1: { type: Number, min: 0, max: 100 },
      mst2: { type: Number, min: 0, max: 100 },
      mst3: { type: Number, min: 0, max: 100 },
      endSem: { type: Number, min: 0, max: 100 },
      // For PRACTICAL
      internalPractical: { type: Number, min: 0, max: 40 },
      externalPractical: { type: Number, min: 0, max: 60 },
      // For VIVA
      vivaScore: { type: Number, min: 0, max: 100 },
      // Tracking absences
      absentFields: [{ type: String }], // Assessing fields like 'mst1', 'endSem'
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    grade: {
      type: String,
      default: 'F',
    },
    gradePoints: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'published', 'rejected'],
      default: 'draft',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: {
      type: String,
    },
    submittedAt: {
      type: Date,
    },
    approvedAt: {
      type: Date,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    lockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    lockedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate total marks and grade before saving
resultSchema.pre('save', function (next) {
  const m = this.marks || {};
  const { mst1, mst2, mst3, endSem, internalPractical, externalPractical, vivaScore } = m;
  
  if (this.courseType === 'THEORY') {
    const msts = [Number(mst1) || 0, Number(mst2) || 0, Number(mst3) || 0];
    const bestTwoSum = msts.sort((a, b) => b - a).slice(0, 2).reduce((sum, val) => sum + val, 0);
    this.totalMarks = Math.round((bestTwoSum + (Number(endSem) || 0)) * 100) / 100;
  } else if (this.courseType === 'PRACTICAL') {
    this.totalMarks = (Number(internalPractical) || 0) + (Number(externalPractical) || 0);
  } else if (this.courseType === 'VIVA') {
    this.totalMarks = (Number(vivaScore) || 0) * 10;
  }

  // Grading Logic (Standardized for 100-point total)
  let score = this.totalMarks;
  if (score >= 90) { this.grade = 'O'; this.gradePoints = 10; }
  else if (score >= 80) { this.grade = 'A+'; this.gradePoints = 9; }
  else if (score >= 70) { this.grade = 'A'; this.gradePoints = 8; }
  else if (score >= 60) { this.grade = 'B+'; this.gradePoints = 7; }
  else if (score >= 50) { this.grade = 'B'; this.gradePoints = 6; }
  else if (score >= 40) { this.grade = 'C'; this.gradePoints = 5; }
  else { this.grade = 'F'; this.gradePoints = 0; }
  
  next();
});

const Result = mongoose.model('Result', resultSchema);
export default Result;
