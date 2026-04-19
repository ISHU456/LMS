import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Award, TrendingUp, Sparkles, ShieldCheck, Target } from 'lucide-react';
import Leaderboard from '../../components/student/Leaderboard';
import PrizeProgress from '../../components/student/PrizeProgress';
import MonthlyHonors from '../../components/student/MonthlyHonors';

const ScholarArena = () => {
    const [activeTab, setActiveTab] = useState('leaderboard');

    const tabs = [
        { id: 'leaderboard', name: 'Global Standings', icon: <TrendingUp size={18} />, component: <Leaderboard /> },
        { id: 'monthly', name: 'Monthly Honors', icon: <Sparkles size={18} />, component: <MonthlyHonors /> },
        { id: 'rewards', name: 'Scholar Rewards', icon: <Award size={18} />, component: <PrizeProgress /> }
    ];

    return (
        <div className="min-h-screen bg-transparent p-4 lg:p-10">
            {/* Header */}
            <header className="max-w-7xl mx-auto mb-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                                <Trophy size={24} />
                            </div>
                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.4em] bg-amber-50 px-3 py-1 rounded-full border border-amber-100">Honor Tier: Alpha</span>
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                            The Honor <span className="text-indigo-600">Arena</span>
                        </h1>
                        <p className="text-sm font-bold text-slate-500 dark:text-gray-400 mt-2 max-w-xl">
                            The centralized hub for institutional recognition. Compete with peers, track your cognitive milestones, and redeem your Scholar Coins for exclusive prizes.
                        </p>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex p-1.5 bg-white/50 dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
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
                    <div className="p-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] text-white relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Weekly Activity</p>
                            <h3 className="text-2xl font-black italic">Cognitive Surge</h3>
                            <p className="text-xs font-bold mt-4 opacity-90">You are in the top 5% of active scholars this week. Keep the momentum!</p>
                        </div>
                        <Sparkles className="absolute top-4 right-4 text-white/20 group-hover:scale-125 transition-transform" size={48} />
                    </div>
                    
                    <div className="p-6 bg-white dark:bg-[#0b0f1a] rounded-[2rem] border border-slate-200 dark:border-white/5 flex items-center justify-between group">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Milestones</p>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white italic">12 / 20</h3>
                            <div className="w-32 h-1.5 bg-slate-100 dark:bg-white/5 rounded-full mt-4 overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[60%]" />
                            </div>
                        </div>
                        <Target className="text-emerald-500 opacity-20 group-hover:opacity-100 transition-opacity" size={48} />
                    </div>

                    <div className="p-6 bg-white dark:bg-[#0b0f1a] rounded-[2rem] border border-slate-200 dark:border-white/5 flex items-center justify-between group">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reputation</p>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white italic">Exemplary</h3>
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter mt-4">Zero Protocol Violations</p>
                        </div>
                        <ShieldCheck className="text-indigo-500 opacity-20 group-hover:opacity-100 transition-opacity" size={48} />
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

export default ScholarArena;
