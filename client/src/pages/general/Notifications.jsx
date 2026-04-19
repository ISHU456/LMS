import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, CheckCircle2, AlertCircle, Info, 
  Trash2, BellOff, MessageSquare, Heart, 
  Star, Shield, Zap, Filter, Calendar
} from 'lucide-react';
import axios from 'axios';

const Notifications = () => {
  const { user } = useSelector((state) => state.auth);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('http://localhost:5001/api/notifications', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user.token]);

  const markAsRead = async (id) => {
    try {
      await axios.put(`http://localhost:5001/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {}
  };

  const deleteNotification = async (id) => {
    try {
      await axios.delete(`http://localhost:5001/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {}
  };

  const getIcon = (type) => {
    switch (type) {
      case 'announcement': return <Bell className="text-indigo-500" size={20} />;
      case 'grade': return <Star className="text-amber-500" size={20} />;
      case 'assignment': return <Zap className="text-emerald-500" size={20} />;
      case 'alert': return <AlertCircle className="text-rose-500" size={20} />;
      case 'comment': return <MessageSquare className="text-blue-500" size={20} />;
      case 'like': return <Heart className="text-rose-500" size={20} />;
      default: return <Info className="text-slate-400" size={20} />;
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !n.read;
    return n.type === activeFilter;
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#030712] py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Neural <span className="text-indigo-600">Broadcasts</span></h1>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-2">Institutional Alert Lattice • Sync Status: Passive</p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="px-4 py-2 bg-indigo-500/10 dark:bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{notifications.filter(n => !n.read).length} Unread Nodes</span>
             </div>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 custom-scrollbar">
          {['all', 'unread', 'announcement', 'grade', 'assignment', 'alert'].map(filter => (
            <button 
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${activeFilter === filter ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 dark:border-white shadow-xl translate-y-[-2px]' : 'bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-white/5 hover:bg-slate-50'}`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="bg-white dark:bg-white/5 rounded-3xl p-8 border border-slate-100 dark:border-white/5 animate-pulse flex gap-6">
                   <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800" />
                   <div className="flex-1 space-y-3">
                      <div className="w-32 h-3 bg-slate-100 dark:bg-slate-800 rounded-full" />
                      <div className="w-full h-8 bg-slate-50 dark:bg-white/10 rounded-xl" />
                   </div>
                </div>
              ))
            ) : filteredNotifications.length > 0 ? (
              filteredNotifications.map((n) => (
                <motion.div 
                  key={n._id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => markAsRead(n._id)}
                  className={`group relative overflow-hidden bg-white dark:bg-[#0b0f1a] rounded-[2.5rem] p-8 border border-slate-100 dark:border-white/5 transition-all hover:shadow-2xl hover:border-indigo-500/20 cursor-pointer ${!n.read ? 'ring-2 ring-indigo-500/20' : ''}`}
                >
                  <div className="flex gap-6 relative z-10">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 group-hover:rotate-6 ${n.read ? 'bg-slate-50 dark:bg-white/5 opacity-50' : 'bg-indigo-50 dark:bg-indigo-500/10 shadow-lg shadow-indigo-500/10'}`}>
                      {getIcon(n.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500/60 dark:text-indigo-400/60">{n.type} node • synchronized</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                           <Calendar size={10} /> {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className={`text-lg font-black tracking-tight leading-tight ${n.read ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                        {n.title}
                      </h3>
                      <p className={`mt-2 text-sm font-bold leading-relaxed italic ${n.read ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'}`}>
                        "{n.message}"
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                       <button 
                         onClick={(e) => { e.stopPropagation(); deleteNotification(n._id); }}
                         className="p-3 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-500/10"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </div>

                  {!n.read && (
                    <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none">
                       <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-indigo-500 m-6 shadow-[0_0_12px_rgba(99,102,241,0.8)]" />
                    </div>
                  )}
                </motion.div>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-40 text-center flex flex-col items-center justify-center"
              >
                <div className="w-24 h-24 rounded-[3rem] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-center mb-6 shadow-sm">
                   <BellOff size={40} className="text-slate-300" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider italic">No Active Broadcasts</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 italic">Institutional pulse is clear. Standing by.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
