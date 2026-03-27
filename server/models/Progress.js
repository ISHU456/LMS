import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  completedItems: [{
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource' },
    itemType: { type: String, enum: ['video', 'pdf', 'assignment', 'quiz', 'ebook', 'resource', 'lecture', 'lab', 'tutorial', 'seminar', 'material', 'pyq', 'mindmap', 'ppt', 'yt', 'youtube', 'project'] },
    completedAt: { type: Date, default: Date.now }
  }],
  lastAccessed: { type: Date, default: Date.now }
}, { timestamps: true });

// Ensure unique progress per user per course
progressSchema.index({ user: 1, course: 1 }, { unique: true });

const Progress = mongoose.model('Progress', progressSchema);
export default Progress;
