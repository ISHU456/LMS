import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { updateProfile } from '../features/auth/authSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Trophy, X, ShieldCheck } from 'lucide-react';

const ActivityTracker = () => {
    const { user } = useSelector(state => state.auth);
    const dispatch = useDispatch();
    
    // Persist session active time to handle refreshes
    const [secondsActive, setSecondsActive] = useState(() => {
        const saved = sessionStorage.getItem(`lms_active_sec_${user?._id}`);
        return saved ? parseInt(saved, 10) : 0;
    });
    
    const [hasRecordedToday, setHasRecordedToday] = useState(() => {
        if (!user?.lastStreakedAt) return false;
        const today = new Date().setHours(0,0,0,0);
        const last = new Date(user.lastStreakedAt).setHours(0,0,0,0);
        return last === today;
    });

    const [showPopup, setShowPopup] = useState(null);

    useEffect(() => {
        if (!user?.lastStreakedAt) {
            setHasRecordedToday(false);
            return;
        }
        const today = new Date().setHours(0,0,0,0);
        const last = new Date(user.lastStreakedAt).setHours(0,0,0,0);
        setHasRecordedToday(last === today);
    }, [user?.lastStreakedAt]);

    useEffect(() => {
        if (!user || user.role !== 'student' || hasRecordedToday) return;

        const interval = setInterval(() => {
            setSecondsActive(prev => {
                const next = prev + 1;
                sessionStorage.setItem(`lms_active_sec_${user._id}`, next);
                
                // Broadcast for real-time UI sync
                window.dispatchEvent(new CustomEvent('smartlms:active_seconds_update', { 
                    detail: { userId: user._id, seconds: next } 
                }));

                // 10 minutes threshold = 600 seconds
                if (next === 600) {
                    handlePulse();
                }
                return next;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [user, hasRecordedToday]);

    const handlePulse = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const res = await axios.post('http://localhost:5001/api/gamification/record-activity', {}, config);
            
            // Always sync profile to ensure UI matches server state
            dispatch(updateProfile({ 
                coins: res.data.totalCoins, 
                streak: res.data.streak,
                lastStreakedAt: new Date().toISOString() // Optimistic update
            }));
            
            setHasRecordedToday(true);

            if (res.data.coinsAwarded > 0) {
                setShowPopup(res.data);
            }
        } catch (err) {
            console.error("Neural pulse failure:", err);
        }
    };

    if (showPopup) {
        return (
            <AnimatePresence>
                <motion.div 
                    initial={{ opacity: 0, y: 100, scale: 0.9, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, scale: 1, x: '0%' }}
                    exit={{ opacity: 0, scale: 0.9, y: 50 }}
                    className="fixed bottom-10 left-10 z-[10000] max-w-sm w-full"
                >
                    <div className="bg-gradient-to-br from-[#2c4c91] to-indigo-900 rounded-[3rem] p-8 border border-white/20 shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                                    <Trophy size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">Daily Pulse Synced</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest">10m Active Threshold Reached</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between bg-white/10 rounded-2xl p-5 border border-white/5 backdrop-blur-md">
                                <div className="flex items-center gap-3">
                                    <div className="text-4xl font-black text-white">+{showPopup.coinsAwarded}</div>
                                    <Zap size={20} className="text-amber-400 fill-current" />
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase text-indigo-300 tracking-widest">Daily Streak</p>
                                    <p className="text-2xl font-black text-white italic">{showPopup.streak} Days</p>
                                </div>
                            </div>

                            <button 
                                onClick={() => setShowPopup(null)}
                                className="w-full mt-6 py-4 bg-white text-[#2c4c91] rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2 group"
                            >
                                <ShieldCheck size={14} className="group-hover:scale-110 transition-transform" />
                                Stabilize Momentum
                            </button>
                        </div>
                        
                        <Zap size={180} className="absolute bottom-[-15%] right-[-10%] text-white/5 pointer-events-none" />
                    </div>
                </motion.div>
            </AnimatePresence>
        );
    }

    // Floating Progress Bar for Streak
    if (!user || user.role !== 'student' || hasRecordedToday || secondsActive >= 600) return null;

    const progress = (secondsActive / 600) * 100;
    const minutesLeft = Math.ceil((600 - secondsActive) / 60) ;

    return (
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="fixed bottom-10 left-10 z-[5000] flex items-center gap-4 bg-white/10 dark:bg-black/40 backdrop-blur-xl p-3 pl-5 rounded-2xl border border-white/10 shadow-2xl"
        >
            <div className="text-right mr-2">
                <p className="text-[8px] font-black uppercase text-gray-500 tracking-widest leading-none">Momentum Build</p>
                <p className="text-xs font-black text-primary-600 dark:text-primary-400 italic">{minutesLeft}m Left</p>
            </div>
            
            <div className="relative w-32 h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-gradient-to-r from-primary-600 to-indigo-600"
                />
            </div>

            <div className="w-8 h-8 rounded-xl bg-primary-600/10 text-primary-600 flex items-center justify-center">
                <Zap size={14} className={progress > 0 ? "animate-pulse" : ""} />
            </div>
        </motion.div>
    );
};

export default ActivityTracker;
