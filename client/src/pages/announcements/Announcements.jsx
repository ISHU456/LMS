import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Trophy, Bell, Settings, Search, Megaphone, 
  Newspaper, LayoutGrid, TrendingUp, Users, Calendar, 
  Star, Briefcase, GraduationCap, ArrowRight, ShieldCheck, Heart, MessageSquare, ShieldAlert, Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import CreatePost from '../../components/announcements/CreatePost';
import AnnouncementFeed from '../../components/announcements/AnnouncementFeed';

const Announcements = ({ isEmbedded = false }) => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [feedVersion, setFeedVersion] = useState(0);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [personalStats, setPersonalStats] = useState({ postsCount: 0, impactCount: 0 });

  const safeFormatDate = (dateLike) => {
    try {
      const d = new Date(dateLike);
      if (isNaN(d.getTime())) return 'recent';
      const diff = Math.floor((new Date() - d) / 1000);
      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return d.toLocaleDateString();
    } catch {
      return 'recent';
    }
  };

  useEffect(() => {
    if (!isEmbedded) window.scrollTo(0, 0);
  }, [isEmbedded]);

  const [tickerPosts, setTickerPosts] = useState([]);

  useEffect(() => {
    const fetchTickerData = async () => {
      try {
        const res = await axios.get('http://localhost:5001/api/announcements', {
          params: { limit: 10, sort: 'createdAt' }, // Fetch latest first
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const data = res.data.announcements || (Array.isArray(res.data) ? res.data : []);
        setTickerPosts(data);
      } catch (err) {
        console.error("Failed to fetch ticker data", err);
      }
    };

    const fetchTrendingData = async () => {
      try {
        const res = await axios.get('http://localhost:5001/api/announcements/trending', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setTrendingPosts(res.data);
      } catch (err) {
        console.error("Failed to fetch trending data", err);
      }
    };

    const fetchPersonalStats = async () => {
      try {
        const res = await axios.get('http://localhost:5001/api/announcements/stats/me', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setPersonalStats(res.data);
      } catch (err) {
        console.error("Failed to fetch personal stats", err);
      }
    };

    if (user?.token) {
      fetchTickerData();
      fetchTrendingData();
      fetchPersonalStats();
    }
  }, [user]);

  const handlePostCreated = (newPost) => {
    // Socket.io handles feed injection, but we refresh personal stats locally
    const fetchTrendingData = async () => {
      try {
        const res = await axios.get('http://localhost:5001/api/announcements/trending', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setTrendingPosts(res.data);
      } catch (err) {}
    };
    fetchPersonalStats();
    fetchTrendingData();
  };

  return (
    <div className={`${isEmbedded ? 'h-auto' : 'h-[calc(100vh-5rem)]'} bg-transparent transition-colors duration-500`}>
      <div className={`h-full max-w-[1800px] mx-auto ${isEmbedded ? 'px-0' : 'px-4 sm:px-6 lg:px-8'} py-6 flex flex-col`}>
        
        {/* Institutional News Ticker */}
        <div className="shrink-0 mb-6 h-12 bg-white/40 dark:bg-white/5 border-y border-slate-200/50 dark:border-white/5 backdrop-blur-xl overflow-hidden flex items-center relative group">
           <div className="absolute left-0 top-0 bottom-0 bg-emerald-600 px-8 flex items-center z-10 shadow-2xl">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                 <span className="text-[10px] font-black text-emerald-50 px-1 uppercase tracking-[0.3em] italic">Neural Pulse</span>
              </div>
           </div>
           <div className="flex-1 overflow-hidden">
              <div className="whitespace-nowrap animate-marquee flex items-center gap-12 pl-[180px]">
                 {(tickerPosts.length > 0 ? tickerPosts.concat(tickerPosts) : [
                    { category: 'Motivation', title: 'The Architecture of Innovation', createdAt: '2026-03-28' },
                    { category: 'Motivation', title: 'Recursive Success Protocol', createdAt: '2026-03-28' },
                    { category: 'Motivation', title: 'The Power of Neural Networks', createdAt: '2026-03-28' }
                 ].concat([
                    { category: 'Motivation', title: 'The Architecture of Innovation', createdAt: '2026-03-28' },
                    { category: 'Motivation', title: 'Recursive Success Protocol', createdAt: '2026-03-28' },
                    { category: 'Motivation', title: 'The Power of Neural Networks', createdAt: '2026-03-28' }
                 ])).map((post, i) => (
                    <div key={i} className="flex items-center gap-4 cursor-pointer hover:text-amber-500 transition-colors">
                       <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">• {post.category || 'URGENT'}</span>
                       <span className="text-xs font-bold text-slate-700 dark:text-gray-300">{post.title || post.content?.substring(0, 60)}</span>
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{safeFormatDate(post.createdAt)}</span>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-8">
          
          {/* LEFT SIDEBAR - User Profile & Navigation */}
          <aside className={`${isEmbedded ? 'hidden' : 'hidden lg:block'} w-[340px] shrink-0 h-full overflow-y-auto overflow-x-hidden custom-scrollbar pr-2`}>
            <div className="flex flex-col gap-6 pt-8 pb-32">
              {/* Profile Card - LinkedIn Style */}
              <div className="bg-white/80 dark:bg-white/5 rounded-[3rem] border border-slate-200/50 dark:border-white/5 shadow-2xl backdrop-blur-2xl overflow-hidden relative group">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-600 via-purple-600 to-rose-600 z-0 opacity-90" />
                <div className="relative z-10 pt-10 flex flex-col items-center">
                  <motion.div 
                    whileHover={{ scale: 1.05, rotate: 2 }}
                    className="w-28 h-28 rounded-[2rem] bg-white dark:bg-white/10 p-1.5 shadow-2xl mb-4 border border-white/20"
                  >
                    <div className="w-full h-full rounded-[1.8rem] bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                      {user?.profilePic ? (
                        <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl font-black text-slate-300 dark:text-gray-600">
                          {user?.name?.charAt(0) || 'U'}
                        </span>
                      )}
                    </div>
                  </motion.div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white text-center leading-tight tracking-tight uppercase italic">{user?.name}</h2>
                  <div className="mt-3 px-6 py-2 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                    <span className="text-[10px] font-black uppercase text-indigo-500 dark:text-indigo-400 tracking-[0.3em]">{user?.role} • {user?.department || 'Node Architecture'}</span>
                  </div>
                </div>
                
                <div className="mt-10 p-8 pt-0 space-y-6 relative z-10">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-slate-50/50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 text-center">
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Impact</span>
                        <span className="text-lg font-black text-slate-900 dark:text-white">
                          {personalStats.impactCount > 999 ? (personalStats.impactCount / 1000).toFixed(1) + 'k' : personalStats.impactCount}
                        </span>
                     </div>
                     <div className="p-4 bg-slate-50/50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 text-center">
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Posts</span>
                        <span className="text-lg font-black text-slate-900 dark:text-white">{personalStats.postsCount}</span>
                     </div>
                  </div>
                </div>
              </div>

              {/* Quick Navigation Shortcuts */}
              <div className="bg-white/40 dark:bg-white/5 rounded-[3rem] border border-slate-100 dark:border-white/5 p-8 backdrop-blur-xl">
                <h3 
                  onClick={() => navigate('/departments')}
                  className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-8 px-2 italic cursor-pointer hover:text-indigo-500 transition-colors"
                >
                  Important Links
                </h3>
                <nav className="space-y-2">
                  {[
                    { label: 'Matrix Arena', icon: <Users size={20} />, path: '/arena' },
                    { label: 'Governance Node', icon: <Calendar size={20} />, path: '/dashboard?tab=schedule' },
                    { label: 'Neural Broadcasts', icon: <Bell size={20} />, badge: '12', path: '/notifications' },
                    { label: 'Identity Nexus', icon: <Shield size={20} />, path: '/profile' },
                    ...(user?.role === 'admin' || user?.role === 'hod' ? [
                      { label: 'Moderation Grid', icon: <ShieldAlert size={20} />, path: '/admin-dashboard?tab=moderation', active: true, color: 'text-rose-500' }
                    ] : [])
                  ].filter(item => !item.role || item.role.includes(user?.role)).map((item, i) => (
                    <motion.button 
                      key={i} 
                      whileHover={{ x: 8 }}
                      onClick={() => item.path && navigate(item.path)}
                      className={`w-full flex items-center justify-between p-4 rounded-[1.5rem] hover:bg-white dark:hover:bg-white/5 transition-all group font-bold ${item.color || 'text-slate-600 dark:text-gray-400'} hover:text-indigo-600 shadow-sm hover:shadow-md`}
                    >
                      <div className="flex items-center gap-4">
                        <span className={`p-2 rounded-xl bg-slate-100 dark:bg-white/5 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 group-hover:text-indigo-600 transition-colors ${item.active ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>{item.icon}</span>
                        <span className="text-[11px] uppercase tracking-widest font-black">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="bg-indigo-600 text-white text-[9px] px-2 py-0.5 rounded-lg font-black tracking-widest">{item.badge}</span>
                      )}
                    </motion.button>
                  ))}
                </nav>
              </div>
            </div>
          </aside>

           {/* MAIN CENTER FEED */}
          <main className="flex-1 h-full max-w-[800px] min-w-0 w-full flex flex-col gap-6 mx-auto lg:mx-0 overflow-y-auto overflow-x-hidden custom-scrollbar px-6 pt-0 pb-32 relative">

            {/* Announcement Banner */}
            <div className="relative h-72 rounded-[3.5rem] overflow-hidden shadow-2xl shadow-indigo-500/10 group mb-4">
              <img src="/banner.png" alt="Academic Feed" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-0" />
              <div className="absolute top-0 right-0 p-12 opacity-30 z-10 transition-transform group-hover:rotate-12 duration-1000">
                <Sparkles size={140} className="text-white" />
              </div>
              <div className="relative z-10 p-12 h-full flex flex-col justify-end">
                <span className="px-5 py-2 w-fit rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl">Institutional Broadcast</span>
                <h1 className="text-5xl lg:text-6xl font-black text-white mt-4 leading-none uppercase tracking-tighter italic">Lattice Community</h1>
                <p className="text-white/70 text-sm font-bold mt-4 max-w-lg leading-relaxed">Connecting faculty and scholars through high-performance academic governance and synchronous social identity nodes.</p>
              </div>
            </div>

            <div className="relative z-40 w-full">
              <CreatePost user={user} onPostCreated={handlePostCreated} />
            </div>
            
            <div className="space-y-8 relative z-10 w-full">
               <AnnouncementFeed key={feedVersion} user={user} />
            </div>
          </main>

          {/* RIGHT SIDEBAR - Trending & Highlights */}
          <aside className="hidden xl:block w-[350px] shrink-0 h-full overflow-y-auto overflow-x-hidden custom-scrollbar pl-2">
            <div className="flex flex-col gap-6 pt-8 pb-24">
              {/* Trending Hub - Reimagined as Pulse Matrix */}
              <div className="bg-white/70 dark:bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-slate-200/60 dark:border-white/5 p-8 shadow-2xl shadow-indigo-500/5 relative overflow-hidden group">
                {/* Background Decor */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                
                <div className="flex items-center justify-between mb-10 relative z-10">
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Neural Pulse</h3>
                    <p className="text-sm font-black text-slate-900 dark:text-white mt-1 uppercase tracking-tighter">Trending Hub</p>
                  </div>
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-600">
                    <TrendingUp size={20} />
                  </div>
                </div>
                
                <div className="space-y-4 relative z-10">
                  {trendingPosts.slice(0, 3).length > 0 ? trendingPosts.slice(0, 3).map((post, i) => {
                    const isLive = post.title?.toLowerCase().includes('live class') || post.content?.toLowerCase().includes('broadcast');
                    return (
                      <motion.div 
                        key={post._id} 
                        whileHover={{ x: 6 }}
                        className="p-5 rounded-[2rem] bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/5 transition-all hover:bg-white dark:hover:bg-white/10 hover:shadow-xl group/card relative"
                      >
                        <div className="flex gap-5">
                          {/* Rank/Counter */}
                          <div className="shrink-0 flex flex-col items-center">
                            <span className="text-3xl font-black tracking-tighter text-slate-200 dark:text-slate-800 group-hover/card:text-indigo-500/20 transition-colors">0{i + 1}</span>
                            {isLive && (
                              <div className="mt-2 w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {isLive && (
                                <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 text-[8px] font-black uppercase tracking-widest border border-rose-500/20">Live</span>
                              )}
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{post.category || 'Institutional'}</span>
                            </div>
                            
                            <h4 className="text-xs font-black text-slate-900 dark:text-gray-100 line-clamp-2 leading-tight tracking-tight uppercase group-hover/card:text-indigo-600 transition-colors">
                              {post.title || post.content}
                            </h4>

                            <div className="flex items-center gap-4 mt-4 opacity-60">
                              <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                <Heart size={10} className="text-rose-500" /> {post.likesCount || 0}
                              </div>
                              <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                <MessageSquare size={10} /> {post.commentsCount || 0}
                              </div>
                              <div className="ml-auto text-[8px] font-black text-slate-400 uppercase">
                                {safeFormatDate(post.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }) : (
                    <div className="py-20 flex flex-col items-center justify-center space-y-4">
                       <div className="w-10 h-10 rounded-full border-2 border-slate-100 dark:border-white/5 border-t-indigo-500 animate-spin" />
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syncing Lattice Pulse...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Verification / Security Badge */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-black rounded-[2rem] p-8 text-white relative overflow-hidden group">
                <div className="relative z-10">
                  <ShieldCheck size={32} className="text-emerald-400 mb-4 group-hover:scale-110 transition-transform" />
                  <h4 className="text-lg font-black uppercase tracking-tight">Verified Feed</h4>
                  <p className="text-xs text-gray-400 mt-2 font-bold leading-relaxed">
                    Only official academic updates from verified faculty and administrators are pinned at the top.
                  </p>
                </div>
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
              </div>

            </div>
          </aside>

        </div>
      </div>
      <style>
        {`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            animation: marquee 60s linear infinite;
            display: flex;
          }
          .animate-marquee:hover {
            animation-play-state: paused;
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(67, 97, 238, 0.1);
            border-radius: 20px;
            border: 2px solid transparent;
            background-clip: content-box;
          }
          .dark .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
          }
          .custom-scrollbar:hover::-webkit-scrollbar-thumb {
            background: rgba(67, 97, 238, 0.4);
            background-clip: content-box;
          }
           /* Hide main page scrollbar to enforce 3-column independent scrolling */
          html, body {
            overflow: hidden !important;
            height: 100%;
          }
        `}
      </style>
    </div>
  );
};

export default Announcements;
