import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // If allowGroupSubmission is true on Assignment
  groupMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  status: { type: String, enum: ['pending', 'submitted', 'late', 'graded'], default: 'pending' },
  submittedAt: { type: Date },
  
  files: [{
    fileName: String,
    fileUrl: String // File Upload (Zip, PDF, PPT)
  }],

  studentNotes: { type: String },
  quizAnswers: [Number], // Store student's chosen option index for each question
  automatedScore: { type: Number }, // Calculated score for Quiz type

  // Grading
  marksObtained: { type: Number },
  facultyFeedback: { type: String },
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gradedAt: { type: Date },
  attemptCount: { type: Number, default: 1 }

}, {
  timestamps: true
});

const Submission = mongoose.model('Submission', submissionSchema);
export default Submission;
