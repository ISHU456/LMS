import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  title: { type: String }, // Optional title
  content: { type: String, required: true },
  
  // Post Type
  type: { type: String, enum: ['text', 'image', 'video', 'file', 'link'], default: 'text' },

  // Organization & importance
  category: { type: String, default: 'General' }, 
  priority: { type: String, default: 'normal' }, 
  pinned: { type: Boolean, default: false },
  important: { type: Boolean, default: false },
  tags: [{ type: String }],

  // Scheduling metadata
  deadline: { type: Date },
  eventDate: { type: Date },
  venue: { type: String },
  duration: { type: String },
  going: { type: Number, default: 0 },

  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String }, 
  
  // Subject/Course Link
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  attachments: [{
    url: { type: String },
    type: { type: String, enum: ['image', 'video', 'pdf', 'doc', 'other'] },
    name: { type: String },
    size: { type: Number },
    thumbnail: { type: String }
  }],

  // Video embed (YouTube/Vimeo)
  videoUrl: { type: String },

  // External link
  externalLink: { type: String },

  // Engagement
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reactions: {
    like: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    heart: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    clap: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    fire: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    think: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],

  // Views & presence
  views: { type: Number, default: 0 },
  presence: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastSeenAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

const Announcement = mongoose.model('Announcement', announcementSchema);
export default Announcement;

