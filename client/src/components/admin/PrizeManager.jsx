import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Plus, Trash2, Edit, Save, X, Star, Zap, Award, CheckCircle, Trophy, Camera, Image as ImageIcon, ChevronRight, ChevronLeft, Loader2, Database, Search, User } from 'lucide-react';
import CoinIcon from '../CoinIcon';
import axios from 'axios';
import { useSelector } from 'react-redux';

const PrizeManager = ({ isCompact = false }) => {
  const { user } = useSelector(state => state.auth);
  const [activeView, setActiveView] = useState('orders'); // 'orders', 'monthly', 'currency', 'registry'
  const [prizes, setPrizes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [monthlyPrizes, setMonthlyPrizes] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditingMonthly, setIsEditingMonthly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Currency Adjustment States
  const [studentSearch, setStudentSearch] = useState('');
  const [foundStudents, setFoundStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newBalance, setNewBalance] = useState(0);
  const [newCredits, setNewCredits] = useState(0);
  const [isUpdatingBalance, setIsUpdatingBalance] = useState(false);

  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    requiredCoins: 1000,
    type: 'badge',
    couponCode: '',
    imageUrl: ''
  });

  const [monthlyData, setMonthlyData] = useState({
    rank: 1,
    rewardName: '',
    requiredCoins: 5000,
    image: null,
    imageUrl: ''
  });

  useEffect(() => {
    fetchPrizes();
    fetchMonthlyPrizes();
    if (user?.role === 'admin') fetchOrders();
  }, [user, selectedMonth, selectedYear]);

  const fetchOrders = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get('http://localhost:5001/api/gamification/orders', config);
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`http://localhost:5001/api/gamification/orders/${orderId}`, { status: newStatus }, config);
      fetchOrders();
    } catch (err) {
      alert("Status Sync Failure: " + err.message);
    }
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const fetchPrizes = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get('http://localhost:5001/api/gamification/prizes', config);
      setPrizes(res.data.prizes);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMonthlyPrizes = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get(`http://localhost:5001/api/gamification/monthly-prizes?month=${selectedMonth}&year=${selectedYear}`, config);
      setMonthlyPrizes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post('http://localhost:5001/api/gamification/prizes', formData, config);
      fetchPrizes();
      setIsAdding(false);
      setFormData({ name: '', description: '', requiredCoins: 1000, type: 'badge', couponCode: '', imageUrl: '' });
    } catch (err) {
      alert("Creation failed: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpsertMonthly = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const payload = {
        ...monthlyData,
        month: selectedMonth,
        year: selectedYear
      };
      await axios.put('http://localhost:5001/api/gamification/monthly-prizes', payload, config);
      fetchMonthlyPrizes();
      setIsEditingMonthly(false);
      setMonthlyData({ rank: 1, rewardName: '', requiredCoins: 5000, image: null, imageUrl: '' });
    } catch (err) {
      alert("Update failed: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Purge this asset from the registry?")) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`http://localhost:5001/api/gamification/prizes/${id}`, config);
      fetchPrizes();
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMonthlyData({ ...monthlyData, image: reader.result, imageUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const searchStudents = async (query) => {
    setStudentSearch(query);
    if (query.length < 2) {
      setFoundStudents([]);
      return;
    }
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      // Search for any user with student role
      const res = await axios.get(`http://localhost:5001/api/admin/users?role=student`, config);
      // Filter locally for better UX in this demo context
      setFoundStudents(res.data.filter(s => 
        s.name.toLowerCase().includes(query.toLowerCase()) || 
        s.email.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5));
    } catch (err) {
      console.error(err);
    }
  };

  const updateBalance = async () => {
    if (!selectedStudent) return;
    setIsUpdatingBalance(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`http://localhost:5001/api/admin/users/${selectedStudent._id}`, { 
        coins: parseInt(newBalance),
        credits: parseInt(newCredits)
      }, config);
      alert("Terminal Recalibrated: Student balances updated successfully.");
      setSelectedStudent({ 
        ...selectedStudent, 
        coins: parseInt(newBalance),
        credits: parseInt(newCredits)
      });
      setIsUpdatingBalance(false);
    } catch (err) {
      alert("Adjustment Failed: " + err.message);
      setIsUpdatingBalance(false);
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return 'from-yellow-400 to-amber-600';
      case 2: return 'from-slate-300 to-slate-500';
      case 3: return 'from-orange-400 to-orange-700';
      default: return 'from-indigo-400 to-indigo-600';
    }
  };

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className={isCompact ? "space-y-6" : "space-y-12"}>
      {!isCompact && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50 dark:bg-[#080c14] p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Reward Ecosystem</h2>
            <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest mt-1">Institutional Incentive Governance</p>
          </div>
          
          <div className="flex items-center bg-slate-200/50 dark:bg-white/5 p-1.5 rounded-2xl border border-slate-300/50 dark:border-white/10 gap-2">
            <button 
              onClick={() => setActiveView('orders')}
              className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeView === 'orders' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Order Status
            </button>
            <button 
                onClick={() => setActiveView('registry')}
                className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeView === 'registry' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 dark:text-gray-400 hover:text-white'}`}
            >
                Prize Registry
            </button>
            <button 
              onClick={() => setActiveView('monthly')}
              className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeView === 'monthly' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 dark:text-gray-400 hover:text-white'}`}
            >
              Monthly Top 10
            </button>
            <button 
              onClick={() => setActiveView('currency')}
              className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeView === 'currency' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 dark:text-gray-400 hover:text-white'}`}
            >
              Currency Forge
            </button>
          </div>

          <button 
             onClick={() => setIsAdding(true)}
             className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all flex items-center gap-3"
          >
             <Plus size={16} /> Deploy New Asset
          </button>
        </div>
      )}

    {activeView === 'orders' ? (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 p-8 rounded-[2.2rem] flex flex-col justify-center">
                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-2 italic">Active Orders</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{orders.length}</p>
                 </div>
                 <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 p-8 rounded-[2.2rem] flex flex-col justify-center">
                    <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-2 italic">Pending Fulfillment</p>
                    <p className="text-3xl font-black text-slate-900 dark:text-white">{orders.filter(o => !o.isClaimed).length}</p>
                 </div>
                 <div className="bg-emerald-500/5 border border-emerald-500/20 p-8 rounded-[2.2rem] flex flex-col justify-center">
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2 italic">Successfully Cleared</p>
                    <p className="text-3xl font-black text-emerald-600 tabular-nums">{orders.filter(o => o.isClaimed).length}</p>
                 </div>
                 <div className="bg-indigo-600/10 border border-indigo-500/10 p-8 rounded-[2.2rem] flex flex-col justify-center relative overflow-hidden group">
                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-2 italic">Protocol Yield</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums flex items-center gap-2">
                        {orders.reduce((acc, o) => acc + (o.prize?.requiredCoins || o.monthlyPrize?.requiredCoins || 0), 0).toLocaleString()}
                        <CoinIcon size={18} />
                    </p>
                 </div>
            </div>

            <div className="bg-white dark:bg-[#080c14] border border-slate-200 dark:border-white/10 rounded-[3rem] overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest italic flex items-center gap-3">
                        <Database size={18} className="text-indigo-500" /> Terminal Fulfillment Ledger
                    </h3>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Real-time Transaction Stream</p>
                </div>
                <div className="relative min-h-[500px]">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-black/20 border-b border-slate-100 dark:border-white/5">
                                <th className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-950 px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">#</th>
                                <th className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-950 px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">Scholar Identity</th>
                                <th className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-950 px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">Acquired Asset</th>
                                <th className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-950 px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">Capital Exhausted</th>
                                <th className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-950 px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">Temporal Log</th>
                                <th className="sticky top-0 z-20 bg-gray-50 dark:bg-gray-950 px-10 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right border-b border-slate-200 dark:border-slate-800">Clearance Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                            {orders.map((order, idx) => (
                                <tr key={order._id} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                                    <td className="px-10 py-6 text-[10px] font-black text-slate-400 tabular-nums">{idx + 1}</td>
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full border-2 border-white dark:border-white/10 overflow-hidden shrink-0">
                                                {order.student?.profilePic ? <img src={order.student.profilePic} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-indigo-500 flex items-center justify-center font-black text-white">{order.student?.name?.[0]}</div>}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight italic">{order.student?.name}</p>
                                                <p className="text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1 opacity-60">{order.student?.rollNumber || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-500 flex items-center justify-center">
                                                {order.prize?.type === 'badge' ? <Award size={14}/> : <Gift size={14}/>}
                                            </div>
                                            <p className="text-[11px] font-black text-slate-800 dark:text-gray-300 uppercase italic">{order.prize?.name || order.monthlyPrize?.rewardName}</p>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-2 tabular-nums">
                                            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{order.prize?.requiredCoins || order.monthlyPrize?.requiredCoins}</span>
                                            <CoinIcon size={14} />
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <p className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}</p>
                                        <p className="text-[8px] font-black text-slate-300 dark:text-gray-700 uppercase tracking-widest mt-1">{new Date(order.createdAt).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}</p>
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <select 
                                            value={order.status || 'pending'}
                                            onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest outline-none border transition-all cursor-pointer ${
                                                order.status === 'delivered' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' :
                                                order.status === 'rejected' ? 'bg-rose-500/10 border-rose-500/20 text-rose-600' :
                                                order.status === 'processing' ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600' :
                                                order.status === 'accepted' ? 'bg-blue-500/10 border-blue-500/20 text-blue-600' :
                                                'bg-amber-500/10 border-amber-500/20 text-amber-600'
                                            }`}
                                        >
                                            <option value="pending" className="bg-white dark:bg-[#0b0f1a]">Pending</option>
                                            <option value="processing" className="bg-white dark:bg-[#0b0f1a]">Processing</option>
                                            <option value="accepted" className="bg-white dark:bg-[#0b0f1a]">Accepted</option>
                                            <option value="delivered" className="bg-white dark:bg-[#0b0f1a]">Delivered</option>
                                            <option value="rejected" className="bg-white dark:bg-[#0b0f1a]">Rejected</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                            {orders.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center opacity-30 italic font-black uppercase tracking-[0.3em] text-slate-400">Order Ledger is currently null</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    ) : activeView === 'registry' ? (
        <div className="space-y-10">
          {!isCompact && prizes.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 p-6 rounded-[2rem] flex flex-col justify-center">
                  <p className="text-[8px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-2">Total Registry Nodes</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{prizes.length} <span className="text-[10px] text-indigo-500 italic">Active</span></p>
               </div>
               <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 p-6 rounded-[2rem] flex flex-col justify-center">
                  <p className="text-[8px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-2">Min Threshold</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{Math.min(...prizes.map(p => p.requiredCoins), 0)} <CoinIcon className="inline ml-1" size={14} /></p>
               </div>
               <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 p-6 rounded-[2rem] flex flex-col justify-center">
                  <p className="text-[8px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-2">Max Threshold</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{Math.max(...prizes.map(p => p.requiredCoins), 0)} <CoinIcon className="inline ml-1" size={14} /></p>
               </div>
               <div onClick={() => setActiveView('currency')} className="bg-gradient-to-br from-indigo-600 to-indigo-900 border border-indigo-500/20 p-6 rounded-[2rem] flex flex-col justify-center relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-all group">
                  <div className="relative z-10">
                    <p className="text-[8px] font-black text-indigo-100 uppercase tracking-widest mb-2">Currency Forge</p>
                    <p className="text-xl font-black text-white flex items-center gap-2">GRANT COINS <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" /></p>
                  </div>
                  <Zap className="absolute right-0 bottom-0 text-indigo-400/20 -mr-4 -mb-4 group-hover:scale-110 transition-transform" size={80} />
               </div>
            </div>
          )}
          
          <div className={isCompact ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"}>
            {prizes.map(prize => (
              <motion.div 
                key={prize._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] relative group overflow-hidden ${isCompact ? 'p-5' : 'p-8'} hover:border-indigo-500/30 transition-all`}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className={`${isCompact ? 'w-10 h-10' : 'w-14 h-14'} rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-500 flex items-center justify-center shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all`}>
                    {prize.type === 'badge' ? <Award size={isCompact ? 18 : 28} /> : <Gift size={18} />}
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className="text-[8px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1 italic">Quota Cap</p>
                    <p className={`${isCompact ? 'text-lg' : 'text-xl'} font-black text-slate-900 dark:text-white font-mono flex items-center gap-1.5`}>
                      {prize.requiredCoins}
                      <CoinIcon size={isCompact ? 16 : 20} />
                    </p>
                  </div>
                </div>
                <h3 className={`${isCompact ? 'text-[10px]' : 'text-sm'} font-black text-slate-900 dark:text-white uppercase tracking-tight`}>{prize.name}</h3>
                {!isCompact && <p className="text-[10px] font-bold text-slate-500 dark:text-gray-500 mt-2 line-clamp-2 uppercase italic tracking-wide">{prize.description}</p>}
                
                <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
                   <span className="text-[8px] font-black text-indigo-400 uppercase bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/20">{prize.type}</span>
                   <button onClick={() => handleDelete(prize._id)} className="p-2 text-gray-600 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1">
                      <Trash2 size={12}/>
                   </button>
                </div>
              </motion.div>
            ))}
            
            {prizes.length === 0 && (
              <div className="col-span-full py-24 bg-slate-50 dark:bg-[#080c14] rounded-[4rem] border border-dashed border-slate-200 dark:border-white/5 flex flex-col items-center justify-center text-center overflow-hidden relative group">
                <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity blur-3xl pointer-events-none" />
                <div className="w-20 h-20 rounded-[2.5rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mb-8 shadow-2xl">
                   <Gift className="text-slate-300 dark:text-gray-700" size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Null Asset Registry</h3>
                <p className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-[0.3em] mt-3 max-w-xs leading-relaxed italic border-t border-slate-100 dark:border-white/5 pt-4">Institutional incentives are currently offline. Initialize the lattice to deploy rewards.</p>
                
                <div className="mt-10 flex gap-4">
                   <button 
                    onClick={() => setIsAdding(true)}
                    className="px-10 py-4 bg-indigo-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-indigo-600/20"
                   >
                     Initialize First Asset
                   </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : activeView === 'monthly' ? (
        <div className="space-y-10">
          <div className="flex items-center justify-between bg-slate-50 dark:bg-white/5 p-6 rounded-3xl border border-slate-200 dark:border-white/5">
             <div className="flex items-center gap-4">
                <Trophy size={24} className="text-yellow-500" />
                <div>
                   <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">{months[selectedMonth]} {selectedYear} Podium</h3>
                   <p className="text-[9px] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1 italic">Monthly Honor Registry</p>
                </div>
             </div>
             <div className="flex gap-2">
                <button onClick={handlePrevMonth} className="p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10"><ChevronLeft size={16}/></button>
                <button onClick={handleNextMonth} className="p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10"><ChevronRight size={16}/></button>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rank => {
              const prize = monthlyPrizes.find(p => p.rank === rank);
              return (
                <motion.div
                  key={rank}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`bg-white dark:bg-[#0b0f1a] border ${prize ? 'border-slate-200 dark:border-white/10' : 'border-dashed border-slate-300 dark:border-white/5'} rounded-[2.5rem] p-6 relative overflow-hidden group hover:border-indigo-500/30 transition-all shadow-sm dark:shadow-none`}
                >
                  <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-gradient-to-br ${getRankColor(rank)} opacity-10 blur-2xl group-hover:opacity-20 transition-all`}></div>
                  
                  <div className="flex items-center justify-between mb-6">
                     <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getRankColor(rank)} flex items-center justify-center text-white font-black text-sm shadow-xl`}>
                        {rank}
                     </div>
                     {prize && (
                        <p className="text-xs font-black text-slate-900 dark:text-white font-mono flex items-center gap-1">
                          {prize.requiredCoins}
                          <CoinIcon size={14} />
                        </p>
                     )}
                  </div>

                  {prize ? (
                    <div className="space-y-4">
                       <div className="aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 relative">
                          <img src={prize.imageUrl} alt={prize.rewardName} className="w-full h-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 p-3">
                             <p className="text-[8px] font-black text-white uppercase truncate">{prize.rewardName}</p>
                          </div>
                       </div>
                       <button 
                         onClick={() => {
                            setMonthlyData({
                              rank: rank,
                              rewardName: prize.rewardName,
                              requiredCoins: prize.requiredCoins,
                              imageUrl: prize.imageUrl,
                              image: null
                            });
                            setIsEditingMonthly(true);
                         }}
                         className="w-full py-3 rounded-xl bg-slate-50 dark:bg-white/5 text-[8px] font-black text-slate-400 dark:text-gray-400 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-white/5"
                       >
                         <Edit size={12}/> Update Node
                       </button>
                    </div>
                  ) : (
                    <div className="h-48 flex flex-col items-center justify-center text-center">
                       <ImageIcon size={32} className="text-slate-200 dark:text-white/5 mb-4" />
                       <p className="text-[8px] font-black text-slate-400 dark:text-gray-600 uppercase tracking-tighter">Null Asset Assigned</p>
                       <button onClick={() => { setMonthlyData({...monthlyData, rank}); setIsEditingMonthly(true); }} className="mt-4 px-4 py-2 bg-indigo-600/10 text-indigo-500 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">Initialize</button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5 space-y-8">
               <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                     <Database size={100} className="text-indigo-500" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-8">Currency Forge Audit</h3>
                  
                  <div className="relative">
                     <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                     <input 
                        value={studentSearch}
                        onChange={(e) => searchStudents(e.target.value)}
                        placeholder="Search Identity (Name/Email)..." 
                        className="w-full bg-white dark:bg-[#0b0f1a] border border-slate-200 dark:border-white/10 rounded-2xl pl-16 pr-6 py-5 text-xs font-black text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all"
                     />
                  </div>

                  <div className="mt-6 space-y-3">
                     {foundStudents.map(student => (
                        <button 
                           key={student._id}
                           onClick={() => {
                              setSelectedStudent(student);
                              setNewBalance(student.coins);
                              setNewCredits(student.credits || 0);
                           }}
                           className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedStudent?._id === student._id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5'}`}
                        >
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                 {student.profilePic ? <img src={student.profilePic} className="w-full h-full object-cover rounded-lg" /> : <User size={14} className={selectedStudent?._id === student._id ? 'text-white' : 'text-indigo-500'} />}
                              </div>
                              <div className="text-left">
                                 <p className="text-[10px] font-black truncate max-w-[120px]">{student.name}</p>
                                 <p className={`text-[7px] font-bold uppercase tracking-widest ${selectedStudent?._id === student._id ? 'text-indigo-200' : 'text-slate-400'}`}>{student.email}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-1.5 bg-black/10 px-3 py-1.5 rounded-xl">
                              <span className="text-[10px] font-black tabular-nums">{student.coins}</span>
                              <CoinIcon size={12} />
                           </div>
                        </button>
                     ))}
                  </div>
               </div>
            </div>

            <div className="lg:col-span-7">
               <AnimatePresence mode="wait">
                  {selectedStudent ? (
                     <motion.div 
                        key={selectedStudent._id}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        className="bg-white dark:bg-[#0b0f1a] border border-slate-200 dark:border-white/10 rounded-[3.5rem] p-12 shadow-2xl relative overflow-hidden"
                     >
                        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-600 to-violet-700 opacity-5 blur-[120px] -mr-40 -mt-40"></div>
                        
                        <div className="flex items-center gap-8 mb-12">
                           <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-indigo-600 to-violet-700 p-1 shadow-2xl shadow-indigo-500/30">
                              <div className="w-full h-full rounded-[1.8rem] bg-indigo-900 flex items-center justify-center overflow-hidden">
                                 {selectedStudent.profilePic ? <img src={selectedStudent.profilePic} className="w-full h-full object-cover" /> : <User size={40} className="text-white/20" />}
                              </div>
                           </div>
                           <div>
                              <p className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.3em] mb-2 italic">Terminal Identity</p>
                              <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{selectedStudent.name}</h3>
                              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">{selectedStudent.email}</p>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 mb-12">
                           <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 p-8 rounded-[2.5rem]">
                              <p className="text-[8px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-3 italic">Scholar Coins</p>
                              <div className="flex items-center gap-3">
                                 <span className="text-4xl font-black text-slate-900 dark:text-white tabular-nums">{selectedStudent.coins}</span>
                                 <CoinIcon size={32} />
                              </div>
                           </div>
                           <motion.div 
                              animate={{ boxShadow: [null, "0 0 20px rgba(99, 102, 241, 0.2)", null] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="bg-indigo-600/5 border border-indigo-500/20 p-8 rounded-[2.5rem]"
                            >
                              <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mb-3 italic">Neural Credits (AI)</p>
                              <div className="flex items-center gap-3 text-indigo-500">
                                 <span className="text-4xl font-black tabular-nums">{selectedStudent.credits || 0}</span>
                                 <Cpu size={32} />
                              </div>
                           </motion.div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-indigo-600/5 border border-indigo-500/10 p-10 rounded-[3.5rem]">
                           <div className="space-y-6">
                              <label className="block text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2 italic text-center underline decoration-indigo-500/30">Scholar Balance</label>
                              <div className="flex items-center justify-center gap-4">
                                 <button onClick={() => setNewBalance(Math.max(0, parseInt(newBalance) - 100))} className="w-10 h-10 rounded-xl bg-white dark:bg-gray-900 border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all shadow-sm">-</button>
                                 <input 
                                    type="number" 
                                    value={newBalance}
                                    onChange={(e) => setNewBalance(e.target.value)}
                                    className="w-32 bg-white dark:bg-[#0b0f1a] border-2 border-indigo-600/20 rounded-2xl py-3 text-xl font-black text-indigo-600 dark:text-white text-center outline-none focus:border-indigo-600 transition-all font-mono"
                                 />
                                 <button onClick={() => setNewBalance(parseInt(newBalance) + 100)} className="w-10 h-10 rounded-xl bg-white dark:bg-gray-900 border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-all shadow-sm">+</button>
                              </div>
                           </div>

                           <div className="space-y-6">
                              <label className="block text-[9px] font-black text-orange-600 uppercase tracking-widest mb-2 italic text-center underline decoration-orange-500/30">AI Neural Credits</label>
                              <div className="flex items-center justify-center gap-4">
                                 <button onClick={() => setNewCredits(Math.max(0, parseInt(newCredits) - 5))} className="w-10 h-10 rounded-xl bg-white dark:bg-gray-900 border border-slate-200 text-orange-500 font-bold hover:bg-orange-50 transition-all shadow-sm">-</button>
                                 <input 
                                    type="number" 
                                    value={newCredits}
                                    onChange={(e) => setNewCredits(e.target.value)}
                                    className="w-32 bg-white dark:bg-[#0b0f1a] border-2 border-orange-600/20 rounded-2xl py-3 text-xl font-black text-orange-600 dark:text-white text-center outline-none focus:border-orange-600 transition-all font-mono"
                                 />
                                 <button onClick={() => setNewCredits(parseInt(newCredits) + 5)} className="w-10 h-10 rounded-xl bg-white dark:bg-gray-900 border border-slate-200 text-orange-500 font-bold hover:bg-orange-50 transition-all shadow-sm">+</button>
                              </div>
                           </div>
                           
                           <button 
                              onClick={updateBalance}
                              disabled={isUpdatingBalance}
                              className="col-span-1 md:col-span-2 mt-4 py-6 bg-gradient-to-r from-indigo-600 to-violet-700 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-600/30 hover:scale-105 transition-all flex items-center justify-center gap-4 group"
                           >
                              {isUpdatingBalance ? <Loader2 className="animate-spin" size={20} /> : <Zap className="group-hover:animate-pulse" size={20} />}
                              {isUpdatingBalance ? "Recalibrating..." : "Sync Neural Bank"}
                           </button>
                        </div>
                     </motion.div>
                  ) : (
                     <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-white/5 rounded-[4rem] border border-dashed border-slate-200 dark:border-white/5 p-20 group">
                        <div className="w-32 h-32 rounded-[3.5rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mb-10 shadow-2xl group-hover:scale-110 transition-transform duration-700">
                           <User className="text-slate-200 dark:text-gray-700" size={60} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Awaiting Identity Lock</h3>
                        <p className="text-[10px] font-black text-slate-500 dark:text-gray-500 uppercase tracking-[0.3em] mt-4 max-w-sm leading-relaxed italic border-t border-slate-100 dark:border-white/5 pt-6">Select a scholarly identity from the roster to begin terminal currency adjustment.</p>
                     </div>
                  )}
               </AnimatePresence>
            </div>
        </div>
      )}

      {/* Registry Prize Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[8000] bg-slate-900/60 dark:bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#0b0f1a] border border-slate-200 dark:border-white/10 rounded-[3rem] p-10 w-full max-w-xl shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[100px] pointer-events-none"></div>
              
              <div className="flex items-center justify-between mb-8">
                <div>
                   <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Define Logic Milestone</h3>
                   <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest mt-1 italic">Registry Synchronization Protocol</p>
                </div>
                <button onClick={() => setIsAdding(false)} className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"><X size={20}/></button>
              </div>

              <form onSubmit={handleCreate} className="space-y-6">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-2 italic">Asset Identity</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Diamond Scholar Badge" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-xs font-black text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"/>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-2 italic">Interaction Requirement</label>
                    <input type="number" required value={formData.requiredCoins} onChange={e => setFormData({...formData, requiredCoins: e.target.value})} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-xs font-black text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all font-mono"/>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-2 italic">Lattice Classification</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-xs font-black text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all cursor-pointer">
                      <option value="badge" className="bg-white dark:bg-[#0b0f1a]">Badge Asset</option>
                      <option value="coupon" className="bg-white dark:bg-[#0b0f1a]">Digital Voucher</option>
                      <option value="physical" className="bg-white dark:bg-[#0b0f1a]">Somatic Item</option>
                    </select>
                  </div>
                </div>
                <div>
                   <label className="block text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-2 italic">Governance Description</label>
                   <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} placeholder="Clarify the significance of this milestone..." className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-gray-400 outline-none focus:border-indigo-500 resize-none transition-all leading-relaxed placeholder:text-slate-300 dark:placeholder:text-slate-600"/>
                </div>

                <div className="pt-6 flex gap-4">
                  <button type="submit" disabled={isLoading} className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3">
                    {isLoading ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
                    {isLoading ? "Syncing Lattice..." : "Solidify Asset"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Monthly Prize Upsert Modal */}
      <AnimatePresence>
        {isEditingMonthly && (
          <div className="fixed inset-0 z-[8000] bg-slate-900/60 dark:bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#0b0f1a] border border-slate-200 dark:border-white/10 rounded-[3rem] p-10 w-full max-w-xl shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                   <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Rank {monthlyData.rank} Reward Node</h3>
                   <p className="text-[9px] text-indigo-500 font-bold uppercase tracking-widest mt-1 italic">{months[selectedMonth]} {selectedYear} Deployment</p>
                </div>
                <button onClick={() => setIsEditingMonthly(false)} className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"><X size={20}/></button>
              </div>

              <form onSubmit={handleUpsertMonthly} className="space-y-6">
                <div className="flex justify-center mb-8">
                   <div 
                     onClick={() => fileInputRef.current.click()}
                     className="relative w-40 h-40 rounded-3xl overflow-hidden bg-white/5 border-2 border-dashed border-white/10 cursor-pointer group hover:border-indigo-500/50 transition-all"
                   >
                      {monthlyData.imageUrl ? (
                        <img src={monthlyData.imageUrl} className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 group-hover:text-indigo-400">
                           <Camera size={32} className="mb-2" />
                           <span className="text-[8px] font-black uppercase tracking-widest">Upload Asset</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <Plus size={24} className="text-white" />
                      </div>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-2 italic">Rank Index</label>
                    <select value={monthlyData.rank} onChange={e => setMonthlyData({...monthlyData, rank: parseInt(e.target.value)})} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-xs font-black text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all cursor-pointer">
                      {[1,2,3,4,5,6,7,8,9,10].map(r => <option key={r} value={r} className="bg-white dark:bg-[#0b0f1a]">Tier {r}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-2 italic">Threshold Units</label>
                    <input type="number" required value={monthlyData.requiredCoins} onChange={e => setMonthlyData({...monthlyData, requiredCoins: e.target.value})} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-xs font-black text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all font-mono"/>
                  </div>
                </div>
 
                <div>
                   <label className="block text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-2 italic">Reward Nomenclature</label>
                   <input required value={monthlyData.rewardName} onChange={e => setMonthlyData({...monthlyData, rewardName: e.target.value})} placeholder="e.g. Master's Golden Chalice" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-xs font-black text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"/>
                </div>

                <div className="pt-6">
                  <button type="submit" disabled={isLoading || (!monthlyData.image && !monthlyData.imageUrl)} className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3">
                    {isLoading ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle size={16}/>}
                    {isLoading ? "Syncing Node..." : "Lock Monthly Tier"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PrizeManager;
