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
  generateQuiz,
  analyzeFile,
  getAiUsageSummary,
  getUserAiAudit
} from '../controllers/chatbotController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';
import multer from 'multer';

// Memory storage for immediate processing
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const router = express.Router();

router.post('/ask', protect, chatbotResponse);
router.post('/analyze', protect, upload.single('file'), analyzeFile);
router.post('/generate-quiz', protect, generateQuiz);
router.get('/history', protect, getUserChatHistory);
router.post('/request-credits', protect, requestAiCredits);

// Admin Routes
router.get('/requests', protect, admin, getAiCreditRequests);
router.post('/grant/:userId', protect, admin, grantAiCredits);
router.post('/grant-by-email', protect, admin, grantAiCreditsByEmail);
router.put('/update-credits/:userId', protect, admin, updateAiCredits);
router.delete('/delete/:sessionId', protect, admin, deleteChatSession);
router.get('/usage-summary', protect, admin, getAiUsageSummary);
router.get('/user-audit/:userId', protect, admin, getUserAiAudit);

export default router;
