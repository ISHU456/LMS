import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Calendar, Check, X, Search, Filter, 
  ChevronLeft, ChevronRight, Save, Clock,
  AlertCircle, CheckCircle2, UserCheck, UserMinus,
  ArrowRight, MoreHorizontal, CalendarDays, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminStudentProfileModal from '../admin/AdminStudentProfileModal';

const AttendanceManager = ({ user }) => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 16)); // YYYY-MM-DDTHH:MM
  const [semester, setSemester] = useState(1);
  const [attendanceEntries, setAttendanceEntries] = useState({}); // { studentId: status }
  const [remarks, setRemarks] = useState({}); // { studentId: remark }
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [viewMode, setViewMode] = useState('mark'); // 'mark' | 'view'
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingStudentId, setViewingStudentId] = useState(null); // For profile modal
  const [currentMarkPage, setCurrentMarkPage] = useState(1);
  const [currentHistoryPage, setCurrentHistoryPage] = useState(1);
  const [itemsPerPage] = useState(25);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const res = await axios.get(`http://localhost:5001/api/courses`, config);
        // Filter courses where this user is assigned
        const teacherCourses = res.data.filter(c => {
          const isAssigned = c.facultyAssigned?.some(f => 
            (f._id?.toString() || f.toString()) === user._id.toString()
          );
          const isSemMatch = user.assignedSemesters?.includes(c.semester);
          const isDeptMatch = c.department?.name === user.department || c.department?.code === user.department;
          
          return isAssigned || (isSemMatch && isDeptMatch);
        });
        setCourses(teacherCourses);
        if (teacherCourses.length > 0) {
          setSelectedCourse(teacherCourses[0]);
          setSemester(teacherCourses[0].semester);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };
    if (user?.token) fetchCourses();
  }, [user._id, user.token]);

  useEffect(() => {
    if (selectedCourse && viewMode === 'mark') {
      const fetchStudents = async () => {
        setIsLoading(true);
        try {
          const config = { headers: { Authorization: `Bearer ${user.token}` } };
          const studentsRes = await axios.get(`http://localhost:5001/api/courses/${selectedCourse.code}/students?semester=${semester}`, config);
          
          // Fetch existing attendance for this date/course
          const attendanceRes = await axios.get(`http://localhost:5001/api/attendance/course/${selectedCourse._id}?startDate=${attendanceDate}&endDate=${attendanceDate}&semester=${semester}`, config);
          
          setStudents(studentsRes.data);
          
          // Map existing attendance or default to present
          const existing = {};
          if (Array.isArray(attendanceRes.data)) {
            attendanceRes.data.forEach(rec => {
              const sid = rec.student?._id || rec.student;
              existing[sid] = rec.status;
            });
          }

          const entries = {};
          studentsRes.data.forEach(s => { 
            entries[s._id] = existing[s._id] || 'present'; 
          });
          setAttendanceEntries(entries);
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
      setHistory(res.data);
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
      const attendanceData = Object.keys(attendanceEntries).map(studentId => ({
        studentId,
        status: attendanceEntries[studentId],
        remarks: remarks[studentId] || ''
      }));

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

  const filteredStudents = sortedStudents.filter(s => 
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.enrollmentNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalMarkPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentMarkPage - 1) * itemsPerPage;
    return filteredStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStudents, currentMarkPage, itemsPerPage]);

  const totalHistoryPages = Math.ceil(history.length / itemsPerPage);
  const paginatedHistory = useMemo(() => {
    const startIndex = (currentHistoryPage - 1) * itemsPerPage;
    return history.slice(startIndex, startIndex + itemsPerPage);
  }, [history, currentHistoryPage, itemsPerPage]);

  useEffect(() => {
    setCurrentMarkPage(1);
    setCurrentHistoryPage(1);

    // Auto-select first course of the new semester if current selection is not in the new semester
    if (courses.length > 0) {
      const semCourses = courses.filter(c => c.semester === semester);
      if (semCourses.length > 0) {
        if (!selectedCourse || selectedCourse.semester !== semester) {
          setSelectedCourse(semCourses[0]);
        }
      } else {
        setSelectedCourse(null);
      }
    }
  }, [semester, searchQuery, viewMode, courses]);

  return (
    <div className="space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-8 z-[60] px-6 py-3 rounded-2xl shadow-2xl text-white font-black uppercase tracking-widest text-xs flex items-center gap-3 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
            {toast.type === 'success' ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl text-indigo-600">
            <CalendarDays size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Attendance Manager</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Manage class presence & history</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          {viewMode === 'mark' && (
            <div className="flex items-center gap-4 bg-gray-50/80 dark:bg-gray-800/80 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 pl-2">
                <Clock size={14} className="text-indigo-500" />
                <input 
                  type="datetime-local" 
                  value={attendanceDate} 
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="bg-transparent border-none text-[11px] font-black uppercase tracking-tight text-gray-900 dark:text-white focus:ring-0 outline-none w-40" 
                />
              </div>
              <div className="w-[1px] h-6 bg-gray-200 dark:bg-gray-700" />
              <div className="flex items-center gap-2 px-2">
                <Users size={14} className="text-indigo-500" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Semester:</span>
                <select 
                  value={semester} 
                  onChange={(e) => setSemester(parseInt(e.target.value))}
                  className="bg-transparent border-none text-[11px] font-black text-gray-900 dark:text-white focus:ring-0 outline-none w-14 appearance-none cursor-pointer" 
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s} className="bg-white dark:bg-gray-900">Sem {s}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {viewMode === 'mark' && (
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
        {/* Sidebar: Course Selection */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col max-h-[500px]">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 shrink-0">Select Subject</h3>
            <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar">
              {courses.filter(c => c.semester === semester).length > 0 ? (
                courses.filter(c => c.semester === semester).map(course => (
                  <button key={course._id} onClick={() => {
                     setSelectedCourse(course);
                     // Ensure we're in marking mode when selecting a new course
                     if (viewMode === 'view') setViewMode('mark');
                  }}
                    className={`w-full text-left p-4 rounded-2xl transition-all border ${selectedCourse?._id === course._id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    <p className="text-xs font-black text-gray-900 dark:text-white uppercase truncate">{course.name}</p>
                    <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{course.code} · Sem {course.semester}</p>
                  </button>
                ))
              ) : (
                <div className="py-20 text-center">
                  <p className="text-[9px] font-black text-gray-300 uppercase leading-relaxed">No subjects assigned for Semester {semester}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content: Marking or Viewing */}
        <div className="lg:col-span-3 space-y-6">
          {viewMode === 'mark' ? (
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
              {/* Toolbar */}
              <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4">
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input type="text" placeholder="Filter by Name or Roll #" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 transition" />
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => handleBulkMark('present')} className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all">Mark All Present</button>
                  <button onClick={() => handleBulkMark('absent')} className="px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all">Mark All Absent</button>
                </div>
              </div>

              {/* Student List */}
              <div className="flex-1 overflow-y-auto max-h-[600px] p-6">
                <div className="space-y-3">
                  {paginatedStudents.length > 0 ? paginatedStudents.map((s) => (
                    <div key={s._id} className="group flex items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-700 flex items-center justify-center font-bold text-indigo-600 shadow-sm border border-gray-100 dark:border-gray-600 uppercase">
                          {s.name[0]}{s.name.split(' ')[1]?.[0] || ''}
                        </div>
                        <div className="cursor-pointer group/name" onClick={() => setViewingStudentId(s._id)}>
                          <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight group-hover/name:text-rose-500 transition-colors">{s.name}</p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Roll: {s.rollNumber || '—'} · Enr: {s.enrollmentNumber || '—'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {['present', 'absent', 'late', 'excused'].map((status) => (
                          <button key={status} onClick={() => handleStatusChange(s._id, status)}
                            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${attendanceEntries[s._id] === status ? 
                              (status === 'present' ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' : 
                               status === 'absent' ? 'bg-rose-500 border-rose-500 text-white shadow-md' : 
                               status === 'late' ? 'bg-amber-500 border-amber-500 text-white shadow-md' : 
                               'bg-indigo-500 border-indigo-500 text-white shadow-md') : 
                              'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 hover:border-gray-300'}`}>
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-20">
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No students found matching filters</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Mark Tab Pagination */}
              {totalMarkPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-50 dark:border-gray-800 flex items-center justify-center gap-2">
                  <button 
                    onClick={() => setCurrentMarkPage(p => Math.max(1, p - 1))}
                    disabled={currentMarkPage === 1}
                    className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 disabled:opacity-30 hover:text-indigo-600 transition-all"
                  >
                    <ChevronLeft size={16}/>
                  </button>
                  <div className="flex items-center gap-1">
                    {[...Array(totalMarkPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentMarkPage(i + 1)}
                        className={`min-w-[32px] h-8 rounded-lg text-[10px] font-black transition-all ${
                          currentMarkPage === i + 1 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => setCurrentMarkPage(p => Math.min(totalMarkPages, p + 1))}
                    disabled={currentMarkPage === totalMarkPages}
                    className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 disabled:opacity-30 hover:text-indigo-600 transition-all"
                  >
                    <ChevronRight size={16}/>
                  </button>
                </div>
              )}

              {/* Footer Save */}
              <div className="p-6 bg-gray-50/50 dark:bg-gray-800/20 border-t border-gray-50 dark:border-gray-800 flex justify-end">
                <button onClick={handleSaveAttendance} disabled={isLoading || students.length === 0}
                  className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-primary-600 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-200 dark:shadow-indigo-900/40 hover:opacity-90 transition-all disabled:opacity-50">
                  {isLoading ? <Clock className="animate-spin" size={18}/> : <Save size={18}/>}
                  Save Attendance
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Historical Logs</h3>
                <button onClick={fetchHistory} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
                  <Clock size={16} className="text-gray-400" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50">
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Date</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Student</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Remarks</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Entry By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {paginatedHistory.length > 0 ? paginatedHistory.map((record) => (
                      <tr key={record._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all">
                        <td className="px-6 py-4">
                          <p className="text-xs font-black text-gray-900 dark:text-white tabular-nums">{new Date(record.date).toLocaleDateString()}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold uppercase">
                              {record.student?.name?.[0]}
                            </div>
                            <div className="cursor-pointer group/name" onClick={() => setViewingStudentId(record.student?._id)}>
                              <p className="text-xs font-black text-gray-900 dark:text-white uppercase truncate max-w-[120px] group-hover/name:text-rose-500 transition-colors">{record.student?.name}</p>
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">R: {record.student?.rollNumber} · E: {record.student?.enrollmentNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest inline-block min-w-[70px] ${
                            record.status === 'present' ? 'bg-emerald-50 text-emerald-600' : 
                            record.status === 'absent' ? 'bg-rose-50 text-rose-600' : 
                            record.status === 'late' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-[10px] text-gray-500 italic truncate max-w-[100px]">{record.remarks || '—'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Self</p>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-20 text-center text-gray-400 font-bold uppercase text-xs tracking-widest">No logs found for this subject</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* History Tab Pagination */}
              {totalHistoryPages > 1 && (
                <div className="p-6 border-t border-gray-50 dark:border-gray-800 flex items-center justify-center gap-2">
                  <button 
                    onClick={() => setCurrentHistoryPage(p => Math.max(1, p - 1))}
                    disabled={currentHistoryPage === 1}
                    className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 disabled:opacity-30 hover:text-indigo-600 transition-all"
                  >
                    <ChevronLeft size={16}/>
                  </button>
                  <div className="flex items-center gap-1">
                    {[...Array(totalHistoryPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentHistoryPage(i + 1)}
                        className={`min-w-[32px] h-8 rounded-lg text-[10px] font-black transition-all ${
                          currentHistoryPage === i + 1 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => setCurrentHistoryPage(p => Math.min(totalHistoryPages, p + 1))}
                    disabled={currentHistoryPage === totalHistoryPages}
                    className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-400 disabled:opacity-30 hover:text-indigo-600 transition-all"
                  >
                    <ChevronRight size={16}/>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Student Profile Modal */}
      {viewingStudentId && (
        <AdminStudentProfileModal 
          studentId={viewingStudentId} 
          user={user} 
          onClose={() => setViewingStudentId(null)} 
        />
      )}
    </div>
  );
};

export default AttendanceManager;
