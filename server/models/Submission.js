import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentNotes: { type: String },
  submittedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['submitted', 'graded', 'rejected'], default: 'submitted' },
  marksObtained: { type: Number },
  facultyFeedback: { type: String },
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gradedAt: { type: Date },
  files: [{
    fileName: String,
    fileUrl: String
  }],
  quizAnswers: mongoose.Schema.Types.Mixed,
  attemptCount: { type: Number, default: 1 }
}, {
  timestamps: true
});

const Submission = mongoose.model('Submission', submissionSchema);
export default Submission;
