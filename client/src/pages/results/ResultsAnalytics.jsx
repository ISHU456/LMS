import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAnalytics } from '../../features/results/resultSlice';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, BookOpen, CheckCircle, AlertTriangle, TrendingUp, Search } from 'lucide-react';
import axios from 'axios';

const ResultsAnalytics = () => {
  const dispatch = useDispatch();
  const { analytics, isLoading } = useSelector(state => state.results);
  const { user } = useSelector(state => state.auth);

  const [courseId, setCourseId] = useState('');
  const [semester, setSemester] = useState('');
  const [courses, setCourses] = useState([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await axios.get('/api/courses', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setCourses(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching courses', err);
        setCourses([]);
      }
    };
    fetchCourses();
  }, [user.token]);

  useEffect(() => {
    dispatch(getAnalytics({ courseId, semester }));
  }, [courseId, semester, dispatch]);

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#f97316', '#ef4444'];

  const getPieData = () => {
    if (!analytics) return [];
    return Object.keys(analytics.gradeDistribution).map(grade => ({
      name: grade,
      value: analytics.gradeDistribution[grade]
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-7xl mx-auto"
      >
        <div className="flex flex-col md:flex-row justify-between mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tighter text-white uppercase">
              Result <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Analytics</span>
            </h1>
            <p className="text-slate-400 mt-2 font-medium">Departmental Performance Insights</p>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
             <div className="relative group">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
               <select 
                 value={courseId} 
                 onChange={(e) => setCourseId(e.target.value)}
                 className="pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none min-w-[200px] transition-all"
               >
                 <option value="">All Subjects</option>
                 {(Array.isArray(courses) ? courses : []).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
               </select>
             </div>
             
             <select 
               value={semester} 
               onChange={(e) => setSemester(e.target.value)}
               className="px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
             >
               <option value="">All Semesters</option>
               {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
             </select>
          </div>
        </div>

        {analytics && (
          <>
            {/* High-level Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
               <motion.div whileHover={{ y: -5 }} className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-2 h-full bg-blue-500/50 group-hover:bg-blue-500 transition-all" />
                  <Users className="text-blue-400 mb-4" size={24} />
                  <h3 className="text-slate-500 uppercase text-[10px] font-black tracking-widest mb-1">Total Students</h3>
                  <p className="text-4xl font-black text-white">{analytics.totalStudents}</p>
               </motion.div>

               <motion.div whileHover={{ y: -5 }} className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500/50 group-hover:bg-emerald-500 transition-all" />
                  <CheckCircle className="text-emerald-400 mb-4" size={24} />
                  <h3 className="text-slate-500 uppercase text-[10px] font-black tracking-widest mb-1">Pass %</h3>
                  <p className="text-4xl font-black text-white">{analytics.passPercentage}%</p>
               </motion.div>

               <motion.div whileHover={{ y: -5 }} className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-2 h-full bg-purple-500/50 group-hover:bg-purple-500 transition-all" />
                  <TrendingUp className="text-purple-400 mb-4" size={24} />
                  <h3 className="text-slate-500 uppercase text-[10px] font-black tracking-widest mb-1">Average Marks</h3>
                  <p className="text-4xl font-black text-white">{analytics.averageMarks}</p>
               </motion.div>

               <motion.div whileHover={{ y: -5 }} className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-2 h-full bg-orange-500/50 group-hover:bg-orange-500 transition-all" />
                  <AlertTriangle className="text-orange-400 mb-4" size={24} />
                  <h3 className="text-slate-500 uppercase text-[10px] font-black tracking-widest mb-1">Students at Risk</h3>
                  <p className="text-4xl font-black text-white">{analytics.gradeDistribution['F']}</p>
               </motion.div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 backdrop-blur-3xl shadow-2xl h-[450px] flex flex-col">
                  <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                    <BookOpen className="text-blue-500" />
                    Grade Distribution
                  </h3>
                  <div className="flex-1 min-h-[300px] relative">
                    {isMounted && (
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart data={getPieData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b' }}
                        />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                          {getPieData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    )}
                  </div>
               </div>

                <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 backdrop-blur-3xl shadow-2xl h-[450px] flex flex-col transition-all">
                  <h3 className="w-full text-xl font-bold mb-8 flex items-center gap-3">
                    <TrendingUp className="text-purple-500" />
                    Overall Performance
                  </h3>
                  <div className="flex-1 min-h-[300px] relative">
                    {isMounted && (
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <PieChart>
                        <Pie
                          data={getPieData()}
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {getPieData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b' }}
                        />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                    )}
                  </div>
               </div>
            </div>
          </>
        )}

        {!analytics && !isLoading && (
          <div className="p-20 text-center bg-slate-900/50 rounded-3xl border border-dashed border-slate-800">
             <p className="text-slate-500 font-bold text-xl">No analytics data found for current selection.</p>
             <p className="text-slate-600 text-sm mt-2">Try changing filters or wait for results to be published.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ResultsAnalytics;
