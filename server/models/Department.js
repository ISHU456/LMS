import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  tagline: { type: String },
  description: { type: String },
  overview: { type: String },
  establishedYear: { type: Number },
  
  // Hero & Media
  heroImage: { type: String },
  gallery: [{
    url: String,
    caption: String,
    type: { type: String, enum: ['image', 'video'], default: 'image' }
  }],

  // Strategic
  vision: { type: String },
  mission: { type: String },
  highlights: [{
    title: String,
    value: String,
    icon: String // Lucide icon name
  }],

  // People
  hod: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  facultyList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Programs
  programs: [{
    name: String, // e.g. B.Tech in CSE
    level: { type: String, enum: ['UG', 'PG', 'PhD'] },
    duration: String,
    eligibility: String,
    description: String
  }],

  // Facilities
  infrastructure: [{
    name: String,
    description: String,
    image: String,
    icon: String
  }],

  // Outcomes
  placements: {
    stats: [{ year: String, percentage: Number, highestPackage: String }],
    topRecruiters: [String] // URLs to logos
  },
  achievements: [{
    title: String,
    date: Date,
    description: String,
    image: String
  }],

  // Social
  testimonials: [{
    name: String,
    role: String, // Student, Alumni
    content: String,
    avatar: String
  }],

  // Contact
  contactDetails: {
    email: String,
    phone: String,
    address: String,
    mapLocation: {
      lat: Number,
      lng: Number
    }
  }
}, {
  timestamps: true
});

const Department = mongoose.model('Department', departmentSchema);
export default Department;
