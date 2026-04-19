import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { 
  Trophy, Star, Zap, Gift, Play, Plus, BookOpen, Layers, 
  Crown, Medal, ShieldCheck, Search, Filter, Sparkles, Brain
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import QuizGenerator from '../../components/teacher/QuizGenerator';
import PrizeManager from '../../components/admin/PrizeManager';
import PrizeProgress from '../../components/student/PrizeProgress';

const QuizArenaPage = () => {
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [stats, setStats] = useState({ coins: 0, streak: 0 });
  const [isGenOpen, setIsGenOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
    fetchProgress();
  }, [user]);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get('http://localhost:5001/api/gamification/quizzes', config);
      setQuizzes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  const fetchProgress = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get('http://localhost:5001/api/gamification/achievements', config);
      setStats({
        coins: res.data.stats.coins,
        streak: res.data.stats.streak
      });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredQuizzes = quizzes.filter(q => 
    (category === 'All' || q.category === category) &&
    (q.title.toLowerCase().includes(search.toLowerCase()) || q.category.toLowerCase().includes(search.toLowerCase()))
  );

  const categories = ['All', ...new Set(quizzes.map(q => q.category))];

  return (
    <div className="min-h-screen bg-transparent p-6 lg:p-12 space-y-12">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        <div>
          <h1 className="text-5xl lg:text-7xl font-black text-white uppercase tracking-tighter italic flex items-center gap-4">
            <ShieldCheck className="text-indigo-500" size={48} /> Quiz Arena
          </h1>
          <p className="text-sm font-black text-gray-500 uppercase tracking-[0.4em] mt-3 border-l-4 border-indigo-600 pl-4 whitespace-nowrap">
            Institutional Neural Assessment & Reward System
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full lg:w-auto">
            <div className="bg-white/5 border border-white/10 p-4 lg:p-6 rounded-3xl flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500"><Star size={24} className="fill-current"/></div>
               <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase">My Credits</p>
                  <p className="text-2xl font-black text-white">{stats.coins}</p>
               </div>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 lg:p-6 rounded-3xl flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-orange-600/10 flex items-center justify-center text-orange-600"><Zap size={24} className="fill-current"/></div>
               <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase">Activity Streak</p>
                  <p className="text-2xl font-black text-white">{stats.streak} Days</p>
               </div>
            </div>
          </div>

          {['teacher', 'admin', 'hod'].includes(user.role) && (
            <button 
              onClick={() => setIsGenOpen(true)}
              className="px-10 py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/20 hover:scale-105 transition-all flex items-center gap-3"
            >
              <Sparkles size={20} /> Architect New Node
            </button>
          )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        {/* Main Quizzes Area */}
        <div className="xl:col-span-8 space-y-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input 
                placeholder="Search subject or topic..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-[2rem] pl-16 pr-8 py-5 text-sm font-bold text-white outline-none focus:border-indigo-500 transition-all"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    category === cat ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-gray-500 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence>
              {loading ? (
                <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-4">
                  <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Synchronizing Neural Quizzes...</p>
                </div>
              ) : filteredQuizzes.map((quiz, idx) => (
                <motion.div
                  key={quiz._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white/5 border border-white/10 rounded-[3rem] p-8 group hover:border-indigo-500/30 transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-600/10 transition-all" />
                  
                  <div className="flex items-start justify-between relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 group-hover:rotate-12 transition-transform">
                      <BookOpen size={28} />
                    </div>
                    <span className="px-4 py-1.5 rounded-xl bg-white/5 text-[10px] font-black text-gray-400 uppercase tracking-widest border border-white/5">
                      {quiz.category}
                    </span>
                  </div>

                  <div className="mt-8 relative z-10">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">{quiz.title}</h3>
                    <p className="text-xs font-bold text-gray-500 mt-2 line-clamp-2">{quiz.description}</p>
                  </div>

                  <div className="flex items-center gap-6 mt-8 relative z-10">
                    <div className="flex items-center gap-2">
                       <Zap size={14} className="text-yellow-500" />
                       <span className="text-[10px] font-black text-white uppercase">{quiz.totalPoints} Pts</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <Play size={14} className="text-indigo-400" />
                       <span className="text-[10px] font-black text-white uppercase">{quiz.timeLimit} Min</span>
                    </div>
                  </div>

                  {quiz.isCompleted ? (
                    <div className="w-full mt-8 flex flex-col gap-3">
                       <div className="w-full py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between px-6">
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                             <CheckCircle2 size={14} /> COMPLETED
                          </span>
                          <span className="text-sm font-black text-emerald-700 italic">{quiz.bestScore} / {quiz.totalPoints}</span>
                       </div>
                       <button 
                         onClick={() => navigate(`/quiz-arena/${quiz._id}`)}
                         className="w-full py-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all"
                       >
                         Re-attempt Assessment
                       </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => navigate(`/quiz-arena/${quiz._id}`)}
                      className="w-full mt-8 py-4 bg-[#2c4c91] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:bg-[#1e3a75] transition-all"
                    >
                      Initialize Attempt
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {!loading && filteredQuizzes.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-6 opacity-40">
                <Brain size={48} className="text-gray-600" />
                <div className="text-center">
                  <p className="text-sm font-black text-white uppercase tracking-widest">Arena currently dormant</p>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2">No active assessment nodes found in this sector</p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Sidebar Contextual Area */}
        <div className="xl:col-span-4 space-y-12">
          {user.role === 'student' ? (
            <div className="bg-white/5 border border-white/10 rounded-[3rem] p-8 h-full">
              <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
                 <Gift size={20} className="text-rose-500" /> Reward Progress
              </h3>
              <PrizeProgress isCompact />
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-[3rem] p-8 h-full">
              <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-10 flex items-center gap-3">
                 <Medal size={20} className="text-rose-500" /> Institutional Prizes
              </h3>
              <PrizeManager isCompact />
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isGenOpen && (
          <QuizGenerator 
            onClose={() => setIsGenOpen(false)} 
            onSave={() => {
              fetchQuizzes();
              setIsGenOpen(false);
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuizArenaPage;
