import mongoose from 'mongoose';

const resultAuditSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: ['SAVE_DRAFT', 'SUBMIT', 'APPROVE', 'REJECT', 'LOCK', 'UNLOCK', 'PUBLISH', 'GENERATE_FINAL'],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    semester: {
      type: Number,
    },
    academicYear: {
      type: String,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const ResultAudit = mongoose.model('ResultAudit', resultAuditSchema);
export default ResultAudit;
