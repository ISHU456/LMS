import express from 'express';
import { verifyMFA, registerFace, markSmartAttendance } from '../controllers/mfaController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// MFA Logic
router.post('/verify', verifyMFA);

// Face Registration
router.post('/register-face', protect, registerFace);

// Smart Attendance
router.post('/mark-attendance', protect, markSmartAttendance);

export default router;
