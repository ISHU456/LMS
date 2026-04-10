import { useState, useEffect, useCallback } from 'react';
import { Book, Users, User, Shield, Building, Activity, Bell, Home, Settings, Search, Zap, CalendarDays, X, Save, TrendingUp, BrainCircuit, CheckCircle, ChevronLeft, ChevronRight, LayoutGrid, Info, UserCheck, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AdminUserManagement from '../../components/admin/AdminUserProvisioning';
import AdminTeacherAttendance from '../../components/admin/AdminTeacherAttendance';
import AdminCourseManagement from '../../components/admin/AdminCourseManagement';
import AdminSystemSettings from '../../components/admin/AdminSystemSettings';
import AdminGlobalBroadcasts from '../../components/admin/AdminGlobalBroadcasts';
import AdminResultHub from '../../components/admin/AdminResultHub';
import AdminBatchFinalization from '../../components/admin/AdminBatchFinalization';
import AdminAiManagement from '../../components/admin/AdminAiManagement';
import AdminAccessRequests from '../../components/admin/AdminAccessRequests';
import AdminPendingTeachers from '../../components/admin/AdminPendingTeachers';
import AttendanceManager from '../../components/teacher/AttendanceManager';
import MonthlyRegister from '../../components/teacher/MonthlyRegister';
import { motion, AnimatePresence } from 'framer-motion';

const AdminDashboard = () => {
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('adminActiveTab') || 'overview');
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(() => parseInt(localStorage.getItem('adminSidebarWidth')) || 280);
  const [isResizing, setIsResizing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [stats, setStats] = useState({
    users: 0,
    departments: 0,
    courses: 0,
    attendance: 0,
    pendingApprovals: 0,
    growth: { daily: 0, weekly: 0, monthly: 0 },
    timeline: [],
    leaderboard: [],
    recentUsers: [],
    demographics: [],
    deptPopulation: []
  });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/admin/stats', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch statistics");
    }
  }, [user.token]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab);
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [activeTab, fetchStats]);

  // Resizable Sidebar Logic
  const startResizing = useCallback(() => setIsResizing(true), []);
  const stopResizing = useCallback(() => setIsResizing(false), []);
  const resize = useCallback((e) => {
    if (isResizing) {
      let newWidth = e.clientX;
      if (newWidth < 200) newWidth = 200;
      if (newWidth > 450) newWidth = 450;
      setSidebarWidth(newWidth);
      localStorage.setItem('adminSidebarWidth', newWidth);
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  const menuItems = [
    { id: 'overview', icon: LayoutGrid, label: 'System Overview' },
    { id: 'users', icon: Users, label: 'User Management Hub' },
    { id: 'faculty-attendance', icon: CalendarDays, label: 'Faculty Presence' },
    { id: 'student-attendance', icon: UserCheck, label: 'Student Attendance' },
    { id: 'monthly-register', icon: Calendar, label: 'Monthly Register' },
    { id: 'pending-faculty', icon: Shield, label: 'Pending Faculty' },
    { id: 'courses', icon: Book, label: 'Academic Lattice' },
    { id: 'global-alerts', icon: Bell, label: 'Global Broadcasts' },
    { id: 'results-hub', icon: TrendingUp, label: 'Results & Transcripts' },
    { id: 'batch-finalization', icon: CheckCircle, label: 'Batch Finalization' },
    { id: 'access-governance', icon: Shield, label: 'Access Governance' },
    { id: 'ai-management', icon: BrainCircuit, label: 'Neural Governance Hub' },
    { id: 'system', icon: Settings, label: 'System Settings' },
  ];

  const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];

  if (isLoading) return (
    <div className="flex min-h-[calc(100vh-73px)] bg-slate-50 dark:bg-[#030712] p-4 md:p-8 gap-6 overflow-hidden">
       <div className="hidden lg:block bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 animate-pulse h-full" style={{ width: sidebarWidth }}></div>
       <div className="flex-1 bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 animate-pulse h-full"></div>
    </div>
  );

  return (
    <div className="flex min-h-[calc(100vh-73px)] bg-slate-50 dark:bg-[#030712] font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-500 overflow-hidden relative">
      
      {/* Premium Sidebar */}
      <aside 
        className={`fixed lg:relative z-[60] h-full bg-white dark:bg-[#080c14] border-r border-slate-200 dark:border-slate-800/60 shadow-2xl lg:shadow-none transition-all duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ width: window.innerWidth < 1024 ? '280px' : (isSidebarOpen ? sidebarWidth : 0) }}
      >
        <div className="p-6 flex flex-col h-full">
           <div className="flex items-center gap-3 mb-10 px-2 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 shrink-0">
                 <Shield size={20} className="animate-pulse" />
              </div>
              <div className="truncate">
                 <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">Neural Admin</h2>
                 <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">Governance Node</p>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden ml-auto p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"><X size={20}/></button>
           </div>

           <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
              {menuItems.map(item => (
                 <button 
                   key={item.id} 
                   onClick={() => {
                     setActiveTab(item.id);
                     if (window.innerWidth < 1024) setIsSidebarOpen(false);
                   }} 
                   className={`group w-full flex items-center gap-4 px-5 py-4 rounded-[1.25rem] transition-all duration-300 relative overflow-hidden ${activeTab === item.id ? 'bg-slate-100/80 dark:bg-white/5 text-indigo-600 dark:text-indigo-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]' : 'text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                 >
                    {activeTab === item.id && <motion.div layoutId="activePill" className="absolute left-0 w-1.5 h-6 bg-indigo-600 dark:bg-indigo-500 rounded-r-full" />}
                    <item.icon size={20} className={`shrink-0 transition-transform duration-500 group-hover:scale-110 ${activeTab === item.id ? 'scale-110' : ''}`} />
                    <span className="text-[11px] font-black uppercase tracking-widest truncate">{item.label}</span>
                 </button>
              ))}
           </nav>

           <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/60 overflow-hidden">
              <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 group hover:border-indigo-500/30 transition-all duration-500 cursor-help">
                 <div className="flex items-center gap-3 mb-2">
                    <Info size={14} className="text-indigo-500" />
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">System Health</p>
                 </div>
                 <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: '92%' }} className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500" />
                 </div>
                 <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mt-2">Operational: 99.8%</p>
              </div>
           </div>
        </div>

        {/* Resizer Slider */}
        <div 
          onMouseDown={startResizing}
          className="hidden lg:block absolute top-0 -right-1 w-2 h-full cursor-col-resize group z-50 transition-all active:w-4"
        >
           <div className={`h-full w-0.5 mx-auto bg-slate-200 dark:bg-slate-800/60 group-hover:bg-indigo-500 transition-colors ${isResizing ? 'bg-indigo-500 w-1' : ''}`} />
        </div>
      </aside>

      {/* Main Framework */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        
        {/* Top Header */}
        <header className="h-16 lg:h-20 shrink-0 bg-white/80 dark:bg-[#030712]/80 backdrop-blur-3xl border-b border-slate-200 dark:border-slate-800/60 flex items-center justify-between px-4 lg:px-10 sticky top-0 z-30 transition-colors duration-500">
           <div className="flex items-center gap-4 lg:gap-6">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 bg-slate-100 dark:bg-white/5 rounded-xl text-slate-600 dark:text-slate-400"><LayoutGrid size={18}/></button>
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">
                  {menuItems.find(i=>i.id===activeTab)?.label}
                </h1>
                <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-0.5">Administrative Grid Interface</p>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 bg-slate-50 dark:bg-white/5 px-5 py-2.5 rounded-2xl border border-slate-100 dark:border-white/5 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all duration-300">
                <Search size={16} className="text-slate-400" />
                <input type="text" placeholder="Global Sector Search..." className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none text-slate-900 dark:text-white w-48" />
              </div>
              <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800/60">
                 <div className="text-right hidden sm:block">
                    <p className="text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">Root Administrator</p>
                    <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest italic">{user.department}</p>
                 </div>
                 <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 p-0.5 shadow-lg shadow-indigo-500/20">
                    <div className="w-full h-full rounded-[10px] bg-slate-900 flex items-center justify-center text-white font-black text-xs uppercase">
                       {user.name[0]}
                    </div>
                 </div>
              </div>
           </div>
        </header>
        
        {/* Dynamic Content Core */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-10 custom-scrollbar">
           <AnimatePresence mode="wait">
           {activeTab === 'overview' ? (
             <motion.div key="overview" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5, ease: "easeOut" }} className="space-y-6 lg:space-y-10 max-w-[1600px] mx-auto">
               
               {/* Dashboard Stats Deck */}
               <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                 {[
                   { label: 'Total Identities', value: stats.users, icon: Users, color: 'indigo', detail: 'Across all vectors' },
                   { label: 'Academic Sectors', value: stats.departments, icon: Building, color: 'violet', detail: 'Departmental nodes' },
                   { label: 'Active Requests', value: stats.pendingApprovals, icon: Zap, color: 'amber', detail: 'Awaiting protocol sync' },
                   { label: 'Faculty Presence', value: `${stats.attendance}%`, icon: Activity, color: 'emerald', detail: 'Live participation' },
                 ].map((s, idx) => (
                   <motion.div 
                     key={s.label} 
                     initial={{ opacity: 0, x: -20 }} 
                     animate={{ opacity: 1, x: 0 }} 
                     transition={{ delay: idx * 0.1 }}
                     className="bg-white dark:bg-[#080c14] p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800/60 shadow-sm hover:shadow-2xl hover:border-indigo-500/30 transition-all group relative overflow-hidden"
                   >
                     <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-all" />
                     <div className="flex justify-between items-start relative z-10">
                       <div>
                         <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{s.label}</p>
                         <h3 className="text-4xl font-black dark:text-white tabular-nums tracking-tighter italic">{s.value}</h3>
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2 italic">{s.detail}</p>
                       </div>
                       <div className={`p-4 rounded-2xl bg-${s.color}-50 dark:bg-white/5 text-${s.color}-500 group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 shadow-sm`}>
                         <s.icon size={28} strokeWidth={2.5} />
                       </div>
                     </div>
                   </motion.div>
                 ))}
               </div>

               {/* Analytic Visualization Hub */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
                    className="bg-white dark:bg-[#080c14] p-10 rounded-[3rem] shadow-xl border border-slate-200 dark:border-slate-800/60 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                       <LayoutGrid size={120} className="text-indigo-500" />
                    </div>
                    <div className="flex items-center justify-between mb-10 relative z-10">
                       <h3 className="text-sm font-black uppercase tracking-[0.3em] dark:text-white italic">Identity Demographics</h3>
                       <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                    </div>
                    <div className="h-[300px] w-full relative z-10">
                        {isMounted && stats.demographics?.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie 
                                data={stats.demographics} 
                                cx="50%" cy="50%" 
                                innerRadius={80} outerRadius={110} 
                                paddingAngle={10} dataKey="value"
                                stroke="none"
                              >
                                {stats.demographics.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={12} />)}
                              </Pie>
                              <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(8, 12, 20, 0.9)', borderRadius: '24px', border: 'none', fontWeight: '900', fontSize: '10px', backdropFilter: 'blur(10px)', color: '#fff' }} itemStyle={{color: '#fff'}} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                           <div className="h-full w-full flex items-center justify-center opacity-30 text-[10px] font-black uppercase tracking-[0.5em] italic">Awaiting Context</div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
                       {stats.demographics.map((d, i) => (
                         <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                           <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                           <div className="truncate">
                              <span className="text-[10px] font-black uppercase text-slate-900 dark:text-white tracking-widest">{d.name}</span>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{d.value} Units</p>
                           </div>
                         </div>
                       ))}
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
                    className="bg-white dark:bg-[#080c14] p-10 rounded-[3rem] shadow-xl border border-slate-200 dark:border-slate-800/60 lg:col-span-2 group">
                    <div className="flex items-center justify-between mb-10">
                       <h3 className="text-sm font-black uppercase tracking-[0.3em] dark:text-white italic">Sector Distribution</h3>
                       <button className="text-[10px] font-black uppercase text-indigo-500 tracking-widest hover:underline transition-all">Export Protocol Data</button>
                    </div>
                    <div className="h-[320px] w-full">
                        {isMounted && stats.deptPopulation?.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.deptPopulation}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} />
                              <RechartsTooltip cursor={{fill: 'rgba(99, 102, 241, 0.05)', radius: 24}} contentStyle={{ backgroundColor: 'rgba(8, 12, 20, 0.9)', borderRadius: '20px', border: 'none', backdropFilter: 'blur(10px)' }} />
                              <Bar 
                                dataKey="students" 
                                fill="url(#colorBar)" 
                                radius={[16, 16, 0, 0]} 
                                barSize={48}
                              />
                              <defs>
                                <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.9}/>
                                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={1}/>
                                </linearGradient>
                              </defs>
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                           <div className="h-full w-full flex items-center justify-center opacity-30 text-[10px] font-black uppercase tracking-[0.5em] italic">Calibrating Sector Matrix</div>
                        )}
                    </div>
                  </motion.div>
               </div>

               {/* Interaction Grid */}
               <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pb-12">
                  <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
                    className="bg-white dark:bg-[#080c14] p-12 rounded-[3.5rem] border border-slate-200 dark:border-slate-800/60 shadow-xl group">
                    <div className="flex items-center justify-between mb-10">
                       <h3 className="text-sm font-black uppercase tracking-[0.3em] dark:text-white flex items-center gap-3 italic">
                        <Zap size={20} className="text-amber-500 fill-amber-500/20" /> Strategic Quick-Launch
                       </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                       {[
                         { label: 'Provision Student', color: 'indigo', action: () => setActiveTab('users'), icon: Users },
                         { label: 'Induct Faculty', color: 'violet', action: () => setActiveTab('users'), icon: User },
                         { label: 'Lattice Protocol', color: 'emerald', action: () => setActiveTab('courses'), icon: LayoutGrid },
                         { label: 'Alert Broadcast', color: 'rose', action: () => setActiveTab('global-alerts'), icon: Bell },
                       ].map(btn => (
                          <button 
                             key={btn.label}
                             onClick={btn.action}
                             className="group/btn relative h-32 flex flex-col items-center justify-center bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white rounded-[2.5rem] border border-slate-100 dark:border-white/5 hover:border-indigo-500/50 hover:bg-white dark:hover:bg-indigo-500/10 transition-all duration-500"
                          >
                             <btn.icon size={24} className="mb-3 text-slate-400 group-hover/btn:text-indigo-500 group-hover/btn:scale-125 transition-all duration-500" />
                             <span className="text-[10px] font-black uppercase tracking-[0.2em]">{btn.label}</span>
                             <div className="absolute inset-x-0 bottom-0 h-1 bg-indigo-500 rounded-b-full scale-x-0 group-hover/btn:scale-x-50 transition-transform duration-500" />
                          </button>
                       ))}
                       <button 
                         onClick={() => navigate('/admin/ai-management')}
                         className="p-8 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-[3rem] font-black uppercase tracking-[0.3em] text-[11px] hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-indigo-500/30 col-span-2 relative overflow-hidden group/ai"
                       >
                         <div className="absolute inset-0 bg-white/10 scale-x-0 group-hover/ai:scale-x-100 origin-left transition-transform duration-700" />
                         <span className="relative z-10 flex items-center justify-center gap-3 italic"><BrainCircuit size={20}/> Neural Governance Terminal</span>
                       </button>
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}
                    className="bg-white dark:bg-[#080c14] p-12 rounded-[3.5rem] border border-slate-200 dark:border-slate-800/60 shadow-xl relative overflow-hidden">
                     <div className="absolute bottom-0 right-0 p-10 opacity-5 -mb-5 -mr-5">
                        <Users size={180} />
                     </div>
                     <h3 className="text-sm font-black uppercase tracking-[0.3em] dark:text-white mb-10 italic">Identity Ignition Stream</h3>
                     <div className="space-y-6 relative z-10">
                        {stats.recentUsers && stats.recentUsers.length > 0 ? stats.recentUsers.slice(0, 6).map((item, i) => (
                          <motion.div 
                             key={i} 
                             initial={{ opacity: 0, y: 10 }} 
                             animate={{ opacity: 1, y: 0 }} 
                             transition={{ delay: 0.8 + (i * 0.05) }}
                             className="flex items-center gap-5 p-4 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 hover:border-indigo-500/20 transition-all group/item"
                          >
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-white/10 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-white/10 group-hover/item:scale-110 transition-transform duration-500 shrink-0">
                               {item.profilePic ? <img src={item.profilePic} className="w-full h-full object-cover" alt="Identity"/> : <Users size={18} className="text-indigo-500"/>}
                            </div>
                            <div className="truncate">
                               <p className="text-[11px] font-black dark:text-white text-slate-900 group-hover/item:text-indigo-600 transition-colors capitalize tracking-tight">{item.name}</p>
                               <div className="flex items-center gap-2 mt-0.5">
                                  <span className={`w-1.5 h-1.5 rounded-full ${item.role === 'student' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">{item.role}</p>
                               </div>
                            </div>
                            <div className="ml-auto text-right">
                               <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tighter tabular-nums">{new Date(item.createdAt).toLocaleDateString()}</p>
                               <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Onboarded</p>
                            </div>
                          </motion.div>
                        )) : (
                           <div className="py-24 text-center">
                              <Activity size={40} className="mx-auto text-slate-200 dark:text-slate-800 mb-4 animate-pulse" />
                              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 dark:text-slate-700 italic">No Active Transmission Logs</p>
                           </div>
                        )}
                     </div>
                  </motion.div>
               </div>
             </motion.div>
           ) : activeTab === 'users' ? (
             <motion.div key="users" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
               <AdminUserManagement user={user} />
             </motion.div>
           ) : activeTab === 'faculty-attendance' ? (
             <motion.div key="attendance" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
               <AdminTeacherAttendance user={user} />
             </motion.div>
           ) : activeTab === 'courses' ? (
             <motion.div key="courses" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
               <AdminCourseManagement user={user} />
             </motion.div>
           ) : activeTab === 'global-alerts' ? (
             <motion.div key="alerts" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
               <AdminGlobalBroadcasts user={user} />
             </motion.div>
           ) : activeTab === 'results-hub' ? (
             <motion.div key="results" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
               <AdminResultHub user={user} />
             </motion.div>
           ) : activeTab === 'batch-finalization' ? (
             <motion.div key="batch" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
               <AdminBatchFinalization user={user} />
             </motion.div>
           ) : activeTab === 'ai-management' ? (
          <motion.div key="ai" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <AdminAiManagement user={user} />
          </motion.div>
        ) : activeTab === 'access-governance' ? (
          <motion.div key="access" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <AdminAccessRequests user={user} />
          </motion.div>
        ) : activeTab === 'pending-faculty' ? (
          <motion.div key="pending-fac" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <AdminPendingTeachers user={user} />
          </motion.div>
        ) : activeTab === 'student-attendance' ? (
          <motion.div key="student-att" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <AttendanceManager user={user} onPersistChange={() => {}} />
          </motion.div>
        ) : activeTab === 'monthly-register' ? (
          <motion.div key="monthly-reg" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <MonthlyRegister user={user} onPersistChange={() => {}} />
          </motion.div>
        ) : activeTab === 'system' ? (
             <motion.div key="system" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
               <AdminSystemSettings user={user} />
             </motion.div>
           ) : (
             <div className="flex bg-white dark:bg-[#080c14] h-[60vh] items-center justify-center text-slate-400 rounded-[3rem] border border-slate-100 dark:border-slate-800/60 italic font-black uppercase tracking-[0.5em] shadow-xl">
               Secure Implementation Area: {activeTab}
             </div>
           )}
           </AnimatePresence>
        </main>
      </div>

      {/* Background Overlay for Mobile Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && window.innerWidth < 1024 && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
