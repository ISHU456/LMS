import express from 'express';
import { 
  chatbotResponse, 
  getUserChatHistory, 
  requestAiCredits, 
  getAiCreditRequests, 
  grantAiCredits,
  grantAiCreditsByEmail,
  deleteChatSession,
  updateAiCredits,
  generateQuiz
} from '../controllers/chatbotController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/ask', protect, chatbotResponse);
router.post('/generate-quiz', protect, generateQuiz);
router.get('/history', protect, getUserChatHistory);
router.post('/request-credits', protect, requestAiCredits);

// Admin Routes
router.get('/requests', protect, admin, getAiCreditRequests);
router.post('/grant/:userId', protect, admin, grantAiCredits);
router.post('/grant-by-email', protect, admin, grantAiCreditsByEmail);
router.put('/update-credits/:userId', protect, admin, updateAiCredits);
router.delete('/delete/:sessionId', protect, admin, deleteChatSession);

export default router;
