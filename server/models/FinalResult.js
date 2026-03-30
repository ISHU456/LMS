import mongoose from 'mongoose';

const finalResultSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
    department: {
      type: String,
    },
    courseResults: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Result',
    }],
    totalMarksObtained: {
      type: Number,
      default: 0,
    },
    totalMarksMax: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    sgpa: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    pdfUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const FinalResult = mongoose.model('FinalResult', finalResultSchema);
export default FinalResult;
