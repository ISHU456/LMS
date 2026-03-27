import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { updateProgress, getProgress } from '../controllers/progressController.js';

const router = express.Router();

router.get('/:courseId', protect, getProgress);
router.post('/update', protect, updateProgress);

export default router;
