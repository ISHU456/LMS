import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin', 'hod', 'librarian', 'parent'],
      required: true,
    },
    // Common Profile Fields
    dob: { type: Date },
    address: { type: String },
    contact: { type: String },
    profilePic: { type: String, default: '' },
    emergencyContact: {
      name: { type: String },
      relation: { type: String },
      phone: { type: String },
    },
    
    // Student Specific Fields
    enrollmentNumber: { type: String, unique: true, sparse: true },
    batch: { type: String },
    department: { type: String },
    year: { type: Number },
    semester: { type: Number },
    rollNumber: { type: String },
    section: { type: String, enum: ['A', 'B'], default: 'A' },
    
    // Parent/Guardian Info (for Students)
    parentInfo: {
      fatherName: { type: String },
      motherName: { type: String },
      parentContact: { type: String },
    },

    // Faculty/HOD Specific Fields
    employeeId: { type: String },
    assignedSemesters: [{ type: Number }],
    
    // Security and Verification
    securityQuestion: { type: String, required: true },
    securityAnswer: { type: String, required: true },
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isAuthorized: { type: Boolean, default: true }, // For teachers
    registrationToken: { type: String }, // Provided to teachers upon registration
    deactivationRequested: { type: Boolean, default: false },
    currentCourse: { type: String, default: null },
    lastActive: { type: Date, default: Date.now },
    credits: { type: Number, default: 10 },
    aiCreditsRequested: { type: Boolean, default: false },
    
    // Career & Profile Enhancement (Admin manageable)
    qualification: { type: String },
    experienceYears: { type: Number, default: 0 },
    designation: { type: String },
    expertise: [{ type: String }],
    careerDetails: { type: String },
    aboutMe: { type: String },
    cgpa: { type: Number }, // For students
    percentage: { type: Number }, // For students
    faceRegistered: { type: Boolean, default: false },

    // Gamification & Rewards
    coins: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastStreakedAt: { type: Date },
    totalLearningTime: { type: Number, default: 0 }, // In minutes
    earnedBadges: [{ 
      badge: { type: mongoose.Schema.Types.ObjectId, ref: 'Badge' },
      earnedAt: { type: Date, default: Date.now }
    }],
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Avoid hashing security answer here to keep it simple, but in production we'd hash it.
// We'll compare directly for demo purposes.

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
