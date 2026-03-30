import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Calendar, Check, X, Search, Filter, 
  ChevronLeft, ChevronRight, Save, Clock,
  AlertCircle, CheckCircle2, UserCheck, UserMinus, ShieldCheck,
  ArrowRight, MoreHorizontal, CalendarDays, Users, RefreshCw, Shield, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminStudentProfileModal from '../admin/AdminStudentProfileModal';

const AttendanceManager = ({ user, initialSemester, initialCourse, onPersistChange }) => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(initialCourse);
  const [students, setStudents] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 16)); // YYYY-MM-DDTHH:MM
  const [semester, setSemester] = useState(initialSemester || 1);
  const [attendanceEntries, setAttendanceEntries] = useState({}); // { studentId: status }
  const [biometricStatus, setBiometricStatus] = useState({}); // { studentId: boolean }
  const [remarks, setRemarks] = useState({}); // { studentId: remark }
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [viewMode, setViewMode] = useState('mark'); // 'mark' | 'view'
  const [history, setHistory] = useState([]);
  const [dailyFaceData, setDailyFaceData] = useState({}); // { studentId: fullRecord }
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [viewingStudentId, setViewingStudentId] = useState(null); // For profile modal
  const [currentMarkPage, setCurrentMarkPage] = useState(1);
  const [currentHistoryPage, setCurrentHistoryPage] = useState(1);
  const [itemsPerPage] = useState(25);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const res = await axios.get(`http://localhost:5001/api/courses`, config);
        const fetchedCourses = res.data;
        setCourses(fetchedCourses);
        
        if (fetchedCourses.length > 0) {
          if (!initialCourse && !initialSemester) {
            const defaultSem = (user.role === 'admin' ? 1 : (user.assignedSemesters?.[0] || 1));
            const hasDefaultSem = fetchedCourses.some(c => c.semester === defaultSem);
            if (hasDefaultSem) {
               const defaultCourse = fetchedCourses.find(c => c.semester === defaultSem);
               setSelectedCourse(defaultCourse);
               setSemester(defaultSem);
               onPersistChange(defaultSem, defaultCourse);
            } else {
               const firstAvailable = [...fetchedCourses].sort((a,b) => a.semester - b.semester)[0];
               setSemester(firstAvailable.semester);
               setSelectedCourse(firstAvailable);
               onPersistChange(firstAvailable.semester, firstAvailable);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };
    if (user?.token) fetchCourses();
  }, [user._id, user.token, initialCourse, initialSemester]);

  useEffect(() => {
    const courseToUse = selectedCourse;
    if (courseToUse && viewMode === 'mark') {
      const fetchStudents = async () => {
        setIsLoading(true);
        setStudents([]); 
        try {
          const config = { headers: { Authorization: `Bearer ${user.token}` } };
          const fetchSem = courseToUse?.semester || semester;
          const studentsRes = await axios.get(`http://localhost:5001/api/courses/${courseToUse.code}/students?semester=${fetchSem}`, config);
          const attendanceRes = await axios.get(`http://localhost:5001/api/attendance/course/${courseToUse._id}?startDate=${attendanceDate}&endDate=${attendanceDate}&semester=${fetchSem}`, config);
          
          const { attendanceRecords, dailyRecords } = attendanceRes.data;
          setStudents(studentsRes.data);
          
          const existing = {};
          const biometric = {};
          const dailyStatus = {}; 

          if (Array.isArray(attendanceRecords)) {
            attendanceRecords.forEach(rec => {
              const sid = rec.student?._id || rec.student;
              existing[sid] = rec.status;
              biometric[sid] = rec.isBiometricVerified;
            });
          }

          if (Array.isArray(dailyRecords)) {
            dailyRecords.forEach(rec => {
              dailyStatus[rec.student] = rec;
            });
          }

          const entries = {};
          studentsRes.data.forEach(s => { 
            entries[s._id] = existing[s._id] || (dailyStatus[s._id]?.status === 'present' ? 'present' : null); 
          });
          setAttendanceEntries(entries);
          setBiometricStatus(biometric);
          setDailyFaceData(dailyStatus);
        } catch (error) {
          console.error('Error fetching students/attendance:', error);
          setStudents([]);
          setAttendanceEntries({});
        } finally {
          setIsLoading(false);
        }
      };
      fetchStudents();
    } else if (selectedCourse && viewMode === 'view') {
      fetchHistory();
    }
  }, [selectedCourse, viewMode, user.token, attendanceDate, semester]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get(`http://localhost:5001/api/attendance/course/${selectedCourse._id}`, config);
      setHistory(res.data.attendanceRecords || res.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceEntries(prev => ({ ...prev, [studentId]: status }));
  };

  const handleBulkMark = (status) => {
    const next = { ...attendanceEntries };
    students.forEach(s => { next[s._id] = status; });
    setAttendanceEntries(next);
  };

  const handleSaveAttendance = async () => {
    setIsLoading(true);
    try {
      const attendanceData = Object.keys(attendanceEntries)
        .filter(studentId => attendanceEntries[studentId] !== null)
        .map(studentId => ({
          studentId,
          status: attendanceEntries[studentId],
          remarks: remarks[studentId] || ''
        }));

      if (attendanceData.length === 0) {
        showToast('No changes to save', 'info');
        setIsLoading(false);
        return;
      }

      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post('http://localhost:5001/api/attendance/bulk-mark', {
        courseId: selectedCourse._id,
        date: attendanceDate,
        semester: semester,
        attendanceData
      }, config);

      showToast('Attendance recorded successfully!');
    } catch (error) {
      console.error('Error saving attendance:', error);
      showToast(error.response?.data?.message || 'Error saving attendance', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => a.name.localeCompare(b.name));
  }, [students]);

  const isAuthorized = useMemo(() => {
    if (user.role === 'admin') return true;
    if (!selectedCourse) return false;
    const isExplicitlyAssigned = selectedCourse.facultyAssigned?.some(f => 
      (typeof f === 'string' ? f : f._id) === user._id
    );
    if (isExplicitlyAssigned) return true;
    const isSemAssigned = user.assignedSemesters?.includes(selectedCourse.semester);
    const isDeptMatch = user.department === selectedCourse.department?.name || user.department === selectedCourse.department?.code;
    return isSemAssigned && isDeptMatch;
  }, [user, selectedCourse]);

  const filteredStudents = sortedStudents.filter(s => 
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedStudents = useMemo(() => {
    const startIndex = (currentMarkPage - 1) * itemsPerPage;
    return filteredStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStudents, currentMarkPage, itemsPerPage]);

  const sidebarFilteredCourses = useMemo(() => {
    return courses.filter(c => 
      (c.semester === semester) &&
      (c.name?.toLowerCase().includes(subjectSearch.toLowerCase()) || 
       c.code?.toLowerCase().includes(subjectSearch.toLowerCase()))
    ).sort((a,b) => a.name.localeCompare(b.name));
  }, [courses, subjectSearch, semester]);

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-8 z-[60] px-6 py-3 rounded-2xl shadow-2xl text-white font-black uppercase tracking-widest text-xs flex items-center gap-3 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
            {toast.type === 'success' ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm leading-none shrink-0 overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl text-indigo-600">
            <CalendarDays size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Attendance Manager</h2>
            <p className="text-[10px] font-black text-gray-400 dark:text-gray-200 uppercase tracking-widest mt-1">Manage class presence & history</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          {viewMode === 'mark' && (
            <div className="flex items-center gap-4 bg-gray-50/80 dark:bg-gray-800/80 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 px-2">
                <Users size={14} className="text-indigo-500" />
                <span className="text-[10px] font-black text-gray-400 dark:text-gray-100 uppercase tracking-widest leading-none">Semester:</span>
                <select 
                  value={semester} 
                  onChange={(e) => {
                    const newSem = parseInt(e.target.value);
                    setSemester(newSem);
                    onPersistChange(newSem, selectedCourse);
                  }}
                  className="bg-transparent border-none text-[11px] font-black text-gray-900 dark:text-white focus:ring-0 outline-none w-14 appearance-none cursor-pointer" 
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s} className="bg-white dark:bg-gray-900 text-black">Sem {s}</option>
                  ))}
                </select>
              </div>
              <div className="w-[1px] h-6 bg-gray-200 dark:bg-gray-700" />
              <div className="flex items-center gap-2 pl-2">
                <Clock size={14} className="text-indigo-500" />
                <input 
                  type="datetime-local" 
                  value={attendanceDate} 
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="bg-transparent border-none text-[11px] font-black uppercase tracking-tight text-gray-900 dark:text-white focus:ring-0 outline-none w-40" 
                />
              </div>
            </div>
          )}

          {viewMode === 'mark' && isAuthorized && (
            <button 
              onClick={handleSaveAttendance} 
              disabled={isLoading || students.length === 0}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-50"
            >
              {isLoading ? <Clock className="animate-spin" size={14}/> : <Check size={14}/>}
              Submit
            </button>
          )}
          
          <div className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
            <button onClick={() => setViewMode('mark')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'mark' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              Mark Daily
            </button>
            <button onClick={() => setViewMode('view')}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'view' ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              View Logs
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col h-[600px]">
            <div className="flex items-center justify-between mb-4 shrink-0">
               <h3 className="text-[10px] font-black text-gray-400 dark:text-gray-200 uppercase tracking-widest">Select Subject</h3>
               <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500">{sidebarFilteredCourses.length}</span>
            </div>

            <div className="relative mb-4 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
              <input 
                type="text" 
                placeholder="Search subjects..." 
                value={subjectSearch}
                onChange={(e) => setSubjectSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-[10px] font-bold focus:ring-2 focus:ring-indigo-500 transition placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-1.5 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {sidebarFilteredCourses.map(course => (
                <button key={course._id} onClick={() => {
                   setSelectedCourse(course);
                   onPersistChange(semester, course);
                   if (viewMode === 'view') setViewMode('mark');
                }}
                  className={`w-full text-left p-3 rounded-2xl transition-all border group ${selectedCourse?._id === course._id ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-800 shadow-sm' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-[11px] font-black uppercase leading-tight transition-colors ${selectedCourse?._id === course._id ? 'text-indigo-600' : 'text-gray-700 dark:text-gray-300'}`}>{course.name}</p>
                    <ArrowRight size={10} className={`mt-0.5 shrink-0 ${selectedCourse?._id === course._id ? 'text-indigo-400' : 'text-gray-300 opacity-0'}`} />
                  </div>
                  <p className="text-[9px] font-bold text-gray-400 dark:text-gray-300 mt-1 uppercase tracking-widest">{course.code} · Sem {course.semester}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {viewMode === 'mark' ? (
            <div className="bg-white dark:bg-[#080c14] rounded-[2.5rem] border border-slate-200 dark:border-slate-800/60 shadow-xl overflow-hidden relative min-h-[500px]">
              <div className="overflow-x-auto custom-scrollbar h-full">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800/60 font-black">Student Identity</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800/60 font-black">Recognition Logs</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800/60 text-center font-black">Response</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {paginatedStudents.map(student => (
                      <tr key={student._id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-all">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="relative group/avatar">
                              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-white/10 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-white/10 transition-transform group-hover/avatar:scale-110">
                                {student.profilePic ? (
                                  <img src={student.profilePic} className="w-full h-full object-cover" alt={student.name} />
                                ) : (
                                  <Users size={18} className="text-indigo-500" />
                                )}
                              </div>
                              <button onClick={() => setViewingStudentId(student._id)} className="absolute -right-2 -bottom-2 p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-lg opacity-0 group-hover/avatar:opacity-100 transition-all"><MoreHorizontal size={12} className="text-slate-400" /></button>
                            </div>
                            <div>
                              <p className="text-[11px] font-black italic dark:text-white uppercase tracking-tight">{student.name}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{student.rollNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col gap-1.5">
                            {dailyFaceData[student._id] ? (
                              <>
                                <div className="flex items-center gap-2">
                                  <ShieldCheck size={12} className="text-emerald-500" />
                                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">{dailyFaceData[student._id].exit?.time ? 'Face Verified' : 'Entry Only'}</span>
                                </div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                  {new Date(dailyFaceData[student._id].entry?.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  {dailyFaceData[student._id].exit?.time && ` - ${new Date(dailyFaceData[student._id].exit.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                </p>
                              </>
                            ) : (
                              <div className="flex items-center gap-2">
                                <AlertCircle size={12} className="text-slate-300" />
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Pending Face Verification</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center justify-center">
                            <div className="flex items-center gap-1 p-1.5 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5">
                              {['present', 'absent', 'late', 'excused'].map(status => (
                                <button key={status} onClick={() => handleStatusChange(student._id, status)}
                                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${attendanceEntries[student._id] === status ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>{status.charAt(0)}</button>
                              ))}
                              {attendanceEntries[student._id] && <button onClick={() => handleStatusChange(student._id, null)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl"><X size={12} /></button>}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!isAuthorized && (
                <motion.div initial={{ opacity: 0, backdropFilter: 'blur(0px)' }} animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
                  className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/20 dark:bg-slate-900/40">
                  <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center max-w-md mx-4">
                    <div className="w-20 h-20 rounded-[2rem] bg-rose-500/10 flex items-center justify-center text-rose-500 mb-6 border border-rose-500/20 shadow-xl shadow-rose-500/10"><Shield size={32} /></div>
                    <h3 className="text-xl font-black italic dark:text-white uppercase tracking-tighter mb-3">Access Denied</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">
                      This sector is restricted to faculty members explicitly assigned to <span className="text-rose-500">{selectedCourse?.name || 'this course'}</span>.
                    </p>
                    <div className="mt-8 flex flex-col gap-2 w-full">
                       <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center gap-3">
                          <Activity size={14} className="text-slate-400"/><p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact HOD for manual lattice induction</p>
                       </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
             <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
               <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
                 <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Historical Logs</h3>
               </div>
               <div className="overflow-x-auto flex-1 h-[500px]">
                 <table className="w-full text-left border-collapse h-full">
                   <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800/80 backdrop-blur-sm z-10">
                     <tr>
                       <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Date</th>
                       <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Student</th>
                       <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Status</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                     {history.map(record => (
                       <tr key={record._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all italic">
                         <td className="px-6 py-4 text-xs font-black dark:text-white">{new Date(record.date).toLocaleDateString()}</td>
                         <td className="px-6 py-4 text-xs font-black dark:text-white">{record.student?.name}</td>
                         <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${record.status === 'present' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                              {record.status}
                            </span>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
          )}
        </div>
      </div>

      {viewingStudentId && (
        <AdminStudentProfileModal studentId={viewingStudentId} user={user} onClose={() => setViewingStudentId(null)} />
      )}
    </div>
  );
};

export default AttendanceManager;
