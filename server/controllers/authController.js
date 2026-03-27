import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { cloudinary } from '../config/cloudinary.js';

// Verify college email domain helper
const isValidCollegeEmail = (email) => {
  return email.endsWith('@college.edu') || email.endsWith('@student.college.edu');
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { 
      name, email, password, role, dob, address, contact, 
      enrollmentNumber, batch, department, year, semester, rollNumber,
      employeeId, securityQuestion, securityAnswer, descriptors, profilePic
    } = req.body;

    let finalProfilePic = profilePic;
    if (profilePic && profilePic.startsWith('data:image')) {
      const uploadRes = await cloudinary.uploader.upload(profilePic, {
        folder: 'lms_profiles',
      });
      finalProfilePic = uploadRes.secure_url;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name, email: normalizedEmail, password, role, dob, address, contact, 
      enrollmentNumber, batch, department, year, semester, rollNumber,
      employeeId, securityQuestion, securityAnswer, profilePic: finalProfilePic
    });

    if (user) {
      res.status(201).json({
        _id: user._id, name: user.name, email: user.email, role: user.role,
        department: user.department, assignedSemesters: user.assignedSemesters,
        profilePic: user.profilePic, token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user && (await user.matchPassword(password))) {
      if (!user.isActive) return res.status(403).json({ message: 'Account deactivated.' });
      
      res.json({
        _id: user._id, name: user.name, email: user.email, role: user.role,
        department: user.department, assignedSemesters: user.assignedSemesters,
        profilePic: user.profilePic, token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -securityAnswer');
    if (user) res.json(user);
    else res.status(404).json({ message: 'User not found' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.name = req.body.name || user.name;
      user.contact = req.body.contact || user.contact;
      user.address = req.body.address || user.address;
      
      if (req.body.profilePic && req.body.profilePic.startsWith('data:image')) {
        const uploadRes = await cloudinary.uploader.upload(req.body.profilePic, {
          folder: 'lms_profiles',
        });
        user.profilePic = uploadRes.secure_url;
      } else {
        user.profilePic = req.body.profilePic || user.profilePic;
      }

      user.emergencyContact = req.body.emergencyContact || user.emergencyContact;
      user.parentInfo = req.body.parentInfo || user.parentInfo;
      
      if (req.body.password) {
        user.password = req.body.password;
      }

      if (req.body.deactivationRequested) {
        user.deactivationRequested = true;
      }

      const updatedUser = await user.save();
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Forgot Password (Check Answer & Reset)
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email, securityQuestion, securityAnswer, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.securityQuestion === securityQuestion && user.securityAnswer === securityAnswer) {
      user.password = newPassword;
      await user.save();
      res.json({ message: 'Password updated successfully' });
    } else {
      res.status(401).json({ message: 'Security answer incorrect' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register face descriptors
// @route   POST /api/auth/register-face
// @access  Private
export const registerFace = async (req, res) => {
  try {
    const { descriptors } = req.body; 
    const facultyId = req.user._id;

    if (!descriptors || descriptors.length < 5) {
      return res.status(400).json({ message: 'At least 5 face descriptors required' });
    }

    let facultyFace = await FacultyFace.findOne({ facultyId });
    if (facultyFace) {
      facultyFace.faceDescriptors = descriptors;
    } else {
      facultyFace = new FacultyFace({
        facultyId,
        faceDescriptors: descriptors,
      });
    }

    await facultyFace.save();
    res.status(200).json({ message: 'Face descriptors registered successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login with face descriptor
// @route   POST /api/auth/login-face
// @access  Public
export const loginWithFace = async (req, res) => {
  try {
    const { email, descriptor } = req.body; 
    if (!email) return res.status(400).json({ message: 'Email is required for face login' });
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!['teacher', 'hod', 'admin'].includes(user.role)) {
       return res.status(401).json({ message: 'Face login only available for Admin, Faculty, and HOD' });
    }

    const facultyFace = await FacultyFace.findOne({ facultyId: user._id });
    if (!facultyFace || facultyFace.faceDescriptors.length === 0) {
      return res.status(404).json({ message: 'Face not registered for this account' });
    }

    // Euclidean distance matching
    const isMatch = facultyFace.faceDescriptors.some(stored => {
       const v1 = Array.from(stored.descriptor);
       const v2 = descriptor;
       
       if (v1.length !== v2.length) return false;
       
       const dist = Math.sqrt(v1.reduce((sum, val, i) => sum + Math.pow(val - v2[i], 2), 0));
       return dist < 0.55; // Slightly more balanced threshold (face-api generic is 0.6)
    });

    if (isMatch) {
      facultyFace.lastUsed = Date.now();
      await facultyFace.save();
      
      res.json({
        _id: user._id, name: user.name, email: user.email, role: user.role,
        department: user.department, profilePic: user.profilePic, token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Face not recognized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Update pulse (heartbeat)
// @route   POST /api/auth/pulse
// @access  Private
export const updatePulse = async (req, res) => {
  try {
    const { courseId } = req.body;
    await User.findByIdAndUpdate(req.user._id, {
      lastActive: Date.now(),
      currentCourse: courseId || null
    });
    res.status(200).json({ message: 'Pulse updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get counts of online students for a course
// @route   GET /api/auth/course-activity/:courseId
// @access  Public
export const getCourseActivity = async (req, res) => {
  try {
    const { courseId } = req.params;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const count = await User.countDocuments({
      currentCourse: courseId,
      lastActive: { $gte: fiveMinutesAgo }
    });
    res.json({ onlineCount: count || 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
