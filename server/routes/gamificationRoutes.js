import express from 'express';
import { protect, admin, teacher } from '../middlewares/authMiddleware.js';
import {
  submitQuiz,
  getLeaderboard,
  getMyAchievements,
  createBadge,
  createQuiz,
  getQuizzes,
  getQuizDetails,
  getQuizLeaderboard,
  getMonthlyStreakBadges,
  recordActivity,
  generateAIQuiz,
  getPrizes,
  claimPrize,
  buyPrize,
  createPrize,
  deletePrize,
  getMonthlyPrizes,
  upsertMonthlyPrize,
  getAllOrders,
  adminUpdatePrizeStatus
} from '../controllers/gamificationController.js';

const router = express.Router();

router.get('/achievements', protect, getMyAchievements);
router.get('/monthly-streak-badges', protect, getMonthlyStreakBadges);
router.get('/leaderboard', protect, getLeaderboard);
router.get('/quizzes', protect, getQuizzes);
router.get('/quizzes/:id', protect, getQuizDetails);
router.get('/quizzes/:quizId/leaderboard', protect, getQuizLeaderboard);
router.post('/quizzes/submit', protect, submitQuiz);
router.post('/record-activity', protect, recordActivity);

// Prize Management
router.get('/prizes', protect, getPrizes);
router.post('/prizes/claim', protect, claimPrize);
router.post('/prizes/buy', protect, buyPrize);
router.post('/prizes', protect, teacher, createPrize);
router.delete('/prizes/:id', protect, teacher, deletePrize);

// Order Management (Admin)
router.get('/orders', protect, admin, getAllOrders);
router.put('/orders/:id', protect, admin, adminUpdatePrizeStatus);

// Admin/Teacher Only
router.post('/badge', protect, admin, createBadge);
router.post('/quizzes', protect, teacher, createQuiz);
router.post('/quizzes/generate-ai', protect, teacher, generateAIQuiz);

// Monthly Ranked Prizes
router.get('/monthly-prizes', protect, getMonthlyPrizes);
router.put('/monthly-prizes', protect, admin, upsertMonthlyPrize);


export default router;

