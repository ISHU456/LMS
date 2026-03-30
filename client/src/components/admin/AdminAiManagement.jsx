import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  BrainCircuit, Search, Zap, History, User, 
  ChevronRight, Brain, ArrowLeft, Loader2,
  TrendingDown, TrendingUp, ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminAiManagement = ({ user }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsage();
  }, [user]);

  const fetchUsage = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/chatbot/usage-summary', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3 italic">
            <BrainCircuit className="text-indigo-600" size={24} /> Neural Core Governance
          </h2>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 italic">Monitoring high-performance AI interactions across the sector.</p>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text"
            placeholder="Search Identity Node..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 pr-6 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-slate-800/60 rounded-2xl w-full md:w-80 outline-none focus:ring-2 ring-indigo-500/20 transition-all font-black text-[10px] uppercase tracking-widest text-slate-900 dark:text-white"
          />
        </div>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6 bg-white dark:bg-[#080c14] rounded-[3rem] border border-slate-100 dark:border-slate-800/60 shadow-xl">
          <div className="relative">
             <Loader2 size={48} className="animate-spin text-indigo-600" />
             <BrainCircuit size={20} className="absolute inset-0 m-auto text-indigo-400 animate-pulse" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Decrypting neural logs...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((u) => (
            <motion.div 
              key={u._id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -5 }}
              onClick={() => navigate(`/admin/ai-user/${u._id}`)}
              className="group cursor-pointer bg-white dark:bg-[#080c14] border border-slate-200 dark:border-slate-800/60 rounded-[2.5rem] p-8 hover:shadow-2xl hover:border-indigo-500/30 transition-all duration-500 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-indigo-500/10 transition-all" />
              
              <div className="flex items-center gap-5 mb-8 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 dark:bg-white/5 text-indigo-600 flex items-center justify-center font-black text-xl border border-indigo-100 dark:border-white/5 transition-transform duration-500 group-hover:scale-110">
                  {u.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-black text-slate-900 dark:text-white truncate uppercase tracking-tighter text-lg">{u.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{u.role}</p>
                  </div>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-indigo-50 group-hover:translate-x-1 transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="p-5 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 group-hover:border-indigo-500/20 transition-all">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Pulses</p>
                   <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums italic">{u.totalUsage || 0}</p>
                </div>
                <div className="p-5 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 group-hover:border-indigo-500/20 transition-all">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Credits Pool</p>
                   <p className="text-2xl font-black text-indigo-500 tabular-nums italic">{u.credits || 0}</p>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-6 relative z-10">
                <div className="flex items-center gap-2">
                  <History size={14} className="text-slate-400" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Pulsed: {u.lastUsage ? new Date(u.lastUsage).toLocaleDateString() : 'Never'}
                  </span>
                </div>
                <div className="px-4 py-1.5 bg-indigo-500/10 text-indigo-600 text-[8px] font-black uppercase tracking-[0.2em] rounded-full border border-indigo-500/20 italic">
                  {u.lastAction ? (u.lastAction === 'analyze' ? 'Deep Scan' : 'Neural Query') : 'Idle State'}
                </div>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-40 flex flex-col items-center justify-center bg-white dark:bg-[#080c14] border border-dashed border-slate-200 dark:border-slate-800/60 rounded-[3rem] opacity-40">
               <Brain size={48} className="text-slate-300 dark:text-slate-700 mb-6 animate-pulse"/>
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 dark:text-slate-600 italic">No identity nodes detected in current sector</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminAiManagement;
