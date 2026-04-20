import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { 
  Zap, Trophy, ChevronRight, Brain, ClipboardList, Search, Cpu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import QuizGenerator from '../teacher/QuizGenerator';

const QuizHall = () => {
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [stats, setStats] = useState({ totalCoins: 0, completedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Pending');
  const [showGenerator, setShowGenerator] = useState(false);

  const isFaculty = ['teacher', 'admin', 'hod'].includes(user?.role);

  useEffect(() => {
    fetchChallenges();
  }, [user]);

  const fetchChallenges = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const [quizzesRes, leaderboardRes, achievementsRes] = await Promise.all([
        axios.get('http://localhost:5001/api/gamification/quizzes', config),
        axios.get('http://localhost:5001/api/gamification/leaderboard', config),
        axios.get('http://localhost:5001/api/gamification/achievements', config)
      ]);
      
      setChallenges(quizzesRes.data);
      setLeaderboard(leaderboardRes.data.slice(0, 10)); // Top 10 for hall of fame
      setStats({
          totalCoins: achievementsRes.data.stats.coins,
          completedCount: quizzesRes.data.filter(q => q.isCompleted).length
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
      if (tab === 'Leaderboard') {
          document.getElementById('arena-leaderboard')?.scrollIntoView({ behavior: 'smooth' });
          return;
      }
      setActiveTab(tab);
  };

  const filtered = challenges.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase());
    if (activeTab === 'Completed') return c.isCompleted && matchesSearch;
    if (activeTab === 'Pending') return !c.isCompleted && matchesSearch;
    return matchesSearch;
  });

  return (
    <div className="space-y-8 will-change-transform">
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full"
          />
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-8">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic flex items-center gap-4">
             Scholar <span className="text-emerald-600">Assessment</span> Arena
          </h2>
          <p className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest mt-1">
            Participate in professional MCQ evaluations to increase institutional yield and reputation
          </p>
        </div>

        <div className="flex items-center gap-4">
            <div className="px-8 py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] flex items-center gap-6">
                <div>
                   <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Total Yield</p>
                   <p className="text-xl font-black text-slate-900 dark:text-white tabular-nums">{stats.totalCoins?.toLocaleString()}</p>
                </div>
                <div className="h-8 w-[1px] bg-emerald-500/20" />
                <div>
                   <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Clearance</p>
                   <p className="text-xl font-black text-slate-900 dark:text-white tabular-nums">{stats.completedCount}/{challenges.length}</p>
                </div>
            </div>
            {isFaculty && (
                <button
                    onClick={() => setShowGenerator(true)}
                    className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20"
                >
                    <Cpu size={20} />
                </button>
            )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 p-2 bg-white/40 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] backdrop-blur-xl transition-colors">
        <div className="relative flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" size={20} />
          <input 
            placeholder="Search assessments, subjects or categories..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-transparent border-none rounded-[2rem] pl-16 pr-8 py-5 text-sm font-bold text-slate-900 dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-gray-600"
          />
        </div>
        <div className="flex gap-2 p-2 overflow-x-auto no-scrollbar">
          {['Pending', 'Completed', 'Leaderboard'].map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/20' 
                  : 'text-slate-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-white hover:bg-emerald-500/5 dark:hover:bg-white/5'
              }`}
            >
              {tab}
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
              onClick={() => navigate(`/quize-arena/${challenge._id}`)}
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
                   {challenge.isCompleted && (
                       <span className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-500/20 bg-emerald-500/5 text-emerald-600">
                           Score: {challenge.bestScore}/{challenge.totalPoints}
                       </span>
                   )}
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
                 {isFaculty ? (
                     <button 
                       onClick={(e) => {
                           e.stopPropagation();
                           navigate(`/quize-arena/${challenge._id}/leaderboard`);
                       }}
                       className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                     >
                         Review Submissions
                     </button>
                 ) : (
                     <ChevronRight size={18} className="text-slate-300 dark:text-gray-700 group-hover:text-emerald-500 dark:group-hover:text-white group-hover:translate-x-1 transition-all" />
                 )}
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
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest">No assessments found</h3>
                <p className="text-xs font-bold text-slate-400 dark:text-gray-500 mt-2">Try adjusting your filters or search parameters</p>
             </div>
         </div>
      )}

      {/* Hall of Fame section at the downside */}
      <div id="arena-leaderboard" className="pt-20 space-y-10">
          <div className="flex items-center gap-6">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] italic flex items-center gap-3">
                  <Trophy className="text-amber-500" size={24} /> Arena Hall of Fame
              </h2>
              <div className="h-[2px] flex-1 bg-slate-100 dark:bg-white/5 rounded-full" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 bg-white dark:bg-[#0b0f1a] border border-slate-200 dark:border-white/10 rounded-[3.5rem] overflow-hidden shadow-xl">
                  <table className="w-full text-left">
                      <thead>
                          <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/10">
                              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Rank</th>
                              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Master</th>
                              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Department</th>
                              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Yield</th>
                          </tr>
                      </thead>
                      <tbody>
                          {leaderboard.map((entry, idx) => (
                              <tr key={entry._id} className="border-b border-slate-50 dark:border-white/5 last:border-none group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                  <td className="px-8 py-5">
                                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
                                          idx === 0 ? 'bg-amber-500 text-white' : 
                                          idx === 1 ? 'bg-slate-300 text-slate-900' :
                                          idx === 2 ? 'bg-orange-400 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-400'
                                      }`}>
                                          {idx + 1}
                                      </span>
                                  </td>
                                  <td className="px-8 py-5">
                                      <div className="flex items-center gap-4">
                                          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 overflow-hidden border-2 border-white dark:border-white/10">
                                              {entry.profilePic ? <img src={entry.profilePic} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black text-indigo-600">{entry.name?.charAt(0)}</div>}
                                          </div>
                                          <div>
                                              <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight italic">{entry.name}</p>
                                              <p className="text-[9px] font-bold text-slate-400 uppercase">Streak: {entry.streak || 0}d</p>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-8 py-5">
                                      <span className="text-[10px] font-black text-slate-500 dark:text-gray-400 uppercase tracking-widest">{entry.department || 'General'}</span>
                                  </td>
                                  <td className="px-8 py-5 text-right">
                                      <p className="text-sm font-black text-indigo-700 dark:text-indigo-400 tabular-nums">{entry.coins?.toLocaleString()}</p>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>

              <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-[3.5rem] p-10 text-white relative overflow-hidden flex flex-col justify-between shadow-2xl shadow-indigo-600/40">
                  <div className="relative z-10">
                      <Trophy className="mb-8 opacity-40" size={48} />
                      <h3 className="text-3xl font-black uppercase tracking-tighter italic leading-[0.9] mb-4">Elite Status <br/><span className="text-amber-400">Eligibility</span></h3>
                      <p className="text-[10px] font-medium text-indigo-100 opacity-60 uppercase tracking-widest leading-relaxed">
                          Top-ranked scholars are eligible for terminal honors and institutional reputation boosts. Maintain your yield to stay in the hall of fame.
                      </p>
                  </div>
                  
                  <div className="relative z-10 pt-10 border-t border-white/10">
                      <p className="text-[11px] font-black uppercase tracking-widest mb-4">Your Position</p>
                      <div className="flex items-end justify-between">
                          <p className="text-6xl font-black italic tracking-tighter">#{leaderboard.findIndex(e => e._id === user._id) + 1 || 'N/A'}</p>
                          <ChevronRight size={32} className="text-indigo-300 animate-pulse" />
                      </div>
                  </div>
                  
                  <div className="absolute -bottom-10 -right-10 opacity-10">
                      <Zap size={240} />
                  </div>
              </div>
          </div>
      </div>

        </motion.div>
      )}
      <AnimatePresence>
        {showGenerator && (
          <QuizGenerator 
            onClose={() => setShowGenerator(false)} 
            onSave={() => {
              setShowGenerator(false);
              fetchChallenges();
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuizHall;
