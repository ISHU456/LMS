import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldCheck, ShieldAlert, ShieldOff, Search, 
  History, Info, ChevronRight, CheckCircle2, 
  XCircle, AlertTriangle, Filter, Save, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CourseAccessManager = ({ user }) => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [accessData, setAccessData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null); // For history modal
  const [history, setHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [overrideModal, setOverrideModal] = useState(null); // { studentId, studentName, currentState }
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideState, setOverrideState] = useState('ACTIVE');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const res = await axios.get(`http://localhost:5000/api/courses`, config);
        const teacherCourses = res.data.filter(c => 
          c.facultyAssigned?.some(f => f._id === user._id || f === user._id) ||
          (user.assignedSemesters?.includes(c.semester) && (c.department?.name === user.department || c.department?.code === user.department))
        );
        setCourses(teacherCourses);
        if (teacherCourses.length > 0) setSelectedCourse(teacherCourses[0]);
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };
    if (user?.token) fetchCourses();
  }, [user._id, user.token]);

  useEffect(() => {
    if (selectedCourse) {
      fetchAccessData();
    }
  }, [selectedCourse]);

  const fetchAccessData = async () => {
    setIsLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get(`http://localhost:5000/api/course-access/course/${selectedCourse._id}`, config);
      setAccessData(res.data);
    } catch (error) {
      console.error('Error fetching access data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFetchHistory = async (student) => {
    setSelectedStudent(student);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get(`http://localhost:5000/api/course-access/history/${selectedCourse._id}/${student._id}`, config);
      setHistory(res.data);
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleUpdateAccess = async () => {
    if (!overrideReason.trim()) {
      showToast('Please provide a reason for the override', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put('http://localhost:5000/api/course-access/update', {
        courseId: selectedCourse._id,
        studentId: overrideModal.studentId,
        state: overrideState,
        reason: overrideReason
      }, config);

      showToast('Access updated successfully!');
      setOverrideModal(null);
      setOverrideReason('');
      fetchAccessData(); // Refresh list
    } catch (error) {
      console.error('Error updating access:', error);
      showToast(error.response?.data?.message || 'Error updating access', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredData = accessData.filter(item => 
    item.student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.student.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (state) => {
    switch (state) {
      case 'ACTIVE': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'RESTRICTED': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'BLOCKED': return 'bg-rose-50 text-rose-600 border-rose-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (state) => {
    switch (state) {
      case 'ACTIVE': return <ShieldCheck size={14}/>;
      case 'RESTRICTED': return <ShieldAlert size={14}/>;
      case 'BLOCKED': return <ShieldOff size={14}/>;
      default: return <Info size={14}/>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-8 z-[100] px-6 py-3 rounded-2xl shadow-2xl text-white font-black uppercase tracking-widest text-xs flex items-center gap-3 ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
            {toast.type === 'success' ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-900/30 rounded-2xl text-rose-600">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Course Access Control</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Manage student enrollment & restrictions</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
             <AlertTriangle size={14} className="text-amber-600"/>
             <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Auto-Restrict at &lt; 75%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Select Subject</h3>
            <div className="space-y-2">
              {courses.map(course => (
                <button key={course._id} onClick={() => setSelectedCourse(course)}
                  className={`w-full text-left p-4 rounded-2xl transition-all border ${selectedCourse?._id === course._id ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                  <p className="text-xs font-black text-gray-900 dark:text-white uppercase truncate">{course.name}</p>
                  <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{course.code} · Sem {course.semester}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
            <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4">
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" placeholder="Filter by Student..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-rose-500 transition" />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-6 px-6">
                   <div className="text-center">
                     <p className="text-sm font-black text-rose-600">{accessData.filter(d => d.accessState !== 'ACTIVE').length}</p>
                     <p className="text-[9px] font-bold text-gray-400 uppercase">Restricted</p>
                   </div>
                   <div className="text-center">
                     <p className="text-sm font-black text-emerald-600">{accessData.filter(d => d.attendancePercent < 75).length}</p>
                     <p className="text-[9px] font-bold text-gray-400 uppercase">&lt; 75% Attend</p>
                   </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Student</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Attendance</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Last Override Reason</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {filteredData.length > 0 ? filteredData.map((item) => (
                    <tr key={item.student._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-600 shadow-sm border border-gray-100 dark:border-gray-600 uppercase">
                            {item.student.name[0]}{item.student.name.split(' ')[1]?.[0] || ''}
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900 dark:text-white uppercase truncate max-w-[150px]">{item.student.name}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">R: {item.student.rollNumber} · E: {item.student.enrollmentNumber}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`text-xs font-black ${item.attendancePercent < 75 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {Math.round(item.attendancePercent)}%
                          </span>
                          <div className="w-12 h-1 bg-gray-100 dark:bg-gray-800 rounded-full mt-1 overflow-hidden">
                            <div className={`h-full rounded-full ${item.attendancePercent < 75 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${item.attendancePercent}%` }}/>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`px-2.5 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 mx-auto w-[110px] shadow-sm ${getStatusColor(item.accessState)}`}>
                          {getStatusIcon(item.accessState)}
                          {item.accessState}
                        </span>
                        {item.autoRestricted && <p className="text-[8px] font-black text-rose-500 uppercase mt-1 tracking-tighter">Auto-Restricted</p>}
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-[10px] text-gray-500 italic max-w-[150px] truncate" title={item.reason}>
                          {item.reason || '—'}
                        </p>
                        {item.updatedBy && <p className="text-[8px] font-bold text-gray-400 mt-1 uppercase">By {item.updatedBy}</p>}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleFetchHistory(item.student)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all" title="View History">
                            <History size={15} className="text-gray-400"/>
                          </button>
                          <button onClick={() => { setOverrideModal({ studentId: item.student._id, studentName: item.student.name, currentState: item.accessState }); setOverrideState(item.accessState); }}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all">
                            Override
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-20 text-center text-gray-400 font-bold uppercase text-xs">No records found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Override Modal */}
      <AnimatePresence>
        {overrideModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setOverrideModal(null)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-[32px] p-8 shadow-2xl border border-gray-100 dark:border-gray-800 max-w-md w-full relative overflow-hidden"
              onClick={e => e.stopPropagation()}>
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <ShieldCheck size={120} />
              </div>
              
              <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-2">Access Override</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-6">Updating: <span className="text-rose-500">{overrideModal.studentName}</span></p>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Set Access State</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['ACTIVE', 'RESTRICTED', 'BLOCKED'].map(state => (
                      <button key={state} onClick={() => setOverrideState(state)}
                        className={`py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${overrideState === state ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent shadow-lg' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 border-gray-100 dark:border-gray-700'}`}>
                        {state}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Reason / Justification</label>
                  <textarea value={overrideReason} onChange={e => setOverrideReason(e.target.value)}
                    placeholder="Provide reason for manual access change..."
                    rows={3}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-rose-500 transition"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button onClick={() => setOverrideModal(null)}
                    className="flex-1 py-4 rounded-2xl border border-gray-100 dark:border-gray-800 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all">
                    Cancel
                  </button>
                  <button onClick={handleUpdateAccess} disabled={isLoading}
                    className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-200 dark:shadow-rose-900/40 hover:opacity-90 transition-all">
                    {isLoading ? <Clock className="animate-spin inline mr-2" size={14}/> : 'Update Access'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowHistoryModal(false)}>
            <motion.div initial={{ scale: 0.9, x: 20 }} animate={{ scale: 1, x: 0 }} exit={{ scale: 0.9, x: 20 }}
              className="bg-white dark:bg-gray-900 rounded-[32px] p-8 shadow-2xl border border-gray-100 dark:border-gray-800 max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}>
              
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Restriction History</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{selectedStudent?.name}</p>
                </div>
                <button onClick={() => setShowHistoryModal(false)} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl group hover:bg-rose-50 transition-all">
                  <XCircle size={20} className="text-gray-400 group-hover:text-rose-500"/>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                {history.length > 0 ? history.map((h, i) => (
                  <div key={i} className="relative pl-6 pb-6 border-l-2 border-gray-100 dark:border-gray-800 last:pb-0">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white dark:bg-gray-900 border-2 border-indigo-500"/>
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border ${getStatusColor(h.state)}`}>
                          {h.state}
                        </span>
                        <span className="text-[9px] font-black text-gray-400 uppercase">{new Date(h.date).toLocaleDateString()} · {new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 font-bold italic mb-2">"{h.reason}"</p>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Action By: <span className="text-indigo-500">{h.updatedBy?.name || 'System Auto'}</span></p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-10">
                    <p className="text-xs font-black text-gray-300 uppercase tracking-widest">No history recorded yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CourseAccessManager;
