import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Check, X, Clock, User, Book, ChevronRight, AlertCircle } from 'lucide-react';

const AdminAccessRequests = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const { data } = await axios.get('http://localhost:5001/api/access-requests/pending', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setRequests(data);
    } catch (err) {
      console.error("Failed to fetch access requests", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleResolve = async (id, status) => {
    try {
      await axios.post(`http://localhost:5001/api/access-requests/resolve/${id}`, { status }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setRequests(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      alert("Resolution Protocol Failure.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex animate-pulse items-center justify-center p-20">
        <Shield className="text-slate-200 dark:text-slate-800 animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center bg-white dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl dark:shadow-none">
         <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Access Governance Hub</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Pending Curriculum Authorization Requests</p>
         </div>
         <div className="bg-amber-500/10 text-amber-500 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <Clock size={12} /> {requests.length} Pending
         </div>
      </header>

      {requests.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center p-20 bg-slate-50 dark:bg-slate-900/20 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
           <Shield className="text-slate-300 dark:text-slate-700 mb-4" size={48} />
           <p className="text-slate-400 dark:text-slate-500 font-black uppercase text-[10px] tracking-widest">No Security Escalations Found</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {requests.map((req, idx) => (
              <motion.div 
                key={req._id}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: -20 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-xl dark:shadow-none flex flex-col hover:border-blue-500/50 transition-all group"
              >
                 <div className="flex justify-between items-start mb-6">
                    <div className="p-4 bg-blue-500/10 text-blue-500 rounded-2xl group-hover:scale-110 transition-transform">
                       <User size={24} />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{new Date(req.createdAt).toLocaleDateString()}</span>
                 </div>

                 <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">{req.teacher?.name}</h3>
                 <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-6 italic">{req.teacher?.department}</p>

                 <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 mb-6 space-y-3">
                    <div className="flex items-center gap-3">
                       <Book size={14} className="text-slate-400" />
                       <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight">{req.course?.name} ({req.course?.code})</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <ChevronRight size={14} className="text-slate-400" />
                       <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight">Semester {req.course?.semester}</span>
                    </div>
                 </div>

                 <p className="text-slate-500 dark:text-slate-400 text-xs italic leading-relaxed mb-8 flex-grow">
                    "{req.message}"
                 </p>

                 <div className="flex gap-3">
                    <button 
                      onClick={() => handleResolve(req._id, 'approved')} 
                      className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Check size={14} strokeWidth={3} /> Approve
                    </button>
                    <button 
                      onClick={() => handleResolve(req._id, 'rejected')} 
                      className="flex-1 py-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-rose-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                    >
                      <X size={14} strokeWidth={3} /> Deny
                    </button>
                 </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default AdminAccessRequests;
