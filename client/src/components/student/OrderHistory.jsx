import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Clock, CheckCircle, XCircle, Package, Award, Gift, Search, Filter } from 'lucide-react';
import CoinIcon from '../CoinIcon';
import axios from 'axios';
import { useSelector } from 'react-redux';

const OrderHistory = () => {
    const { user } = useSelector(state => state.auth);
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchMyOrders();
    }, []);

    const fetchMyOrders = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            // Using the existing prizes endpoint which returns { prizes, myPrizes }
            const res = await axios.get('http://localhost:5001/api/gamification/prizes', config);
            // Sort by unlockedAt (purchase date) descending
            const sortedOrders = (res.data.myPrizes || []).sort((a, b) => 
                new Date(b.unlockedAt || b.createdAt) - new Date(a.unlockedAt || a.createdAt)
            );
            setOrders(sortedOrders);
        } catch (err) {
            console.error("Orders fetch error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusStyles = (status) => {
        switch (status?.toLowerCase()) {
            case 'delivered': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
            case 'rejected': return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
            case 'processing': return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
            case 'accepted': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
            default: return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
        }
    };

    const filteredOrders = filter === 'all' 
        ? orders 
        : orders.filter(o => (o.status || 'pending').toLowerCase() === filter);

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 dark:border-white/5 pb-8 gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-4 italic">
                        <ShoppingBag className="text-[#2c4c91]" size={32} /> My Purchase <span className="text-[#2c4c91]">History</span>
                    </h2>
                    <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-2 italic">Tracking your institutional asset acquisition and fulfillment status</p>
                </div>
                
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10">
                    {['all', 'pending', 'processing', 'delivered'].map(f => (
                        <button 
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-white dark:bg-indigo-600 text-[#2c4c91] dark:text-white shadow-sm' : 'text-slate-400 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <AnimatePresence mode="popLayout">
                    {filteredOrders.map((order, idx) => (
                        <motion.div
                            key={order._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white dark:bg-[#0b0f1a]/50 backdrop-blur-xl border border-slate-200 dark:border-white/5 p-6 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 group hover:border-indigo-500/30 transition-all shadow-sm hover:shadow-xl hover:shadow-indigo-500/5"
                        >
                            <div className="w-20 h-20 rounded-[1.8rem] bg-indigo-600/10 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500">
                                {order.prize?.type === 'badge' ? <Award size={32} /> : <Gift size={32} />}
                            </div>

                            <div className="flex-1 text-center md:text-left">
                                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1 italic">
                                    OrderID: {order._id.slice(-8).toUpperCase()}
                                </p>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">
                                    {order.prize?.name || order.monthlyPrize?.rewardName}
                                </h3>
                                <div className="flex items-center justify-center md:justify-start gap-4 mt-3">
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
                                        <span className="text-[10px] font-mono text-slate-900 dark:text-white font-black">{order.prize?.requiredCoins || order.monthlyPrize?.requiredCoins}</span>
                                        <CoinIcon size={12} />
                                    </div>
                                    <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Clock size={12} />
                                        <span className="text-[9px] font-black uppercase tracking-widest">
                                            {new Date(order.unlockedAt || order.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center md:items-end gap-3 px-8">
                                <div className={`px-5 py-2 rounded-xl border text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${getStatusStyles(order.status || 'pending')}`}>
                                    {(order.status || 'pending').toLowerCase() === 'delivered' ? <CheckCircle size={14} /> : (order.status || 'pending').toLowerCase() === 'rejected' ? <XCircle size={14} /> : <Package size={14} />}
                                    {order.status || 'Pending'}
                                </div>
                                <p className="text-[8px] font-black text-slate-400 dark:text-gray-600 uppercase tracking-widest italic">
                                    {order.status === 'delivered' ? 'Collection Complete' : 'Awaiting Fulfillment'}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredOrders.length === 0 && !isLoading && (
                    <div className="py-32 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-white/5 rounded-[4rem] border-2 border-dashed border-slate-200 dark:border-white/10">
                        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center mb-8">
                            <ShoppingBag className="text-slate-300 dark:text-gray-700" size={40} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest italic">No Assets Acquired</h3>
                        <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-2 max-w-xs leading-relaxed italic">Your transaction history is currently null. Redeem your Scholar Coins in the Prize Catalog to initialize your inventory.</p>
                    </div>
                )}

                {isLoading && (
                    <div className="py-20 flex justify-center">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                            <ShoppingBag size={40} className="text-indigo-600 opacity-20" />
                        </motion.div>
                    </div>
                )}
            </div>

            {/* Accepted & Delivered Assets Section */}
            {orders.filter(o => ['accepted', 'delivered'].includes((o.status || '').toLowerCase())).length > 0 && (
                <div className="pt-12 mt-12 border-t border-slate-100 dark:border-white/5 space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-emerald-600 uppercase tracking-tighter italic flex items-center gap-3">
                                <CheckCircle size={24} /> Verified <span className="text-slate-900 dark:text-white">Inventory</span>
                            </h3>
                            <p className="text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1 italic">Assets successfully integrated into your scholarly identity</p>
                        </div>
                        <span className="px-4 py-1.5 bg-emerald-500/10 rounded-full text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                            {orders.filter(o => ['accepted', 'delivered'].includes((o.status || '').toLowerCase())).length} Certified
                        </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {orders.filter(o => ['accepted', 'delivered'].includes((o.status || '').toLowerCase())).map((order, idx) => (
                            <motion.div 
                                key={order._id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-6 rounded-[2rem] flex flex-col items-center justify-center text-center relative group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    {order.prize?.type === 'badge' ? <Award size={24} /> : <Gift size={24} />}
                                </div>
                                <p className="text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-tight line-clamp-1">{order.prize?.name || order.monthlyPrize?.rewardName}</p>
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-[#080c14]">
                                    <CheckCircle size={12} fill="currentColor" className="text-emerald-500" />
                                    <CheckCircle size={10} className="text-white absolute" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderHistory;
