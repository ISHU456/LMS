import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import PostCard from './PostCard';
import { Loader2, Sparkles, Filter, Newspaper, Layers, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

const API_BASE = 'http://localhost:5000/api';

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

  return (
    <div className="space-y-6">
      {/* Header & Controls Overlay (Sticky inspired) */}
      <div className="sticky top-0 z-30 pt-4 pb-2 -mx-4 px-4 bg-[#f9fafb]/80 dark:bg-[#0b0f19]/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-gray-800 flex items-center justify-center text-primary-600 shadow-sm border border-gray-100 dark:border-gray-700">
              <Newspaper size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900 dark:text-white">Academic Feed</h1>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Latest social & academic updates</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search updates..."
                className="pl-12 pr-4 py-2.5 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 outline-none text-sm font-bold w-48 focus:w-64 focus:border-primary-500/50 transition-all"
              />
            </div>
            <button className="p-2.5 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-primary-600 transition-colors">
              <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
           {['All', 'Academic', 'Events', 'Exams', 'Sports'].map(cat => (
             <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex-none px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border ${category === cat ? 'bg-primary-600 border-primary-500 text-white shadow-lg shadow-primary-500/30' : 'bg-white dark:bg-gray-800/50 border-gray-100 dark:border-gray-700 text-gray-500 hover:bg-gray-50'}`}
             >
               {cat}
             </button>
           ))}
        </div>
      </div>

      {/* Post Creation Area is handled outside or passed via composition */}

      {/* Feed Content */}
      <div className="space-y-8">
        <AnimatePresence mode="popLayout">
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
        </AnimatePresence>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Syncing Feed...</p>
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
