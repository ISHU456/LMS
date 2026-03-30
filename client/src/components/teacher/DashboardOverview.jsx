import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, BookOpen, Clock, AlertTriangle, 
  TrendingUp, TrendingDown, LayoutGrid, 
  CalendarDays, ChevronRight, ArrowUpRight,
  ShieldCheck, ShieldAlert, ShieldOff, Sparkles, Bell, Check, X,
  FileText, Trophy
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area,
  Cell, PieChart, Pie
} from 'recharts';

const DashboardOverview = ({ user }) => {
  const [stats, setStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCourseIndex, setActiveCourseIndex] = useState(0);
  const [activeCourseStudents, setActiveCourseStudents] = useState([]);
  const [isStudentsLoading, setIsStudentsLoading] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);
  const [isMounted, setIsMounted] = useState(false);
  const navigate = useNavigate();

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user?.token) {
      setIsMounted(true);
      fetchStats();
      fetchLeaderboard();
      // Real-time update simulation (or setup polling/socket listener)
      const interval = setInterval(() => {
        fetchStats();
        fetchLeaderboard();
      }, 60000); // 1-minute updates
      return () => clearInterval(interval);
    }
  }, [user?.token]);

  const fetchLeaderboard = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/auth/leaderboard');
      setGlobalLeaderboard(res.data);
    } catch (err) {
      console.error("Failed to fetch leaderboard in dashboard overview");
    }
  };

  const fetchStats = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get('http://localhost:5001/api/attendance/stats/teacher', config);
      setStats(res.data);
      if (res.data.length > 0) {
        fetchActiveCourseStudents(res.data[activeCourseIndex].courseCode);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActiveCourseStudents = async (courseCode) => {
    setIsStudentsLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get(`http://localhost:5001/api/courses/${courseCode}/students`, config);
      setActiveCourseStudents(res.data);
    } catch (error) {
      console.error('Error fetching course students:', error);
    } finally {
      setIsStudentsLoading(false);
    }
  };

  useEffect(() => {
    if (stats.length > 0 && stats[activeCourseIndex]) {
      fetchActiveCourseStudents(stats[activeCourseIndex].courseCode);
    }
  }, [activeCourseIndex]);

  const totalStudents = stats.reduce((acc, curr) => acc + curr.studentCount, 0);
  const totalRestricted = stats.reduce((acc, curr) => acc + curr.restrictedStudents, 0);
  const totalBlocked = stats.reduce((acc, curr) => acc + (curr.blockedStudents || 0), 0);
  const totalLowAttendance = stats.reduce((acc, curr) => acc + curr.studentsBelow75, 0);
  const avgAttendanceForAll = stats.length > 0 
    ? stats.reduce((acc, curr) => acc + curr.avgAttendance, 0) / stats.length 
    : 0;

  const handleQuickMark = async (studentId, status) => {
    setMarkingId(studentId);
    try {
      const course = stats[activeCourseIndex];
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post('http://localhost:5001/api/attendance/bulk-mark', {
        courseId: course.courseId,
        date: todayStr,
        semester: course.semester || 1, // Defaulting to 1 if not found
        attendanceData: [{ studentId, status, remarks: 'Quick mark from dashboard' }]
      }, config);
      // Refresh students to reflect updated progress/stats if needed
      fetchActiveCourseStudents(course.courseCode);
      fetchStats(); 
    } catch (error) {
      console.error('Error in quick mark:', error);
    } finally {
      setMarkingId(null);
    }
  };

  const currentCourse = stats[activeCourseIndex] || null;

  // Pie chart data
  const pieData = currentCourse ? [
    { name: 'Active', value: currentCourse.activeStudents, color: '#10b981' },
    { name: 'Restricted', value: currentCourse.restrictedStudents, color: '#f59e0b' },
    { name: 'Blocked', value: 0, color: '#f43f5e' } // For demo
  ].filter(d => d.value > 0) : [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse p-8">
        {[1,2,3,4].map(i => <div key={i} className="h-40 bg-gray-100 dark:bg-gray-800 rounded-[32px]"/>)}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Alert Banner for Low Attendance */}
      {totalLowAttendance > 0 && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-3xl bg-rose-50 dark:bg-rose-900/30 border border-rose-100 dark:border-rose-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-200">
              <Bell size={20} className="animate-bounce" />
            </div>
            <div>
              <p className="text-sm font-black text-rose-900 dark:text-rose-100 uppercase tracking-tight">System Notice: Immediate Action Required</p>
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mt-0.5">{totalLowAttendance} students have dropped below 75% attendance. Threshold security active.</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all shadow-md">
            Execute Filter
          </button>
        </motion.div>
      )}

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Network Reach', value: totalStudents, trend: '+12%', icon: Users, accent: 'bg-indigo-50 text-indigo-600', color: '#4361ee' },
          { label: 'Avg Integrity', value: `${Math.round(avgAttendanceForAll)}%`, trend: '-0.4%', icon: CalendarDays, accent: 'bg-emerald-50 text-emerald-600', color: '#10b981' },
          { label: 'Access Barriers', value: totalBlocked + totalRestricted, trend: '+2', icon: ShieldAlert, accent: 'bg-amber-50 text-amber-600', color: '#f59e0b' },
          { label: 'Synergy Score', value: '88%', trend: '+5.2%', icon: Sparkles, accent: 'bg-purple-50 text-purple-600', color: '#7209b7' }
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-6">
              <div className={`p-3 rounded-2xl ${s.accent}`}><s.icon size={20}/></div>
              <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${s.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                {s.trend}
              </span>
            </div>
            <p className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter tabular-nums">{s.value}</p>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 italic">{s.label}</p>
            <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500 pointer-events-none">
               <s.icon size={120} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left: Authorized Governance Nodes Matrix */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-500" /> Authorized Governance Nodes
            </h3>
            <span className="text-[9px] font-black text-emerald-500 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-full">{stats.length} Active</span>
          </div>
          <div className="space-y-3 h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {stats.map((s, i) => (
              <motion.div key={s.courseId} onClick={() => setActiveCourseIndex(i)}
                whileHover={{ x: 4 }}
                className={`w-full p-6 rounded-[32px] text-left transition-all border flex flex-col gap-4 group cursor-pointer ${activeCourseIndex === i ? 'bg-gray-900 dark:bg-white dark:text-gray-900 text-white shadow-2xl scale-105' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-emerald-300'}`}>
                <div className="flex justify-between items-start">
                   <div className="flex flex-col">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border w-fit mb-2 ${activeCourseIndex === i ? 'bg-white/10 border-white/20 text-white dark:bg-gray-100 dark:text-gray-900' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                        {s.courseCode}
                      </span>
                      <h4 className={`text-sm font-black uppercase tracking-tight leading-tight ${activeCourseIndex === i ? 'text-white dark:text-gray-900' : 'text-gray-900 dark:text-white'}`}>
                        {s.courseName}
                      </h4>
                   </div>
                   <div className={`p-2 rounded-2xl transition-all ${activeCourseIndex === i ? 'bg-white/10 text-white dark:text-gray-300 shadow-inner' : 'bg-gray-50 text-emerald-500'}`}>
                      <ShieldCheck size={18}/>
                   </div>
                </div>
                
                <div className="flex items-center justify-between mt-2 pt-4 border-t border-dashed border-gray-100 dark:border-white/10">
                   <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full animate-pulse ${activeCourseIndex === i ? 'bg-emerald-400' : 'bg-emerald-500'}`} />
                      <span className={`text-[8px] font-black uppercase tracking-widest ${activeCourseIndex === i ? 'text-gray-400' : 'text-gray-400'}`}>Access: Full Admin</span>
                   </div>
                   <span className={`text-[8px] font-black uppercase ${activeCourseIndex === i ? 'text-emerald-400' : 'text-gray-300'}`}>Semester {s.semester}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Center: Interactive Intelligence Hub */}
        <div className="lg:col-span-2 space-y-8">
           {currentCourse ? (
             <>
               {/* Quick Intelligence Summary */}
               <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Unit Health', value: `${currentCourse.avgAttendance}%`, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Risk Factor', value: currentCourse.studentsBelow75, color: 'text-rose-500', bg: 'bg-rose-50' },
                    { label: 'Isolation', value: currentCourse.restrictedStudents, color: 'text-amber-500', bg: 'bg-amber-50' }
                  ].map((mini, midx) => (
                    <div key={midx} className={`${mini.bg} dark:bg-gray-900 dark:border dark:border-gray-800 p-4 rounded-[28px] text-center`}>
                       <p className={`text-xl font-black ${mini.color}`}>{mini.value}</p>
                       <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">{mini.label}</p>
                    </div>
                  ))}
               </div>


               {/* Multi-Metric Visualization Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Stacked Attendance Velocity */}
                 <div className="bg-white dark:bg-gray-900 p-8 rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                       <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2"><TrendingUp size={14} className="text-indigo-500"/> Attendance Flux</h3>
                       <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md uppercase">14-Day Cycle</span>
                    </div>
                    <div className="h-[200px] w-full">
                       {isMounted && (
                         <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={[
                              { d: 'M', p: 85, a: 15 }, { d: 'T', p: 88, a: 12 }, { d: 'W', p: 82, a: 18 }, { d: 'T', p: 90, a: 10 }, { d: 'F', p: 85, a: 15 }, 
                              { d: 'S', p: 78, a: 22 }, { d: 'M', p: 92, a: 8 }, { d: 'T', p: 89, a: 11 }
                            ]}>
                              <defs>
                                <linearGradient id="fluxGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#4361ee" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#4361ee" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', background: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)' }} />
                              <Area type="monotone" dataKey="p" stroke="#4361ee" strokeWidth={4} fill="url(#fluxGrad)" />
                            </AreaChart>
                         </ResponsiveContainer>
                       )}
                    </div>
                 </div>

                 {/* Bar Chart: Subject Integrity Comparison */}
                 <div className="bg-white dark:bg-gray-900 p-8 rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                       <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2"><LayoutGrid size={14} className="text-emerald-500"/> Peer Comparison</h3>
                       <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Global Avg: 82%</span>
                    </div>
                    <div className="h-[200px] w-full">
                       {isMounted && (
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.slice(0, 5).map(s => ({ name: s.courseCode, val: s.avgAttendance }))}>
                               <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={8} />
                               <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '20px', border: 'none', background: '#000', color: '#fff' }} />
                               <Bar dataKey="val" radius={[8, 8, 8, 8]} barSize={20}>
                                 {stats.map((entry, index) => (
                                   <Cell key={`cell-${index}`} fill={index === activeCourseIndex ? '#4361ee' : '#e2e8f0'} />
                                 ))}
                               </Bar>
                            </BarChart>
                         </ResponsiveContainer>
                       )}
                    </div>
                 </div>
               </div>
             </>
           ) : (
             <div className="py-40 text-center animate-pulse">
                <LayoutGrid size={48} className="mx-auto text-gray-200 mb-4"/>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Initializing Neural Dashboard...</p>
             </div>
           )}
        </div>

        {/* Right: Active Units Action Sidebar */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white dark:bg-gray-900 p-6 rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col h-[600px]">
             <div className="flex items-center justify-between mb-6 shrink-0">
               <div>
                 <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Live Unit Matrix</h3>
                 <p className="text-[8px] font-bold text-gray-400 mt-0.5 uppercase tracking-tighter">Real-time status updates</p>
               </div>
               <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full uppercase tabular-nums">{activeCourseStudents.length}</span>
             </div>
             
             <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
               {isStudentsLoading ? (
                 [1,2,3,4,5,6].map(i => <div key={i} className="h-16 bg-gray-50 dark:bg-gray-800/40 rounded-3xl animate-pulse"/>)
               ) : activeCourseStudents.length > 0 ? (
                 activeCourseStudents.map((student, sidx) => (
                   <motion.div key={student._id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: sidx * 0.05 }}
                     className="flex items-center justify-between p-3 rounded-3xl hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all border border-transparent hover:border-gray-100 group">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center font-black text-gray-400 group-hover:bg-white dark:group-hover:bg-gray-700 transition-all text-xs border border-transparent group-hover:border-gray-100">
                         {student.profilePic ? <img src={student.profilePic} className="w-full h-full object-cover rounded-2xl" /> : student.name[0]}
                       </div>
                       <div className="min-w-0">
                         <p className="text-[11px] font-black text-gray-900 dark:text-white uppercase truncate tracking-tight">{student.name}</p>
                         <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{student.rollNumber}</p>
                       </div>
                     </div>
                     <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                        {markingId === student._id ? (
                          <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <button onClick={() => handleQuickMark(student._id, 'present')} className="p-2 rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-200 dark:shadow-none transition-all hover:scale-105 active:scale-95"><Check size={10}/></button>
                            <button onClick={() => handleQuickMark(student._id, 'absent')} className="p-2 rounded-xl bg-rose-500 text-white shadow-lg shadow-rose-200 dark:shadow-none transition-all hover:scale-105 active:scale-95"><X size={10}/></button>
                          </>
                        )}
                     </div>
                   </motion.div>
                 ))
               ) : (
                 <div className="text-center py-20 px-8">
                    <ShieldOff size={40} className="mx-auto text-gray-200 mb-4 opacity-40"/>
                    <p className="text-[9px] font-black text-gray-300 uppercase leading-relaxed tracking-widest">Select a synchronization node to view units</p>
                 </div>
               )}
             </div>

              <button 
               onClick={() => navigate('/attendance')}
               className="mt-6 w-full py-4 bg-gray-900 dark:bg-white dark:text-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-[2rem] hover:opacity-90 hover:-translate-y-1 active:translate-y-0 transition-all shadow-2xl shadow-gray-200 dark:shadow-none shrink-0">
                Access Full Control View
              </button>

              <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800 shrink-0">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2"><Trophy size={14} className="text-amber-500"/> Global Top Achievers</h3>
                   <span className="text-[8px] font-black text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full uppercase italic">Performance XP</span>
                </div>
                <div className="space-y-4">
                   {globalLeaderboard.slice(0, 5).map((l, lidx) => (
                     <div key={l._id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-[10px] font-black text-gray-400 border border-transparent group-hover:border-amber-200 transition-all">
                              {lidx + 1}
                           </div>
                           <div className="min-w-0">
                              <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase truncate tracking-tight">{l.name}</p>
                              <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">{l.department} · SEM {l.semester}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black text-amber-500">{l.xp}</p>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const UserMinus = ({ size, className }) => <Users size={size} className={className} />; // Placeholder for specific icons if needed

export default DashboardOverview;
