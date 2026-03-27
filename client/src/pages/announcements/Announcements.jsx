import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Trophy, Bell, Settings, Search, Megaphone, 
  Newspaper, LayoutGrid, TrendingUp, Users, Calendar, 
  Star, Briefcase, GraduationCap, ArrowRight, ShieldCheck, Heart, MessageSquare
} from 'lucide-react';
import axios from 'axios';

import CreatePost from '../../components/announcements/CreatePost';
import AnnouncementFeed from '../../components/announcements/AnnouncementFeed';

const Announcements = () => {
  const { user } = useSelector((state) => state.auth);
  const [feedVersion, setFeedVersion] = useState(0);
  const [trendingPosts, setTrendingPosts] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/announcements', {
          params: { limit: 50 },
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const data = res.data.announcements || (Array.isArray(res.data) ? res.data : []);
        const sorted = data.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0)).slice(0, 3);
        setTrendingPosts(sorted);
      } catch (err) {
        console.error("Failed to fetch trending posts", err);
      }
    };
    if (user?.token) {
      fetchTrending();
    }
  }, [user]);

  const handlePostCreated = (newPost) => {
    // Socket.io handles feed injection automatically now via HandleNewAnnouncement
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0b0f19] transition-colors duration-500">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT SIDEBAR - User Profile & Navigation */}
          <aside className="hidden lg:block w-[320px] sticky top-8">
            <div className="h-[calc(100vh-4rem)] overflow-y-auto pr-4 -mr-4 flex flex-col gap-6">
              {/* Profile Card */}
              <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-2xl shadow-gray-200/50 dark:shadow-none overflow-hidden relative group">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-primary-600 via-indigo-600 to-purple-600 z-0" />
                <div className="relative z-10 pt-4 flex flex-col items-center">
                  <div className="w-24 h-24 rounded-3xl bg-white dark:bg-gray-800 p-1.5 shadow-2xl mb-4 transform group-hover:scale-105 transition-all duration-500 border border-gray-100 dark:border-gray-700">
                    {user?.profilePic ? (
                      <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover rounded-[1.2rem]" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-primary-900/20 dark:to-indigo-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400 font-black text-3xl rounded-[1.2rem]">
                        {user?.name?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl font-black text-gray-900 dark:text-white text-center leading-tight">{user?.name}</h2>
                  <div className="mt-2 px-4 py-1.5 rounded-full bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">{user?.role} • {user?.department || 'CS Dept'}</span>
                  </div>
                </div>
                
                <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800 space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Posts Contribution</span>
                      <span className="text-sm font-black text-gray-900 dark:text-white">Active Publisher</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600">
                      <TrendingUp size={18} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Navigation Shortcuts */}
              <div className="bg-white/40 dark:bg-gray-900/40 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-6 backdrop-blur-md">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-6 px-2">Navigation</h3>
                <nav className="space-y-1">
                  {[
                    { label: 'My Department', icon: <Users size={18} />, active: false },
                    { label: 'Saved Posts', icon: <Star size={18} />, active: false },
                    { label: 'Events Calendar', icon: <Calendar size={18} />, active: false },
                    { label: 'Notifications', icon: <Bell size={18} />, badge: '12', active: false },
                    { label: 'Settings', icon: <Settings size={18} />, active: false },
                  ].map((item, i) => (
                    <button key={i} className="w-full flex items-center justify-between p-3.5 rounded-2xl hover:bg-white dark:hover:bg-gray-800 transition-all group font-bold text-gray-600 dark:text-gray-400 hover:text-primary-600">
                      <div className="flex items-center gap-3">
                        <span className="group-hover:scale-110 transition-transform">{item.icon}</span>
                        <span className="text-sm">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="bg-primary-600 text-white text-[10px] px-2 py-0.5 rounded-lg font-black">{item.badge}</span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </aside>

          {/* MAIN CENTER FEED */}
          <main className="flex-1 max-w-[700px] w-full flex flex-col gap-8 mx-auto lg:mx-0 h-[calc(100vh-4rem)] overflow-y-auto pr-4 -mr-4">
            {/* Announcement Banner */}
            <div className="relative h-48 rounded-[3rem] overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-600 p-8 flex flex-col justify-end shadow-2xl shadow-indigo-500/20">
              <div className="absolute top-0 right-0 p-8 opacity-20">
                <Sparkles size={120} className="text-white" />
              </div>
              <div className="relative z-10">
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-[0.2em]">Live Campus</span>
                <h1 className="text-3xl font-black text-white mt-2 leading-none">Smart Academic Feed</h1>
                <p className="text-white/80 text-sm font-medium mt-2">Connecting students and faculty through real-time updates.</p>
              </div>
            </div>

            <CreatePost user={user} onPostCreated={handlePostCreated} />
            <AnnouncementFeed key={feedVersion} user={user} />
          </main>

          {/* RIGHT SIDEBAR - Trending & Highlights */}
          <aside className="hidden xl:block w-[350px] sticky top-8">
            <div className="h-[calc(100vh-4rem)] overflow-y-auto pr-4 -mr-4 flex flex-col gap-6">
              {/* Trending Posts */}
              <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-2xl shadow-gray-200/50 dark:shadow-none">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 font-black">Trending Hub</h3>
                  <TrendingUp size={18} className="text-primary-500" />
                </div>
                
                <div className="space-y-6">
                  {trendingPosts.length > 0 ? trendingPosts.map((post, i) => (
                    <div key={post._id} className="flex gap-4 group cursor-pointer border-b border-gray-50 dark:border-gray-800 pb-4 last:border-0 last:pb-0">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 flex items-center justify-center text-primary-600 group-hover:scale-110 transition-transform overflow-hidden font-black">
                        {post.author?.profilePic ? (
                          <img src={post.author.profilePic} alt="author" className="w-full h-full object-cover"/>
                        ) : (
                          <span className="text-lg">{i + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors tracking-tight line-clamp-1 truncate">
                          {post.title || post.content}
                        </p>
                        <p className="text-[11px] font-bold text-gray-400 mt-1 line-clamp-1">{post.content}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-500">
                            <Heart size={12} className="text-rose-500" /> {post.likes?.length || 0}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-500">
                            <MessageSquare size={12} /> {post.commentsCount || post.comments?.length || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center py-4">Scanning network...</p>
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

              {/* Quick Links Grid */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Exams', icon: <Newspaper size={18} />, color: 'text-rose-500', bg: 'bg-rose-50' },
                  { label: 'Library', icon: <LayoutGrid size={18} />, color: 'text-amber-500', bg: 'bg-amber-50' },
                  { label: 'Grades', icon: <TrendingUp size={18} />, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                  { label: 'Hostel', icon: <ArrowRight size={18} />, color: 'text-primary-500', bg: 'bg-primary-50' },
                ].map((item, i) => (
                  <div key={i} className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center gap-3 cursor-pointer hover:shadow-2xl hover:shadow-primary-500/10 transition-all group">
                      <div className={`w-12 h-12 rounded-2xl ${item.bg} dark:bg-gray-800 flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform shadow-sm`}>
                        {item.icon}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
};

export default Announcements;
