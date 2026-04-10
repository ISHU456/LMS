import express from 'express';
import { 
  getStudentsForEntry, 
  saveMarks, 
  submitMarks, 
  publishMarks,
  getMyResults,
  getAnalytics,
  generateFinalResult,
  getFinalResults,
  lockResults,
  toggleResultLock,
  getSemesterSummary,
  getTranscript,
  publishFinalResults,
  uploadTranscript
} from '../controllers/resultController.js';
import { 
  approveCourseResults as approveMarks, 
  rejectCourseResults as rejectMarks,
  unlockCourseResults as unlockResults
} from '../controllers/adminController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/students', protect, authorize('teacher', 'admin', 'hod'), getStudentsForEntry);
router.post('/save', protect, authorize('teacher', 'admin', 'hod'), saveMarks);
router.post('/submit', protect, authorize('teacher'), submitMarks);
router.post('/approve', protect, authorize('admin', 'hod'), approveMarks);
router.post('/reject', protect, authorize('admin', 'hod'), rejectMarks);
router.post('/publish', protect, authorize('admin', 'hod'), publishMarks);
router.get('/my-results', protect, authorize('student'), getMyResults);
router.get('/analytics', protect, authorize('admin', 'hod'), getAnalytics);
router.get('/semester-summary', protect, authorize('admin', 'hod'), getSemesterSummary);
router.post('/generate-final', protect, authorize('admin', 'hod'), generateFinalResult);
router.post('/publish-final', protect, authorize('admin', 'hod'), publishFinalResults);
router.get('/final', protect, authorize('student'), getFinalResults);

// Multimedia Archival Hub
import multer from 'multer';
import { storage } from '../config/cloudinary.js';
const upload = multer({ storage });
router.post('/upload-transcript', protect, authorize('admin', 'hod'), upload.single('transcript'), uploadTranscript);

router.post('/lock', protect, authorize('admin', 'hod', 'teacher'), lockResults);
router.post('/unlock', protect, authorize('admin', 'hod', 'teacher'), unlockResults);
router.post('/toggle-lock/:id', protect, authorize('admin', 'hod', 'teacher'), toggleResultLock);
router.get('/transcript/:studentId', protect, authorize('admin', 'hod'), getTranscript);

export default router;
