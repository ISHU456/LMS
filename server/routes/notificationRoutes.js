import express from 'express';
import { getMyNotifications, markAsRead, dismissPopup } from '../controllers/notificationController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getMyNotifications);
router.put('/:id/read', protect, markAsRead);
router.put('/:id/dismiss-popup', protect, dismissPopup);

export default router;
