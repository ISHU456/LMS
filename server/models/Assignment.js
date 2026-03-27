import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['assignment', 'project', 'quiz', 'pdf'], default: 'assignment' },
  
  // Quiz specific fields
  quizQuestions: [{
    question: String,
    options: [String],
    correctAnswer: Number // index
  }],
  
  // PDF specific fields
  pdfUrl: { type: String },
  
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  extraCourseId: { type: String }, // For simple mock-ID matching (CH101, etc)
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The teacher who created it
  
  dueDate: { type: Date, required: true },
  totalMarks: { type: Number, required: true },
  
  attachments: [{
    fileName: String,
    fileUrl: String // Cloudinary / S3 Link
  }],

  // Specific to Projects
  allowGroupSubmission: { type: Boolean, default: false },
  maxGroupSize: { type: Number, default: 1 }

}, {
  timestamps: true
});

const Assignment = mongoose.model('Assignment', assignmentSchema);
export default Assignment;
