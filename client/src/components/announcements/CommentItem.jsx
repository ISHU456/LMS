import React, { useState } from 'react';
import { Heart, MessageCircle, Trash2, Reply } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const CommentItem = ({ comment, onLike, onDelete, onReply, currentUserId, isAdmin, isReply = false }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');

  const handleReply = () => {
    if (!replyText.trim()) return;
    onReply(comment._id, replyText);
    setReplyText('');
    setShowReplyForm(false);
  };

  const isAuthor = currentUserId === (comment.author?._id || comment.author);

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
    <div className={`flex flex-col gap-2 ${isReply ? 'ml-8 mt-2 border-l-2 border-app-border/20 pl-4' : 'pt-4'}`}>
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold overflow-hidden">
          {comment.author?.profilePic ? (
            <img src={comment.author.profilePic} alt={comment.author.name} className="w-full h-full object-cover" />
          ) : (
            comment.author?.name?.charAt(0) || 'U'
          )}
        </div>
        <div className="flex-1 bg-app-surface rounded-2xl p-3 border border-app-border/30">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-app-text">{comment.author?.name || 'User'}</span>
              <span className="text-[10px] text-app-muted ml-2">
                {safeFormatDate(comment.createdAt)}
              </span>
            </div>
            {(isAuthor || isAdmin) && (
              <button 
                onClick={() => onDelete(comment._id)}
                className="text-app-muted hover:text-red-500 transition-colors"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
          <p className="text-sm text-app-text/90 mt-1">{comment.content}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4 ml-11 -mt-1">
        <button 
          onClick={() => onLike(comment._id)}
          className={`flex items-center gap-1 text-[10px] font-bold ${comment.likes?.includes(currentUserId) ? 'text-rose-500' : 'text-app-muted'} hover:opacity-80`}
        >
          <Heart size={12} fill={comment.likes?.includes(currentUserId) ? "currentColor" : "none"} />
          {comment.likes?.length || 0}
        </button>
        {!isReply && (
          <button 
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="flex items-center gap-1 text-[10px] font-bold text-app-muted hover:text-primary-600"
          >
            <Reply size={12} />
            Reply
          </button>
        )}
      </div>

      {showReplyForm && (
        <div className="ml-11 mt-2 flex gap-2">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            className="flex-1 text-xs px-3 py-2 rounded-xl border border-app-border/30 bg-app-bg outline-none text-app-text"
          />
          <button 
            onClick={handleReply}
            className="px-3 py-1 bg-primary-600 text-white text-[10px] font-bold rounded-xl hover:opacity-90"
          >
            Reply
          </button>
        </div>
      )}

      {comment.replies?.map(reply => (
        <CommentItem 
          key={reply._id} 
          comment={reply} 
          onLike={onLike} 
          onDelete={onDelete} 
          onReply={onReply}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          isReply={true}
        />
      ))}
    </div>
  );
};

export default CommentItem;
