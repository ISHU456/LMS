import express from 'express';
import multer from 'multer';
import { storage } from '../config/cloudinary.js';
import { getResources, uploadResource, getFileFromDB, deleteResource, updateResource } from '../controllers/resourceController.js';
import { protect, teacher } from '../middlewares/authMiddleware.js';
import { isCourseTeacher } from '../middlewares/courseAuth.js';

const router = express.Router();

// Cloudinary Storage for remote hosting
const upload = multer({ storage });

// Unified CRUD
router.get('/', getResources);
router.post('/', protect, teacher, isCourseTeacher, uploadResource);
router.post('/upload', protect, teacher, isCourseTeacher, upload.single('file'), uploadResource);
router.get('/file/:id', getFileFromDB);
router.delete('/:id', protect, teacher, isCourseTeacher, deleteResource);
router.put('/:id', protect, teacher, isCourseTeacher, updateResource);

export default router;
