import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, Star, ArrowUp, Zap, User, Search } from 'lucide-react';
import CoinIcon from '../CoinIcon';
import axios from 'axios';
import { useSelector } from 'react-redux';

const Leaderboard = () => {
  const { user } = useSelector(state => state.auth);
  const [activeTab, setActiveTab] = useState('global');
  const [search, setSearch] = useState('');
  const [leaders, setLeaders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get(`http://localhost:5001/api/gamification/leaderboard?type=${activeTab}`, config);
      setLeaders(res.data);
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredLeaders = leaders.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) || 
    l.department?.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination logic for the table (excluding top 3)
  const otherLeaders = filteredLeaders.slice(3);
  const totalPages = Math.ceil(otherLeaders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLeaders = otherLeaders.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  return (
    <div className="p-4 lg:p-12 space-y-10">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-4">
            <Trophy className="text-yellow-500" size={36} /> Top Performers
          </h2>
          <p className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest mt-2">ScholarNode Global Rankings</p>
        </div>

        <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10">
          {['global', 'monthly'].map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
              className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' 
                  : 'text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="relative group">
        <div className="absolute inset-0 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative">
          <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" size={20} />
          <input 
            type="text"
            placeholder="Lookup student or department profile..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] pl-16 pr-8 py-7 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {!isLoading && filteredLeaders.slice(0, 3).map((player, idx) => (
          <motion.div
            key={player._id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`relative p-8 rounded-[3.5rem] border flex flex-col items-center gap-6 overflow-hidden transition-all duration-500 ${
              idx === 0 
                ? 'bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-transparent scale-105 shadow-2xl shadow-indigo-500/20 z-10' 
                : 'bg-white dark:bg-[#0b0f1a] border-slate-200 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-none'
            }`}
          >
            {idx === 0 && <Crown className="absolute top-6 right-8 text-yellow-400" size={36} />}
            <div className={`relative w-28 h-28 rounded-[2rem] p-1.5 border-[3px] rotate-3 group-hover:rotate-0 transition-transform ${
              idx === 0 ? 'border-yellow-400 bg-white/20' : idx === 1 ? 'border-slate-300' : 'border-amber-600'
            }`}>
              {player.profilePic ? (
                <img src={player.profilePic} className="w-full h-full rounded-[1.5rem] object-cover" />
              ) : (
                <div className="w-full h-full rounded-[1.5rem] bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <User size={48} />
                </div>
              )}
            </div>
            <div className="text-center">
              <h3 className={`text-2xl font-black uppercase tracking-tight ${idx === 0 ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                {player.name}
              </h3>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] mt-2 ${idx === 0 ? 'text-indigo-100/60' : 'text-slate-400 dark:text-gray-500'}`}>
                {player.department}
              </p>
            </div>
            <div className="flex items-center gap-4 w-full">
               <div className={`flex-1 flex flex-col items-center p-3 rounded-2xl ${idx === 0 ? 'bg-white/10' : 'bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5'}`}>
                  <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${idx === 0 ? 'text-indigo-200' : 'text-slate-400'}`}>Total XP</p>
                  <p className="text-xl font-black italic">{player.coins}</p>
               </div>
               <div className={`flex-1 flex flex-col items-center p-3 rounded-2xl ${idx === 0 ? 'bg-white/10' : 'bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5'}`}>
                  <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${idx === 0 ? 'text-indigo-200' : 'text-slate-400'}`}>Streak</p>
                  <p className="text-xl font-black italic">{player.streak}d</p>
               </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white dark:bg-[#0b0f1a] border border-slate-200 dark:border-white/10 rounded-[3rem] overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                <th className="px-10 py-6 text-left text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">Rank Position</th>
                <th className="px-10 py-6 text-left text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">Scholar Profile</th>
                <th className="px-10 py-6 text-left text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">Sector</th>
                <th className="px-10 py-6 text-right text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">Institutional Streak</th>
                <th className="px-10 py-6 text-right text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">Cumulative Yield</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {paginatedLeaders.map((player, idx) => {
                const globalIdx = startIndex + idx + 4;
                return (
                  <tr key={player._id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-10 py-6">
                      <span className="text-sm font-black text-slate-400 dark:text-gray-600 group-hover:text-indigo-500 transition-colors">#{globalIdx}</span>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-5">
                        <div className="w-11 h-11 rounded-[14px] bg-slate-100 dark:bg-white/5 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm">
                          {player.profilePic ? <img src={player.profilePic} className="w-full h-full object-cover" /> : <User size={20} className="text-slate-400" />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{player.name}</p>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5 opacity-60">Verified Scholar</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <span className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-widest bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-lg border border-slate-200 dark:border-white/5">{player.department}</span>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 text-indigo-600 dark:text-indigo-400">
                        <Zap size={14} className="fill-current" />
                        <span className="text-sm font-black italic">{player.streak}d</span>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                       <div className="flex items-center justify-end gap-3">
                         <span className="text-sm font-black text-slate-900 dark:text-white">{player.coins.toLocaleString()}</span>
                         <CoinIcon size={16} />
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-10 py-8 bg-slate-50/50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
          <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">
            Showing {startIndex + 1} - {Math.min(startIndex + itemsPerPage, otherLeaders.length)} of {otherLeaders.length} Scholars
          </p>
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/5 disabled:opacity-30 transition-all text-slate-600 dark:text-white"
            >
              <ArrowUp size={16} className="-rotate-90" />
            </button>
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i + 1)}
                  className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${
                    currentPage === i + 1 
                      ? 'bg-indigo-600 text-white shadow-lg' 
                      : 'text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white hover:bg-white dark:hover:bg-white/5'
                  }`}
                >
                  {i + 1}
                </button>
              )).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))}
            </div>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/5 disabled:opacity-30 transition-all text-slate-600 dark:text-white"
            >
              <ArrowUp size={16} className="rotate-90" />
            </button>
          </div>
        </div>

        {!isLoading && filteredLeaders.length === 0 && (
          <div className="p-32 text-center opacity-40">
             <Star className="mx-auto text-slate-300 dark:text-gray-700 mb-6" size={64} />
             <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest">Sector Empty</h3>
             <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-2">No results found for current search parameters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
