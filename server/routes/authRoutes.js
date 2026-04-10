import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  forgotPassword,
  registerFace,
  loginWithFace,
  updatePulse,
  getCourseActivity,
  getLeaderboard,
  getStudentProfileByTeacher,
  getAttendanceHistory,
  getAnnualAttendanceReport,
  getNextRollNumber
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/leaderboard', getLeaderboard);
// router.post('/login-face', loginWithFace);
// router.post('/register-face', protect, registerFace);
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);
router.post('/forgot-password', forgotPassword);
router.post('/pulse', protect, updatePulse);
router.get('/course-activity/:courseId', getCourseActivity);
router.get('/student-profile/:studentId', protect, getStudentProfileByTeacher);
router.get('/attendance/history', protect, getAttendanceHistory);
router.get('/attendance/annual-report', protect, getAnnualAttendanceReport);
router.get('/next-roll-number', getNextRollNumber);

export default router;
