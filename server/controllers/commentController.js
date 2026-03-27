import Comment from '../models/Comment.js';
import Announcement from '../models/Announcement.js';

export const addComment = async (req, res) => {
  try {
    const { content, parentCommentId } = req.body;
    const { announcementId } = req.params;

    const announcement = await Announcement.findById(announcementId);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });

    const comment = await Comment.create({
      content,
      author: req.user._id,
      announcement: announcementId,
      parentComment: parentCommentId || null
    });

    if (parentCommentId) {
      await Comment.findByIdAndUpdate(parentCommentId, {
        $push: { replies: comment._id }
      });
    } else {
      announcement.comments.push(comment._id);
      await announcement.save();
    }

    const populated = await Comment.findById(comment._id).populate('author', 'name profilePic role');
    
    if (req.io) {
      req.io.emit('comment-update', { announcementId });
    }

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getComments = async (req, res) => {
  try {
    const { announcementId } = req.params;
    const comments = await Comment.find({ announcement: announcementId, parentComment: null })
      .populate('author', 'name profilePic role')
      .populate({
        path: 'replies',
        populate: { path: 'author', select: 'name profilePic role' }
      })
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const likeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const index = comment.likes.indexOf(req.user._id);
    if (index === -1) {
      comment.likes.push(req.user._id);
    } else {
      comment.likes.splice(index, 1);
    }

    await comment.save();

    if (req.io) {
      req.io.emit('comment-update', { announcementId: comment.announcement });
    }

    res.json({ likesCount: comment.likes.length, isLiked: index === -1 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    if (comment.author.toString() !== req.user._id.toString() && !['admin', 'hod'].includes(req.user.role)) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // If it's a top-level comment, remove from announcement
    if (!comment.parentComment) {
      await Announcement.findByIdAndUpdate(comment.announcement, {
        $pull: { comments: comment._id }
      });
    } else {
      // If it's a reply, remove from parent's replies
      await Comment.findByIdAndUpdate(comment.parentComment, {
        $pull: { replies: comment._id }
      });
    }

    // Recursively delete replies (simplified: just delete direct replies for now or use a recursive function)
    await Comment.deleteMany({ _id: { $in: comment.replies } });
    await comment.deleteOne();

    if (req.io) {
      req.io.emit('comment-update', { announcementId: comment.announcement });
    }

    res.json({ message: 'Comment removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
