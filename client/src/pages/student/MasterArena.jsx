import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { Trophy, Award, TrendingUp, Sparkles, ShieldCheck, Target, ClipboardList } from 'lucide-react';
import { useGamification } from '../../hooks/useGamification';
import Leaderboard from '../../components/student/Leaderboard';
import PrizeProgress from '../../components/student/PrizeProgress';
import MonthlyHonors from '../../components/student/MonthlyHonors';
import QuizHall from '../../components/student/QuizHall';
import OrderHistory from '../../components/student/OrderHistory';
import CoinIcon from '../../components/CoinIcon';
import { ShoppingBag } from 'lucide-react';

const MasterArena = () => {
    const { user } = useSelector((state) => state.auth);
    const { gamification } = useGamification(user?._id);
    const [activeTab, setActiveTab] = useState('quizzes');

    const earnedBadgesCount = (gamification?.badges || []).length;
    const totalPossibleBadges = 20; // Institutional standard
    const milestoneProgress = (earnedBadgesCount / totalPossibleBadges) * 100;

    const tabs = [
        { id: 'quizzes', name: 'Quiz Arena', icon: <ClipboardList size={18} />, component: <QuizHall /> },
        { id: 'leaderboard', name: 'Global Standings', icon: <TrendingUp size={18} />, component: <Leaderboard /> },
        { id: 'monthly', name: 'Monthly Honors', icon: <Sparkles size={18} />, component: <MonthlyHonors /> },
        { id: 'rewards', name: 'Prize Catalog', icon: <Award size={18} />, component: <PrizeProgress /> },
        { id: 'orders', name: 'Purchase History', icon: <ShoppingBag size={18} />, component: <OrderHistory /> }
    ];

    return (
        <div className="min-h-screen bg-transparent p-4 lg:p-10">
            {/* Header */}
            <header className="max-w-7xl mx-auto mb-12">
                <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
                                <Trophy size={24} />
                            </div>
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] bg-indigo-50 dark:bg-indigo-950/20 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-900/20">
                                Honor Tier: {gamification?.xp >= 1000 ? 'Elite' : gamification?.xp >= 500 ? 'Advanced' : 'Alpha'}
                            </span>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                            The Master <span className="text-indigo-600">Arena</span>
                        </h1>
                        <div className="flex items-center gap-6 mt-2">
                             <p className="text-sm font-bold text-slate-500 dark:text-gray-400 max-w-xl">
                                The centralized ecosystem for cognitive assessments and institutional recognition.
                             </p>
                             <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-2xl flex items-center gap-3">
                                <CoinIcon size={24} />
                                <div className="leading-none">
                                   <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest">Scholar Balance</p>
                                   <p className="text-xl font-black text-amber-500 italic tabular-nums">{user?.coins || 0}</p>
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex p-1.5 bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-x-auto no-scrollbar">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                    activeTab === tab.id 
                                    ? 'bg-[#2c4c91] text-white shadow-xl shadow-[#2c4c91]/20 scale-105' 
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-white dark:hover:bg-white/5'
                                }`}
                            >
                                {tab.icon}
                                {tab.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Achievement Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                    <div className="p-8 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] text-white relative overflow-hidden group shadow-xl shadow-indigo-600/20">
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-100 mb-2">Weekly Activity</p>
                            <h3 className="text-3xl font-black italic tracking-tighter leading-none">
                                {gamification?.streakDays >= 3 ? 'Cognitive Surge' : 'Baseline Momentum'}
                            </h3>
                            <p className="text-[10px] font-bold mt-6 text-indigo-100/80 uppercase tracking-widest leading-relaxed max-w-[200px]">
                                {gamification?.streakDays >= 3 
                                    ? 'Elite scholar status active. Protocol optimized.' 
                                    : 'Increase your daily streak to trigger a Cognitive Surge pulse.'}
                            </p>
                        </div>
                        <Sparkles className="absolute -top-4 -right-4 text-white/10 group-hover:scale-125 group-hover:rotate-12 transition-all duration-700" size={120} />
                    </div>
                    
                    <div className="p-8 bg-white dark:bg-[#0b0f1a] rounded-[2.5rem] border border-slate-200 dark:border-white/5 flex items-center justify-between group shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-2">Milestones</p>
                            <div className="flex items-end gap-2">
                                <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic leading-none">{earnedBadgesCount}</h3>
                                <span className="text-sm font-black text-slate-300 dark:text-gray-700 uppercase italic">/ {totalPossibleBadges}</span>
                            </div>
                            <div className="w-32 h-2 bg-slate-100 dark:bg-white/5 rounded-full mt-6 overflow-hidden border border-slate-200/50 dark:border-white/5">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${milestoneProgress}%` }}
                                    className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                                />
                            </div>
                        </div>
                        <Target className="text-emerald-500 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" size={56} />
                    </div>

                    <div className="p-8 bg-white dark:bg-[#0b0f1a] rounded-[2.5rem] border border-slate-200 dark:border-white/5 flex items-center justify-between group shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-2">Reputation</p>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic leading-none">
                                {gamification?.xp >= 1000 ? 'Exemplary' : gamification?.xp >= 500 ? 'Proven' : 'Established'}
                            </h3>
                            <div className="flex items-center gap-2 mt-6">
                                <div className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-md border border-indigo-100 dark:border-indigo-500/20">
                                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase">{gamification?.xp || 0} XP</span>
                                </div>
                                <span className="text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">Cumulative</span>
                            </div>
                        </div>
                        <ShieldCheck className="text-indigo-500 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" size={56} />
                    </div>

                    <div className="p-8 bg-amber-500/5 rounded-[2.5rem] border border-amber-500/20 flex items-center justify-between group shadow-sm hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-500">
                        <div>
                            <p className="text-[10px] font-black text-amber-600/60 uppercase tracking-widest mb-2">Scholar Currency</p>
                            <h3 className="text-3xl font-black text-amber-500 tracking-tighter italic leading-none tabular-nums">
                                {user?.coins || 0}
                            </h3>
                            <p className="text-[9px] font-black text-amber-600/40 uppercase tracking-widest mt-6 italic">Convert to Prizes</p>
                        </div>
                        <CoinIcon size={56} className="opacity-40 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-7xl mx-auto">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {tabs.find(t => t.id === activeTab)?.component}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default MasterArena;
