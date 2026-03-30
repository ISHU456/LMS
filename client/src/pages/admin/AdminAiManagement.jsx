import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  BrainCircuit, Search, Zap, History, User, 
  ChevronRight, Brain, ArrowLeft, Loader2,
  TrendingDown, TrendingUp, ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AdminAiManagement = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsage();
  }, []);

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
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] p-8">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-4 font-bold uppercase tracking-widest text-[10px]">
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
            <BrainCircuit className="text-indigo-600" size={32} /> Neural Core Governance
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-semibold">Monitoring high-performance AI interactions across the sector.</p>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Search Subject ID or Identifier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-12 pr-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl w-full md:w-80 outline-none focus:ring-2 ring-indigo-500/20 transition-all font-bold"
          />
        </div>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={40} className="animate-spin text-indigo-600" />
          <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Decrypting usage logs...</p>
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
              className="group cursor-pointer bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-black text-lg border border-indigo-100 dark:border-indigo-800">
                  {u.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-extrabold text-gray-900 dark:text-white truncate uppercase tracking-tight">{u.name}</h3>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{u.role}</p>
                </div>
                <ChevronRight className="text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                   <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Pulses</p>
                   <p className="text-xl font-black text-gray-900 dark:text-white">{u.totalUsage || 0}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                   <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Credits Pool</p>
                   <p className="text-xl font-black text-indigo-500">{u.credits || 0}</p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History size={12} className="text-gray-400" />
                  <span className="text-[9px] font-bold text-gray-500">
                    Last Active: {u.lastUsage ? new Date(u.lastUsage).toLocaleDateString() : 'Never'}
                  </span>
                </div>
                <div className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 text-[8px] font-black uppercase tracking-widest rounded-full">
                  {u.lastAction ? (u.lastAction === 'analyze' ? 'Deep Scan' : 'Query') : 'Identity Idle'}
                </div>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-32 flex flex-col items-center justify-center bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-800 rounded-[3rem] opacity-40">
               <Brain size={48} className="text-gray-300 mb-4"/>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">No identity nodes detected in current sector</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminAiManagement;
