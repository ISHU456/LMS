import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, Info, AlertTriangle, ChevronRight, Zap } from 'lucide-react';
import axios from 'axios';
import { useSelector } from 'react-redux';

const InstitutionalAlert = () => {
  const { user } = useSelector(state => state.auth);
  const [alerts, setAlerts] = useState([]);
  const [activePopup, setActivePopup] = useState(null);

  useEffect(() => {
    if (!user?.token) return;
    const fetchAlerts = async () => {
      try {
        const { data } = await axios.get('http://localhost:5001/api/notifications', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        
        // Filter for unread or popup-active warnings/errors
        const unreadAlerts = data.filter(n => !n.read || n.popupActive);
        setAlerts(unreadAlerts);

        // Find first active popup
        const firstPopup = unreadAlerts.find(n => n.popupActive);
        if (firstPopup) setActivePopup(firstPopup);
      } catch (err) { console.error('Alert fetch failure'); }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // 30s refresh
    return () => clearInterval(interval);
  }, [user]);

  const dismissPopup = async (id) => {
    try {
      await axios.put(`http://localhost:5001/api/notifications/${id}/dismiss-popup`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setActivePopup(null);
      setAlerts(prev => prev.map(a => a._id === id ? { ...a, popupActive: false } : a));
    } catch (err) { console.error('Dismiss failed'); }
  };

  if (alerts.length === 0) return null;

  return (
    <>
      {/* Marquee Container */}
      <div className="w-full bg-rose-600/10 border-b border-rose-500/20 backdrop-blur-md overflow-hidden h-10 flex items-center shrink-0 z-40">
        <div className="flex items-center px-4 gap-3 bg-rose-600 h-full z-10 shadow-lg whitespace-nowrap">
          <AlertTriangle size={14} className="text-white animate-pulse" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest italic">Institutional Alert System</span>
        </div>
        
        <div className="relative flex-1 overflow-hidden h-full flex items-center">
          <div className="flex animate-marquee whitespace-nowrap py-2">
            {alerts.map((alert, idx) => (
              <span key={alert._id} className="text-[11px] font-black text-rose-500 uppercase tracking-widest px-10 flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                {alert.message}
                <span className="text-[9px] text-rose-400/60 font-black italic">[{new Date(alert.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}]</span>
              </span>
            ))}
            {/* Duplicate for seamless loop */}
            {alerts.map((alert, idx) => (
              <span key={alert._id + '_dup'} className="text-[11px] font-black text-rose-500 uppercase tracking-widest px-10 flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                {alert.message}
                <span className="text-[9px] text-rose-400/60 font-black italic">[{new Date(alert.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}]</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Popup */}
      <AnimatePresence>
        {activePopup && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[3rem] shadow-[0_0_100px_rgba(225,29,72,0.2)] overflow-hidden relative"
            >
              {/* Alert Header */}
              <div className="bg-gradient-to-r from-rose-600 to-rose-800 p-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <AlertCircle size={28} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none">Administrative Directive</h3>
                    <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                       <Zap size={10} /> Protocol Priority: Level 5
                    </p>
                  </div>
                </div>
                <button onClick={() => dismissPopup(activePopup._id)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all">
                  <X size={20} />
                </button>
              </div>

              {/* Msg Content */}
              <div className="p-10 space-y-8">
                <div className="space-y-4">
                  <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] flex items-center gap-2">
                    <span className="w-4 h-[1px] bg-rose-500" /> Secure Transmission
                  </span>
                  <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
                    <p className="text-lg font-black text-white italic leading-relaxed tracking-tight">
                      "{activePopup.message}"
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => {
                      if (activePopup.link) window.location.href = activePopup.link;
                      dismissPopup(activePopup._id);
                    }}
                    className="w-full py-5 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all hover:bg-rose-50 flex items-center justify-center gap-3"
                  >
                    Acknowledge & Access Protocol <ChevronRight size={14} />
                  </button>
                  <button 
                    onClick={() => dismissPopup(activePopup._id)}
                    className="w-full py-5 bg-slate-800 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-slate-700"
                  >
                    Dismiss Directive
                  </button>
                </div>
                
                <p className="text-center text-[8px] font-black text-slate-600 uppercase tracking-widest tabular-nums">
                  Directive Issued: {new Date(activePopup.createdAt).toLocaleString()} Node ID: {activePopup._id.slice(-8)}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </>
  );
};

export default InstitutionalAlert;
