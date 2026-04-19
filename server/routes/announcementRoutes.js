import express from 'express';
import {
  createAnnouncement,
  getAnnouncements,
  likeAnnouncement,
  reactToAnnouncement,
  deleteAnnouncement,
  addView,
  updatePresence,
  reportAnnouncement,
  getReportedAnnouncements,
  dismissReport,
  getUserAnnouncementStats,
  getTrendingAnnouncements
} from '../controllers/announcementController.js';
import {
  addComment,
  getComments,
  likeComment,
  deleteComment
} from '../controllers/commentController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getAnnouncements)
  .post(protect, createAnnouncement);

router.get('/stats/me', protect, getUserAnnouncementStats);
router.get('/trending', protect, getTrendingAnnouncements);

// Engagement / presence
router.post('/:id/view', addView); 
router.post('/:id/presence', protect, updatePresence);

router.post('/:id/like', protect, likeAnnouncement);
router.post('/:id/react', protect, reactToAnnouncement);
router.post('/:id/report', protect, reportAnnouncement);
router.delete('/:id', protect, deleteAnnouncement);

// Admin Moderation
router.get('/reported', protect, getReportedAnnouncements);
router.post('/:id/dismiss-report', protect, dismissReport);

// Comments
router.route('/:announcementId/comments')
  .get(getComments)
  .post(protect, addComment);

router.post('/comments/:id/like', protect, likeComment);
router.delete('/comments/:id', protect, deleteComment);

export default router;

