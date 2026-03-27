import { useState, useEffect } from 'react';
import { Book, Users, Building, Shield, Activity, Bell, Home, Settings, Search, Zap, CalendarDays, X, Save, TrendingUp, BrainCircuit } from 'lucide-react';
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
import { motion, AnimatePresence } from 'framer-motion';

const AdminDashboard = () => {
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('adminActiveTab') || 'overview');
  const [isLoading, setIsLoading] = useState(true);
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
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab);
    fetchStats();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/admin/stats', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch statistics");
    }
  };

  const menuItems = [
    { id: 'overview', icon: Home, label: 'System Overview' },
    { id: 'users', icon: Users, label: 'User Management Hub' },
    { id: 'faculty-attendance', icon: CalendarDays, label: 'Faculty Presence' },
    { id: 'courses', icon: Book, label: 'Academic Lattice' },
    { id: 'global-alerts', icon: Bell, label: 'Global Broadcasts' },
    { id: 'results-hub', icon: TrendingUp, label: 'Results & Transcripts' },
    { id: 'ai-management', icon: BrainCircuit, label: 'Neural Governance Hub' },
    { id: 'system', icon: Settings, label: 'System Settings' },
  ];

  const pieData = [
    { name: 'Students', value: 1200 },
    { name: 'Faculty', value: 100 },
    { name: 'Others', value: 50 },
  ];
  const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b'];

  if (isLoading) return (
    <div className="flex min-h-[calc(100vh-73px)] flex-col lg:flex-row bg-gray-50 p-4 md:p-8 gap-6 animate-pulse">
       <div className="w-full lg:w-64 bg-gray-200 rounded-2xl h-48 lg:h-full"></div>
       <div className="flex-1 bg-gray-200 rounded-2xl h-56 lg:h-full"></div>
    </div>
  );

  return (
    <div className="flex min-h-[calc(100vh-73px)] flex-col lg:flex-row bg-gray-50 dark:bg-[#0f172a]">
      <aside className="w-full lg:w-64 glass border-b lg:border-r border-gray-200 dark:border-gray-800 flex flex-col p-4 space-y-2 overflow-y-auto max-h-[40vh] lg:max-h-none">
        {menuItems.map(item => (
           <button 
             key={item.id} 
             onClick={() => {
               if (item.id === 'ai-management') navigate('/admin/ai-management');
               else setActiveTab(item.id);
             }} 
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === item.id ? 'bg-red-50 text-red-600 dark:bg-red-900/40 dark:text-red-400' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'}`}
           >
              <item.icon size={20} /> {item.label}
           </button>
        ))}
      </aside>
      
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="mb-8 flex justify-between items-center">
           <div>
             <h1 className="text-3xl font-extrabold dark:text-white capitalize">{menuItems.find(i=>i.id===activeTab)?.label}</h1>
             <p className="text-gray-500 dark:text-gray-400 mt-1">Logged in securely as <span className="uppercase font-bold text-red-500">Administrator</span></p>
           </div>
           
           <div className="flex gap-4">
              <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md transition">
                <Search size={18} className="text-gray-500" /> <span className="text-sm font-medium dark:text-gray-300">Global Search</span>
              </button>
           </div>
        </header>

        <AnimatePresence mode="wait">
        {activeTab === 'overview' ? (
          <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Total identities', value: stats.users, icon: Users, color: 'blue', border: 'border-l-blue-500' },
                { label: 'Academic Sectors', value: stats.departments, icon: Building, color: 'purple', border: 'border-l-purple-500' },
                { label: 'Active Requests', value: stats.pendingApprovals, icon: Zap, color: 'amber', border: 'border-l-amber-500' },
                { label: 'Faculty Presence', value: `${stats.attendance}%`, icon: Activity, color: 'emerald', border: 'border-l-emerald-500' },
              ].map((s, idx) => (
                <motion.div 
                  key={s.label} 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: idx * 0.1 }}
                  className={`glass p-6 rounded-3xl border-l-[6px] ${s.border} shadow-sm hover:shadow-xl transition-all group cursor-default`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{s.label}</p>
                      <h3 className="text-3xl font-black dark:text-white group-hover:scale-110 transition-transform origin-left">{s.value}</h3>
                    </div>
                    <div className={`p-3 rounded-2xl bg-${s.color}-50 dark:bg-${s.color}-900/20 text-${s.color}-500 group-hover:rotate-12 transition-transform`}>
                      <s.icon size={24} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
                 className="glass p-8 rounded-[32px] shadow-lg border border-gray-100 dark:border-gray-800">
                 <h3 className="text-xs font-black uppercase tracking-[0.2em] dark:text-white mb-8 italic">User Demographics</h3>
                 <div className="h-[280px] w-full min-w-0">
                    {isMounted && (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={stats.demographics} 
                            cx="50%" cy="50%" 
                            innerRadius={70} outerRadius={90} 
                            paddingAngle={8} dataKey="value"
                            stroke="none"
                          >
                            {stats.demographics.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                          <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', fontWeight: '900', fontSize: '10px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                 </div>
                 <div className="flex justify-center gap-4 mt-4">
                    {stats.demographics.map((d, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-[9px] font-black uppercase text-gray-500">{d.name}</span>
                      </div>
                    ))}
                 </div>
               </motion.div>

               <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
                 className="glass p-8 rounded-[32px] shadow-lg border border-gray-100 dark:border-gray-800 lg:col-span-2">
                 <h3 className="text-xs font-black uppercase tracking-[0.2em] dark:text-white mb-8 italic">Departmental Distribution</h3>
                 <div className="h-[280px] w-full min-w-0">
                    {isMounted && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.deptPopulation}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                          <RechartsTooltip cursor={{fill: 'rgba(59, 130, 246, 0.05)', radius: 12}} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                          <Bar 
                            dataKey="students" 
                            fill="url(#colorBar)" 
                            radius={[12, 12, 0, 0]} 
                            barSize={40}
                          />
                          <defs>
                            <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#dc2626" stopOpacity={1}/>
                            </linearGradient>
                          </defs>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                 </div>
               </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
               <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
                 className="glass p-10 rounded-[40px] border border-gray-100 dark:border-gray-800">
                 <h3 className="text-xs font-black uppercase tracking-[0.2em] dark:text-white mb-8 flex items-center gap-2">
                    <Zap size={16} className="text-red-600" /> Administrative Quick-Launch
                 </h3>
                 <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Add Student', color: 'blue', action: () => setActiveTab('users') },
                      { label: 'Add Faculty', color: 'purple', action: () => setActiveTab('users') },
                      { label: 'Lattice Sync', color: 'emerald', action: () => setActiveTab('courses') },
                      { label: 'Broadcast', color: 'rose', action: () => {} },
                    ].map(btn => (
                       <button 
                        key={btn.label}
                        onClick={btn.action}
                        className={`p-6 bg-${btn.color}-50 dark:bg-${btn.color}-900/10 text-${btn.color}-600 rounded-[24px] font-black uppercase tracking-widest text-[10px] hover:bg-${btn.color}-600 hover:text-white transition-all transform hover:-translate-y-1 hover:shadow-xl active:scale-95`}
                      >
                        {btn.label}
                      </button>
                    ))}
                    <button 
                      onClick={() => navigate('/admin/ai-management')}
                      className="p-6 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 rounded-[24px] font-black uppercase tracking-widest text-[10px] hover:bg-indigo-600 hover:text-white transition-all transform hover:-translate-y-1 hover:shadow-xl active:scale-95 col-span-2"
                    >
                      Neural Governance Hub
                    </button>
                 </div>
               </motion.div>

               <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}
                 className="glass p-10 rounded-[40px] border border-gray-100 dark:border-gray-800">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] dark:text-white mb-8 italic">Neural Identity Stream (Latest Joinees)</h3>
                  <div className="space-y-6">
                     {stats.recentUsers && stats.recentUsers.length > 0 ? stats.recentUsers.map((item, i) => (
                       <div key={i} className="flex items-center gap-4 group">
                         <div className={`w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-100 dark:border-gray-700`}>
                            {item.profilePic ? <img src={item.profilePic} className="w-full h-full object-cover"/> : <Users size={14} className="text-gray-400"/>}
                         </div>
                         <div>
                            <p className="text-xs font-black dark:text-white group-hover:text-red-500 transition-colors capitalize">{item.name}</p>
                            <p className="text-[9px] font-black uppercase text-gray-400">{item.role}</p>
                         </div>
                         <span className="text-[9px] font-black uppercase text-gray-400 ml-auto tabular-nums">{new Date(item.createdAt).toLocaleDateString()}</span>
                       </div>
                     )) : (
                        <div className="py-20 text-center opacity-30 text-[10px] font-black uppercase tracking-widest">No Recent Transmission Logs</div>
                     )}
                  </div>
               </motion.div>
            </div>

            {/* LEADERBOARD & GROWTH */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pb-20">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
                className="glass p-10 rounded-[40px] border border-gray-100 dark:border-gray-800 xl:col-span-2">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] dark:text-white flex items-center gap-2">
                    <Activity size={16} className="text-emerald-500" /> Identity Growth Timeline
                  </h3>
                  <div className="flex gap-4">
                    <div className="text-right">
                      <p className="text-[9px] font-black text-gray-400 uppercase">Weekly Delta</p>
                      <p className="text-sm font-black text-emerald-500 flex items-center gap-1">+{stats.growth?.weekly || 0} <Zap size={10}/></p>
                    </div>
                  </div>
                </div>
                <div className="h-[300px] w-full min-w-0">
                  {isMounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.timeline}>
                        <defs>
                          <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8' }} />
                        <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', fontWeight: '900', fontSize: '10px' }} />
                        <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorGrowth)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
                className="glass p-10 rounded-[40px] border border-gray-100 dark:border-gray-800 bg-gradient-to-br from-blue-50/20 to-transparent">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] dark:text-white mb-8 flex items-center gap-2 italic">
                  <TrendingUp size={16} className="text-blue-500" /> Achievement Leaderboard
                </h3>
                <div className="space-y-6">
                  {stats.leaderboard && stats.leaderboard.length > 0 ? stats.leaderboard.map((student, i) => (
                    <div key={student._id} className="flex items-center gap-4 group">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center font-black text-[10px] text-blue-600">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] font-black dark:text-white text-gray-800 group-hover:text-blue-500 transition-colors uppercase whitespace-nowrap overflow-hidden overflow-ellipsis max-w-[120px]">{student.name}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase">{student.department} • SEM {student.semester}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-blue-500">{student.credits || 0}</p>
                        <p className="text-[8px] font-black text-gray-400 uppercase">CREDITS</p>
                      </div>
                    </div>
                  )) : (
                     <div className="py-20 text-center opacity-30 text-[10px] font-black uppercase tracking-widest">Awaiting Identity Calibration</div>
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
        ) : activeTab === 'system' ? (
          <motion.div key="system" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <AdminSystemSettings user={user} />
          </motion.div>
        ) : (
          <div className="flex bg-gray-100 dark:bg-gray-900/50 h-[50vh] items-center justify-center text-gray-500 rounded-2xl">
            Secure Implementation Area for {activeTab}
          </div>
        )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default AdminDashboard;
