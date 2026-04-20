import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import PostCard from './PostCard';
import { Loader2, Sparkles, Filter, Newspaper, Layers, Search } from 'lucide-react';

import { io } from 'socket.io-client';
import GeminiLoader from '../GeminiLoader';

const socket = io('http://localhost:5001');

const API_BASE = 'http://localhost:5001/api';

const AnnouncementFeed = ({ user, initialSearch = '', initialCategory = 'All' }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [priority, setPriority] = useState('All');

  const observer = useRef();
  const lastPostRef = useCallback(node => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore]);

  const fetchAnnouncements = async (pageNum, isNewSearch = false) => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/announcements`, {
        params: {
          page: pageNum,
          limit: 10,
          search: search.trim() || undefined,
          category: category !== 'All' ? category : undefined,
          priority: priority !== 'All' ? priority : undefined
        }
      });

      const rawData = res.data;
      const data = rawData.announcements || (Array.isArray(rawData) ? rawData : []);
      const more = rawData.hasMore !== undefined ? rawData.hasMore : false;

      if (isNewSearch) {
        setAnnouncements(data);
      } else {
        setAnnouncements(prev => [...prev, ...data]);
      }
      setHasMore(more);
    } catch (err) {
      console.error(err);
      setError('Failed to load feed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleNewAnnouncement = (newPost) => {
      setAnnouncements(prev => [newPost, ...prev]);
    };

    socket.on('new-announcement', handleNewAnnouncement);

    return () => {
      socket.off('new-announcement', handleNewAnnouncement);
    };
  }, []);

  useEffect(() => {
    setPage(1);
    fetchAnnouncements(1, true);
  }, [search, category, priority]);

  useEffect(() => {
    if (page > 1) {
      fetchAnnouncements(page);
    }
  }, [page]);

  const handleDeletePost = async (postId) => {
    try {
      await axios.delete(`${API_BASE}/announcements/${postId}`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      setAnnouncements(prev => prev.filter(p => p._id !== postId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdatePost = (updatedPost) => {
    setAnnouncements(prev => prev.map(p => p._id === updatedPost._id ? updatedPost : p));
  };

  const roleConfigs = {
    admin: { color: 'text-rose-500', bg: 'bg-rose-500', from: 'from-rose-600', to: 'to-orange-500', lightBg: 'bg-rose-500/10' },
    teacher: { color: 'text-indigo-500', bg: 'bg-indigo-500', from: 'from-indigo-600', to: 'to-purple-500', lightBg: 'bg-indigo-500/10' },
    faculty: { color: 'text-indigo-500', bg: 'bg-indigo-500', from: 'from-indigo-600', to: 'to-purple-500', lightBg: 'bg-indigo-500/10' },
    student: { color: 'text-blue-500', bg: 'bg-blue-500', from: 'from-blue-600', to: 'to-cyan-500', lightBg: 'bg-blue-500/10' },
  };

  const config = roleConfigs[user?.role] || roleConfigs.student;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="p-6 bg-white/80 dark:bg-white/[0.02] backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className={`p-3 rounded-2xl ${config.lightBg} border ${config.lightBg.replace('bg-', 'border-').replace('/10', '/20')}`}>
                <Newspaper size={20} className={config.color} />
             </div>
             <div className="flex flex-col">
               <h1 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Academic Signaling</h1>
               <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic pt-0.5">Real-time institutional relay active</span>
             </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search archive..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 outline-none text-xs text-white placeholder-slate-500 focus:border-indigo-500/50 transition-all font-mono"
              />
            </div>
            <button className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-500 hover:text-white transition-colors">
               <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto mt-6 no-scrollbar pb-1">
           {['All', 'Admin', 'Teacher', 'Student'].map(cat => (
             <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex-none px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${category === cat ? `${config.bg} border-${config.bg.split('-')[1]}-600 text-white shadow-lg ${config.bg.replace('bg-', 'shadow-')}/20` : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10'}`}
             >
               {cat}
             </button>
           ))}
        </div>
      </div>

      {/* Post Creation Area is handled outside or passed via composition */}

      {/* Feed Content */}
      <div className="space-y-8">
          {announcements.map((post, index) => (
            <div 
              key={post._id} 
              ref={index === announcements.length - 1 ? lastPostRef : null}
            >
              <PostCard 
                announcement={post} 
                user={user} 
                onDelete={handleDeletePost}
                onUpdate={handleUpdatePost}
              />
            </div>
          ))}

        {isLoading && (
          <div className="py-10">
            <GeminiLoader text="Syncing Feed..." />
          </div>
        )}

        {!hasMore && announcements.length > 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
             <div className="w-12 h-1 bg-gray-200 dark:bg-gray-800 rounded-full" />
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">You've reached the end of the galaxy</p>
             <div className="w-12 h-1 bg-gray-200 dark:bg-gray-800 rounded-full" />
          </div>
        )}

        {announcements.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 rounded-[2.5rem] bg-gray-50 dark:bg-gray-800/30 flex items-center justify-center mb-6 border border-gray-100 dark:border-gray-800">
               <Layers className="text-gray-200" size={40} />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-wider">Silence in the universe</h3>
            <p className="text-sm text-gray-500 font-bold mt-2">No announcements found in this orbit</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementFeed;
