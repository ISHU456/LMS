import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getStudentsForEntry, approveMarks, publishMarks, saveMarks, reset } from '../../features/results/resultSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Globe, ChevronRight, LayoutGrid, FileText, Bell, Send, AlertTriangle, ShieldCheck, User, Edit, Save } from 'lucide-react';
import axios from 'axios';

const ResultVerification = () => {
  const dispatch = useDispatch();
  const { results, isLoading, isSuccess } = useSelector(state => state.results);
  const { user } = useSelector(state => state.auth);

  const [searchParams, setSearchParams] = useSearchParams();
  const [courseId, setCourseId] = useState(searchParams.get('courseId') || '');
  const [semester, setSemester] = useState(searchParams.get('semester') || '');
  const [academicYear, setAcademicYear] = useState('2025-26');
  const [courses, setCourses] = useState([]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [teacher, setTeacher] = useState(null);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editingMarks, setEditingMarks] = useState({});

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await axios.get('http://localhost:5001/api/public/settings');
        setDeadline(data.globalAlert);
      } catch (err) { console.error("Failed to load deadline info."); }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (courseId && courses.length > 0) {
       const selectedCourse = courses.find(c => c._id === courseId);
       if (selectedCourse?.facultyAssigned && selectedCourse.facultyAssigned.length > 0) {
         setTeacher(selectedCourse.facultyAssigned[0]);
       } else { setTeacher(null); }
    }
  }, [courseId, courses]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await axios.get('http://localhost:5001/api/courses', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setCourses(Array.isArray(data) ? data : []);
      } catch (err) { console.error('Error fetching courses', err); setCourses([]); }
    };
    fetchCourses();
  }, [user.token]);

  useEffect(() => {
    const params = {};
    if (courseId) params.courseId = courseId;
    if (semester) params.semester = semester;
    setSearchParams(params, { replace: true });
    if (courseId && semester) {
      dispatch(getStudentsForEntry({ courseId, semester, academicYear }));
    }
  }, [courseId, semester, academicYear, dispatch, setSearchParams]);

  const handleSetDeadline = async () => {
    if (!newDeadline) return alert("Select a date-time for the protocol deadline.");
    const dateStr = new Date(newDeadline).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
    try {
      await axios.put('http://localhost:5001/api/admin/settings', {
        globalAlert: `Institutional Protocol Deadline: ${dateStr}`
      }, { headers: { Authorization: `Bearer ${user.token}` } });
      setDeadline(`Institutional Protocol Deadline: ${dateStr}`);
      alert('Institutional Protocol Deployed.');
    } catch (err) { alert('Protocol Sync Failure.'); }
  };

  const handleApprove = async () => {
    if (window.confirm('Approve all results?')) {
      try {
        await dispatch(approveMarks({ courseId, semester, academicYear })).unwrap();
        dispatch(getStudentsForEntry({ courseId, semester, academicYear }));
        alert('Selection Approved.');
      } catch (err) { alert('Approval failure.'); }
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return alert('Reason required.');
    try {
      await axios.post('http://localhost:5001/api/results/reject', { courseId, semester, academicYear, reason: rejectionReason }, { headers: { Authorization: `Bearer ${user.token}` } });
      setShowRejectModal(false); setRejectionReason('');
      dispatch(getStudentsForEntry({ courseId, semester, academicYear }));
    } catch (err) { alert('Failed to reject marks.'); }
  };

  const handlePublish = async () => {
    if (window.confirm('Publish results?')) {
      try {
        await dispatch(publishMarks({ courseId, semester, academicYear })).unwrap();
        dispatch(getStudentsForEntry({ courseId, semester, academicYear }));
        alert('Results Published to Students.');
      } catch (err) { alert('Publishing failure.'); }
    }
  };

  const handleNotifyTeacher = async () => {
    const message = window.prompt("Message for Instructor:");
    if (!message || !teacher) return;
    try {
       await axios.post('http://localhost:5001/api/admin/results/notify-faculty', { teacherId: teacher._id, courseId, semester, message }, { headers: { Authorization: `Bearer ${user.token}` } });
       alert('Alert transmitted.');
    } catch (err) { alert('Transmission fail.'); }
  };

  const gradeToPoints = { 'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'F': 0 };
  const pointsToGrade = { 10: 'O', 9: 'A+', 8: 'A', 7: 'B+', 6: 'B', 5: 'C', 0: 'F' };

  const calculateMarks = (marks, type) => {
    let total = 0;
    let grade = 'F';
    const normalizedType = type?.toString().toUpperCase().trim();

    if (normalizedType === 'VIVA') {
      let score = marks.vivaScore;
      if (typeof score === 'string' && gradeToPoints[score.toUpperCase()] !== undefined) {
        score = gradeToPoints[score.toUpperCase()];
      }
      const numScore = Number(score) || 0;
      total = numScore * 10;
      
      if (numScore >= 10) grade = 'O';
      else if (numScore >= 9) grade = 'A+';
      else if (numScore >= 8) grade = 'A';
      else if (numScore >= 7) grade = 'B+';
      else if (numScore >= 6) grade = 'B';
      else if (numScore >= 5) grade = 'C';
      else grade = 'F';
      return { total, grade };
    }

    if (normalizedType === 'THEORY') {
      const msts = [Number(marks.mst1) || 0, Number(marks.mst2) || 0, Number(marks.mst3) || 0];
      const bestTwoSum = msts.sort((a, b) => b - a).slice(0, 2).reduce((sum, val) => sum + val, 0);
      total = bestTwoSum + (Number(marks.endSem) || 0);
    } else if (normalizedType === 'PRACTICAL') {
      total = (Number(marks.internalPractical) || 0) + (Number(marks.externalPractical) || 0);
    }

    if (total >= 90) grade = 'O';
    else if (total >= 80) grade = 'A+';
    else if (total >= 70) grade = 'A';
    else if (total >= 60) grade = 'B+';
    else if (total >= 50) grade = 'B';
    else if (total >= 40) grade = 'C';
    
    return { total, grade };
  };

  const handleSaveRow = async (studentId) => {
    try {
      const cType = courses.find(c => c._id === courseId)?.type;
      const { total, grade } = calculateMarks(editingMarks, cType);

      await dispatch(saveMarks({ 
        courseId, 
        semester, 
        academicYear, 
        results: [{ 
          studentId, 
          marks: editingMarks, 
          totalMarks: total, 
          grade 
        }] 
      })).unwrap();
      setEditingStudentId(null);
      alert('Normalized.');
    } catch (err) { alert('Sync failure.'); }
  };

  const selectedCourse = courses.find(c => c._id === courseId);

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white p-4 md:p-8 transition-colors duration-300">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[2rem] bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 dark:border-emerald-500/30 flex items-center justify-center p-1 shadow-2xl">
               <div className="w-full h-full rounded-[1.8rem] bg-white dark:bg-slate-900 flex items-center justify-center text-emerald-600 dark:text-white font-black text-2xl uppercase tracking-tighter">
                  {user.department[0]}
               </div>
            </div>
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter bg-gradient-to-r from-emerald-600 dark:from-emerald-400 to-cyan-600 dark:to-cyan-400 bg-clip-text text-transparent italic">Verification Core</h1>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2 px-1">{user.department} Result Governance</p>
            </div>
          </div>
          
          {teacher && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-5 p-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-xl dark:shadow-2xl backdrop-blur-md">
               <div className="w-12 h-12 rounded-2xl overflow-hidden border border-slate-100 dark:border-white/20 hover:scale-105 transition-transform duration-500">
                  <img src={teacher.profilePic || 'https://via.placeholder.com/50'} className="w-full h-full object-cover" alt="Node Origin" />
               </div>
               <div>
                  <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Certifying Instructor</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mt-1">{teacher.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                     <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-500/80 uppercase tracking-widest italic">{teacher.designation || 'Faculty Member'}</span>
                  </div>
               </div>
            </motion.div>
          )}

          <div className="flex flex-wrap gap-3">
             <button onClick={handleNotifyTeacher} className="px-5 py-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase text-slate-600 dark:text-white shadow-sm hover:bg-slate-50 transition-all tracking-widest">Notify Instructor</button>
             <button onClick={handleApprove} className="px-5 py-3 bg-emerald-600 rounded-2xl text-[10px] font-black uppercase text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all tracking-widest">Approve All</button>
             <button onClick={() => setShowRejectModal(true)} className="px-5 py-3 bg-rose-600 rounded-2xl text-[10px] font-black uppercase text-white shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all tracking-widest">Reject All</button>
             <button onClick={handlePublish} className="px-5 py-3 bg-cyan-600 rounded-2xl text-[10px] font-black uppercase text-white shadow-lg shadow-cyan-600/20 hover:bg-cyan-700 transition-all tracking-widest">Publish Selection</button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 bg-white dark:bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl dark:shadow-none transition-all">
          <div className="space-y-2">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4">Select Semester</p>
            <select value={semester} onChange={e=>setSemester(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 font-black uppercase text-xs outline-none border border-slate-100 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 transition-all">
              <option value="">Semester</option>
              {[1,2,3,4,5,6,7,8].map(s=>(<option key={s} value={s.toString()}>Sem {s}</option>))}
            </select>
          </div>
          <div className="space-y-2">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4">Course Assignment</p>
            <select value={courseId} onChange={e=>setCourseId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 font-black uppercase text-xs outline-none border border-slate-100 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 transition-all">
              <option value="">Course</option>
              {courses.filter(c => !semester || c.semester.toString() === semester).map(c=>(<option key={c._id} value={c._id}>{c.name}</option>))}
            </select>
          </div>
          <div className="space-y-2">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4">Protocol Deadline</p>
            <div className="flex gap-2">
               <input type="datetime-local" value={newDeadline} onChange={e=>setNewDeadline(e.target.value)} className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-[10px] font-black uppercase outline-none border border-slate-100 dark:border-slate-700 transition-all" />
               <button onClick={handleSetDeadline} className="px-5 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all"><ShieldCheck size={20}/></button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden mb-8 shadow-2xl dark:shadow-none">
          <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Roll No</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Student Name</th>
                {selectedCourse?.type?.toUpperCase() === 'THEORY' && (
                  <>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">MST 1</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">MST 2</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">MST 3</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">End Sem</th>
                  </>
                )}
                {selectedCourse?.type?.toUpperCase() === 'PRACTICAL' && (
                  <>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Internal</th>
                    <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">External</th>
                  </>
                )}
                {selectedCourse?.type?.toUpperCase() === 'VIVA' && (
                   <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Viva Grade</th>
                )}
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Total Unit</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Grade</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Submission Node</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {results.map(student => {
                const isEditing = editingStudentId === student._id;
                const m = isEditing ? editingMarks : student.marks;
                const { total, grade } = calculateMarks(m, selectedCourse?.type);
                return (
                <tr key={student._id} className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                  <td className="p-6 font-mono text-emerald-600 font-bold text-xs tracking-tighter">{student.rollNumber}</td>
                  <td className="p-6">
                    <p className="font-black text-sm uppercase tracking-tight text-slate-900 dark:text-white uppercase">{student.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Academic Record Participant</p>
                  </td>
                  {selectedCourse?.type?.toUpperCase() === 'THEORY' && (
                    <>
                      {['mst1', 'mst2', 'mst3', 'endSem'].map(field => (
                        <td key={field} className="p-4 text-center">
                          {isEditing ? (
                            <input type="number" value={editingMarks[field] || 0} onChange={(e) => setEditingMarks({...editingMarks, [field]: Number(e.target.value)})} className="w-16 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-center text-xs font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                          ) : (
                            <span className="font-black text-slate-600 dark:text-slate-300 tabular-nums">{student.marks[field] || 0}</span>
                          )}
                        </td>
                      ))}
                    </>
                  )}
                  {selectedCourse?.type?.toUpperCase() === 'PRACTICAL' && (
                    <>
                      {['internalPractical', 'externalPractical'].map(field => (
                        <td key={field} className="p-4 text-center">
                          {isEditing ? (
                            <input type="number" value={editingMarks[field] || 0} onChange={(e) => setEditingMarks({...editingMarks, [field]: Number(e.target.value)})} className="w-16 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-center text-xs font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                          ) : (
                            <span className="font-black text-slate-600 dark:text-slate-300 tabular-nums">{student.marks[field] || 0}</span>
                          )}
                        </td>
                      ))}
                    </>
                  )}
                  {selectedCourse?.type?.toUpperCase() === 'VIVA' && (
                    <td className="p-4 text-center">
                       {isEditing ? (
                         <select 
                            value={editingMarks.vivaScore} 
                            onChange={e=>setEditingMarks({...editingMarks, vivaScore: Number(e.target.value)})} 
                            className="w-20 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-center text-xs font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-sans"
                         >
                            <option value="">Grade</option>
                            {Object.entries(gradeToPoints).map(([g, pts]) => (<option key={g} value={pts}>{g}</option>))}
                         </select>
                       ) : (
                         <span className="font-black text-indigo-600 dark:text-indigo-400 tabular-nums uppercase">{pointsToGrade[student.marks.vivaScore] || student.marks.vivaScore || 'N/A'}</span>
                       )}
                    </td>
                  )}
                  <td className="p-4 text-center">
                    <span className="text-xl font-black text-slate-900 dark:text-white px-3 py-1 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-transparent tabular-nums">
                      {total.toFixed(0)}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`text-2xl font-black italic tracking-tighter ${grade === 'F' ? 'text-rose-500 shadow-rose-500/20' : 'text-emerald-500 shadow-emerald-500/20'}`}>{grade}</span>
                  </td>
                  <td className="p-4 text-center">
                    <p className="text-[10px] font-black uppercase tracking-tight text-slate-900 dark:text-slate-200">{student.uploaderName}</p>
                    <p className="text-[7px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5 italic">Uploader Identity</p>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border shadow-sm ${
                      student.status === 'published' ? 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-100 dark:border-cyan-800' : 
                      student.status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' : 
                      student.status === 'submitted' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800' : 
                      'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800'
                    }`}>{student.status}</span>
                  </td>
                  <td className="p-4 text-center">
                    {isEditing ? (
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => handleSaveRow(student._id)} className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"><CheckCircle size={14}/></button>
                        <button onClick={() => setEditingStudentId(null)} className="p-3 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20"><XCircle size={14}/></button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingStudentId(student._id); setEditingMarks({...student.marks}); }} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl text-slate-400 dark:text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-200 transition-all group-hover:scale-110"><Edit size={14}/></button>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col md:flex-row items-center justify-between gap-8 p-10 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 mb-20 shadow-2xl transition-all">
           <div>
              <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white italic">Institutional Certification Hub</h3>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mt-2">Global Governance Node Terminal: {selectedCourse?.name || 'Departmental Sector'}</p>
           </div>
           <div className="flex flex-wrap gap-4">
              <button onClick={handleNotifyTeacher} className="px-10 py-5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-3xl text-[10px] font-black uppercase text-slate-600 dark:text-white hover:bg-white transition-all tracking-[0.2em] shadow-sm">Notify Instructor</button>
              <button onClick={handleApprove} className="px-10 py-5 bg-emerald-600 rounded-3xl text-[10px] font-black uppercase text-white shadow-xl shadow-emerald-500/30 hover:bg-emerald-700 transition-all tracking-[0.2em]">Approve Protocol</button>
              <button onClick={() => setShowRejectModal(true)} className="px-10 py-5 bg-rose-600 rounded-3xl text-[10px] font-black uppercase text-white shadow-xl shadow-rose-500/30 hover:bg-rose-700 transition-all tracking-[0.2em]">Reject Submission</button>
           </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showRejectModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
             <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                <h3 className="text-2xl font-black uppercase mb-8 text-slate-900 dark:text-white italic tracking-tighter">Reject Transmission</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">State Specific Reason</p>
                <textarea value={rejectionReason} onChange={e=>setRejectionReason(e.target.value)} className="w-full h-40 bg-slate-50 dark:bg-slate-800 rounded-3xl p-6 outline-none border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold mb-8 focus:ring-2 focus:ring-rose-500 transition-all resize-none" placeholder="Administrative discrepancy report..." />
                <div className="flex gap-4">
                   <button onClick={() => setShowRejectModal(false)} className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all">Abort Action</button>
                   <button onClick={handleReject} className="flex-1 py-5 bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-rose-500/20 hover:bg-rose-700 transition-all">Confirm Rejection</button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResultVerification;
