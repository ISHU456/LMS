import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  BrainCircuit, Search, Zap, History, User, 
  ChevronRight, Brain, ArrowLeft, Loader2,
  TrendingDown, TrendingUp, ShieldCheck, Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AdminAiManagement = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeView, setActiveView] = useState('summary'); // 'summary' or 'requests'
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsage();
    fetchRequests();
  }, []);

  const fetchUsage = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/chatbot/usage-summary', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } 
  };

  const fetchRequests = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/chatbot/requests', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrant = async (id) => {
    try {
      await axios.post(`http://localhost:5001/api/chatbot/grant/${id}`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      fetchRequests();
      fetchUsage();
      alert("Neural Link synchronized. Credits assigned.");
    } catch (err) {
      alert("Grant Failed: " + err.message);
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

        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center bg-white dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
             <button 
               onClick={() => setActiveView('summary')}
               className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'summary' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-400 hover:text-indigo-500'}`}>
               Registry Summary
             </button>
             <button 
               onClick={() => setActiveView('requests')}
               className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative ${activeView === 'requests' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-400 hover:text-indigo-500'}`}>
               Neural Requests
               {requests.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[8px] flex items-center justify-center border-2 border-white dark:border-gray-800 text-white font-black">{requests.length}</span>}
             </button>
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
        </div>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={40} className="animate-spin text-indigo-600" />
          <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Decrypting usage logs...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {activeView === 'requests' ? (
             requests.map((r) => (
               <motion.div 
                 key={r._id}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="bg-white dark:bg-gray-900 border-2 border-rose-100 dark:border-rose-900/20 rounded-[2.5rem] p-8 shadow-xl shadow-rose-500/5 relative overflow-hidden group"
               >
                 <div className="absolute top-0 right-0 p-4">
                    <Zap className="text-rose-500 animate-pulse" size={24} />
                 </div>
                 <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center font-black text-xl border border-rose-100 dark:border-rose-800 uppercase">
                      {r.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-extrabold text-gray-900 dark:text-white uppercase tracking-tighter truncate">{r.name}</h3>
                      <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{r.role}</p>
                    </div>
                 </div>
                 
                 <div className="p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 mb-8">
                    <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-1">State: Critical Depletion</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{r.credits} Credits Remaining</p>
                 </div>

                 <div className="flex gap-3">
                    <button 
                      onClick={() => handleGrant(r._id)}
                      className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                    >
                      Refill Neural Link
                    </button>
                    <button 
                      onClick={() => navigate(`/admin/ai-user/${r._id}`)}
                      className="px-4 py-4 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-2xl hover:text-rose-500 transition-all group-hover:bg-gray-200 dark:group-hover:bg-gray-700"
                    >
                       <History size={18} />
                    </button>
                 </div>
               </motion.div>
             ))
           ) : (
             filtered.map((u) => (
                <motion.div 
                  key={u._id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -5 }}
                  onClick={() => navigate(`/admin/ai-user/${u._id}`)}
                  className="group cursor-pointer bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all relative overflow-hidden"
                >
                  {u.aiCreditsRequested && (
                    <div className="absolute top-0 right-0 bg-rose-500 text-white px-3 py-1 rounded-bl-xl text-[8px] font-black uppercase tracking-widest animate-pulse z-10">
                      Request Pending
                    </div>
                  )}
                  <div className="flex items-center gap-4 mb-6 relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-black text-lg border border-indigo-100 dark:border-indigo-800 uppercase">
                      {u.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-extrabold text-gray-900 dark:text-white truncate uppercase tracking-tight">{u.name}</h3>
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{u.role}</p>
                    </div>
                    <ChevronRight className="text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                       <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Pulses</p>
                       <p className="text-xl font-black text-gray-900 dark:text-white tabular-nums">{u.totalUsage || 0}</p>
                    </div>
                    <div className={`p-4 rounded-2xl border transition-all group/pool ${u.credits < 3 ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700'}`}>
                       <div className="flex items-center justify-between mb-1">
                          <p className={`text-[9px] font-black ${u.credits < 3 ? 'text-rose-500' : 'text-gray-500'} uppercase tracking-widest`}>Credits Pool</p>
                          <button 
                            onClick={(e) => {
                               e.stopPropagation();
                               handleGrant(u._id);
                            }}
                            className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center opacity-0 group-hover/pool:opacity-100 transition-opacity hover:scale-110"
                          >
                             <Plus size={10} />
                          </button>
                       </div>
                       <p className={`text-xl font-black tabular-nums ${u.credits < 3 ? 'text-rose-600' : 'text-indigo-500'}`}>{u.credits || 0}</p>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2">
                      <History size={12} className="text-gray-400" />
                      <span className="text-[9px] font-bold text-gray-500 uppercase">
                        Last Pulse: {u.lastUsage ? new Date(u.lastUsage).toLocaleDateString() : 'Idle'}
                      </span>
                    </div>
                    <div className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 text-[8px] font-black uppercase tracking-widest rounded-full">
                      {u.lastAction ? (u.lastAction === 'analyze' ? 'Deep Scan' : 'Query') : 'Identity Dormant'}
                    </div>
                  </div>
                </motion.div>
             ))
           )}
           {activeView === 'summary' && filtered.length === 0 && (
            <div className="col-span-full py-32 flex flex-col items-center justify-center bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-800 rounded-[3rem] opacity-40">
               <Brain size={48} className="text-gray-300 mb-4"/>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">No identity nodes detected in current sector</p>
            </div>
           )}
           {activeView === 'requests' && requests.length === 0 && (
             <div className="col-span-full py-32 flex flex-col items-center justify-center bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-800 rounded-[3rem] opacity-40">
                <ShieldCheck size={48} className="text-emerald-500 mb-4"/>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">All neural nodes synchronized. No pending requests.</p>
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default AdminAiManagement;
