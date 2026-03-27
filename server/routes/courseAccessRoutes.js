import express from 'express';
import { 
  updateAccessState, 
  getCourseAccessData, 
  getAccessHistory 
} from '../controllers/courseAccessController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.put('/update', protect, authorize('teacher', 'admin'), updateAccessState);
router.get('/course/:courseId', protect, authorize('teacher', 'admin'), getCourseAccessData);
router.get('/history/:courseId/:studentId', protect, getAccessHistory);

export default router;
