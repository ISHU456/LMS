import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Zap, Clock, TrendingUp, Info, ShieldCheck, Award } from 'lucide-react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import CoinIcon from '../CoinIcon';

const MonthlyHonors = () => {
    const { user } = useSelector(state => state.auth);
    const [prizes, setPrizes] = useState([]);
    const [myPrizes, setMyPrizes] = useState([]);
    const [myRank, setMyRank] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchMonthlyData();
    }, []);

    const fetchMonthlyData = async () => {
        try {
            const now = new Date();
            const month = now.getMonth();
            const year = now.getFullYear();
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            
            const [prizesRes, leaderboardRes, myPrizesRes] = await Promise.all([
                axios.get(`http://localhost:5001/api/gamification/monthly-prizes?month=${month}&year=${year}`, config),
                axios.get(`http://localhost:5001/api/gamification/leaderboard?type=monthly`, config),
                axios.get(`http://localhost:5001/api/gamification/prizes`, config)
            ]);

            setPrizes(prizesRes.data);
            setMyPrizes(myPrizesRes.data.myPrizes);
            
            const rank = leaderboardRes.data.findIndex(entry => entry._id === user._id);
            if (rank !== -1) {
                setMyRank({
                    position: rank + 1,
                    coins: leaderboardRes.data[rank].coins
                });
            } else {
                setMyRank({ position: 'N/A', coins: 0 });
            }
        } catch (err) {
            console.error("Monthly Honors fetch error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBuy = async (monthlyPrizeId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post('http://localhost:5001/api/gamification/prizes/buy', { monthlyPrizeId }, config);
            fetchMonthlyData();
            alert("Purchase Successful! Asset Secured.");
            window.location.reload(); 
        } catch (err) {
            alert("Transaction Failed: " + (err.response?.data?.message || err.message));
        }
    };

    const getMonthName = () => {
        return new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date());
    };

    const getRankTheme = (rank) => {
        switch (rank) {
            case 1: return { color: 'amber', from: 'from-amber-400', via: 'via-yellow-500', to: 'to-amber-600', shadow: 'shadow-amber-500/20' };
            case 2: return { color: 'slate', from: 'from-slate-300', via: 'via-slate-400', to: 'to-slate-600', shadow: 'shadow-slate-400/20' };
            case 3: return { color: 'orange', from: 'from-orange-400', via: 'via-orange-500', to: 'to-orange-700', shadow: 'shadow-orange-600/20' };
            default: return { color: 'indigo', from: 'from-indigo-400', via: 'via-indigo-500', to: 'to-indigo-700', shadow: 'shadow-indigo-500/20' };
        }
    };

    if (isLoading) return (
        <div className="p-12 flex flex-col items-center justify-center opacity-50">
            <Clock size={48} className="text-indigo-500 animate-spin mb-6" />
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white">Synchronizing Monthly Registry...</p>
        </div>
    );

    return (
        <div className="space-y-12 pb-20">
            {/* Monthly Status Header */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 rounded-[3.5rem] p-12 border border-white/5 relative overflow-hidden group shadow-2xl shadow-indigo-900/40">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <Clock size={16} className="text-indigo-400 animate-pulse" />
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{getMonthName()} Season Active</span>
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-black text-white uppercase tracking-tighter italic mb-6 leading-[0.9]">Monthly <span className="text-indigo-500">Achievement</span> Hub</h2>
                        <p className="text-[10px] font-black text-indigo-100/60 max-w-sm mb-12 leading-relaxed uppercase tracking-widest opacity-80">
                            Track your real-time standing and coin yield for the current institutional cycle. All rankings and honor eligibility reset on the 1st of every month.
                        </p>
                        
                        <div className="flex items-center gap-12 pt-10 border-t border-white/10">
                            <div>
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Monthly Rank</p>
                                <p className="text-4xl font-black text-white italic tracking-tighter">#{myRank?.position}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Cycle Yield</p>
                                <div className="flex items-center gap-3">
                                    <p className="text-4xl font-black text-white italic tracking-tighter">{myRank?.coins?.toLocaleString()}</p>
                                    <div className="px-2 py-1 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                                        <CoinIcon size={20} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Trophy className="absolute -bottom-12 -right-12 text-white/5 group-hover:rotate-12 transition-all duration-1000 group-hover:scale-110" size={320} />
                </div>

                <div className="bg-white dark:bg-[#0b0f1a] rounded-[3.5rem] border border-slate-200 dark:border-white/5 p-12 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-500">
                    <div className="flex items-center gap-6 mb-10">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-600/30">
                            <ShieldCheck size={28} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none mb-1">Engagement Protocols</h3>
                            <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">Institutional Yield Standards</p>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        {[
                            { 
                                title: '7-Day Continuous Streak', 
                                icon: <Zap size={18} className="text-emerald-500" />, 
                                desc: 'Maintain an uninterrupted 7-day engagement cycle for a coin injection.',
                                color: 'emerald',
                                yield: '+20'
                            },
                            { 
                                title: 'Monthly Goal Completion', 
                                icon: <Award size={18} className="text-amber-500" />, 
                                desc: 'Perfect monthly activity yields a terminal reward and Honor Badge.',
                                color: 'amber',
                                yield: '+50'
                            },
                            { 
                                title: 'Quiz Arena Achievement', 
                                icon: <Trophy size={18} className="text-indigo-500" />, 
                                desc: 'Each institutional assessment triggers a scholarship reward.',
                                color: 'indigo',
                                yield: '+100'
                            },
                            { 
                                title: 'XP Threshold Dividend', 
                                icon: <Star size={18} className="text-pink-500" />, 
                                desc: 'Accumulate every 100 XP increment to claim a recurring dividend.',
                                color: 'pink',
                                yield: '+50'
                            }
                        ].map((rule, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group flex items-center gap-6 p-4 bg-slate-50 dark:bg-white/5 rounded-[2rem] border border-slate-200 dark:border-white/10 hover:border-indigo-500/30 transition-all duration-300"
                            >
                                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white dark:bg-white/10 flex items-center justify-center text-xs font-black text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-white/10 shadow-sm group-hover:scale-110 transition-transform">
                                    {idx + 1}
                                </div>
                                <div className="flex-grow">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        {rule.icon}
                                        <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{rule.title}</h4>
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-tighter leading-tight opacity-70">
                                        {rule.desc}
                                    </p>
                                </div>
                                <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/10`}>
                                    <span className="text-[10px] font-black uppercase tracking-tighter">{rule.yield}</span>
                                    <CoinIcon size={12} />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Monthly Prize Ladder */}
            <div className="space-y-10">
                <div className="flex items-center gap-6">
                   <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] italic">Monthly Honor Registry</h2>
                   <div className="h-[2px] flex-1 bg-slate-100 dark:bg-white/5 rounded-full" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {prizes.length > 0 ? prizes.map((prize, idx) => {
                        const isEligible = myRank?.position !== 'N/A' && myRank?.position <= prize.rank;
                        const isOwned = myPrizes.some(mp => mp.monthlyPrize?._id === prize._id);
                        const canAfford = user.coins >= prize.requiredCoins;
                        const theme = getRankTheme(prize.rank);
                        return (
                            <motion.div 
                                key={prize._id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`group relative p-8 rounded-[3rem] border transition-all duration-500 overflow-hidden ${
                                    isEligible 
                                    ? `bg-${theme.color}-50 dark:bg-${theme.color}-500/5 border-${theme.color}-200 dark:border-${theme.color}-500/30 shadow-xl ${theme.shadow}` 
                                    : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-indigo-500/30'
                                }`}
                            >
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${theme.from} ${theme.to} opacity-[0.03] rounded-bl-[4rem] group-hover:scale-110 transition-transform`} />
                                
                                <div className="space-y-6">
                                    <div className="flex flex-col items-center text-center gap-1 mb-4">
                                        <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${isEligible ? `text-${theme.color}-600` : 'text-slate-400'}`}>Target: Rank #{prize.rank}</p>
                                        <div className={`h-1 w-8 rounded-full bg-gradient-to-r ${theme.from} ${theme.to} opacity-40`} />
                                    </div>

                                    <div className={`relative w-full aspect-square overflow-hidden rounded-[2.5rem] border-2 transition-all duration-700 ${
                                        isEligible ? `border-${theme.color}-400/50 shadow-2xl` : 'border-slate-100 dark:border-white/5'
                                    }`}>
                                        <img src={prize.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={prize.rewardName} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>

                                    <div className="text-center space-y-4">
                                        <div className="flex flex-col items-center">
                                            <p className={`text-2xl font-black italic tracking-tighter ${isEligible ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-gray-500'}`}>{prize.rewardName}</p>
                                            <div className="flex items-center gap-3 mt-3">
                                                 <p className={`text-3xl font-black tabular-nums transition-colors ${isEligible ? `text-${theme.color}-500` : 'text-slate-400'}`}>{prize.requiredCoins?.toLocaleString()}</p>
                                                 <div className={`p-2 rounded-xl border ${isEligible ? `bg-${theme.color}-500/10 border-${theme.color}-500/20` : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10'}`}>
                                                     <CoinIcon size={20} className={isEligible ? `text-${theme.color}-500` : 'text-slate-400'} />
                                                 </div>
                                            </div>
                                        </div>

                                         <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5">
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs border transition-all ${
                                                isOwned ? `bg-${theme.color}-500 text-white border-transparent rotate-12` : 'bg-white dark:bg-gray-800 text-slate-300 border-slate-200 dark:border-white/10'
                                            }`}>S</div>
                                            <button 
                                                onClick={() => !isOwned && canAfford && handleBuy(prize._id)}
                                                disabled={isOwned || !canAfford}
                                                className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                    isOwned ? `bg-emerald-500 text-white shadow-lg` : 
                                                    canAfford ? `bg-${theme.color}-500 text-white shadow-lg hover:scale-105 active:scale-95` :
                                                    'bg-slate-50 dark:bg-white/10 text-slate-400 dark:text-gray-500 cursor-not-allowed'
                                                }`}
                                            >
                                                {isOwned ? 'Owned' : canAfford ? 'Buy Now' : 'Locked'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    }) : (
                        <div className="col-span-full py-32 bg-slate-50 dark:bg-white/5 rounded-[4rem] border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-center">
                            <Star className="text-slate-300 dark:text-gray-700 mb-8 opacity-40 animate-pulse" size={64} />
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest">Honors Pending</h3>
                            <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-2">Institutional registry currently being synthesized for this cycle</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MonthlyHonors;
