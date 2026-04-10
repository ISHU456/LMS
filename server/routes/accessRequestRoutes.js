import express from 'express';
import { 
  createAccessRequest, 
  getPendingRequests, 
  resolveAccessRequest 
} from '../controllers/accessRequestController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Teacher accessible
router.post('/', protect, authorize('teacher'), createAccessRequest);

// Admin / HOD accessible
router.get('/pending', protect, authorize('admin', 'hod'), getPendingRequests);
router.post('/resolve/:id', protect, authorize('admin', 'hod'), resolveAccessRequest);

export default router;
