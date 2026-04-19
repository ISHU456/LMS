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
  const [todayAttendance, setTodayAttendance] = useState({});
  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);
  const [isMounted, setIsMounted] = useState(false);
  const [courseHistory, setCourseHistory] = useState([]);
  const navigate = useNavigate();

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user?.token) {
      setIsMounted(true);
      fetchStats();
      fetchLeaderboard();
     
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
        fetchActiveCourseStudents(res.data[activeCourseIndex]);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActiveCourseStudents = async (course) => {
    if (!course) return;
    setIsStudentsLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      // Parallel fetch students and today's attendance
      const [studentsRes, attendanceRes] = await Promise.all([
        axios.get(`http://localhost:5001/api/courses/${course.courseCode}/students`, config),
        axios.get(`http://localhost:5001/api/attendance/course/${course.courseId}?startDate=${todayStr}&endDate=${todayStr}`, config)
      ]);

      const attMap = {};
      (attendanceRes.data.attendanceRecords || []).forEach(rec => {
        attMap[rec.student?._id || rec.student] = rec.status;
      });

      setTodayAttendance(attMap);
      setActiveCourseStudents(studentsRes.data);
    } catch (error) {
      console.error('Error fetching course students/attendance:', error);
    } finally {
      setIsStudentsLoading(false);
    }
  };

  useEffect(() => {
    if (stats.length > 0 && stats[activeCourseIndex]) {
      const active = stats[activeCourseIndex];
      fetchActiveCourseStudents(active);
      fetchCourseHistory(active.courseId);
    }
  }, [activeCourseIndex]);

  const fetchCourseHistory = async (courseId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const res = await axios.get(`http://localhost:5001/api/attendance/course/${courseId}?startDate=${startDate}&endDate=${endDate}`, config);
      
      // Group by date and calculate daily percentage
      const records = res.data.attendanceRecords || [];
      const grouped = records.reduce((acc, rec) => {
        const d = new Date(rec.date).toLocaleDateString('en-US', { weekday: 'short' });
        if (!acc[d]) acc[d] = { total: 0, present: 0 };
        acc[d].total++;
        if (rec.status === 'present' || rec.status === 'late') acc[d].present++;
        return acc;
      }, {});

      const historyData = Object.entries(grouped).map(([day, val]) => ({
        d: day,
        p: Math.round((val.present / val.total) * 100),
        a: 100 - Math.round((val.present / val.total) * 100)
      })).reverse(); // Reverse to get chronological order if needed, but reduce/grouped keys might vary.

      setCourseHistory(historyData.length > 0 ? historyData : [
        { d: 'M', p: 85, a: 15 }, { d: 'T', p: 88, a: 12 }, { d: 'W', p: 82, a: 18 }, { d: 'T', p: 90, a: 10 }, { d: 'F', p: 85, a: 15 }
      ]);
    } catch (err) {
      console.error("Failed to fetch course history", err);
    }
  };

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
        semester: course.semester || 1,
        attendanceData: [{ studentId, status, remarks: 'Quick mark from dashboard' }]
      }, config);
      fetchActiveCourseStudents(course);
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
    { name: 'Blocked', value: 0, color: '#f43f5e' }
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[
          { label: 'Network Reach', value: totalStudents, trend: '+12%', icon: Users, accent: 'bg-indigo-50 text-indigo-600', color: '#4361ee' },
          { label: 'Avg Integrity', value: `${Math.round(avgAttendanceForAll)}%`, trend: '-0.4%', icon: CalendarDays, accent: 'bg-emerald-50 text-emerald-600', color: '#10b981' },
          { label: 'Access Barriers', value: totalBlocked + totalRestricted, trend: '+2', icon: ShieldAlert, accent: 'bg-amber-50 text-amber-600', color: '#f59e0b' },
          { label: 'Synergy Score', value: '88%', trend: '+5.2%', icon: Sparkles, accent: 'bg-purple-50 text-purple-600', color: '#7209b7' }
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-gray-900 p-5 lg:p-6 rounded-3xl lg:rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <div className={`p-2.5 lg:p-3 rounded-2xl ${s.accent}`}><s.icon size={18}/></div>
              <span className={`text-[8px] lg:text-[9px] font-black uppercase px-2 py-0.5 lg:py-1 rounded-full ${s.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                {s.trend}
              </span>
            </div>
            <p className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white tracking-tighter tabular-nums">{s.value}</p>
            <p className="text-[9px] lg:text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 italic">{s.label}</p>
            <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500 pointer-events-none">
               <s.icon size={80} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Col (1): Governance Nodes */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-500" /> Authorized Nodes
            </h3>
            <span className="text-[9px] font-black text-emerald-500 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-full">{stats.length}</span>
          </div>
          <div className="space-y-3 pr-2 custom-scrollbar max-h-[calc(100vh-280px)] overflow-y-auto">
            {stats.map((s, i) => (
              <motion.div key={`node-${s.courseId}`} onClick={() => setActiveCourseIndex(i)}
                whileHover={{ x: 6, scale: 1.01 }}
                className={`w-full p-6 rounded-[2.5rem] text-left transition-all border flex flex-col gap-4 group cursor-pointer ${activeCourseIndex === i ? 'bg-slate-900 dark:bg-white shadow-2xl scale-[1.02] border-transparent' : 'bg-white/80 dark:bg-gray-900/80 border-slate-100 dark:border-slate-800 backdrop-blur-sm'}`}>
                <div className="flex justify-between items-start">
                   <div className="flex flex-col">
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-lg border w-fit mb-2 ${activeCourseIndex === i ? 'bg-white/10 dark:bg-gray-100 border-white/20 dark:border-gray-200 text-white dark:text-gray-900' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                        {s.courseCode}
                      </span>
                      <h4 className={`text-xs font-black uppercase tracking-tight leading-tight ${activeCourseIndex === i ? 'text-white dark:text-gray-900' : 'text-gray-900 dark:text-white'}`}>
                        {s.courseName}
                      </h4>
                   </div>
                </div>
                <div className="flex items-center justify-between mt-1 pt-4 border-t border-dashed border-gray-100 dark:border-white/10">
                   <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${activeCourseIndex === i ? 'bg-emerald-400' : 'bg-emerald-500'}`} />
                      <span className={`text-[7px] font-black uppercase ${activeCourseIndex === i ? 'text-white/60 dark:text-gray-500' : 'text-gray-400'}`}>Access: Full</span>
                   </div>
                   <span className={`text-[7px] font-black uppercase ${activeCourseIndex === i ? 'text-emerald-400' : 'text-gray-300'}`}>Sem {s.semester}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Intelligence Sidebar (1) */}
        <div className="lg:col-span-1 space-y-6">
           {currentCourse ? (
             <>
               <div className="grid grid-cols-1 gap-3">
                  {[
                    { label: 'Unit Health', value: `${currentCourse.avgAttendance}%`, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Risk Factor', value: currentCourse.studentsBelow75, color: 'text-rose-500', bg: 'bg-rose-50' }
                  ].map((mini, midx) => (
                    <div key={midx} className={`${mini.bg} dark:bg-gray-900 dark:border dark:border-gray-800 p-4 rounded-[24px] text-center`}>
                       <p className={`text-xl font-black ${mini.color}`}>{mini.value}</p>
                       <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">{mini.label}</p>
                    </div>
                  ))}
               </div>
               <div className="bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
                  <h3 className="text-[9px] font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2"><TrendingUp size={12} className="text-indigo-500"/> Attendance Flux</h3>
                  <div className="h-[150px] w-full">
                     {isMounted && (
                       <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={courseHistory}>
                            <defs>
                              <linearGradient id="fluxGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4361ee" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#4361ee" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', background: '#020617', color: '#fff', fontSize: '10px' }} />
                            <Area type="monotone" dataKey="p" stroke="#4361ee" strokeWidth={3} fill="url(#fluxGrad)" dot={{ r: 3, fill: '#4361ee' }} />
                          </AreaChart>
                       </ResponsiveContainer>
                     )}
                  </div>
               </div>
               <div className="bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm">
                  <h3 className="text-[9px] font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2"><LayoutGrid size={12} className="text-emerald-500"/> Peer Comparison</h3>
                  <div className="h-[150px] w-full">
                     {isMounted && (
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats.slice(0, 5).map(s => ({ name: s.courseCode, val: s.avgAttendance }))}>
                             <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={7} />
                             <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '15px', border: 'none', background: '#020617', color: '#fff', fontSize: '10px' }} />
                             <Bar dataKey="val" radius={[5, 5, 5, 5]} barSize={15}>
                               {stats.slice(0, 5).map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={index === activeCourseIndex ? '#4361ee' : '#e2e8f0'} fillOpacity={index === activeCourseIndex ? 1 : 0.4} />
                               ))}
                             </Bar>
                          </BarChart>
                       </ResponsiveContainer>
                     )}
                  </div>
               </div>
             </>
           ) : (
             <div className="py-20 text-center animate-pulse">
                <LayoutGrid size={40} className="mx-auto text-gray-200 mb-4"/>
                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Initializing Hub...</p>
             </div>
           )}
        </div>

        {/* Center Col (2): Live Unit Matrix */}
        <div className="lg:col-span-2">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col h-full max-h-[calc(100vh-280px)]">
            <div className="flex items-center justify-between mb-8 shrink-0">
              <div>
                <h3 className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                  <ShieldCheck size={18} className="text-indigo-500"/> Live Unit Matrix
                </h3>
                <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-tighter italic">Synchronous student identity nodes</p>
              </div>
              <div className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl border border-indigo-100 dark:border-indigo-800/40">
                <span className="text-[10px] font-black text-indigo-500 tabular-nums">{activeCourseStudents.length} Nodes</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-0">
              {isStudentsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1,2,3,4,5,6].map(i => <div key={i} className="h-20 bg-gray-50 dark:bg-gray-800/40 rounded-[2rem] animate-pulse"/>)}
                </div>
              ) : activeCourseStudents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeCourseStudents.map((student, sidx) => {
                    const status = todayAttendance[student._id];
                    return (
                      <motion.div key={`unit-${student._id}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: sidx * 0.02 }}
                        className={`flex items-center justify-between p-4 rounded-[2rem] transition-all border group cursor-default
                          ${status === 'present' ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/40' : 
                            status === 'absent' ? 'bg-rose-50/50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-800/40' : 
                            'bg-gray-50/50 dark:bg-gray-800/20 border-transparent hover:border-gray-200 dark:hover:border-gray-700'}`}>
                        
                        <div className="flex items-center gap-4">
                          {/* Identity Node / Status Indicator */}
                          <button 
                            onClick={() => handleQuickMark(student._id, status === 'present' ? 'absent' : 'present')}
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs shadow-sm transition-all active:scale-90
                              ${status === 'present' ? 'bg-emerald-500 text-white' : 
                                status === 'absent' ? 'bg-rose-500 text-white' : 
                                'bg-white dark:bg-gray-700 text-gray-400 border border-gray-100 dark:border-gray-600 hover:border-indigo-500'}`}
                          >
                            {markingId === student._id ? (
                               <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                               status === 'present' ? 'P' : status === 'absent' ? 'A' : (student.profilePic ? <img src={student.profilePic} className="w-full h-full object-cover rounded-2xl" /> : student.name[0])
                            )}
                          </button>
                          
                          <div className="min-w-0">
                            <p className="text-[11px] font-black text-gray-900 dark:text-white uppercase truncate tracking-tight">{student.name}</p>
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{student.rollNumber}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                              onClick={() => handleQuickMark(student._id, 'present')} 
                              disabled={markingId === student._id}
                              className={`p-2 rounded-xl transition-all hover:scale-110 active:scale-95 ${status === 'present' ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-emerald-500'}`}
                           >
                             <Check size={10}/>
                           </button>
                           <button 
                              onClick={() => handleQuickMark(student._id, 'absent')} 
                              disabled={markingId === student._id}
                              className={`p-2 rounded-xl transition-all hover:scale-110 active:scale-95 ${status === 'absent' ? 'bg-rose-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-rose-500'}`}
                           >
                             <X size={10}/>
                           </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-24 px-8 text-gray-300">
                   <ShieldOff size={48} className="mx-auto mb-4 opacity-40"/>
                   <p className="text-[10px] font-black uppercase tracking-widest">Select Course To View Nodes</p>
                </div>
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800 shrink-0">
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2"><Trophy size={14} className="text-amber-500"/> Global Top Achievers</h3>
                 <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest italic">Institutional Ranking</span>
               </div>
               <div className="flex items-center gap-3 overflow-x-auto pb-4 custom-scrollbar">
                 {globalLeaderboard.slice(0, 5).map((l, i) => (
                   <div key={`leader-${i}`} className="flex-shrink-0 flex items-center gap-3 p-3 rounded-2xl bg-amber-50/5 dark:bg-amber-900/10 border border-amber-100/50 dark:border-amber-900/40">
                      <div className="w-8 h-8 rounded-xl bg-white dark:bg-amber-900 flex items-center justify-center font-black text-[10px] text-amber-600 border border-amber-200">#{i+1}</div>
                      <div className="min-w-0 pr-4">
                         <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase truncate">{l.name}</p>
                         <p className="text-[8px] font-bold text-amber-600 uppercase tracking-tighter">{l.totalAttendance}% Sync</p>
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

const UserMinus = ({ size, className }) => <Users size={size} className={className} />;

export default DashboardOverview;