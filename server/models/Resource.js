import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  points: { type: Number, default: 10 },
  type: { type: String, enum: ['material', 'ebook', 'pyq', 'yt', 'mindmap', 'resource', 'youtube', 'pdf', 'ppt', 'assignment'], required: true },
  fileUrl: { type: String }, // Cloudinary / S3 / Local Server URL
  fileData: { data: Buffer, contentType: String }, // Optional direct DB storage for small files
  fileType: { type: String }, // pdf, pptx, zip, docx
  size: { type: String }, // e.g. "4.2 MB"
  
  // Categorization
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  extraCourseId: { type: String }, // For simple mock-ID / code matching (CH101, etc)
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  semester: { type: Number, min: 1, max: 8 },
  tags: [{ type: String }],
  
  // For eBooks explicitly
  author: { type: String },
  year: { type: Number },
  
  // Trackers & Analytics
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  downloads: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  ratings: [{
     user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
     rating: { type: Number, min: 1, max: 5 }
  }]
}, {
  timestamps: true
});

const Resource = mongoose.model('Resource', resourceSchema);
export default Resource;
