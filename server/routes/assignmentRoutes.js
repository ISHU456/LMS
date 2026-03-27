import express from 'express';
import { 
    createAssignment, 
    getCourseAssignments, 
    submitAssignment, 
    getSubmissions, 
    gradeSubmission,
    deleteSubmission,
    deleteAssignment,
    getUserSubmissions,
    getAllAssignments
} from '../controllers/assignmentController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';
import multer from 'multer';
import { storage } from '../config/cloudinary.js';

const router = express.Router();
const upload = multer({ storage });

// TEACHER ROUTES
router.post('/create', protect, upload.single('file'), createAssignment);
router.get('/course/:courseId', protect, getCourseAssignments);
router.get('/submissions/:assignmentId', protect, getSubmissions);
router.put('/grade/:submissionId', protect, gradeSubmission);
router.delete('/submissions/:submissionId', protect, deleteSubmission);
router.get('/', protect, getAllAssignments);
router.delete('/:assignmentId', protect, deleteAssignment);

// STUDENT ROUTES
router.post('/submit', protect, upload.array('files', 5), submitAssignment);
router.get('/my-submissions/:courseId', protect, getUserSubmissions);

export default router;
