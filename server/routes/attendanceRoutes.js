import express from 'express';
import { 
  markBulkAttendance, 
  getCourseAttendance, 
  getStudentAttendance, 
  updateAttendance, 
  getTeacherStats,
  getClassroomAttendance,
  getClassFaceData
} from '../controllers/attendanceController.js';
import {
  markDailyEntry,
  markDailyExit,
  getDailyStatus,
  updateGPSConfig,
  getMonthlyDailyAttendance,
  getBulkMonthlyDailyAttendance
} from '../controllers/dailyAttendanceController.js';

import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Only teachers/admin can mark/edit attendance
router.post('/bulk-mark', protect, authorize('teacher', 'admin'), markBulkAttendance);
router.get('/course/:courseId', protect, authorize('teacher', 'admin'), getCourseAttendance);
router.get('/course/:courseId/face-data', protect, authorize('teacher'), getClassFaceData);
router.get('/stats/teacher', protect, authorize('teacher'), getTeacherStats);
router.put('/:id', protect, authorize('teacher', 'admin'), updateAttendance);

// Student/Teacher/Admin can view student's attendance
router.get('/student/:studentId', protect, getStudentAttendance);
router.get('/classroom', protect, getClassroomAttendance);

// Daily Face + GPS Attendance
router.post('/daily/entry', protect, authorize('student'), markDailyEntry);
router.post('/daily/exit', protect, authorize('student'), markDailyExit);
router.get('/daily/status', protect, authorize('student'), getDailyStatus);
router.get('/daily/monthly', protect, authorize('teacher', 'admin'), getMonthlyDailyAttendance);
router.post('/daily/gps-config', protect, authorize('admin'), updateGPSConfig);
router.get('/daily/gps-config', protect, (req, res, next) => {
   import('../models/GPSConfig.js').then(m => m.default.findOne({ isActive: true })).then(c => res.json(c)).catch(next);
});
router.get('/daily/monthly-bulk', protect, authorize('teacher', 'admin'), getBulkMonthlyDailyAttendance);

export default router;
