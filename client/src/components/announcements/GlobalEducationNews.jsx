import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, ExternalLink, GraduationCap, Briefcase, RefreshCw, AlertCircle } from 'lucide-react';

const API_BASE = 'http://localhost:5001/api';

const GlobalEducationNews = () => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchNews = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_BASE}/news/education`);
            if (res.data.success) {
                setNews(res.data.items);
            } else {
                setError("Failed to sync updates");
            }
        } catch (err) {
            console.error(err);
            setError("Network sync error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNews();
    }, []);

    return (
        <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-2xl shadow-gray-200/50 dark:shadow-none overflow-hidden relative group">
            {/* Background Polish */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 blur-[80px] -z-0 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600">
                            <Newspaper size={18} />
                        </div>
                        <div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Governance Pulse</h3>
                            <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">UPSC & SSC Strategic News</h4>
                        </div>
                    </div>
                    <button 
                        onClick={fetchNews}
                        className={`p-2 rounded-xl text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all ${loading ? 'animate-spin' : ''}`}
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        Array(3).fill(0).map((_, i) => (
                            <div key={i} className="animate-pulse flex gap-4 p-4 rounded-3xl bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
                                <div className="w-16 h-16 rounded-2xl bg-gray-200 dark:bg-gray-700 shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-md" />
                                    <div className="h-3 w-1/2 bg-gray-100 dark:bg-gray-800 rounded-md" />
                                </div>
                            </div>
                        ))
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-3">
                             <AlertCircle className="text-rose-400" size={32} />
                             <p className="text-[10px] font-black uppercase tracking-widest text-rose-500/60">{error}</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {news.map((item, index) => (
                                <motion.a
                                    key={index}
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="group/news flex gap-4 p-4 rounded-3xl bg-gray-50/50 hover:bg-white dark:bg-gray-800/20 dark:hover:bg-gray-800/40 border border-transparent hover:border-primary-100 dark:hover:border-primary-900/30 hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-300 relative overflow-hidden"
                                >
                                    {item.image ? (
                                        <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-white dark:border-gray-700 shadow-sm group-hover/news:scale-105 transition-transform">
                                            <img src={item.image} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-primary-900/10 dark:to-indigo-900/10 flex items-center justify-center text-primary-400 shrink-0">
                                            {item.title.toLowerCase().includes('job') || item.title.toLowerCase().includes('placement') ? <Briefcase size={24} /> : <GraduationCap size={24} />}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2 py-0.5 rounded-lg bg-primary-100/50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-[8px] font-black uppercase tracking-widest font-black">
                                                {item.source?.name}
                                            </span>
                                            <span className="text-[8px] font-bold text-gray-400">
                                                {new Date(item.publishedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>
                                        <h5 className="text-[12px] font-black text-gray-800 dark:text-gray-200 leading-snug line-clamp-2 group-hover/news:text-primary-600 transition-colors">
                                            {item.title}
                                        </h5>
                                    </div>
                                    <div className="absolute top-4 right-4 opacity-0 group-hover/news:opacity-100 group-hover/news:translate-x-0 translate-x-2 transition-all">
                                        <ExternalLink size={12} className="text-primary-500" />
                                    </div>
                                </motion.a>
                            ))}
                        </AnimatePresence>
                    )}
                </div>

                <div className="mt-2 flex items-center justify-center">
                    <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-primary-600 transition-colors">
                        View All News Pipeline <ExternalLink size={10} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GlobalEducationNews;
