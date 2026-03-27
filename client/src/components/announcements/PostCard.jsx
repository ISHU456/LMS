import React, { useState, useEffect } from 'react';
import { 
  Heart, MessageSquare, Share2, MoreVertical, 
  Trash2, Pin, Info, ExternalLink, Paperclip, 
  Play, Maximize2, Download, CheckCircle2,
  Clock, Calendar, MapPin, Twitter, Facebook, Linkedin, Link2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import CommentItem from './CommentItem';

const socket = io('http://localhost:5001');

const API_BASE = 'http://localhost:5001/api';

const PostCard = ({ announcement, user, onUpdate, onDelete }) => {
  const [reactions, setReactions] = useState(announcement.reactionsCount || {
    like: 0, heart: 0, clap: 0, fire: 0, think: 0
  });
  const [currentReaction, setCurrentReaction] = useState(null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isLiked, setIsLiked] = useState(announcement.likes?.includes(user?._id));
  const [likesCount, setLikesCount] = useState(announcement.likes?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsCount, setCommentsCount] = useState(announcement.commentsCount || announcement.comments?.length || 0);
  const [commentText, setCommentText] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    // Determine current user's reaction
    if (announcement.reactions) {
      const type = Object.keys(announcement.reactions).find(key => 
        Array.isArray(announcement.reactions[key]) && announcement.reactions[key].includes(user?._id)
      );
      setCurrentReaction(type || null);
    }
  }, [announcement.reactions, user?._id]);

  useEffect(() => {
    const handleLikeUpdate = ({ announcementId, likesCount: newLikesCount }) => {
      if (announcementId === announcement._id) {
        setLikesCount(newLikesCount);
      }
    };

    const handleReactionUpdate = ({ announcementId, reactionsCount: newReactionsCount }) => {
      if (announcementId === announcement._id) {
        setReactions(newReactionsCount);
      }
    };

    const handleCommentUpdate = async ({ announcementId }) => {
      if (announcementId === announcement._id) {
        // Re-fetch comments gracefully to update data and count sync
        try {
           const res = await axios.get(`${API_BASE}/announcements/${announcement._id}/comments`, {
             headers: { Authorization: `Bearer ${user?.token}` }
           });
           if (showComments) setComments(res.data);
           
           let total = res.data.length;
           res.data.forEach(c => { total += (c.replies?.length || 0); });
           setCommentsCount(total);
        } catch(e) {}
      }
    };

    socket.on('like-update', handleLikeUpdate);
    socket.on('reaction-update', handleReactionUpdate);
    socket.on('comment-update', handleCommentUpdate);

    return () => {
      socket.off('like-update', handleLikeUpdate);
      socket.off('reaction-update', handleReactionUpdate);
      socket.off('comment-update', handleCommentUpdate);
    };
  }, [announcement._id, showComments, user?.token]);

  const isAdmin = user?.role === 'admin' || user?.role === 'hod';
  const isAuthor = user?._id === (announcement.author?._id || announcement.author);
  const headers = { Authorization: `Bearer ${user?.token}` };

  const handleLike = async () => {
    try {
      const res = await axios.post(`${API_BASE}/announcements/${announcement._id}/like`, {}, { headers });
      setIsLiked(res.data.isLiked);
      setLikesCount(res.data.likesCount);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReact = async (reactionType) => {
    try {
      const res = await axios.post(`${API_BASE}/announcements/${announcement._id}/react`, { reactionType }, { headers });
      setReactions(res.data.reactionsCount);
      setCurrentReaction(res.data.currentReaction);
      setShowReactionPicker(false);
    } catch (err) {
      console.error(err);
    }
  };

  const reactionEmojis = {
    like: '👍',
    heart: '❤️',
    clap: '👏',
    fire: '🔥',
    think: '🤔'
  };

  const loadComments = async () => {
    if (!showComments) {
      setIsLoadingComments(true);
      try {
        const res = await axios.get(`${API_BASE}/announcements/${announcement._id}/comments`, { headers });
        setComments(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingComments(false);
      }
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async (parentCommentId = null, content = null) => {
    const text = content || commentText;
    if (!text.trim()) return;
    try {
      const res = await axios.post(`${API_BASE}/announcements/${announcement._id}/comments`, { 
        content: text,
        parentCommentId
      }, { headers });
      
      if (parentCommentId) {
        // Refresh comments to show nested reply (simplified for now)
        const refreshRes = await axios.get(`${API_BASE}/announcements/${announcement._id}/comments`, { headers });
        setComments(refreshRes.data);
      } else {
        setComments([res.data, ...comments]);
        setCommentText('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      await axios.post(`${API_BASE}/announcements/comments/${commentId}/like`, {}, { headers });
      const refreshRes = await axios.get(`${API_BASE}/announcements/${announcement._id}/comments`, { headers });
      setComments(refreshRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`${API_BASE}/announcements/comments/${commentId}`, { headers });
      const refreshRes = await axios.get(`${API_BASE}/announcements/${announcement._id}/comments`, { headers });
      setComments(refreshRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = () => {
    setShowShareMenu(!showShareMenu);
  };

  const copyToClipboard = () => {
    const url = `${window.location.origin}/announcements?id=${announcement._id}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
    setShowShareMenu(false);
  };

  const windowOpenShare = (shareUrl) => {
    window.open(shareUrl, '_blank', 'width=600,height=400');
    setShowShareMenu(false);
  };

  const renderMedia = () => {
    const { type, videoUrl, attachments, externalLink } = announcement;
    
    if (type === 'image' && attachments?.[0]) {
      return (
        <div className="relative rounded-2xl overflow-hidden mt-3 group">
          <img src={attachments[0].url} alt="Post content" className="w-full max-h-[500px] object-cover" />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Maximize2 className="text-white" size={24} />
          </div>
        </div>
      );
    }

    if (type === 'video' && videoUrl) {
      // Improved YouTube embed logic
      let embedUrl = videoUrl;
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = videoUrl.match(regExp);
      const videoId = (match && match[2].length === 11) ? match[2] : null;

      if (videoId) {
        embedUrl = `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&loop=1&playlist=${videoId}`;
      } else if (videoUrl.includes('vimeo.com/')) {
        const vimeoId = videoUrl.split('/').pop();
        embedUrl = `https://player.vimeo.com/video/${vimeoId}`;
      }

      return (
        <div className="relative rounded-2xl overflow-hidden mt-3 aspect-video bg-white dark:bg-gray-800 flex items-center justify-center p-2 sm:p-4">
          <iframe 
            src={embedUrl} 
            className="w-full h-full border-0 rounded-xl shadow-lg" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen 
            title="Video post"
          />
        </div>
      );
    }

    if (type === 'file' && attachments?.length > 0) {
      return (
        <div className="mt-3 space-y-2">
          {attachments.map((file, idx) => (
            <a 
              key={idx} 
              href={file.url} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600">
                <Paperclip size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{file.name || 'Attachment'}</p>
                <p className="text-[10px] text-gray-500 uppercase font-black">{file.type || 'file'} • {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Download'}</p>
              </div>
              <Download size={18} className="text-gray-400" />
            </a>
          ))}
        </div>
      );
    }

    if (type === 'link' && externalLink) {
      return (
        <a 
          href={externalLink} 
          target="_blank" 
          rel="noreferrer"
          className="mt-3 block p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/40 hover:border-primary-500/30 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary-600">External Link</span>
            <ExternalLink size={14} className="text-gray-400 group-hover:text-primary-500" />
          </div>
          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{externalLink}</p>
        </a>
      );
    }

    return null;
  };

  const safeFormatDate = (dateLike) => {
    try {
      const d = new Date(dateLike);
      if (isNaN(d.getTime())) return 'recent';
      return formatDistanceToNow(d, { addSuffix: true });
    } catch {
      return 'recent';
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-6 shadow-xl shadow-gray-200/50 dark:shadow-none hover:shadow-2xl hover:shadow-primary-500/10 transition-all group"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 p-[2px]">
              <div className="w-full h-full rounded-[0.85rem] bg-white dark:bg-gray-900 overflow-hidden flex items-center justify-center p-0.5">
                {announcement.author?.profilePic ? (
                  <img src={announcement.author.profilePic} alt={announcement.author?.name} className="w-full h-full object-cover rounded-[0.7rem]" />
                ) : (
                  <span className="text-lg font-black text-primary-600">{announcement.author?.name?.charAt(0) || 'A'}</span>
                )}
              </div>
            </div>
            {announcement.author?.role === 'admin' && (
              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-900 rounded-lg p-0.5">
                <CheckCircle2 size={14} className="text-primary-500 fill-primary-500/10" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-gray-900 dark:text-white text-base leading-tight">
                {announcement.author?.name || 'Academic Office'}
              </h3>
              {announcement.pinned && (
                <Pin size={14} className="text-amber-500 fill-amber-500/10 transform rotate-45" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                {announcement.author?.role || 'Staff'} • {safeFormatDate(announcement.createdAt)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400 group-hover:text-gray-600"
          >
            <MoreVertical size={20} />
          </button>
          
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden"
              >
                {(isAuthor || isAdmin) && (
                  <button 
                    onClick={() => { onDelete(announcement._id); setIsMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-bold"
                  >
                    <Trash2 size={16} /> Delete Post
                  </button>
                )}
                <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors font-bold">
                  <Info size={16} /> Report Post
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {announcement.title && (
          <h2 className="text-lg font-black text-gray-900 dark:text-white leading-tight">
            {announcement.title}
          </h2>
        )}
        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
          {announcement.content}
        </p>
        
        {/* Dynamic Metadata Badges */}
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-primary-500/10">
            {announcement.category || 'General'}
          </span>
          {announcement.priority !== 'normal' && (
            <span className={`px-3 py-1 ${announcement.priority === 'critical' || announcement.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'} text-[10px] font-black uppercase tracking-widest rounded-full border border-red-500/10`}>
              {announcement.priority}
            </span>
          )}
          {announcement.deadline && (
            <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5 border border-amber-500/10">
              <Clock size={12} /> Deadline: {new Date(announcement.deadline).toLocaleDateString()}
            </span>
          )}
        </div>

        {renderMedia()}
      </div>

      {/* Interaction Buttons */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-4 relative">
          <div className="relative">
            <button 
              onMouseEnter={() => setShowReactionPicker(true)}
              onMouseLeave={() => setTimeout(() => setShowReactionPicker(false), 2000)}
              onClick={() => handleReact('like')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold ${currentReaction ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'}`}
            >
              {currentReaction ? reactionEmojis[currentReaction] : <Heart size={18} className={isLiked ? 'fill-red-500 text-red-500' : ''} />}
              <span className="text-xs">
                {Object.values(reactions).reduce((a, b) => a + b, 0) || likesCount}
              </span>
            </button>

            <AnimatePresence>
              {showReactionPicker && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  onMouseEnter={() => setShowReactionPicker(true)}
                  className="absolute bottom-full left-0 mb-2 p-2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 flex gap-2 z-50"
                >
                  {Object.entries(reactionEmojis).map(([type, emoji]) => (
                    <button 
                      key={type}
                      onClick={() => handleReact(type)}
                      className={`text-2xl hover:scale-125 transition-transform p-1 rounded-lg ${currentReaction === type ? 'bg-primary-50 dark:bg-primary-900/30' : ''}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={loadComments}
            className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-gray-500 font-bold"
          >
            <MessageSquare size={18} />
            <span className="text-xs">{commentsCount}</span>
          </button>
        </div>

        <div className="relative">
          <button 
            onClick={handleShare}
            className={`p-2 rounded-xl transition-colors font-bold ${showShareMenu ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400'}`}
          >
            <Share2 size={18} />
          </button>
          
          <AnimatePresence>
            {showShareMenu && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="absolute bottom-full right-0 mb-3 w-48 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden text-sm"
              >
                <div className="py-2">
                  <span className="px-4 py-1 text-[10px] font-black uppercase text-gray-400 tracking-widest block border-b border-gray-50 dark:border-gray-800 pb-2 mb-1">Share to...</span>
                  
                  <button onClick={() => windowOpenShare(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.origin + '/announcements?id=' + announcement._id)}&text=${encodeURIComponent(announcement.title || 'Check out this announcement!')}`)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 transition-colors font-bold">
                    <Twitter size={14} className="text-blue-400" /> Twitter / X
                  </button>
                  <button onClick={() => windowOpenShare(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin + '/announcements?id=' + announcement._id)}`)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 transition-colors font-bold">
                    <Linkedin size={14} className="text-blue-700" /> LinkedIn
                  </button>
                  <button onClick={() => windowOpenShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/announcements?id=' + announcement._id)}`)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 transition-colors font-bold border-b border-gray-50 dark:border-gray-800">
                    <Facebook size={14} className="text-blue-600" /> Facebook
                  </button>
                  
                  <button onClick={copyToClipboard}
                    className="w-full flex items-center gap-3 px-4 py-2.5 mt-1 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 transition-colors font-black uppercase tracking-wider text-[11px]">
                    <Link2 size={14} /> Copy Link
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Comment Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-6 mt-6 border-t border-gray-100 dark:border-gray-800">
              <div className="flex gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {user?.profilePic ? (
                    <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-black text-gray-400">{user?.name?.charAt(0) || 'U'}</span>
                  )}
                </div>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 outline-none text-sm font-bold placeholder:text-gray-400 focus:border-primary-500/50 transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  />
                  <button 
                    onClick={() => handleAddComment()}
                    disabled={!commentText.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary-600 disabled:text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all"
                  >
                    <CheckCircle2 size={20} />
                  </button>
                </div>
              </div>

              {isLoadingComments ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {comments.length > 0 ? (
                    comments.map(comment => (
                      <CommentItem 
                        key={comment._id} 
                        comment={comment} 
                        currentUserId={user?._id}
                        isAdmin={isAdmin}
                        onLike={handleLikeComment}
                        onDelete={handleDeleteComment}
                        onReply={(parentId, text) => handleAddComment(parentId, text)}
                      />
                    ))
                  ) : (
                    <div className="text-center py-10">
                      <MessageSquare size={32} className="mx-auto text-gray-200 mb-3" />
                      <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No comments yet</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PostCard;
