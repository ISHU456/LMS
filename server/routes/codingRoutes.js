import express from 'express';
import { protect, teacher } from '../middlewares/authMiddleware.js';
import { 
    getChallenges, 
    getChallengeById, 
    submitSolution, 
    runCode,
    createChallenge,
    updateChallenge,
    deleteChallenge
} from '../controllers/codingController.js';

const router = express.Router();

router.get('/challenges', protect, getChallenges);
router.get('/challenges/:id', protect, getChallengeById);
router.post('/run', protect, runCode);
router.post('/submit', protect, submitSolution);

// Admin/Teacher Routes
router.post('/challenges', protect, teacher, createChallenge);
router.put('/challenges/:id', protect, teacher, updateChallenge);
router.delete('/challenges/:id', protect, teacher, deleteChallenge);

export default router;
