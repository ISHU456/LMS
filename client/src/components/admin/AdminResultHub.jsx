import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, LayoutGrid, CheckCircle2, Globe, Sparkles, Filter, 
  ChevronRight, ArrowUpDown, Download, Printer, ShieldCheck,
  Zap, AlertCircle, Loader2, Search, MoreHorizontal, Unlock,
  XCircle, Bell, Clock
} from 'lucide-react';
import axios from 'axios';

const AdminResultHub = ({ user }) => {
  const [semester, setSemester] = useState(() => localStorage.getItem('adminResultSem') || '1');
  const [academicYear, setAcademicYear] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    return now.getMonth() >= 6 ? `${year}-${(year + 1).toString().slice(-2)}` : `${year - 1}-${year.toString().slice(-2)}`;
  });
  const [department, setDepartment] = useState(() => localStorage.getItem('adminResultDept') || 'All');
  const [departments, setDepartments] = useState([]);
  const [data, setData] = useState({ students: [], courses: [], matrix: {} });
  const [loading, setLoading] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'rollNumber', direction: 'asc' });

  const fetchDepartments = async () => {
    try {
      const { data } = await axios.get('http://localhost:5001/api/departments');
      setDepartments(data);
    } catch (err) {
      console.error("Failed to fetch departments", err);
    }
  };

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`http://localhost:5001/api/results/semester-summary?semester=${semester}&academicYear=${academicYear}&department=${department}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setData(data);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch semester records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchSummary();
    localStorage.setItem('adminResultSem', semester);
    localStorage.setItem('adminResultDept', department);
  }, [semester, academicYear, department]);

  const handleUnlockCourse = async (courseId, courseName) => {
    if (!window.confirm(`Force unlock all identity records for ${courseName}? This override permits faculty to modify results after standard locking.`)) return;
    try {
      setLoading(true);
      const { data } = await axios.post('http://localhost:5001/api/admin/results/unlock', {
        courseId, semester, academicYear
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert(data.message);
      fetchSummary();
    } catch (err) {
      alert(err.response?.data?.message || 'Override protocol failure.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompile = async () => {
    if (!window.confirm(`Compile and generate final results for ${data.students.length} students? This will calculate SGPA/CGPA.`)) return;
    try {
      setCompiling(true);
      const res = await axios.post('http://localhost:5001/api/results/generate-final', {
        semester, academicYear, department
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert(res.data.message);
      fetchSummary();
    } catch (err) {
      alert(err.response?.data?.message || 'Compilation failed');
    } finally {
      setCompiling(false);
    }
  };

  const handleApproveCourse = async (courseId, courseName) => {
    if (!window.confirm(`Certify all identity records for ${courseName}? This action officially archives marks for transcript generation.`)) return;
    try {
      setLoading(true);
      const { data } = await axios.post('http://localhost:5001/api/admin/results/approve', {
        courseId, semester, academicYear
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert(data.message);
      fetchSummary();
    } catch (err) {
      alert(err.response?.data?.message || 'Certification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectCourse = async (courseId, courseName) => {
    const reason = window.prompt(`Enter reason for rejecting ${courseName} results:`);
    if (!reason) return;
    try {
      setLoading(true);
      const { data } = await axios.post('http://localhost:5001/api/admin/results/reject', {
        courseId, semester, academicYear, reason
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert(data.message);
      fetchSummary();
    } catch (err) {
      alert(err.response?.data?.message || 'Decommissioning failure.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishDeadline = async () => {
    const deadline = window.prompt("Enter marks submission deadline (e.g., '15th July 2025'):");
    if (!deadline) return;
    try {
      await axios.put('http://localhost:5001/api/admin/settings', {
        globalAlert: `PROTOCOL ALERT: Final deadline for Result Transmission is ${deadline}. Ensure all modules are submitted for certification.`
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert('Deadline broadcast deployed to all terminal dashboards.');
    } catch (err) {
      alert('Broadcast transmission failure.');
    }
  };

  const filteredStudents = data.students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'published': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'approved': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'submitted': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black dark:text-white uppercase tracking-tighter flex items-center gap-3">
             <BarChart3 className="text-red-600" size={32} /> Semester Result Hub
          </h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2">
            Multi-Subject Performance Lattice & Result Compilation Engine
          </p>
        </div>

        <div className="flex gap-4 w-full xl:w-auto">
          <button 
            onClick={handlePublishDeadline}
            className="flex-1 xl:flex-none px-6 py-4 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all flex items-center gap-2"
          >
            <Bell size={16} /> Broadcast Deadline
          </button>
          <button 
            onClick={fetchSummary}
            className="flex-1 xl:flex-none px-6 py-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-xl transition-all"
          >
            Refresh Stream
          </button>
          <button 
            onClick={handleCompile}
            disabled={compiling || data.students.length === 0}
            className="flex-1 xl:flex-none px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-600/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {compiling ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} className="group-hover:animate-pulse" />}
            Compile Final Results
          </button>
        </div>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-10 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[3rem] shadow-xl">
        <div className="space-y-4">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Current Semester</label>
          <select 
            value={semester} 
            onChange={(e) => setSemester(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800/50 border border-transparent hover:border-red-200 focus:bg-white dark:focus:bg-gray-800 rounded-[28px] py-6 px-10 text-sm font-black dark:text-white outline-none focus:ring-4 ring-red-500/10 transition-all shadow-inner"
          >
            {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s.toString()}>Semester {s}</option>)}
          </select>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Department</label>
          <select 
            value={department} 
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800/50 border border-transparent hover:border-red-200 focus:bg-white dark:focus:bg-gray-800 rounded-[28px] py-6 px-10 text-sm font-black dark:text-white outline-none focus:ring-4 ring-red-500/10 transition-all shadow-inner"
          >
            <option value="All">All Departments</option>
            {departments.map(d => (
              <option key={d._id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Identity Search</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder="Query Name or Roll Number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800/50 border border-transparent focus:bg-white dark:focus:bg-gray-800 rounded-2xl py-4 pl-12 pr-4 text-xs font-black dark:text-white outline-none focus:ring-2 ring-red-500/50 transition-all shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <th className="p-6 sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 min-w-[200px]">
                  <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setSortConfig({ key: 'name', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Student Identity</span>
                    <ArrowUpDown size={10} className="text-gray-300 group-hover:text-red-500 transition-colors" />
                  </div>
                </th>
                {data.courses.map(course => (
                  <th key={course._id} className="p-6 min-w-[160px] text-center relative group/th border-r border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] font-black dark:text-white uppercase tracking-tighter truncate max-w-[140px]">{course.name}</p>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <p className="text-[8px] font-black text-red-500 uppercase tracking-widest">{course.code}</p>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover/th:opacity-100 transition-all">
                        <button 
                          onClick={() => handleUnlockCourse(course._id, course.name)}
                          className="p-1 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-md hover:bg-red-600 hover:text-white transition-all"
                          title="Override Lock"
                        >
                          <Unlock size={10} />
                        </button>
                        <button 
                           onClick={() => handleApproveCourse(course._id, course.name)}
                           className="p-1 bg-emerald-50 text-emerald-600 rounded-md hover:bg-emerald-600 hover:text-white transition-all"
                           title="Certify Module"
                        >
                          <CheckCircle2 size={10} />
                        </button>
                        <button 
                           onClick={() => handleRejectCourse(course._id, course.name)}
                           className="p-1 bg-rose-50 text-rose-600 rounded-md hover:bg-rose-600 hover:text-white transition-all"
                           title="Reject Mapping"
                        >
                          <XCircle size={10} />
                        </button>
                      </div>
                    </div>
                  </th>
                ))}
                <th className="p-6 text-center min-w-[120px] bg-red-50/30 dark:bg-red-900/10">
                   <div className="flex items-center justify-center gap-2">
                      <span className="text-[9px] font-black text-red-600 uppercase tracking-widest">Completion</span>
                   </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={data.courses.length + 2} className="p-20 text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-red-600 mx-auto mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Synchronizing Local Records...</p>
                  </td>
                </tr>
              ) : filteredStudents.length > 0 ? filteredStudents.map(student => {
                const resultsCount = Object.values(data.matrix[student._id] || {}).filter(v => v !== null).length;
                const totalPossible = data.courses.length;
                const percent = Math.round((resultsCount / totalPossible) * 100);

                return (
                  <tr key={student._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all group">
                    <td className="p-6 sticky left-0 bg-white dark:bg-gray-900 z-10 border-r border-gray-100 dark:border-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-800 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-black text-xs text-gray-400">
                           {student.name[0]}
                        </div>
                        <div>
                          <p className="text-xs font-black dark:text-white group-hover:text-red-600 transition-colors capitalize">{student.name}</p>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{student.rollNumber}</p>
                        </div>
                      </div>
                    </td>
                    
                    {data.courses.map(course => {
                      const res = data.matrix[student._id]?.[course._id];
                      return (
                        <td key={course._id} className="p-6 text-center border-r border-gray-100 dark:border-gray-800 last:border-0 relative">
                           {res ? (
                             <div className="flex flex-col items-center">
                                <span className="text-lg font-black dark:text-white">{res.totalMarks}</span>
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border mt-1 ${getStatusColor(res.status)}`}>
                                   {res.grade || res.status}
                                </span>
                             </div>
                           ) : (
                             <div className="flex items-center justify-center">
                                <AlertCircle size={16} className="text-gray-200 dark:text-gray-700" />
                             </div>
                           )}
                        </td>
                      );
                    })}

                    <td className="p-6 bg-red-50/10 dark:bg-red-900/5">
                       <div className="flex flex-col items-center gap-1">
                          <div className="w-full bg-gray-200 dark:bg-gray-800 h-1 rounded-full overflow-hidden">
                             <div className="h-full bg-emerald-500" style={{ width: `${percent}%` }} />
                          </div>
                          <span className="text-[10px] font-black text-emerald-500">{percent}% Sync</span>
                          {percent === 100 && <ShieldCheck size={14} className="text-emerald-500" />}
                       </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                   <td colSpan={data.courses.length + 2} className="p-32 text-center opacity-30 text-[10px] font-black uppercase tracking-widest italic">
                      Zero Transmission Detected for Selected Sector
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminResultHub;
