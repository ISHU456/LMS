import express from 'express';
import multer from 'multer';
import { storage } from '../config/cloudinary.js';
import { 
  getCourses, 
  createCourse, 
  getCourseByCode, 
  updateCourseSchedule, 
  uploadTimetableImage, 
  getCourseStudents, 
  removeStudentFromCourse, 
  toggleAutoRestrict, 
  updateCourseDeadline,
  incrementCourseViews
} from '../controllers/courseController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';
import { isCourseTeacher } from '../middlewares/courseAuth.js';

const router = express.Router();
const upload = multer({ storage });

router.get('/', protect, getCourses);
router.post('/', protect, admin, createCourse);
router.get('/:code', protect, getCourseByCode);
router.get('/:code/students', protect, getCourseStudents);
router.delete('/:code/students/:studentId', protect, isCourseTeacher, removeStudentFromCourse);
router.put('/:code/schedule', protect, isCourseTeacher, updateCourseSchedule);
router.put('/:code/auto-restrict', protect, isCourseTeacher, toggleAutoRestrict);
router.put('/:code/deadline', protect, isCourseTeacher, updateCourseDeadline);
router.patch('/:code/view', protect, incrementCourseViews);
router.post('/:code/schedule/image', protect, isCourseTeacher, upload.single('file'), uploadTimetableImage);

export default router;
