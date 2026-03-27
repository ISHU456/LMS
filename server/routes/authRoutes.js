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
  getCourseActivity
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
// router.post('/login-face', loginWithFace);
// router.post('/register-face', protect, registerFace);
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);
router.post('/forgot-password', forgotPassword);
router.post('/pulse', protect, updatePulse);
router.get('/course-activity/:courseId', getCourseActivity);

export default router;
