import express from 'express';
import { protect, admin, teacher } from '../middlewares/authMiddleware.js';
import {
  submitQuiz,
  getLeaderboard,
  getMyAchievements,
  createBadge,
  createQuiz,
  getQuizzes,
  getQuizDetails
} from '../controllers/gamificationController.js';

const router = express.Router();

router.get('/achievements', protect, getMyAchievements);
router.get('/leaderboard', protect, getLeaderboard);
router.get('/quizzes', protect, getQuizzes);
router.get('/quizzes/:id', protect, getQuizDetails);
router.post('/quizzes/submit', protect, submitQuiz);

// Admin-Only Routes
router.post('/badge', protect, admin, createBadge);

// Teacher/Admin Quiz Creation
router.post('/quizzes', protect, createQuiz);

export default router;
