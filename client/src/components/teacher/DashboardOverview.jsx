import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, BookOpen, Clock, AlertTriangle, 
  TrendingUp, TrendingDown, LayoutGrid, 
  CalendarDays, ChevronRight, ArrowUpRight,
  ShieldCheck, ShieldAlert, ShieldOff, Sparkles, Bell, Check, X,
  FileText
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
  const navigate = useNavigate();

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user?.token) {
      fetchStats();
      // Real-time update simulation (or setup polling/socket listener)
      const interval = setInterval(fetchStats, 60000); // 1-minute updates
      return () => clearInterval(interval);
    }
  }, [user?.token]);

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
              <p className="text-sm font-black text-rose-900 dark:text-rose-100 uppercase tracking-tight">Critical Alert: Attention Required</p>
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mt-0.5">{totalLowAttendance} students have dropped below 75% attendance threshold.</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all shadow-md">
            Review List
          </button>
        </motion.div>
      )}

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Enrolled', value: totalStudents, sub: 'Across subjects', icon: Users, color: '#4361ee', accent: 'bg-indigo-50 text-indigo-600' },
          { label: 'Avg Attendance', value: `${Math.round(avgAttendanceForAll)}%`, sub: 'Current Semester', icon: CalendarDays, color: '#10b981', accent: 'bg-emerald-50 text-emerald-600' },
          { label: 'Total Conflicts', value: totalBlocked + totalRestricted, sub: `${totalBlocked} Blocked / ${totalRestricted} Restricted`, icon: ShieldAlert, color: '#f59e0b', accent: 'bg-amber-50 text-amber-600' },
          { label: 'Performance', value: '88%', sub: 'Avg engagement', icon: Sparkles, color: '#7209b7', accent: 'bg-purple-50 text-purple-600' }
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all cursor-default relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform`}>
              <s.icon size={110} />
            </div>
            <div className="flex items-center justify-between mb-6">
              <div className={`p-3 rounded-2xl ${s.accent}`}><s.icon size={20}/></div>
              {i === 1 && <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full"><TrendingUp size={10} className="inline mr-1"/>+2.4%</span>}
            </div>
            <p className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter tabular-nums">{s.value}</p>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">{s.label}</p>
            <p className="text-[9px] font-bold text-gray-300 dark:text-gray-600 uppercase mt-1 italic tracking-widest">{s.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Subject-wise Cards List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Your Subjects</h3>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{stats.length} Subjects</span>
          </div>
          <div className="space-y-3">
            {stats.map((s, i) => (
              <motion.div key={s.courseId} onClick={() => setActiveCourseIndex(i)}
                whileHover={{ x: 4 }}
                className={`w-full p-5 rounded-[28px] text-left transition-all border flex items-center justify-between gap-4 group cursor-pointer ${activeCourseIndex === i ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-200 dark:shadow-indigo-900/40' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-indigo-300'}`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${activeCourseIndex === i ? 'bg-white/20 border-white/20 text-white' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>{s.courseCode}</span>
                    <span className={`text-[9px] font-black uppercase ${activeCourseIndex === i ? 'text-indigo-200' : 'text-gray-400'}`}>{s.studentCount} Students Enrolled</span>
                  </div>
                  <h4 className={`text-sm font-black uppercase truncate ${activeCourseIndex === i ? 'text-white' : 'text-gray-900 dark:text-white'}`}>{s.courseName}</h4>
                </div>
                <div className="flex flex-col gap-2">
                  <div className={`p-2 rounded-xl transition-all ${activeCourseIndex === i ? 'bg-white/10 text-white rotate-90' : 'bg-gray-50 text-gray-300 group-hover:text-indigo-500'}`}>
                     <ChevronRight size={16}/>
                  </div>
                  <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/results/entry?courseId=${s.courseId}&semester=${s.semester}`);
                  }}
                  className={`p-2 rounded-xl transition-all ${activeCourseIndex === i ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-500'}`}
                  title="Go to Grading"
                  >
                    <FileText size={16}/>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Analytics Section */}
        <div className="lg:col-span-2 space-y-6">
          {currentCourse && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pie Chart: Access Distribution */}
              <div className="bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-indigo-500"/> Course Access State
                </h3>
                <div className="h-[200px] w-full flex items-center">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 pr-6">
                     {pieData.map(d => (
                       <div key={d.name} className="flex items-center gap-2">
                         <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}/>
                         <span className="text-[10px] font-black text-gray-500 uppercase">{d.name}: {d.value}</span>
                       </div>
                     ))}
                  </div>
                </div>
              </div>

              {/* Bar Chart: Quick Stats Component */}
              <div className="bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                   <AlertTriangle size={14} className="text-amber-500"/> Critical Metrics
                </h3>
                <div className="space-y-5">
                   {[
                     { label: 'Avg Attendance', value: currentCourse.avgAttendance, color: '#4361ee', icon: Clock },
                     { label: 'Students Below 75%', value: Math.round((currentCourse.studentsBelow75 / currentCourse.studentCount) * 100) || 0, color: '#f43f5e', icon: UserMinus },
                     { label: 'Restricted Students', value: Math.round((currentCourse.restrictedStudents / currentCourse.studentCount) * 100) || 0, color: '#f59e0b', icon: ShieldAlert },
                     { label: 'Blocked Students', value: Math.round((currentCourse.blockedStudents / currentCourse.studentCount) * 100) || 0, color: '#f43f5e', icon: ShieldOff }
                   ].map((item, idx) => (
                     <div key={idx}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                            <item.icon size={12} style={{ color: item.color }}/> {item.label}
                          </span>
                          <span className="text-[11px] font-black tabular-nums" style={{ color: item.color }}>{item.value}%</span>
                        </div>
                        <div className="h-2 bg-gray-50 dark:bg-gray-800 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${item.value}%` }} transition={{ duration: 0.8, delay: idx * 0.1 }}
                            className="h-full rounded-full" style={{ backgroundColor: item.color }}/>
                        </div>
                     </div>
                   ))}
                </div>
              </div>

              {/* Attendance Trends (Fake data for visualization) */}
              <div className="md:col-span-2 bg-white dark:bg-gray-900 p-8 rounded-[36px] border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                      <TrendingUp size={18} className="text-indigo-500"/> Attendance Velocity
                    </h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Growth trends over the last 14 days</p>
                  </div>
                  <div className="flex items-center gap-2 p-1 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <span className="px-3 py-1 bg-white dark:bg-gray-700 rounded-lg text-[9px] font-black uppercase text-indigo-600 shadow-sm">14 Days</span>
                    <span className="px-3 py-1 text-[9px] font-black uppercase text-gray-400">30 Days</span>
                  </div>
                </div>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <AreaChart data={[
                      { name: 'W1 D1', val: 82 }, { name: 'D2', val: 78 }, { name: 'D3', val: 85 }, 
                      { name: 'D4', val: 92 }, { name: 'D5', val: 88 }, { name: 'D6', val: 80 }, 
                      { name: 'W2 D1', val: 84 }, { name: 'D2', val: 89 }, { name: 'D3', val: 95 }, 
                      { name: 'D4', val: 91 }, { name: 'D5', val: 93 }, { name: 'D6', val: 96 }
                    ]}>
                      <defs>
                        <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4361ee" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#7209b7" stopOpacity={0.01}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB66" />
                      <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} />
                      <Area type="monotone" dataKey="val" stroke="#4361ee" strokeWidth={3} fillOpacity={1} fill="url(#velocityGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Active Students List */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col h-full max-h-[800px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Active Students</h3>
              <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full uppercase">{activeCourseStudents.length} Students</span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
              {isStudentsLoading ? (
                [1,2,3,4,5].map(i => <div key={i} className="h-16 bg-gray-50 dark:bg-gray-800 rounded-2xl animate-pulse"/>)
              ) : activeCourseStudents.length > 0 ? (
                activeCourseStudents.map((student) => (
                  <motion.div key={student._id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all border border-transparent hover:border-gray-100 group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center font-black text-indigo-600 border border-indigo-100 text-xs">
                        {student.profilePic ? <img src={student.profilePic} className="w-full h-full object-cover rounded-xl" /> : student.name[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-gray-900 dark:text-white uppercase truncate tracking-tight">{student.name}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{student.rollNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       {markingId === student._id ? (
                         <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                       ) : (
                         <>
                           <button onClick={() => handleQuickMark(student._id, 'present')} title="Mark Present"
                             className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all">
                             <Check size={12}/>
                           </button>
                           <button onClick={() => handleQuickMark(student._id, 'absent')} title="Mark Absent"
                             className="p-2 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 hover:bg-rose-500 hover:text-white transition-all">
                             <X size={12}/>
                           </button>
                         </>
                       )}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-20">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No students found</p>
                </div>
              )}
            </div>

            <button className="mt-6 w-full py-4 bg-gray-900 dark:bg-white dark:text-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all shadow-xl shadow-gray-200 dark:shadow-none">
              View All Students
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserMinus = ({ size, className }) => <Users size={size} className={className} />; // Placeholder for specific icons if needed

export default DashboardOverview;
