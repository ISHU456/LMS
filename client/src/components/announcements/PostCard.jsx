import React, { useState, useEffect } from 'react';
import { 
  Heart, MessageSquare, Share2, MoreVertical, 
  Trash2, Pin, Info, ExternalLink, Paperclip, 
  Play, Maximize2, Download, CheckCircle2,
  Clock, Calendar, MapPin, Twitter, Facebook, Linkedin, Link2, ShieldCheck
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';

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

  const handleReport = async () => {
    const reason = window.prompt("Reason for reporting this post:");
    if (reason === null) return; // Cancelled
    
    try {
      const res = await axios.post(`${API_BASE}/announcements/${announcement._id}/report`, { reason }, { headers });
      alert(res.data.message);
      setIsMenuOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to report post");
    }
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
        <div className="relative rounded-3xl overflow-hidden mt-4 aspect-video bg-slate-100 dark:bg-white/5 flex items-center justify-center group/video gpu-accelerated glass-contain">
          <iframe 
            src={embedUrl} 
            className="w-full h-full border-0 rounded-2xl shadow-2xl relative z-10" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen 
            loading="lazy"
            title="Video post"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none opacity-0 group-hover/video:opacity-100 transition-opacity" />
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
              className="flex items-center gap-3 p-3 rounded-2xl border border-app-border/30 bg-app-bg/40 hover:bg-app-bg/60 transition-colors"
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

  const roleConfigs = {
    admin: { color: 'text-rose-500', bg: 'bg-rose-500', from: 'from-rose-600', to: 'to-orange-500', lightBg: 'bg-rose-500/10' },
    teacher: { color: 'text-indigo-500', bg: 'bg-indigo-500', from: 'from-indigo-600', to: 'to-purple-500', lightBg: 'bg-indigo-500/10' },
    faculty: { color: 'text-indigo-500', bg: 'bg-indigo-500', from: 'from-indigo-600', to: 'to-purple-500', lightBg: 'bg-indigo-500/10' },
    student: { color: 'text-blue-500', bg: 'bg-blue-500', from: 'from-blue-600', to: 'to-cyan-500', lightBg: 'bg-blue-500/10' },
  };

  const config = roleConfigs[user?.role] || roleConfigs.student;

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
    <div className="bg-app-surface backdrop-blur-lg border border-app-border/10 rounded-[2.5rem] shadow-xl transition-all overflow-hidden mb-8 hover:border-app-border/20 transform-gpu group gpu-accelerated glass-contain">
      {/* Pinned / Priority Indicator Bar */}
      {announcement.pinned && (
        <div className={`${config.lightBg} px-6 py-3 border-b border-app-border/20 flex items-center gap-3`}>
           <Pin size={14} className={`${config.color} fill-current`} />
           <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${config.color}`}>Pinned Academic Priority</span>
        </div>
      )}

      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex gap-4">
            <div className="w-14 h-14 rounded-2xl bg-app-bg overflow-hidden border border-app-border/10 shadow-lg group-hover:scale-105 transition-transform duration-500">
               {announcement.author?.profilePic ? (
                 <img src={announcement.author.profilePic} alt="" className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-xl font-black text-app-muted">
                   {announcement.author?.name?.charAt(0) || 'A'}
                 </div>
               )}
            </div>
            <div>
               <div className="flex items-center gap-2">
                 <h3 className={`text-base font-bold text-app-text group-hover:${config.color} transition-colors cursor-pointer uppercase tracking-tight`}>
                   {announcement.author?.name || 'Academic Handshake'}
                 </h3>
                 {announcement.author?.role === 'admin' && <ShieldCheck size={16} className={config.color} />}
               </div>
               <p className="text-[10px] font-medium text-app-muted leading-none mt-1 uppercase tracking-widest">
                  {announcement.author?.role || 'Academic Member'} • Institutional Relay
               </p>
               <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1 text-[9px] font-medium text-app-muted uppercase tracking-widest bg-app-bg px-2 py-0.5 rounded">
                     <Clock size={10} /> {safeFormatDate(announcement.createdAt)}
                  </div>
               </div>
            </div>
          </div>
          
          <div className="relative">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2.5 hover:bg-app-bg rounded-xl text-app-muted transition-all">
               <MoreVertical size={20} />
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-app-surface/95 backdrop-blur-2xl shadow-2xl rounded-2xl border border-app-border/30 z-50 overflow-hidden text-[10px] py-1">
                 {(isAuthor || isAdmin) && (
                   <button onClick={() => onDelete(announcement._id)} className="w-full text-left px-5 py-3 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 font-black uppercase tracking-widest flex items-center gap-3 transition-colors">
                     <Trash2 size={14} /> Purge Post
                   </button>
                 )}
                 <button onClick={handleReport} className="w-full text-left px-5 py-3 hover:bg-app-bg text-app-muted font-black uppercase tracking-widest flex items-center gap-3 transition-colors">
                   <Info size={14} /> Report Pulse
                 </button>
              </div>
            )}
          </div>
        </div>

        {/* Post text content */}
        <div className="space-y-4">
          {announcement.title && (
            <h2 className="text-xl font-bold text-app-text leading-tight">
              {announcement.title}
            </h2>
          )}
          <p className="text-sm text-app-text/90 leading-relaxed whitespace-pre-wrap font-medium">
            {announcement.content}
          </p>
          
          <div className="flex flex-wrap gap-2 pt-2">
            <span className={`text-[9px] font-bold uppercase tracking-widest ${config.color} ${config.lightBg} px-3 py-1 rounded-lg border border-current opacity-60`}>
              #{announcement.category || 'Institutional'}
            </span>
            {announcement.priority !== 'normal' && (
              <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg border ${announcement.priority === 'critical' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                {announcement.priority} PRIORITY
              </span>
            )}
          </div>

          <div className="pt-2">
            {renderMedia()}
          </div>
        </div>
      </div>

      {/* Footer Stats Line */}
      <div className="px-8 py-3 flex items-center justify-between border-b border-app-border/20 text-[9px] text-app-muted font-bold uppercase tracking-[0.2em]">
         <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
               <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-transparent flex items-center justify-center text-[10px] text-white shadow-lg">👍</div>
               <div className="w-5 h-5 rounded-full bg-red-500 border-2 border-transparent flex items-center justify-center text-[10px] text-white shadow-lg">❤️</div>
            </div>
            <span>{Object.values(reactions).reduce((a, b) => a + b, 0) || likesCount} ARCHIVES</span>
         </div>
         <div className={`hover:${config.color} transition-colors cursor-pointer`} onClick={loadComments}>
            {commentsCount} SIGNALS
         </div>
      </div>

      {/* Interaction Buttons */}
      <div className="px-4 py-2 flex items-center justify-around gap-2">
        {[
          { 
            id: 'like', 
            icon: currentReaction ? (
              <span className="text-lg">{reactionEmojis[currentReaction]}</span>
            ) : (
              <Heart size={20} className={isLiked ? 'fill-red-500 text-red-500' : 'text-slate-400'} />
            ), 
            label: 'ARCHIVE', 
            action: () => handleReact('like'),
            active: !!currentReaction || isLiked
          },
          { 
            id: 'comment', 
            icon: <MessageSquare size={20} className="text-slate-400" />, 
            label: 'SIGNAL', 
            action: loadComments 
          },
          { 
            id: 'share', 
            icon: <Share2 size={20} className="text-slate-400" />, 
            label: 'UPLINK', 
            action: handleShare 
          },
        ].map((btn, i) => (
          <button 
            key={i}
            onClick={btn.action}
            className={`flex-1 flex items-center justify-center gap-3 py-3.5 rounded-2xl hover:bg-app-bg transition-all group ${btn.active ? config.color : 'text-app-muted'}`}
          >
            <div className="group-hover:scale-110 transition-transform">{btn.icon}</div>
            <span className="text-[9px] font-bold uppercase tracking-widest">{btn.label}</span>
          </button>
        ))}
      </div>

      {/* Comment Section Panel */}
      {showComments && (
          <div className="border-t border-app-border/20 p-4">
              <div className="flex gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-app-bg shrink-0">
                  {user?.profilePic && <img src={user.profilePic} alt="" className="w-full h-full object-cover rounded-full" />}
                </div>
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-4 py-2 rounded-full bg-transparent border border-app-border/10 text-xs font-medium focus:border-indigo-600 outline-none text-app-text"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  />
                  <button onClick={() => handleAddComment()} disabled={!commentText.trim()} className="px-3 py-1 bg-indigo-600 text-white rounded-full text-xs font-bold disabled:opacity-50">Post</button>
                </div>
              </div>

              {isLoadingComments ? (
                <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
              ) : (
                <div className="space-y-4">
                  {comments.length > 0 ? (
                    comments.map(comment => (
                      <CommentItem 
                        key={comment._id} comment={comment} currentUserId={user?._id}
                        isAdmin={isAdmin} onLike={handleLikeComment} onDelete={handleDeleteComment}
                        onReply={(parentId, text) => handleAddComment(parentId, text)}
                      />
                    ))
                  ) : <p className="text-center text-xs text-slate-400 py-4 font-medium">No comments yet</p>}
                </div>
              )}
          </div>
        )}
    </div>
  );
};

export default PostCard;
