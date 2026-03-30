import UserFace from '../models/UserFace.js';
import MFASession from '../models/MFASession.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Course from '../models/Course.js';
import generateToken from '../utils/generateToken.js';
import { decryptDescriptors } from '../utils/crypto.js';
import { getDistance } from '../utils/haversine.js';
import crypto from 'crypto';

// @desc    Verify MFA (Step 2 of login: Face + GPS)
// @route   POST /api/mfa/verify
export const verifyMFA = async (req, res) => {
  try {
    const { tempToken, descriptor, location } = req.body;

    if (!tempToken || !descriptor) {
      return res.status(400).json({ message: 'Missing verification data' });
    }

    // 1. Find the MFA session
    const hashedToken = crypto.createHash('sha256').update(tempToken).digest('hex');
    const mfaSession = await MFASession.findOne({ tempToken: hashedToken }).populate('user');

    if (!mfaSession || mfaSession.expiresAt < new Date()) {
      return res.status(401).json({ message: 'MFA session expired or invalid' });
    }

    const { user } = mfaSession;

    // 2. Face Matching (Euclidean distance)
    const userFace = await UserFace.findOne({ user: user._id });
    if (!userFace) {
      return res.status(404).json({ message: 'Face data not registered for this user' });
    }

    const storedDescriptors = decryptDescriptors(userFace.encryptedDescriptors);
    
    // Check if the provided descriptor matches any of the stored ones
    const isMatch = storedDescriptors.some(stored => {
       const v1 = Array.from(stored);
       const v2 = descriptor;
       if (v1.length !== v2.length) return false;
       const dist = Math.sqrt(v1.reduce((sum, val, i) => sum + Math.pow(val - v2[i], 2), 0));
       return dist < 0.5; // Threshold requirement
    });

    if (!isMatch) {
       return res.status(401).json({ message: 'Face not recognized' });
    }

    // 3. Mark MFA as verified
    mfaSession.isVerified = true;
    mfaSession.lastVerifiedLocation = {
       lat: location?.latitude,
       lng: location?.longitude,
       verifiedAt: new Date()
    };
    await mfaSession.save();

    // 4. Issue the final JWT login token
    const token = generateToken(user._id);

    res.json({
        _id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        department: user.department,
        faceRegistered: user.faceRegistered,
        token: token,
      });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register a new face embedding
// @route   POST /api/mfa/register-face
export const registerFace = async (req, res) => {
  try {
    const { descriptors } = req.body;
    const userId = req.user._id;

    if (!descriptors || descriptors.length < 1) {
      return res.status(400).json({ message: 'At least one face descriptor required' });
    }

    // Encrypt and store the descriptors
    const { encryptDescriptors } = await import('../utils/crypto.js');
    const encrypted = encryptDescriptors(descriptors);

    let userFace = await UserFace.findOne({ user: userId });
    if (userFace) {
      userFace.encryptedDescriptors = encrypted;
      userFace.registeredAt = new Date();
    } else {
      userFace = new UserFace({
        user: userId,
        encryptedDescriptors: encrypted,
      });
    }

    await userFace.save();
    
    // Update user record to indicate face is registered
    await User.findByIdAndUpdate(userId, { faceRegistered: true });

    res.status(200).json({ message: 'Face registered successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Smart Attendance (Face + GPS verified marking)
// @route   POST /api/mfa/mark-attendance
export const markSmartAttendance = async (req, res) => {
  try {
    const { courseId, descriptor, location } = req.body;
    const userId = req.user._id;

    if (!courseId || !descriptor || !location) {
       return res.status(400).json({ message: 'Missing attendance verification data' });
    }

    // 1. Face Verification
    const userFace = await UserFace.findOne({ user: userId });
    if (!userFace) return res.status(404).json({ message: 'Face not registered' });

    const storedDescriptors = decryptDescriptors(userFace.encryptedDescriptors);
    const isMatch = storedDescriptors.some(stored => {
       const v1 = Array.from(stored);
       const dist = Math.sqrt(v1.reduce((sum, val, i) => sum + Math.pow(val - Array.from(descriptor)[i], 2), 0));
       return dist < 0.5;
    });

    if (!isMatch) return res.status(401).json({ message: 'Face verification failed' });

    // 2. GPS Verification
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    // We assume the course/classroom has a lat/lng stored or we use a system-wide institutional center
    const allowedLat = course.location?.lat || process.env.INSTITUTION_LAT;
    const allowedLng = course.location?.lng || process.env.INSTITUTION_LNG;
    const allowedRadius = course.location?.radius || process.env.ALLOWED_RADIUS_METERS || 100;

    if (allowedLat && allowedLng) {
      const distance = getDistance(location.latitude, location.longitude, allowedLat, allowedLng);
      if (distance > allowedRadius) {
         return res.status(401).json({ message: `Location mismatch (You are ${Math.round(distance)}m away)` });
      }
    }

    // 3. Mark Attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingRecord = await Attendance.findOne({
      student: userId,
      course: courseId,
      date: today
    });

    if (existingRecord) {
       return res.status(400).json({ message: 'Attendance already marked for today' });
    }

    const attendance = await Attendance.create({
      student: userId,
      course: courseId,
      date: today,
      status: 'present',
      semester: req.user.semester || course.semester,
      markedBy: userId, // Self-marked via MFA
      remarks: 'Self-Verified via Face + GPS',
      entryWindowExpiresAt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      isBiometricVerified: true
    });

    res.status(201).json({ message: 'Attendance marked successfully', attendance });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
