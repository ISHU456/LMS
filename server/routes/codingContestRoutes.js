import express from 'express';
import { 
  createContest, 
  createProblem, 
  getActiveContests, 
  getContestDetail, 
  submitSolution, 
  getLeaderboard,
  finalizeContest 
} from '../controllers/codingContestController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public / Protected Student Routes
router.get('/', protect, getActiveContests);
router.get('/:id', protect, getContestDetail);
router.post('/submit', protect, submitSolution);
router.get('/leaderboard/:contestId', protect, getLeaderboard);

// Admin Routes
router.post('/admin/create', protect, admin, createContest);
router.post('/admin/create-problem', protect, admin, createProblem);
router.post('/admin/finalize/:contestId', protect, admin, finalizeContest);

export default router;
