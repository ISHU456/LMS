import { useState, useEffect, useMemo } from 'react';
import { 
  Users, CheckCircle2, ChevronRight, Search, 
  Filter, GraduationCap, Building, Loader2,
  AlertCircle, ShieldCheck, UserCheck, CalendarDays,
  LayoutGrid, BookOpen, ChevronLeft
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const AdminBatchFinalization = ({ user }) => {
  const [courses, setCourses] = useState([]);
  const [selectedSem, setSelectedSem] = useState(1);
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

  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

  useEffect(() => {
    fetchCourses();
  }, []);

  const filteredCourses = useMemo(() => {
    return courses.filter(c => c.semester === selectedSem);
  }, [courses, selectedSem]);

  // Reset selected course if it's not in the current semester
  useEffect(() => {
    if (selectedCourse && selectedCourse.semester !== selectedSem) {
      setSelectedCourse(null);
    }
  }, [selectedSem]);

  useEffect(() => {
    if (selectedCourse) {
      fetchEligibleStudents();
    } else {
      setStudents([]);
      setSelectedIds([]);
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
        fetchEligibleStudents(); 
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
    <div className="space-y-10 animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-20">
      {/* Dynamic Notification Hub */}
      <AnimatePresence>
        {notification && (
          <motion.div initial={{ opacity: 0, y: -20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-24 right-10 z-[100] flex items-center gap-4 px-8 py-5 rounded-[2rem] shadow-2xl backdrop-blur-3xl border border-white/20 ${
              notification.type === 'success' ? 'bg-emerald-600/90 text-white' : 'bg-rose-600/90 text-white'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
            <p className="font-black text-xs uppercase tracking-[0.2em]">{notification.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP HEADER: SEMESTER SELECTOR */}
      <div className="bg-white dark:bg-[#080c14] p-10 rounded-[3.5rem] border border-slate-200 dark:border-slate-800/60 shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:rotate-12 transition-transform duration-700">
           <GraduationCap size={160} className="text-indigo-500" />
        </div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Batch Finalization</h2>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] mt-2 italic flex items-center gap-2">
                <CalendarDays size={14} className="text-indigo-500" /> Session: {academicYear} Protocol
              </p>
            </div>
            <div className="flex items-center gap-4">
               <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest italic">Academic Cycle:</label>
               <select value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white outline-none focus:ring-2 ring-indigo-500/20">
                 {[`2024-25`, `2025-26`, `2026-27`].map(y => <option key={y} value={y}>{y} Session</option>)}
               </select>
            </div>
          </div>

          <div className="space-y-4">
             <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-[1px] bg-indigo-500/50" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 italic">Select Semester Node</h3>
             </div>
             <div className="flex flex-wrap gap-3">
               {semesters.map(sem => (
                 <button
                   key={sem}
                   onClick={() => setSelectedSem(sem)}
                   className={`px-8 py-5 rounded-[1.75rem] font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 border ${
                     selectedSem === sem 
                     ? 'bg-indigo-600 border-indigo-500 text-white shadow-2xl shadow-indigo-600/30 -translate-y-1' 
                     : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-400 dark:text-slate-500 hover:bg-white dark:hover:bg-indigo-500/10 hover:border-indigo-500/30'
                   }`}
                 >
                   Semester {sem}
                 </button>
               ))}
             </div>
          </div>
        </div>
      </div>

      {/* MID SECTION: COURSE SELECTOR GRID */}
      <AnimatePresence mode="wait">
        <motion.div key={selectedSem} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }} className="bg-white dark:bg-[#080c14] p-10 rounded-[3.5rem] border border-slate-200 dark:border-slate-800/60 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black uppercase tracking-[0.3em] dark:text-white italic flex items-center gap-3">
              <BookOpen size={20} className="text-indigo-500" /> Identity Matrix: Semester {selectedSem}
            </h3>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{filteredCourses.length} Modules Available</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCourses.map(course => (
              <button
                key={course._id}
                onClick={() => setSelectedCourse(course)}
                className={`group relative p-8 rounded-[2.5rem] text-left transition-all duration-500 border overflow-hidden ${
                  selectedCourse?._id === course._id 
                  ? 'bg-gradient-to-br from-indigo-600 to-violet-600 border-indigo-500 text-white shadow-2xl shadow-indigo-600/30 scale-105 z-10' 
                  : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-900 dark:text-white hover:bg-white dark:hover:bg-indigo-500/10 hover:border-indigo-500/30'
                }`}
              >
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 transition-transform duration-700"><Users size={80}/></div>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${selectedCourse?._id === course._id ? 'text-indigo-100/60' : 'text-slate-400'}`}>{course.code}</p>
                <h4 className="text-sm font-black uppercase tracking-tighter leading-tight mb-4">{course.name}</h4>
                <div className={`flex items-center gap-2 text-[8px] font-black uppercase tracking-tighter ${selectedCourse?._id === course._id ? 'text-indigo-200' : 'text-slate-400'}`}>
                   <Building size={12} /> {course.department?.name || 'GEN-ACAD'}
                </div>
                {selectedCourse?._id === course._id && (
                  <motion.div layoutId="courseMarker" className="absolute bottom-4 right-4"><CheckCircle2 size={24} className="text-white fill-white/10" /></motion.div>
                )}
              </button>
            ))}
            {filteredCourses.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800/60 rounded-[2.5rem] opacity-40">
                <LayoutGrid size={40} className="text-slate-300 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic">No academic modules mapped to this node</p>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* FINAL AREA: IDENTITY FINALIZATION LIST */}
      <AnimatePresence mode="wait">
        {selectedCourse ? (
          <motion.div key={selectedCourse._id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} className="bg-white dark:bg-[#080c14] rounded-[4rem] border border-slate-200 dark:border-slate-800/60 shadow-2xl overflow-hidden relative">
            <div className="p-12 bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 backdrop-blur-3xl sticky top-0 z-20">
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-10">
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-600/20">
                      <UserCheck size={28} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Identity Finalization Protocol</h3>
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-2 italic flex items-center gap-2">
                        Module: {selectedCourse.name} <ChevronRight size={10}/> Roll Protocol Active
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="px-6 py-4 bg-white dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 shadow-inner">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Identity Pool</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white italic tabular-nums">{filteredStudents.length} Subjects</p>
                  </div>
                  <div className="px-6 py-4 bg-indigo-500/10 rounded-3xl border border-indigo-500/20 shadow-inner">
                    <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mb-1">Auth Selectors</p>
                    <p className="text-lg font-black text-indigo-500 italic tabular-nums">{selectedIds.length} Flagged</p>
                  </div>
                  <button
                    onClick={handleFinalize}
                    disabled={loading || selectedIds.length === 0}
                    className="h-20 px-10 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-emerald-500/40 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:grayscale flex items-center gap-4 group"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={22} className="group-hover:rotate-12 transition-transform" />}
                    Commit Identity Manifest
                  </button>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                 <div className="flex-1 relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input 
                      type="text" 
                      placeholder="SEARCH IDENTITY NODE BY NAME OR ROLL ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-3xl pl-16 pr-8 py-5 text-xs font-black uppercase tracking-[0.1em] focus:border-indigo-500/50 outline-none transition-all dark:text-white"
                    />
                 </div>
                 <button 
                  onClick={() => handleSelectAll(filteredStudents)}
                  className="px-8 py-5 bg-slate-900 dark:bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest text-[10px] hover:shadow-xl transition-all"
                >
                  {filteredStudents.every(s => selectedIds.includes(s._id)) ? 'De-Auth Sector' : 'Authorize All Nodes'}
                </button>
              </div>
            </div>

            <div className="max-h-[700px] overflow-y-auto custom-scrollbar p-8">
              {fetchingStudents ? (
                <div className="py-40 text-center flex flex-col items-center justify-center gap-6">
                  <div className="relative">
                    <Loader2 className="animate-spin text-indigo-600" size={60} />
                    <Search size={24} className="absolute inset-0 m-auto text-indigo-400 animate-pulse" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 italic">Querying Identity Candidates for Lattice Sync...</p>
                </div>
              ) : filteredStudents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                  {filteredStudents.map(student => (
                    <motion.div 
                      key={student._id}
                      onClick={() => handleToggleSelect(student._id)}
                      className={`group p-8 rounded-[2.5rem] border transition-all duration-500 cursor-pointer relative overflow-hidden ${
                        selectedIds.includes(student._id) 
                        ? 'bg-indigo-50/50 dark:bg-indigo-600/10 border-indigo-500 shadow-xl' 
                        : 'bg-white dark:bg-[#080c14] border-slate-100 dark:border-slate-800/60 hover:border-indigo-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-6">
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg transition-colors border ${
                           selectedIds.includes(student._id) ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/5'
                         }`}>
                           {student.name[0]}
                         </div>
                         <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all ${
                            selectedIds.includes(student._id) ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-transparent border-slate-200 dark:border-slate-800 text-transparent'
                         }`}>
                            <CheckCircle2 size={24} />
                         </div>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">{student.name}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{student.rollNumber || 'ID-PENDING'}</p>
                      </div>
                      <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                         <div className="flex flex-col">
                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter italic">{student.enrollmentNumber}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{student.department} • SEM {student.semester}</span>
                         </div>
                         {student.isEnrolled ? (
                            <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-emerald-500/20 italic"><CheckCircle2 size={12}/> Locked</span>
                          ) : (
                            <span className="px-3 py-1.5 bg-amber-500/10 text-amber-600 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-amber-500/20 italic"><Loader2 size={12}/> Draft</span>
                          )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-40 text-center flex flex-col items-center justify-center opacity-30">
                  <Users size={80} className="text-slate-300 dark:text-slate-700 mb-6" />
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 max-w-lg leading-loose italic">No administrative identity nodes detected for this module mapping (Lattice Point: SEM {selectedCourse.semester}).</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[400px] flex flex-col items-center justify-center bg-white dark:bg-[#080c14] rounded-[4rem] border border-slate-200 dark:border-slate-800/60 opacity-40">
             <ShieldCheck size={64} className="text-slate-300 dark:text-slate-700 mb-6 animate-pulse" />
             <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 italic">Select an Academic Module to Activate Identity List</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminBatchFinalization;
