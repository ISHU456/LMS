import { useState, useEffect } from 'react';
import { 
  Users, CheckCircle2, ChevronRight, Search, 
  Filter, GraduationCap, Building, Loader2,
  AlertCircle, ShieldCheck, UserCheck
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const AdminBatchFinalization = ({ user }) => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingStudents, setFetchingStudents] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [notification, setNotification] = useState(null);
  const [academicYear, setAcademicYear] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    return now.getMonth() >= 6 ? `${year}-${(year + 1).toString().slice(-2)}` : `${year - 1}-${year.toString().slice(-2)}`;
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (courses.length > 0) {
      const savedCourseId = localStorage.getItem('adminBatchSelectedCourseId');
      if (savedCourseId) {
        const course = courses.find(c => c._id === savedCourseId);
        if (course) setSelectedCourse(course);
      }
    }
  }, [courses]);

  useEffect(() => {
    if (selectedCourse) {
      localStorage.setItem('adminBatchSelectedCourseId', selectedCourse._id);
      fetchEligibleStudents();
    }
  }, [selectedCourse, academicYear]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('http://localhost:5001/api/admin/courses', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setCourses(data);
    } catch (err) {
      showNotice('error', 'Protocol failure: Could not reach course repository.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibleStudents = async () => {
    try {
      setFetchingStudents(true);
      const { data } = await axios.get(`http://localhost:5001/api/admin/courses/eligible-students?courseId=${selectedCourse._id}&academicYear=${academicYear}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setStudents(data.students);
      // Auto-select already enrolled students
      setSelectedIds(data.students.filter(s => s.isEnrolled).map(s => s._id));
    } catch (err) {
      showNotice('error', 'Failed to fetch identity candidates for this sector.');
    } finally {
      setFetchingStudents(false);
    }
  };

  const showNotice = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (filtered) => {
    const filteredIds = filtered.map(s => s._id);
    const allSelected = filteredIds.every(id => selectedIds.includes(id));
    
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...filteredIds])]);
    }
  };

  const handleFinalize = async () => {
    if (!selectedCourse || selectedIds.length === 0) return;
    
    try {
        setLoading(true);
        const { data } = await axios.post(`http://localhost:5001/api/admin/courses/${selectedCourse._id}/finalize-batch`, {
            studentIds: selectedIds,
            academicYear: academicYear,
            semester: selectedCourse.semester
        }, {
            headers: { Authorization: `Bearer ${user.token}` }
        });
        
        showNotice('success', data.message);
        fetchEligibleStudents(); // Refresh to update enrollment status
    } catch (err) {
        showNotice('error', err.response?.data?.message || 'Finalization logic failure.');
    } finally {
        setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className={`fixed top-24 right-8 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl ${
              notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
            <p className="font-bold text-sm uppercase tracking-wider">{notification.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Course Selector */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass p-8 rounded-[40px] border border-gray-100 dark:border-gray-800">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-6 italic">Course Matrix</h3>
            
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {courses.map(course => (
                <button
                  key={course._id}
                  onClick={() => setSelectedCourse(course)}
                  className={`w-full p-5 rounded-[24px] text-left transition-all border ${
                    selectedCourse?._id === course._id 
                    ? 'bg-red-600 border-red-500 text-white shadow-xl shadow-red-600/20 translate-x-3' 
                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${selectedCourse?._id === course._id ? 'text-red-100' : 'text-gray-400'}`}>
                      {course.code}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${selectedCourse?._id === course._id ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
                      Sem {course.semester}
                    </span>
                  </div>
                  <p className="font-bold text-sm uppercase tracking-tight leading-tight">{course.name}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Identity Finalization */}
        <div className="lg:col-span-8 space-y-6">
          {!selectedCourse ? (
            <div className="glass h-[600px] rounded-[40px] border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center text-center p-12">
              <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-[32px] flex items-center justify-center text-red-600 mb-6">
                <ShieldCheck size={48} strokeWidth={1.5} />
              </div>
              <h4 className="text-xl font-black dark:text-white uppercase tracking-tighter">Selection Required</h4>
              <p className="text-gray-500 font-medium text-xs uppercase tracking-widest mt-2 max-w-xs">
                Select an academic module from the matrix to begin the identity finalization protocol.
              </p>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-[40px] border border-gray-100 dark:border-gray-800 overflow-hidden"
            >
              <div className="p-8 border-b border-gray-50 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-black dark:text-white uppercase tracking-tighter">Batch Finalization</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs font-bold text-red-600 uppercase italic">{selectedCourse.name} ({selectedCourse.code})</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Session {academicYear}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleFinalize}
                    disabled={loading || selectedIds.length === 0}
                    className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <UserCheck size={20} />}
                    Finalize Identity List
                  </button>
                </div>

                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Locate student by name or roll number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl pl-12 pr-4 py-4 text-xs font-bold focus:border-red-500 outline-none transition-all dark:text-white"
                    />
                  </div>
                  
                  <button 
                    onClick={() => handleSelectAll(filteredStudents)}
                    className="px-6 py-4 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200"
                  >
                    {filteredStudents.every(s => selectedIds.includes(s._id)) ? 'Deselect Segment' : 'Select Segment'}
                  </button>
                </div>
              </div>

              <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                {fetchingStudents ? (
                  <div className="py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-red-600 mb-4" size={32} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Querying identity candidates...</p>
                  </div>
                ) : filteredStudents.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-white dark:bg-gray-900 z-10">
                      <tr>
                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 dark:border-gray-800">Identity</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 dark:border-gray-800">Lattice Mapping</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 dark:border-gray-800 text-center">Status</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 dark:border-gray-800 text-right">Selection</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                      {filteredStudents.map(student => (
                        <tr 
                          key={student._id} 
                          className={`group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all ${selectedIds.includes(student._id) ? 'bg-red-50/20 dark:bg-red-900/10' : ''}`}
                        >
                          <td className="px-8 py-5">
                            <div>
                              <p className="text-sm font-black dark:text-white uppercase tracking-tight">{student.name}</p>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{student.rollNumber || 'NO-ROLL'}</p>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-indigo-600 uppercase">{student.enrollmentNumber}</span>
                              <span className="text-[9px] font-bold text-gray-400 uppercase">{student.semester} Semester • {student.department}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-center">
                            {student.isEnrolled ? (
                              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] border border-emerald-100 dark:border-emerald-800">Finalized</span>
                            ) : (
                              <span className="px-3 py-1 bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] border border-amber-100 dark:border-amber-800">Pending</span>
                            )}
                          </td>
                          <td className="px-8 py-5 text-right">
                            <input 
                              type="checkbox"
                              checked={selectedIds.includes(student._id)}
                              onChange={() => handleToggleSelect(student._id)}
                              className="w-10 h-10 rounded-xl border-2 border-gray-200 checked:bg-red-600 transition-all cursor-pointer"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-20 text-center">
                    <Users size={48} className="mx-auto text-gray-100 dark:text-gray-800 mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-12">No eligible identities found for this module mapping (Sector: {selectedCourse.department?.code}, Sem: {selectedCourse.semester}).</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBatchFinalization;
