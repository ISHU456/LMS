import { useState, useEffect, useCallback } from 'react';
import { Book, Users, User, Shield, Building, Activity, Bell, Home, Settings, Search, Zap, CalendarDays, X, Save, TrendingUp, BrainCircuit, CheckCircle, ChevronLeft, ChevronRight, LayoutGrid, Info, UserCheck, Calendar, Megaphone, ShieldAlert } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AdminUserManagement from '../../components/admin/AdminUserProvisioning';
import AdminTeacherAttendance from '../../components/admin/AdminTeacherAttendance';
import AdminCourseManagement from '../../components/admin/AdminCourseManagement';
import AdminSystemSettings from '../../components/admin/AdminSystemSettings';
import AdminGlobalBroadcasts from '../../components/admin/AdminGlobalBroadcasts';
import AdminResultHub from '../../components/admin/AdminResultHub';
import AdminAiManagement from '../../components/admin/AdminAiManagement';
import AdminPendingTeachers from '../../components/admin/AdminPendingTeachers';
import AdminFacultyMonthlyRegister from '../../components/admin/AdminFacultyMonthlyRegister';
import AdminAnnouncementModeration from '../../components/admin/AdminAnnouncementModeration';
import AttendanceManager from '../../components/teacher/AttendanceManager';
import MonthlyRegister from '../../components/teacher/MonthlyRegister';
import QuizGenerator from '../../components/teacher/QuizGenerator';
import PrizeManager from '../../components/admin/PrizeManager';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Gift, Plus, Clock, Layers, Terminal, ClipboardList, Wind, Leaf, Droplets } from 'lucide-react';
import FluidBackground from '../../components/FluidBackground';


const AdminDashboard = () => {
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
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
    reportedAnnouncementsCount: 0,
    growth: { daily: 0, weekly: 0, monthly: 0 },
    timeline: [],
    leaderboard: [],
    recentUsers: [],
    demographics: [],
    deptPopulation: []
  });
  const [isMounted, setIsMounted] = useState(false);
  const [quizzes, setQuizzes] = useState([]);
  const [quizGenOpen, setQuizGenOpen] = useState(false);


  const [searchParams] = useSearchParams();

  useEffect(() => {
    setIsMounted(true);
    
    // Deep linking logic
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }

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
    fetchStats();
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [fetchStats]);

  useEffect(() => {
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [activeTab, fetchStats]);

  useEffect(() => {
    if (activeTab === 'quizzes') {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      axios.get('http://localhost:5001/api/gamification/quizzes', config).then(r => setQuizzes(r.data)).catch(e => console.error(e));
    }
  }, [activeTab, user]);


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
    { id: 'overview', icon: LayoutGrid, label: 'Dashboard' },
    { id: 'users', icon: Users, label: 'User Management Hub' },
    { id: 'faculty-attendance', icon: CalendarDays, label: 'Faculty Presence' },
    { id: 'faculty-monthly', icon: ClipboardList, label: 'Faculty Register' },
    { id: 'student-attendance', icon: UserCheck, label: 'Student Attendance' },
    { id: 'monthly-register', icon: Calendar, label: 'Monthly Register' },
    { id: 'pending-faculty', icon: Shield, label: 'Pending Faculty' },
    { id: 'courses', icon: Book, label: 'Course Management' },
    { id: 'global-alerts', icon: Bell, label: 'Global Broadcasts' },
    { id: 'results-hub', icon: TrendingUp, label: 'Results & Transcripts' },
    { id: 'quizzes', icon: Radio, label: 'MCQ Assessment Lab' },
    { id: 'rewards', icon: Gift, label: 'Reward Ecosystem' },
    { id: 'ai-management', icon: BrainCircuit, label: 'Neural Governance Hub' },
    { id: 'moderation', icon: ShieldAlert, label: 'Moderation Grid' },
    { id: 'system', icon: Settings, label: 'System Settings' },
  ];

  const CHART_GRADIENTS = {
    indigo: { from: '#6366f1', to: '#818cf8', light: 'rgba(99, 102, 241, 0.08)' },
    violet: { from: '#8b5cf6', to: '#a78bfa', light: 'rgba(139, 92, 246, 0.08)' },
    amber: { from: '#f59e0b', to: '#fbbf24', light: 'rgba(245, 158, 11, 0.08)' },
    emerald: { from: '#10b981', to: '#34d399', light: 'rgba(16, 185, 129, 0.08)' },
    rose: { from: '#ef4444', to: '#f87171', light: 'rgba(239, 68, 68, 0.08)' },
    teal: { from: '#14b8a6', to: '#5eead4', light: 'rgba(20, 184, 166, 0.08)' }
  };

  const COLORS = ['#6366f1', '#10b981', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (isLoading) return (
    <div className="flex h-[calc(100vh-80px)] bg-slate-50 dark:bg-[#030712] p-4 md:p-8 gap-6 overflow-hidden">
       <div className="hidden lg:block bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 animate-pulse h-full" style={{ width: sidebarWidth }}></div>
       <div className="flex-1 bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 animate-pulse h-full"></div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-80px)] bg-transparent font-sans selection:bg-teal-500 selection:text-white transition-colors duration-500 overflow-hidden relative">
      <FluidBackground />
      
      {/* Organic Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-40">
        <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-teal-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px] animate-bounce-subtle" />
      </div>
      
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
                     if (item.id === 'coding') {
                        navigate('/coding-arena');
                        return;
                     }
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                  {[
                    { label: 'Total Identities', value: stats.users, icon: Users, theme: CHART_GRADIENTS.indigo, detail: 'Across all vectors' },
                    { label: 'Academic Sectors', value: stats.departments, icon: Building, theme: CHART_GRADIENTS.violet, detail: 'Departmental nodes' },
                    { label: 'Active Requests', value: stats.pendingApprovals, icon: Zap, theme: CHART_GRADIENTS.amber, detail: 'Awaiting protocol sync' },
                    { label: 'Reported Content', value: stats.reportedAnnouncementsCount, icon: ShieldAlert, theme: CHART_GRADIENTS.rose, detail: 'Flagged for review' },
                    { label: 'Faculty Presence', value: `${stats.attendance}%`, icon: Activity, theme: CHART_GRADIENTS.emerald, detail: 'Live participation' },
                  ].map((s, idx) => (
                    <motion.div 
                      key={s.label} 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: idx * 0.1 }}
                      className="bg-white dark:bg-[#080c14] p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800/60 shadow-sm hover:shadow-2xl hover:border-indigo-500/30 transition-all group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" style={{ backgroundColor: s.theme.light }} />
                      <div className="flex justify-between items-start relative z-10">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{s.label}</p>
                          <h3 className="text-4xl font-black dark:text-white tabular-nums tracking-tighter italic">{s.value}</h3>
                          <div className="flex items-center gap-2 mt-2">
                             <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.theme.from }} />
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">{s.detail}</p>
                          </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 transition-all duration-500 shadow-sm relative overflow-hidden group-hover:scale-110 group-hover:rotate-6">
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500" style={{ background: `linear-gradient(135deg, ${s.theme.from}, ${s.theme.to})` }} />
                          <s.icon size={28} strokeWidth={2.5} style={{ color: s.theme.from }} />
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
                       <h3 className="text-sm font-black uppercase tracking-[0.3em] dark:text-white italic">Identity Hub</h3>
                       <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                       </div>
                    </div>
                    <div className="h-[300px] w-full relative z-10">
                        {isMounted && stats.demographics?.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie 
                                data={stats.demographics} 
                                cx="50%" cy="50%" 
                                innerRadius={80} outerRadius={110} 
                                paddingAngle={12} dataKey="value"
                                stroke="none"
                              >
                                {stats.demographics.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={16} />)}
                              </Pie>
                              <RechartsTooltip contentStyle={{ backgroundColor: 'rgba(8, 12, 20, 0.95)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', fontWeight: '900', fontSize: '10px', backdropFilter: 'blur(10px)', color: '#fff' }} itemStyle={{color: '#fff'}} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                           <div className="h-full w-full flex items-center justify-center opacity-30 text-[10px] font-black uppercase tracking-[0.5em] italic">Awaiting Hub Context</div>
                        )}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                           <p className="text-[8px] font-black text-slate-400 underline decoration-indigo-500/50 underline-offset-4 uppercase tracking-widest mb-1">Total</p>
                           <p className="text-2xl font-black dark:text-white italic">{stats.users}</p>
                        </div>
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
                    className="bg-white dark:bg-[#080c14] p-10 rounded-[3rem] shadow-xl border border-slate-200 dark:border-slate-800/60 lg:col-span-2 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-[0.02]">
                       <TrendingUp size={240} className="text-indigo-500" />
                    </div>
                    <div className="flex items-center justify-between mb-10 relative z-10">
                       <h3 className="text-sm font-black uppercase tracking-[0.3em] dark:text-white italic">Sector Population Matrix</h3>
                       <div className="p-2 bg-indigo-500/5 rounded-xl border border-indigo-500/10 text-[9px] font-black text-indigo-500 uppercase tracking-widest">Real-time Sync</div>
                    </div>
                    <div className="h-[320px] w-full relative z-10">
                        {isMounted && stats.deptPopulation?.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.deptPopulation}>
                              <defs>
                                <linearGradient id="popGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#6366f1" stopOpacity={1}/>
                                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                </linearGradient>
                                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                                  <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                                  <feOffset dx="2" dy="2" result="offsetblur" />
                                  <feComponentTransfer>
                                    <feFuncA type="linear" slope="0.5" />
                                  </feComponentTransfer>
                                  <feMerge>
                                    <feMergeNode />
                                    <feMergeNode in="SourceGraphic" />
                                  </feMerge>
                                </filter>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.03} stroke="#fff" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontBold: 900, fill: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }} dy={10} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontBold: 900, fill: '#64748b' }} dx={-10} />
                              <RechartsTooltip cursor={{fill: 'rgba(99, 102, 241, 0.05)', radius: 24}} contentStyle={{ backgroundColor: 'rgba(8, 12, 20, 0.95)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }} />
                              <Bar 
                                dataKey="students" 
                                fill="url(#popGradient)" 
                                radius={[12, 12, 0, 0]} 
                                barSize={42}
                                filter="url(#shadow)"
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                           <div className="h-full w-full flex items-center justify-center opacity-30 text-[10px] font-black uppercase tracking-[0.5em] italic">Constructing Sector Matrix...</div>
                        )}
                    </div>
                  </motion.div>
               </div>
                
               {/* Institutional Growth Pulse */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                 className="bg-white/70 dark:bg-[#080c14]/70 backdrop-blur-xl p-10 rounded-[3.5rem] shadow-xl border border-slate-200 dark:border-slate-800/60 overflow-hidden relative group">
                  <div className="flex items-center justify-between mb-10">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-[0.3em] dark:text-white flex items-center gap-3 italic">
                        <Activity size={20} className="text-teal-500" /> Institutional Growth Pulse
                      </h3>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1 italic underline decoration-teal-500/30 underline-offset-4">Growth trajectory over active cycles</p>
                    </div>
                    <div className="flex items-center gap-6">
                       <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-teal-500 to-indigo-500" />
                          <span className="text-[9px] font-black dark:text-white text-slate-900 uppercase tracking-widest">Sync Efficiency (%)</span>
                       </div>
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    {isMounted ? (
                       <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={[
                           { name: 'Sun', value: 65 },
                           { name: 'Mon', value: 85 },
                           { name: 'Tue', value: 78 },
                           { name: 'Wed', value: 92 },
                           { name: 'Thu', value: 88 },
                           { name: 'Fri', value: 96 },
                           { name: 'Sat', value: 74 },
                         ]}>
                           <defs>
                             <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4}/>
                               <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                             </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="5 5" vertical={false} opacity={0.05} stroke="#6366f1" />
                           <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontBold: 900, fill: '#64748b', letterSpacing: '0.1em' }} dy={10} />
                           <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontBold: 900, fill: '#64748b' }} dx={-10} domain={[0, 100]} />
                           <RechartsTooltip 
                             contentStyle={{ backgroundColor: 'rgba(8, 12, 20, 0.95)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', padding: '15px' }}
                             itemStyle={{ color: '#14b8a6', fontWeight: '900', fontSize: '12px' }}
                             labelStyle={{ color: '#fff', fontWeight: '900', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                           />
                           <Area type="monotone" dataKey="value" stroke="url(#colorPulse)" strokeWidth={5} fillOpacity={1} fill="url(#colorPulse)" />
                         </AreaChart>
                       </ResponsiveContainer>
                    ) : (
                      <div className="h-full w-full flex items-center justify-center opacity-30 text-[10px] font-black uppercase tracking-[0.5em] italic tabular-nums">Tracing Institutional Vectors...</div>
                    )}
                  </div>
               </motion.div>

                {/* Analytic Interaction Grid */}

                {/* Analytic Interaction Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pb-12">
                   {/* Ecosystem Equilibrium Chart */}
                   <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
                     className="bg-white/70 dark:bg-[#080c14]/70 backdrop-blur-xl p-10 rounded-[3.5rem] border border-slate-200 dark:border-slate-800/60 shadow-xl group relative overflow-hidden">
                      <div className="flex items-center justify-between mb-8">
                         <h3 className="text-sm font-black uppercase tracking-[0.3em] dark:text-white flex items-center gap-3 italic">
                           <Wind size={20} className="text-teal-500" /> Ecosystem Equilibrium
                         </h3>
                      </div>
                      <div className="h-[300px] w-full">
                         {isMounted ? (
                           <ResponsiveContainer width="100%" height="100%">
                             <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                               { subject: 'Identity', A: 120, B: 110, fullMark: 150 },
                               { subject: 'Synergy', A: 98, B: 130, fullMark: 150 },
                               { subject: 'Growth', A: 86, B: 130, fullMark: 150 },
                               { subject: 'Uptime', A: 99, B: 100, fullMark: 150 },
                               { subject: 'Security', A: 85, B: 90, fullMark: 150 },
                               { subject: 'Neural', A: 65, B: 85, fullMark: 150 },
                             ]}>
                               <PolarGrid stroke="#64748b" opacity={0.1} />
                               <PolarAngleAxis dataKey="subject" tick={{ fontSize: 8, fontBold: 900, fill: '#64748b' }} />
                               <Radar name="Active Matrix" dataKey="A" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.6} />
                               <Radar name="Neural Vector" dataKey="B" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                               <RechartsTooltip />
                             </RadarChart>
                           </ResponsiveContainer>
                         ) : null}
                      </div>
                      <div className="mt-6 flex justify-around">
                         <div className="text-center">
                            <p className="text-[10px] font-black text-teal-500">94.2%</p>
                            <p className="text-[7px] font-black uppercase text-slate-400 tracking-widest">Stability</p>
                         </div>
                         <div className="text-center">
                            <p className="text-[10px] font-black text-indigo-500">88.5%</p>
                            <p className="text-[7px] font-black uppercase text-slate-400 tracking-widest">Cohesion</p>
                         </div>
                      </div>
                   </motion.div>

                   <motion.div initial={{ opacity: 0, x: 0 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.65 }}
                     className="bg-white/70 dark:bg-[#080c14]/70 backdrop-blur-xl p-10 rounded-[3.5rem] border border-slate-200 dark:border-slate-800/60 shadow-xl group">
                     <div className="flex items-center justify-between mb-8">
                        <h3 className="text-sm font-black uppercase tracking-[0.3em] dark:text-white flex items-center gap-3 italic">
                         <Zap size={20} className="text-amber-500" /> Strategic Quick-Links
                        </h3>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: 'Induct Node', icon: Users, theme: CHART_GRADIENTS.indigo, action: () => { localStorage.setItem('provision_role', 'student'); setActiveTab('users'); } },
                          { label: 'Faculty Pulse', icon: Leaf, theme: CHART_GRADIENTS.emerald, action: () => setActiveTab('faculty-attendance') },
                          { label: 'Lattice Protocol', icon: Droplets, theme: CHART_GRADIENTS.teal, action: () => setActiveTab('courses') },
                          { label: 'Broadcast', icon: Megaphone, theme: CHART_GRADIENTS.rose, action: () => setActiveTab('global-alerts') },
                        ].map(btn => (
                           <button 
                              key={btn.label}
                              onClick={btn.action}
                              className="group/btn relative h-28 flex flex-col items-center justify-center bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-slate-800/60 hover:border-teal-500/30 hover:bg-white dark:hover:bg-teal-500/10 transition-all duration-500"
                           >
                              <btn.icon size={22} style={{ color: btn.theme.from }} className="mb-2 group-hover/btn:scale-110 transition-transform duration-500" />
                              <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{btn.label}</span>
                           </button>
                        ))}
                        <button className="col-span-2 py-4 bg-gradient-to-r from-teal-600 to-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] hover:scale-[1.02] transition-all shadow-xl shadow-teal-500/20 italic">
                           Deploy Neural Synthesis
                        </button>
                     </div>
                   </motion.div>

                   <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}
                     className="bg-white/70 dark:bg-[#080c14]/70 backdrop-blur-xl p-10 rounded-[3.5rem] border border-slate-200 dark:border-slate-800/60 shadow-xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 transition-opacity">
                         <Leaf size={120} className="text-emerald-500" />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-[0.3em] dark:text-white mb-8 italic">Identity Ignition</h3>
                      <div className="space-y-4 relative z-10">
                         {stats.recentUsers && stats.recentUsers.length > 0 ? stats.recentUsers.slice(0, 5).map((item, i) => (
                           <motion.div 
                              key={i} 
                              className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-slate-800/60 hover:bg-white dark:hover:bg-white/10 transition-all group/item"
                           >
                             <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 text-teal-500 group-hover/item:scale-110 transition-transform">
                                {item.profilePic ? <img src={item.profilePic} className="w-full h-full object-cover rounded-xl" alt="ID"/> : <Users size={18}/>}
                             </div>
                             <div className="truncate">
                                <p className="text-[10px] font-black dark:text-white text-slate-900 truncate tracking-tight">{item.name}</p>
                                <p className="text-[7px] font-black uppercase text-slate-400 tracking-widest">{item.role}</p>
                             </div>
                             <div className="ml-auto flex flex-col items-end">
                                <span className="text-[9px] font-black tabular-nums dark:text-teal-400 text-teal-600">{new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                <div className="w-1 h-1 rounded-full bg-teal-500" />
                             </div>
                           </motion.div>
                         )) : (
                            <div className="py-12 text-center opacity-30">
                               <Wind size={32} className="mx-auto mb-2 animate-bounce-subtle" />
                               <p className="text-[8px] font-black uppercase tracking-widest italic">Awaiting Ignition...</p>
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
            ) : activeTab === "faculty-attendance" ? (
              <motion.div key="attendance" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <AdminTeacherAttendance user={user} />
              </motion.div>
            ) : activeTab === 'faculty-monthly' ? (
              <motion.div key="fac-monthly" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <AdminFacultyMonthlyRegister user={user} />
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
            ) : activeTab === 'quizzes' ? (
              <motion.div key="quizzes" initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="space-y-6">
                 <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">MCQ Assessment Lab</h2>
                      <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-1">Manage institutional multiple choice assessments</p>
                    </div>
                    <button onClick={() => setQuizGenOpen(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-500 transition-all flex items-center gap-2">Deploy New MCQ <Plus size={14}/></button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {quizzes.map(q => (
                      <div key={q._id} className="bg-white dark:bg-[#080c14] p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800/60 shadow-sm hover:shadow-xl hover:border-indigo-500/30 transition-all group relative overflow-hidden">
                        <div className="flex items-center gap-4 mb-6">
                           <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all"><ClipboardList size={22}/></div>
                           <div>
                              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{q.title}</h3>
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{q.category}</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-8 mt-4 pt-6 border-t border-slate-100 dark:border-slate-800/60">
                           <div className="flex items-center gap-2">
                              <CheckCircle size={14} className="text-emerald-500" />
                              <span className="text-[10px] font-black text-slate-500 uppercase">{q.totalPoints} XP</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <Clock size={14} className="text-slate-400" />
                              <span className="text-[10px] font-black text-slate-500 uppercase">{q.timeLimit} Min</span>
                           </div>
                        </div>
                      </div>
                    ))}
                    {quizzes.length === 0 && (
                       <div className="col-span-full py-20 text-center opacity-30 italic font-black uppercase tracking-widest">No MCQ Assessments Found</div>
                    )}
                 </div>
              </motion.div>
            ) : activeTab === 'rewards' ? (
              <motion.div key="rewards" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <PrizeManager />
              </motion.div>
            ) : activeTab === 'ai-management' ? (
              <motion.div key="ai" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <AdminAiManagement user={user} />
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
            ) : activeTab === 'moderation' ? (
              <motion.div key="moderation" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <AdminAnnouncementModeration user={user} />
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
      <AnimatePresence>
        {quizGenOpen && <QuizGenerator onClose={() => setQuizGenOpen(false)} onSave={() => {
          const config = { headers: { Authorization: `Bearer ${user.token}` } };
          axios.get('http://localhost:5001/api/gamification/quizzes', config).then(r => setQuizzes(r.data));
        }} />}
      </AnimatePresence>
    </div>

  );
};

export default AdminDashboard;
