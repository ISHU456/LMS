import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { 
  Terminal, Cpu, Zap, Trophy, Play, CheckCircle, 
  Search, Filter, Lock, ChevronRight, Gauge, Brain, Code2, ClipboardList
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import QuizGenerator from '../../components/teacher/QuizGenerator';

const QuizeArenaPage = () => {
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('All');
  const [showGenerator, setShowGenerator] = useState(false);

  // RENDER SEPARATION LOGIC
  const isFaculty = ['teacher', 'admin', 'hod'].includes(user?.role);

  useEffect(() => {
    fetchChallenges();
  }, [user]);

  const fetchChallenges = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get('http://localhost:5001/api/gamification/quizzes', config);
      setChallenges(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = challenges.filter(c => 
    (difficulty === 'All' || c.difficulty === difficulty || c.category === difficulty) &&
    (c.title.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-transparent p-6 lg:p-12 space-y-12 transition-colors duration-500">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl lg:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-4">
            <ClipboardList className="text-emerald-500" size={48} /> Quize Arena
          </h1>
          <p className="text-xs font-black text-slate-500 dark:text-gray-500 uppercase tracking-[0.4em] mt-3 border-l-4 border-emerald-600 pl-4">
            Subject-wise MCQ Exams & Weekly Evaluation
          </p>
        </div>

        <div className="flex items-center gap-6">
            {isFaculty && (
              <button
                onClick={() => setShowGenerator(true)}
                className="px-6 py-3 bg-white dark:bg-[#0b0f1a] border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-emerald-500 hover:text-emerald-500 dark:hover:text-emerald-300 transition-all shadow-xl shadow-emerald-500/10 dark:shadow-emerald-500/20"
              >
                Deploy Quiz
              </button>
            )}

            <div className="text-right hidden sm:block">
               <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">Global Rank</p>
               <p className="text-2xl font-black text-slate-900 dark:text-white italic">#402</p>
            </div>
           <div className="w-14 h-14 hidden sm:flex rounded-2xl bg-emerald-500 items-center justify-center text-white shadow-lg shadow-emerald-500/30">
              <Trophy size={28} />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        <div className="xl:col-span-12 space-y-8">
          <div className="flex flex-col md:flex-row gap-6 p-2 bg-white/40 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] backdrop-blur-xl transition-colors">
            <div className="relative flex-1">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" size={20} />
              <input 
                placeholder="Search algorithms, patterns or topics..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-transparent border-none rounded-[2rem] pl-16 pr-8 py-5 text-sm font-bold text-slate-900 dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-gray-600"
              />
            </div>
            <div className="flex gap-2 p-2">
              {['Universal', 'Minor', 'Major', 'Professional'].map(diff => (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff === 'Universal' ? 'All' : diff)}
                  className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    (difficulty === 'All' && diff === 'Universal') || difficulty === diff 
                      ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/20' 
                      : 'text-slate-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-white hover:bg-emerald-500/5 dark:hover:bg-white/5'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filtered.map((challenge, idx) => (
                <motion.div
                  key={challenge._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => navigate(`/quiz-arena/${challenge._id}`)}
                  className="bg-white dark:bg-[#0b0f1a] border border-slate-200 dark:border-white/10 rounded-[3rem] p-8 group hover:border-emerald-500/40 transition-all cursor-pointer relative overflow-hidden active:scale-95 shadow-lg shadow-slate-200/50 dark:shadow-none"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                     <Cpu size={80} />
                  </div>
                  
                  <div className="flex items-start justify-between mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <ClipboardList size={24} />
                    </div>
                    <div className="flex items-center gap-2">
                       <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-indigo-500/20 bg-indigo-500/5 text-indigo-500`}>
                        {challenge.category || "General"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{challenge.title}</h3>
                    <p className="text-xs font-bold text-slate-500 dark:text-gray-500 mt-2 line-clamp-2">{challenge.description}</p>
                  </div>

                  <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-slate-400 dark:text-gray-400">
                           <Zap size={14} className="text-yellow-500" />
                           <span className="text-[10px] font-black">{challenge.totalPoints || 100} Coins</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 dark:text-gray-400 border-l border-slate-100 dark:border-white/10 pl-4">
                           <Brain size={14} className="text-pink-400" />
                           <span className="text-[10px] font-black">{challenge.questions?.length || 0} Questions</span>
                        </div>
                     </div>
                     <ChevronRight size={18} className="text-slate-300 dark:text-gray-700 group-hover:text-emerald-500 dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filtered.length === 0 && !loading && (
             <div className="py-32 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-700 animate-pulse">
                   <Brain size={40} />
                </div>
                 <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest">No matching sectors found</h3>
                    <p className="text-xs font-bold text-slate-400 dark:text-gray-500 mt-2">Try adjusting your filters or search parameters</p>
                 </div>
             </div>
          )}
        </div>
      </div>
      <AnimatePresence>
        {showGenerator && (
          <QuizGenerator 
            onClose={() => setShowGenerator(false)} 
            onSave={() => {
              setShowGenerator(false);
              fetchChallenges(); // Refresh the quizzes
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuizeArenaPage;
