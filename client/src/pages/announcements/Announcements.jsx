import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { 
  Sparkles, Trophy, Bell, Settings, Search, Megaphone, 
  Newspaper, LayoutGrid, TrendingUp, Users, Calendar, 
  Star, Briefcase, GraduationCap, ArrowRight, ShieldCheck, Heart, MessageSquare, ShieldAlert, Shield, User
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

  const roleConfigs = {
    admin: { color: 'text-rose-500', bg: 'bg-rose-500', from: 'from-rose-600', to: 'to-orange-500', lightBg: 'bg-rose-500/10' },
    teacher: { color: 'text-indigo-500', bg: 'bg-indigo-500', from: 'from-indigo-600', to: 'to-purple-500', lightBg: 'bg-indigo-500/10' },
    faculty: { color: 'text-indigo-500', bg: 'bg-indigo-500', from: 'from-indigo-600', to: 'to-purple-500', lightBg: 'bg-indigo-500/10' },
    student: { color: 'text-blue-500', bg: 'bg-blue-500', from: 'from-blue-600', to: 'to-cyan-500', lightBg: 'bg-blue-500/10' },
  };

  const config = roleConfigs[user?.role] || roleConfigs.student;

  return (
    <div 
      className={`${isEmbedded ? 'h-auto' : 'h-[calc(100vh-5rem)]'} transition-colors duration-500 overflow-hidden relative`}
      style={{ backgroundColor: 'var(--app-bg)' }}
    >
      {/* Dynamic Background Elements for Dark Mode */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-1000">
        <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full opacity-5 blur-[100px] transform-gpu bg-gradient-to-br ${config.from} ${config.to}`} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/5 blur-[100px] transform-gpu" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay"></div>
      </div>

      <div className={`h-full max-w-[1250px] mx-auto relative z-10 ${isEmbedded ? 'px-0' : 'px-4 sm:px-6 lg:px-8'} lg:pt-6`}>
        
        <div className="flex flex-col lg:flex-row gap-6 h-full">
          
          {/* LEFT SIDEBAR - User Profile & Navigation */}
          <aside className={`${isEmbedded ? 'hidden' : 'hidden lg:block'} w-[240px] shrink-0 h-full overflow-y-auto no-scrollbar pb-10 space-y-4 pt-2 lg:pt-0`}>
            {/* Profile Summary Card */}
            <div className="bg-app-surface backdrop-blur-xl rounded-2xl border border-app-border/10 shadow-xl overflow-hidden transition-all hover:border-app-border/30 transform-gpu group">
               <div className={`h-16 bg-gradient-to-br ${config.from} ${config.to} opacity-20 overflow-hidden relative`}>
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
               </div>
               <div className="px-4 pb-6 relative">
                  <div className="relative -mt-10 flex justify-center">
                    <div className="w-20 h-20 rounded-2xl border-2 border-app-border/10 bg-app-bg overflow-hidden shrink-0 shadow-2xl group-hover:scale-105 transition-transform duration-500">
                       {user?.profilePic ? (
                         <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center text-2xl font-black text-slate-400">
                           {user?.name?.charAt(0) || 'U'}
                         </div>
                       )}
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <h2 className="text-base font-bold text-app-text leading-tight uppercase tracking-tight">{user?.name}</h2>
                    <p className={`text-[10px] font-medium ${config.color} mt-1 uppercase tracking-widest ${config.lightBg} inline-block px-2 py-0.5 rounded italic`}>
                      {user?.role} • {user?.department || 'Academic Node'}
                    </p>
                  </div>
                  
                  <div className="mt-8 space-y-3">
                    <div className="pt-4 border-t border-app-border/10 flex justify-between items-center">
                       <span className="text-[10px] font-black uppercase tracking-widest text-app-muted">Post views</span>
                       <span className={`text-xs font-mono font-black ${config.color}`}>{personalStats.impactCount || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-black uppercase tracking-widest text-app-muted">Total Pulses</span>
                       <span className={`text-xs font-mono font-black ${config.color}`}>{personalStats.postsCount || 0}</span>
                    </div>
                  </div>
               </div>
            </div>

            {/* Side Navigation links */}
            <div className="bg-app-surface backdrop-blur-xl rounded-2xl border border-app-border/10 shadow-xl p-4 transition-all hover:border-app-border/30">
               <nav className="flex flex-col space-y-1">
                  {[
                    { label: 'Campus Arena', path: '/arena', icon: Newspaper },
                    { label: 'Operations', path: '/dashboard?tab=schedule', icon: LayoutGrid },
                    { label: 'Signal Center', path: '/notifications', icon: Bell },
                    { label: 'Identify', path: '/profile', icon: User },
                    ...(user?.role === 'admin' || user?.role === 'hod' ? [
                      { label: 'Moderation', path: '/admin-dashboard?tab=moderation', color: 'text-rose-500', icon: Shield }
                    ] : [])
                  ].map((item, i) => (
                    <button 
                      key={i} 
                      onClick={() => item.path && navigate(item.path)}
                      className={`text-left px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 ${item.color || 'text-app-muted'} hover:bg-app-bg transition-all w-full group`}
                    >
                      {item.icon && <item.icon size={14} className={`group-hover:scale-110 transition-transform ${item.color ? '' : `group-hover:${config.color}`}`} />}
                      {item.label}
                    </button>
                  ))}
               </nav>
            </div>
          </aside>

          {/* MAIN CENTER FEED */}
          <main className="flex-1 min-w-0 h-full overflow-y-auto custom-scrollbar gpu-accelerated space-y-4 px-1 pb-20 pt-2 lg:pt-0">
            <CreatePost user={user} onPostCreated={handlePostCreated} />
            <AnnouncementFeed key={feedVersion} user={user} />
          </main>

          {/* RIGHT SIDEBAR - Trending */}
          <aside className="hidden xl:block w-[320px] shrink-0 h-full overflow-y-auto no-scrollbar pb-10 space-y-4 pt-2 lg:pt-0">
             <div className="bg-app-surface backdrop-blur-xl rounded-2xl border border-app-border/30 shadow-xl p-6 transition-all hover:border-app-border/50">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-xs font-black uppercase tracking-widest text-app-text">Trending Signal</h3>
                   <TrendingUp size={16} className={`${config.color} animate-pulse`} />
                </div>
                
                <div className="space-y-6">
                   {trendingPosts.slice(0, 5).length > 0 ? trendingPosts.slice(0, 5).map((post, i) => (
                     <div key={post._id} className="cursor-pointer group flex gap-3">
                        <div className="text-xs font-mono font-black text-app-muted/30 mt-1">0{i+1}</div>
                        <div>
                          <h4 className={`text-xs font-bold text-app-text group-hover:${config.color} transition-colors line-clamp-2 leading-relaxed`}>
                             {post.title || post.content}
                          </h4>
                          <p className="text-[9px] font-mono font-bold text-app-muted mt-1 uppercase tracking-widest">{safeFormatDate(post.createdAt)} • {post.likesCount || 0} ARCHIVES</p>
                        </div>
                     </div>
                   )) : (
                     <div className="flex flex-col items-center py-6 gap-2">
                        <div className={`w-8 h-8 rounded-full border border-dashed ${config.color} opacity-30 animate-spin`} />
                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest italic">Syncing pulses...</p>
                     </div>
                   )}
                </div>
                
                <button 
                  onClick={() => navigate('/notifications')}
                  className="w-full mt-8 py-3 border border-app-border rounded-xl text-[10px] font-black uppercase tracking-widest text-app-muted hover:bg-app-bg transition-all"
                >
                  Global Archives
                </button>
             </div>

             {/* Side Footer box */}
             <div className="relative group transition-all">
                <div className={`absolute inset-0 bg-app-surface opacity-50 rounded-2xl`} />
                <div className="relative z-10 p-6 text-center rounded-2xl border border-app-border/10 shadow-lg backdrop-blur-sm group-hover:border-app-border/30 transition-all overflow-hidden font-sans">
                   <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-20" />
                   <Sparkles size={28} className={`${config.color} mx-auto mb-4 group-hover:scale-110 transition-transform`} />
                   <h4 className="text-xs font-black uppercase tracking-widest text-app-text tracking-tighter">Strategic Impact</h4>
                   <p className="text-[10px] font-medium text-app-muted mt-3 leading-relaxed">
                      Every signal sent propagates through the entire institutional lattice.
                   </p>
                </div>
             </div>
             {/* Redefining the Verified box with better nesting */}
             <div className="relative group transition-all">
                <div className={`absolute inset-0 bg-gradient-to-br ${config.from} ${config.to} opacity-[0.03] dark:opacity-[0.05] rounded-2xl`} />
                <div className="relative z-10 p-6 text-center rounded-2xl border border-app-border/10 shadow-lg backdrop-blur-sm group-hover:border-app-border/30 transition-all overflow-hidden font-sans">
                   <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
                   <ShieldCheck size={28} className={`${config.color} mx-auto mb-4 group-hover:scale-110 transition-transform`} />
                   <h4 className="text-xs font-black uppercase tracking-widest text-app-text">Verified Protocol</h4>
                   <p className="text-[10px] font-medium text-app-muted mt-3 leading-relaxed">
                     Authorized signals from the Institutional Council and Strategic Boards.
                   </p>
                </div>
             </div>
          </aside>

        </div>
      </div>
      <style>
        {`
          .custom-scrollbar {
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
            scrollbar-gutter: stable;
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(15, 23, 42, 0.1);
            border-radius: 20px;
          }
          .dark .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.05);
          }
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          html, body {
            overflow: hidden !important;
            height: 100vh !important;
            margin: 0;
            padding: 0;
          }
          /* Optimize for video & heavy blur */
          .gpu-accelerated {
            transform: translateZ(0);
            backface-visibility: hidden;
            perspective: 1000px;
            will-change: transform;
          }
          .glass-contain {
            contain: paint;
          }
        `}
      </style>
    </div>
  );
};

export default Announcements;
