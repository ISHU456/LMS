import express from 'express';
import { 
  markBulkAttendance, 
  getCourseAttendance, 
  getStudentAttendance, 
  updateAttendance, 
  getTeacherStats 
} from '../controllers/attendanceController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Only teachers/admin can mark/edit attendance
router.post('/bulk-mark', protect, authorize('teacher', 'admin'), markBulkAttendance);
router.get('/course/:courseId', protect, authorize('teacher', 'admin'), getCourseAttendance);
router.get('/stats/teacher', protect, authorize('teacher'), getTeacherStats);
router.put('/:id', protect, authorize('teacher', 'admin'), updateAttendance);

// Student/Teacher/Admin can view student's attendance
router.get('/student/:studentId', protect, getStudentAttendance);

export default router;
