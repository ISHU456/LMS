import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Lock as LockIcon, CheckCircle, ArrowRight, Zap, Trophy, Star, Sparkles, Clock, Snowflake, Heart, Flower2, CloudRain, Sun, Waves, Flame, Leaf, Moon, Wind, Shield } from 'lucide-react';
import CoinIcon from '../CoinIcon';

import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile } from '../../features/auth/authSlice'; 
import { ShoppingBag } from 'lucide-react';

const PrizeProgress = ({ isCompact = false }) => {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const [data, setData] = useState({ prizes: [], myPrizes: [] });
  const [monthlyBadges, setMonthlyBadges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPrizes();
    fetchMonthlyBadges();
  }, []);

  const fetchPrizes = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get('http://localhost:5001/api/gamification/prizes', config);
      setData(res.data);
    } catch (err) {
      console.error("Prizes fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMonthlyBadges = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get('http://localhost:5001/api/gamification/monthly-streak-badges', config);
      setMonthlyBadges(res.data);
    } catch (err) {
      console.error("Monthly badges fetch error:", err);
    }
  };

  const handleClaim = async (studentPrizeId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post('http://localhost:5001/api/gamification/prizes/claim', { studentPrizeId }, config);
      fetchPrizes();
      alert("Prize Claimed! Check your email or inventory.");
    } catch (err) {
      alert("Claim failed: " + err.message);
    }
  };

  const handleBuy = async (prizeId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.post('http://localhost:5001/api/gamification/prizes/buy', { prizeId }, config);
      fetchPrizes();
      
      // Real-time synchronization: Update global user state (coins)
      if (res.data.coinsRemaining !== undefined) {
        dispatch(updateProfile({ coins: res.data.coinsRemaining }));
      }
      
      alert(res.data.message || "Purchase Successful! Asset integrated.");    } catch (err) {
      alert("Transaction Failed: " + (err.response?.data?.message || err.message));
    }
  };

  const getMonthConfig = (index) => {
    const configs = [
      { icon: 'Snowflake', color: 'from-blue-400 to-indigo-600', textColor: 'text-blue-400' }, // Jan
      { icon: 'Heart', color: 'from-rose-400 to-pink-600', textColor: 'text-rose-400' },   // Feb
      { icon: 'Flower2', color: 'from-emerald-400 to-teal-600', textColor: 'text-emerald-400' }, // Mar
      { icon: 'CloudRain', color: 'from-cyan-400 to-blue-600', textColor: 'text-cyan-400' }, // Apr
      { icon: 'Sun', color: 'from-amber-400 to-orange-600', textColor: 'text-amber-400' },   // May
      { icon: 'Waves', color: 'from-cyan-400 to-indigo-600', textColor: 'text-cyan-400' },   // Jun
      { icon: 'Flame', color: 'from-orange-500 to-red-600', textColor: 'text-orange-500' },  // Jul
      { icon: 'Zap', color: 'from-yellow-400 to-amber-600', textColor: 'text-yellow-400' },   // Aug
      { icon: 'Leaf', color: 'from-orange-400 to-brown-600', textColor: 'text-orange-400' },  // Sep
      { icon: 'Moon', color: 'from-indigo-400 to-purple-600', textColor: 'text-indigo-400' }, // Oct
      { icon: 'Wind', color: 'from-slate-400 to-blue-600', textColor: 'text-slate-400' },     // Nov
      { icon: 'Star', color: 'from-amber-300 to-yellow-500', textColor: 'text-amber-300' }   // Dec
    ];
    return configs[index];
  };

  const getMonthIcon = (name, size, isCompleted) => {
     const icons = { Snowflake, Heart, Flower2, CloudRain, Sun, Waves, Flame, Zap, Leaf, Moon, Wind, Star };
     const IconComp = icons[name] || Trophy;
     return (
        <div className="relative flex items-center justify-center">
            <Shield 
                size={size * 2} 
                className={`absolute transition-all duration-700 ${isCompleted ? 'opacity-100' : 'opacity-20'}`} 
                fill={isCompleted ? 'currentColor' : 'none'}
                strokeWidth={1}
            />
            <div className="relative z-10 scale-75">
                <IconComp size={size} />
            </div>
        </div>
     );
  };

  return (
    <div className={isCompact ? "space-y-6 text-slate-900 dark:text-white" : "p-4 lg:p-12 space-y-20 text-slate-900 dark:text-white"}>
      {/* Eternal Momentum Calendar */}
      {!isCompact && (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 dark:border-white/5 pb-8 gap-6">
                <div>
                   <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-4 italic font-black">
                      <Shield className="text-indigo-600" size={32} /> Eternal Momentum <span className="text-indigo-600">Calendar</span>
                   </h2>
                   <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-2 italic">Achieve 100% attendance perfection to unlock monthly legacy badges</p>
                </div>
                <div className="flex items-center gap-6">
                   <div className="flex items-center gap-2">
                       <Shield size={12} className="text-emerald-500 fill-current" />
                       <span className="text-[9px] font-black uppercase text-slate-400 dark:text-gray-400">Completed Cycle</span>
                   </div>
                   <div className="flex items-center gap-2">
                       <Shield size={12} className="text-slate-200 dark:text-white/10" />
                       <span className="text-[9px] font-black uppercase text-slate-400 dark:text-gray-400">Phase In-Progress</span>
                   </div>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
               {monthlyBadges.map((badge, idx) => {
                 const config = getMonthConfig(idx);
                 return (
                   <motion.div 
                     key={idx}
                     whileHover={{ y: -5, scale: 1.05 }}
                     className={`relative aspect-square rounded-[2rem] border transition-all duration-500 flex flex-col items-center justify-center p-4 overflow-hidden group ${
                       badge.isCompleted 
                       ? `bg-gradient-to-br ${config.color.replace('from-', 'from-').replace('to-', 'to-')}/10 border-indigo-500/20 shadow-xl shadow-indigo-500/5` 
                       : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 grayscale opacity-60 hover:opacity-100'
                     }`}
                   >
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 transition-transform duration-500 group-hover:rotate-6 ${
                         badge.isCompleted ? `${config.textColor}` : 'text-slate-300 dark:text-gray-600'
                      }`}>
                          {getMonthIcon(config.icon, 20, badge.isCompleted)}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-tight text-center leading-none mt-2">{badge.monthName}</span>
                      <p className={`text-[8px] font-black uppercase tracking-widest mt-2 ${badge.isCompleted ? 'text-emerald-500' : 'text-slate-400 dark:text-gray-500'}`}>
                          {badge.attendedCount}/{badge.totalDays} Days
                      </p>
                      
                      {badge.isCompleted && (
                         <Sparkles size={14} className="absolute top-4 right-4 text-amber-500 animate-pulse" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                   </motion.div>
                 );
               })}
            </div>
        </div>
      )}

      {!isCompact && (
        <div className="flex flex-col xl:flex-row items-center justify-between gap-12">
          <div>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-4">
              <Gift className="text-rose-500" size={36} /> Prize Catalog
            </h2>
            <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-2">Redeem your hard-earned coins for institutional assets</p>
          </div>
          
          <div className="w-full xl:w-auto bg-slate-100 dark:bg-yellow-500/10 border border-slate-200 dark:border-yellow-500/20 p-8 rounded-[3rem] flex items-center gap-8 shadow-xl shadow-slate-200/50 dark:shadow-none">
             <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30">
               <Trophy size={32} />
             </div>
             <div>
               <p className="text-[10px] font-black text-slate-400 dark:text-yellow-500 uppercase tracking-widest mb-1">Scholar Standing</p>
               <div className="flex items-center gap-4">
                  <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{user.coins.toLocaleString()}</h3>
                  <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-white/10 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                    <span className="text-[10px] font-black text-indigo-600 dark:text-white uppercase">SC</span>
                    <CoinIcon size={16} />
                  </div>
               </div>
             </div>
          </div>
        </div>
      )}

      <div className={isCompact ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"}>
        {data.prizes.map((prize, idx) => {
          const studentPrize = data.myPrizes.find(mp => mp.prize._id === prize._id);
          const isUnlocked = !!studentPrize;
          const isClaimed = studentPrize?.isClaimed;
          const progress = Math.min((user.coins / prize.requiredCoins) * 100, 100);

          return (
            <motion.div 
              key={prize._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={`relative rounded-[3rem] border transition-all duration-500 overflow-hidden ${
                isCompact ? 'p-6' : 'p-10'
              } ${
                isUnlocked 
                ? 'bg-white dark:bg-indigo-600/5 border-indigo-200 dark:border-indigo-500/30 shadow-xl shadow-slate-200/50 dark:shadow-none ring-1 ring-indigo-500/5' 
                : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 grayscale opacity-80'
              }`}
            >
              <div className="flex items-start justify-between mb-8">
                <div className={`rounded-2xl flex items-center justify-center text-white shadow-xl ${
                   isCompact ? 'w-10 h-10' : 'w-16 h-16 shadow-indigo-600/20'
                } ${
                  isUnlocked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-gray-700 text-slate-100'
                }`}>
                  {prize.type === 'badge' ? <Star size={isCompact ? 18 : 32} /> : prize.type === 'coupon' ? <Zap size={isCompact ? 18 : 32} /> : <Gift size={isCompact ? 18 : 32} />}
                </div>
                {isUnlocked ? (
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">Unlocked</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-100 dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/10">
                    <LockIcon className="text-slate-400 dark:text-gray-500" size={12} />
                    <span className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">{Math.max(0, prize.requiredCoins - user.coins)} Left</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h3 className={`${isCompact ? 'text-sm' : 'text-2xl'} font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none`}>
                    {prize.name}
                </h3>
                {!isCompact && (
                    <p className="text-xs font-bold text-slate-500 dark:text-gray-500 leading-relaxed line-clamp-2 uppercase italic tracking-tight opacity-70">
                        {prize.description}
                    </p>
                )}
              </div>

              <div className={isCompact ? "mt-6" : "mt-10 space-y-8"}>
                 {!isUnlocked && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Synthesis Progress</span>
                         <span className="text-[10px] font-black text-slate-900 dark:text-white">{Math.round(progress)}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden border border-slate-200/50 dark:border-white/5">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${progress}%` }}
                           className={`h-full ${isUnlocked ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-gray-600'}`}
                         />
                      </div>
                    </div>
                 )}

                  {isUnlocked ? (
                    <button 
                      disabled={isClaimed}
                      onClick={() => handleClaim(studentPrize._id)}
                      className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
                        isClaimed 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20 cursor-default'
                          : 'bg-emerald-600 text-white shadow-2xl shadow-emerald-600/30 hover:scale-[1.02] hover:bg-emerald-700 active:scale-95'
                      }`}
                    >
                      {isClaimed ? (
                        <> <CheckCircle size={14}/> Asset Claimed </>
                      ) : (
                        <> Claim Institutional Reward <ArrowRight size={14}/> </>
                      )}
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleBuy(prize._id)}
                      disabled={user.coins < prize.requiredCoins}
                      className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 ${
                        user.coins >= prize.requiredCoins
                        ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/20 hover:scale-[1.02] hover:bg-indigo-700'
                        : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-gray-500 border border-slate-200 dark:border-white/10 cursor-not-allowed'
                      }`}
                    >
                      <span className="font-mono">{prize.requiredCoins.toLocaleString()}</span>
                      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${user.coins >= prize.requiredCoins ? 'bg-white/10 border-white/20' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10'}`}>
                         <span className="text-[8px] font-black uppercase">SC</span>
                         <CoinIcon size={12} />
                      </div>
                      <span className="ml-2 uppercase tracking-widest">{user.coins >= prize.requiredCoins ? 'Buy Now' : 'Locked'}</span>
                    </button>
                  )}
              </div>
            </motion.div>
          );
        })}

        {data.prizes.length === 0 && !isLoading && (
          <div className="col-span-full py-32 bg-slate-50 dark:bg-white/5 rounded-[4rem] border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center text-center">
             <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center mb-8">
                <LockIcon className="text-slate-300 dark:text-gray-700" size={40} />
             </div>
             <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest">Rewards Vault Sealed</h3>
             <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-2">Institutional assets currently being synthesized</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrizeProgress;
