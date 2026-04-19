import Announcement from '../models/Announcement.js';
import Comment from '../models/Comment.js';
import Course from '../models/Course.js';
import { cloudinary } from '../config/cloudinary.js';

const mapAnnouncement = (announcement) => {
  const obj = announcement.toObject ? announcement.toObject() : announcement;
  obj.likesCount = Array.isArray(obj.likes) ? obj.likes.length : 0;
  obj.commentsCount = Array.isArray(obj.comments) ? obj.comments.length : 0;

  // Reaction counts
  obj.reactionsCount = {};
  if (obj.reactions) {
    Object.keys(obj.reactions).forEach(key => {
      obj.reactionsCount[key] = Array.isArray(obj.reactions[key]) ? obj.reactions[key].length : 0;
    });
  }
  
  const now = Date.now();
  const onlineThresholdMs = 2 * 60 * 1000;
  const onlineSince = new Date(now - onlineThresholdMs);
  obj.onlineNow = Array.isArray(obj.presence)
    ? obj.presence.filter((p) => p?.lastSeenAt && new Date(p.lastSeenAt) >= onlineSince).length
    : 0;
  
  obj.isReported = !!obj.isReported;
  obj.reportCount = Array.isArray(obj.reports) ? obj.reports.length : 0;
  return obj;
};

export const createAnnouncement = async (req, res) => {
  try {
    const {
      title,
      content,
      type,
      attachments,
      category,
      pinned,
      important,
      priority,
      tags,
      videoUrl,
      externalLink,
      deadline,
      eventDate,
      venue,
      duration,
      courseId,
    } = req.body;

    let processedAttachments = [];
    if (attachments && attachments.length > 0) {
      for (const att of attachments) {
        if (att.url && att.url.startsWith('data:image')) {
          const uploadRes = await cloudinary.uploader.upload(att.url, {
             folder: 'lms_announcements',
          });
          processedAttachments.push({ ...att, url: uploadRes.secure_url });
        } else {
          processedAttachments.push(att);
        }
      }
    }

    const announcement = await Announcement.create({
      title,
      content,
      type: type || 'text',
      attachments: processedAttachments,
      category,
      pinned: pinned || false,
      important: important || false,
      priority,
      tags: tags || [],
      videoUrl,
      externalLink,
      deadline,
      eventDate,
      venue,
      duration,
      courseId,
      author: req.user._id,
      role: req.user.role
    });

    const populated = await Announcement.findById(announcement._id).populate('author', 'name profilePic role');
    const responseData = mapAnnouncement(populated);
    
    // Broadcast via socket io
    if (req.io) {
      req.io.emit('new-announcement', responseData);
    }
    
    res.status(201).json(responseData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAnnouncements = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const courseIdParam = req.query.courseId;
    const categoryParam = req.query.category;
    const searchParam = req.query.search;
    const priorityParam = req.query.priority;

    const query = {};
    if (courseIdParam) {
      if (courseIdParam.length === 24) {
        query.courseId = courseIdParam;
      } else {
        const course = await Course.findOne({ code: courseIdParam.toUpperCase() });
        if (course) { query.courseId = course._id; }
        else { return res.json({ announcements: [], currentPage: 1, totalPages: 0, hasMore: false }); }
      }
    }

    if (categoryParam) {
       const lowerCat = categoryParam.toLowerCase();
       if (['admin', 'teacher', 'student', 'hod'].includes(lowerCat)) {
          // Map category string from frontend to backend role
          query.role = lowerCat === 'admin' ? { $in: ['admin', 'hod'] } : lowerCat;
       } else {
          query.category = categoryParam;
       }
    }

    if (searchParam) {
      query.$or = [
        { title: { $regex: searchParam, $options: 'i' } },
        { content: { $regex: searchParam, $options: 'i' } }
      ];
    }

    if (priorityParam) {
      query.priority = priorityParam.toLowerCase();
    }

    const announcements = await Announcement.find(query)
      .populate('author', 'name profilePic role')
      .sort({ pinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Announcement.countDocuments(query);

    res.json({
      announcements: announcements.map(mapAnnouncement),
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const likeAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Not found' });
    
    const index = announcement.likes.indexOf(req.user._id);
    if (index === -1) {
      announcement.likes.push(req.user._id);
    } else {
      announcement.likes.splice(index, 1);
    }
    
    await announcement.save();
    
    // Broadcast via socket io
    if (req.io) {
      req.io.emit('like-update', { announcementId: req.params.id, likesCount: announcement.likes.length });
    }

    res.json({ likesCount: announcement.likes.length, isLiked: index === -1 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const reactToAnnouncement = async (req, res) => {
  try {
    const { reactionType } = req.body;
    const validReactions = ['like', 'heart', 'clap', 'fire', 'think'];
    
    if (!validReactions.includes(reactionType)) {
      return res.status(400).json({ message: 'Invalid reaction type' });
    }

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Not found' });

    const userId = req.user._id;
    
    // Toggle reaction
    const index = announcement.reactions[reactionType].indexOf(userId);
    if (index === -1) {
      // Remove other reactions from this user (optional - typically one reaction per post)
      validReactions.forEach(type => {
        const otherIndex = announcement.reactions[type].indexOf(userId);
        if (otherIndex !== -1) {
          announcement.reactions[type].splice(otherIndex, 1);
        }
      });
      // Add new reaction
      announcement.reactions[reactionType].push(userId);
    } else {
      // Remove existing reaction
      announcement.reactions[reactionType].splice(index, 1);
    }

    await announcement.save();
    
    const reactionsCount = {};
    validReactions.forEach(type => {
      reactionsCount[type] = announcement.reactions[type].length;
    });

    if (req.io) {
      req.io.emit('reaction-update', { announcementId: req.params.id, reactionsCount });
    }

    res.json({ reactionsCount, currentReaction: index === -1 ? reactionType : null });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Not found' });
    
    if (announcement.author.toString() !== req.user._id.toString() && !['admin', 'hod'].includes(req.user.role)) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    // Also delete associated comments
    await Comment.deleteMany({ announcement: announcement._id });
    await announcement.deleteOne();
    
    res.json({ message: 'Announcement removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addView = async (req, res) => {
  try {
    const updated = await Announcement.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json({ views: updated.views });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePresence = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const announcement = await Announcement.findById(id);
    if (!announcement) return res.status(404).json({ message: 'Not found' });

    const now = new Date();
    const onlineThresholdMs = 2 * 60 * 1000;
    const onlineSince = new Date(Date.now() - onlineThresholdMs);

    announcement.presence = (announcement.presence || []).filter(
      (p) => p?.lastSeenAt && p.lastSeenAt >= onlineSince
    );

    const existingIndex = announcement.presence.findIndex((p) => p.user?.toString() === userId.toString());
    if (existingIndex === -1) {
      announcement.presence.push({ user: userId, lastSeenAt: now });
    } else {
      announcement.presence[existingIndex].lastSeenAt = now;
    }

    await announcement.save();
    res.json({ onlineNow: announcement.presence.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const reportAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;

    const announcement = await Announcement.findById(id);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });

    // Prevent duplicate reporting by same user
    const alreadyReported = announcement.reports.some(r => r.user.toString() === userId.toString());
    if (alreadyReported) {
      return res.status(400).json({ message: 'You have already reported this post' });
    }

    announcement.reports.push({ user: userId, reason: reason || 'Inappropriate content' });
    announcement.isReported = true;
    await announcement.save();

    res.json({ message: 'Post reported successfully. Admin will review it shortly.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getReportedAnnouncements = async (req, res) => {
  try {
    if (!['admin', 'hod'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized for moderation' });
    }

    const announcements = await Announcement.find({ isReported: true })
      .populate('author', 'name profilePic role')
      .populate('reports.user', 'name role')
      .sort({ updatedAt: -1 });

    res.json(announcements.map(mapAnnouncement));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const dismissReport = async (req, res) => {
  try {
    if (!['admin', 'hod'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized for moderation' });
    }

    const { id } = req.params;
    const announcement = await Announcement.findById(id);
    if (!announcement) return res.status(404).json({ message: 'Not found' });

    announcement.isReported = false;
    announcement.reports = []; // Clear reports
    await announcement.save();

    res.json({ message: 'Reports dismissed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserAnnouncementStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const postsCount = await Announcement.countDocuments({ author: userId });
    
    // Sum of all likes and reactions across user's posts
    const userPosts = await Announcement.find({ author: userId }).select('likes reactions');
    
    let totalImpact = 0;
    userPosts.forEach(post => {
      totalImpact += (post.likes?.length || 0);
      if (post.reactions) {
        Object.values(post.reactions).forEach(uArray => {
          totalImpact += (uArray?.length || 0);
        });
      }
    });

    res.json({
      postsCount,
      impactCount: totalImpact
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTrendingAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({ isReported: false })
      .populate('author', 'name profilePic role')
      .limit(50); // Get recent candidates

    const trending = announcements.map(mapAnnouncement).map(a => {
      // Trending heat score: Likes(1) + Comments(2) + Views(0.5)
      const score = (a.likesCount || 0) + (a.commentsCount * 2) + ((a.views || 0) * 0.5);
      return { ...a, trendingScore: score };
    }).sort((a, b) => b.trendingScore - a.trendingScore).slice(0, 5);

    res.json(trending);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

