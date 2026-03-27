import express from 'express';
import {
  createAnnouncement,
  getAnnouncements,
  likeAnnouncement,
  reactToAnnouncement,
  deleteAnnouncement,
  addView,
  updatePresence,
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

// Engagement / presence
router.post('/:id/view', addView); 
router.post('/:id/presence', protect, updatePresence);

router.post('/:id/like', protect, likeAnnouncement);
router.post('/:id/react', protect, reactToAnnouncement);
router.delete('/:id', protect, deleteAnnouncement);

// Comments
router.route('/:announcementId/comments')
  .get(getComments)
  .post(protect, addComment);

router.post('/comments/:id/like', protect, likeComment);
router.delete('/comments/:id', protect, deleteComment);

export default router;

