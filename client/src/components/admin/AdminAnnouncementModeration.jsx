import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldAlert, AlertTriangle, ShieldCheck, 
  Trash2, ExternalLink, User, Clock, CheckCircle2,
  Flag, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = 'http://localhost:5001/api';

const AdminAnnouncementModeration = ({ user }) => {
  const [reportedPosts, setReportedPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReportedPosts = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/announcements/reported`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setReportedPosts(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch reported content');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportedPosts();
  }, [user.token]);

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to PERMANENTLY delete this post? This action is irreversible.')) return;
    try {
      await axios.delete(`${API_BASE}/announcements/${postId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setReportedPosts(prev => prev.filter(p => p._id !== postId));
    } catch (err) {
      alert('Delete failed');
    }
  };

  const handleDismiss = async (postId) => {
    try {
      await axios.post(`${API_BASE}/announcements/${postId}/dismiss-report`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setReportedPosts(prev => prev.filter(p => p._id !== postId));
    } catch (err) {
      alert('Dismiss failed');
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4 animate-pulse">
        <div className="w-12 h-12 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 italic">Syncing Moderation Grid...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Content Moderation</h2>
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-1">Reported Posts Governance</p>
        </div>
        <div className="px-4 py-2 bg-rose-500 dark:bg-rose-900/30 text-white dark:text-rose-400 rounded-2xl border border-rose-500/20 flex items-center gap-2">
           <ShieldAlert size={16} />
           <span className="text-[10px] font-black uppercase tracking-widest">{reportedPosts.length} Pending Actions</span>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {reportedPosts.length > 0 ? (
          reportedPosts.map((post) => (
            <motion.div 
              key={post._id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-white dark:bg-[#080c14] border border-slate-100 dark:border-white/5 rounded-[2.5rem] overflow-hidden shadow-xl"
            >
              <div className="p-8">
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Left: Content Preview */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                        {post.author?.profilePic ? (
                          <img src={post.author.profilePic} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <User size={20} className="text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.1em]">{post.author?.name || 'Anonymous'}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{post.author?.role || 'user'}</p>
                      </div>
                      <span className="ml-auto text-[10px] font-bold text-slate-400">
                        {new Date(post.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                      {post.title && <h3 className="font-black text-slate-900 dark:text-white mb-2">{post.title}</h3>}
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic line-clamp-3">
                        "{post.content}"
                      </p>
                      {post.type === 'image' && post.attachments?.[0] && (
                        <div className="mt-4 rounded-xl overflow-hidden max-h-40 border border-slate-200 dark:border-slate-800">
                           <img src={post.attachments[0].url} className="w-full h-full object-cover" alt="" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Reports & Actions */}
                  <div className="w-full lg:w-72 flex flex-col gap-4 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-white/5 pt-6 lg:pt-0 lg:pl-6">
                    <div className="flex-1 space-y-3 overflow-y-auto max-h-[150px] pr-2 custom-scrollbar">
                      <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-2 flex items-center gap-2">
                        <Flag size={12} /> Reporting History
                      </p>
                      {post.reports?.map((report, idx) => (
                        <div key={idx} className="p-3 bg-rose-500/5 dark:bg-rose-500/10 rounded-xl border border-rose-500/10">
                          <p className="text-[9px] font-black text-slate-900 dark:text-slate-200 uppercase tracking-tight truncate">
                            From: {report.user?.name || 'User'} ({report.user?.role})
                          </p>
                          <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold mt-1 leading-tight">
                            "{report.reason}"
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3">
                      <button 
                        onClick={() => handleDismiss(post._id)}
                        className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                      >
                        <ShieldCheck size={14} /> Safe
                      </button>
                      <button 
                         onClick={() => handleDelete(post._id)}
                         className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-rose-900/10 border border-rose-500/20 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all active:scale-95 shadow-lg shadow-rose-500/5"
                      >
                        <Trash2 size={14} /> Purge
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-40 text-center flex flex-col items-center justify-center"
          >
            <div className="w-24 h-24 rounded-[2.5rem] bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center mb-6 shadow-sm">
               <ShieldCheck size={48} className="text-indigo-400" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider italic">Matrix Sanitized</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 italic decoration-indigo-500/30 underline underline-offset-4">All nodes reporting within protocol parameters</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminAnnouncementModeration;
