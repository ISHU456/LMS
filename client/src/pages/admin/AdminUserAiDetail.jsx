import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Zap, History, User, 
  Cpu, FileText, TrendingDown, Clock,
  Loader2, ExternalLink, Calendar
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { 
  ResponsiveContainer, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip 
} from 'recharts';

const AdminUserAiDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: adminUser } = useSelector((state) => state.auth);
  
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAudit();
  }, [userId]);

  const fetchAudit = async () => {
    try {
      const res = await axios.get(`http://localhost:5001/api/chatbot/user-audit/${userId}`, {
        headers: { Authorization: `Bearer ${adminUser.token}` }
      });
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = useMemo(() => {
    if (!data?.logs) return [];
    // Process logs into daily usage frequency
    const map = {};
    [...data.logs].reverse().forEach(log => {
      const day = new Date(log.timestamp).toLocaleDateString();
      map[day] = (map[day] || 0) + log.cost;
    });
    return Object.keys(map).map(day => ({ day, cost: map[day] }));
  }, [data?.logs]);

  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#0f172a]">
       <Loader2 size={40} className="animate-spin text-indigo-500" />
       <p className="text-xs font-black uppercase tracking-widest text-indigo-400">Auditing Neural Activity...</p>
    </div>
  );

  if (!data) return <div className="p-10 text-white">Neural Subject Not Found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] p-8">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-indigo-500 mb-6 font-black uppercase tracking-[0.2em] text-[10px]">
             <ArrowLeft size={16} /> Back to Audit Central
          </button>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-[2.5rem] bg-indigo-600 text-white flex items-center justify-center font-black text-3xl shadow-2xl shadow-indigo-600/40 border-4 border-white/10">
              {data.user.name[0]}UI
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter tabular-nums leading-none mb-2">{data.user.name}</h1>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg">{data.user.role}</span>
                <span className="text-gray-400 font-bold text-xs uppercase tracking-widest italic">{data.user.email}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="p-6 rounded-[2rem] bg-indigo-600/10 border border-indigo-500/20 text-center min-w-[140px]">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Current Balance</p>
              <p className="text-3xl font-black text-gray-900 dark:text-white">{data.user.credits}</p>
           </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Metrics & Logs */}
        <div className="lg:col-span-2 space-y-8">
           <section className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 shadow-xl shadow-black/5">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500 mb-8 flex items-center gap-3">
                 <TrendingDown size={14} className="text-indigo-500" /> Credit Consumption Frequency
              </h3>
              <div className="h-64 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="usageGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="day" hide />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                        itemStyle={{ color: '#818cf8', fontWeight: 'bold', textTransform: 'uppercase' }}
                      />
                      <Area type="monotone" dataKey="cost" stroke="#4f46e5" fillOpacity={1} fill="url(#usageGrad)" strokeWidth={4} />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </section>

           <section className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 shadow-xl shadow-black/5">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500 mb-8 flex items-center gap-3">
                 <History size={14} className="text-indigo-500" /> Granular Credit Logs
              </h3>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 no-scrollbar">
                 {data.logs.map((log, i) => (
                   <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700 hover:border-indigo-500/30 transition-all">
                      <div className="flex items-center gap-4">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${log.action === 'analyze' ? 'bg-orange-500/10 text-orange-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
                            {log.action === 'analyze' ? <FileText size={18} /> : <Zap size={18} />}
                         </div>
                         <div className="min-w-0">
                            <p className="text-[11px] font-black text-gray-900 dark:text-white uppercase truncate">{log.contentSummary}</p>
                            <div className="flex items-center gap-2 mt-1">
                               <Clock size={10} className="text-gray-400" />
                               <span className="text-[8px] font-bold text-gray-500 uppercase">{new Date(log.timestamp).toLocaleString()}</span>
                            </div>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-xs font-black text-rose-500">-{log.cost}</p>
                         <p className="text-[8px] font-black text-gray-500 uppercase mt-1">Remain: {log.remainingCredits}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </section>
        </div>

        {/* Right Column: Chat History Sessions */}
        <div className="space-y-8">
           <section className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 shadow-xl shadow-black/5 h-full">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500 mb-8 flex items-center gap-3">
                 <Cpu size={14} className="text-indigo-500" /> Neural Session Logs
              </h3>
              <div className="space-y-4">
                 {data.chats.map((chat, i) => (
                   <motion.div 
                     key={i}
                     whileHover={{ x: 5 }}
                     className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-all cursor-default"
                   >
                      <div className="flex items-baseline justify-between mb-3">
                        <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">{new Date(chat.lastActive).toLocaleDateString()}</span>
                        <span className="text-[10px] font-black text-gray-400 uppercase">Track #{i + 1}</span>
                      </div>
                      <h4 className="text-[11px] font-black text-gray-900 dark:text-white uppercase leading-tight line-clamp-2">{chat.title}</h4>
                      <p className="text-[10px] font-bold text-gray-500 mt-3 flex items-center gap-2">
                         {chat.messages.length} neural nodes preserved
                      </p>
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800/50 flex flex-col gap-2">
                        {chat.messages.slice(-2).map((m, j) => (
                          <div key={j} className="flex gap-2">
                             <span className={`text-[8px] font-black uppercase tracking-tighter ${m.role === 'user' ? 'text-orange-500' : 'text-indigo-500'}`}>{m.role[0]}:</span>
                             <p className="text-[9px] text-gray-500 line-clamp-1 italic">{m.content}</p>
                          </div>
                        ))}
                      </div>
                   </motion.div>
                 ))}
              </div>
           </section>
        </div>

      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default AdminUserAiDetail;
