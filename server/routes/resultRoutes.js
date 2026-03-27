import express from 'express';
import { 
  getStudentsForEntry, 
  saveMarks, 
  submitMarks, 
  approveMarks,
  publishMarks,
  rejectMarks,
  getMyResults,
  getAnalytics,
  generateFinalResult,
  getFinalResults,
  lockResults,
  toggleResultLock,
  getSemesterSummary
} from '../controllers/resultController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/students', protect, authorize('teacher', 'admin', 'hod'), getStudentsForEntry);
router.post('/save', protect, authorize('teacher'), saveMarks);
router.post('/submit', protect, authorize('teacher'), submitMarks);
router.post('/approve', protect, authorize('admin', 'hod'), approveMarks);
router.post('/reject', protect, authorize('admin', 'hod'), rejectMarks);
router.post('/publish', protect, authorize('admin', 'hod'), publishMarks);
router.get('/my-results', protect, authorize('student'), getMyResults);
router.get('/analytics', protect, authorize('admin', 'hod'), getAnalytics);
router.get('/semester-summary', protect, authorize('admin', 'hod'), getSemesterSummary);
router.post('/generate-final', protect, authorize('admin', 'hod'), generateFinalResult);
router.get('/final', protect, authorize('student'), getFinalResults);
router.post('/lock', protect, authorize('admin', 'hod', 'teacher'), lockResults);
router.post('/toggle-lock/:id', protect, authorize('admin', 'hod', 'teacher'), toggleResultLock);

export default router;
