import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  credits: { type: Number, required: true, min: 1, max: 6 },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  semester: { type: Number, required: true, min: 1, max: 8 },
  type: { type: String, enum: ['THEORY', 'PRACTICAL', 'VIVA'], required: true },
  description: { type: String },
  syllabusUrl: { type: String }, // Link to PDF or document upload
  textbooks: [{
    title: String,
    author: String,
    isbn: String
  }],
  prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  facultyAssigned: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  batches: [{ type: String }], // e.g., '2023-2027'
  schedule: [{
    day: { type: String, required: true },
    time: { type: String, required: true },
    room: { type: String, required: true },
    activity: { type: String, required: true },
    type: { type: String, enum: ['lecture', 'lab', 'tutorial', 'seminar'], default: 'lecture' },
    addedBy: { type: String }
  }],
  timetableImageUrl: { type: String },
  excludedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, {
  timestamps: true
});

const Course = mongoose.model('Course', courseSchema);
export default Course;
