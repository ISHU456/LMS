import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getStudentsForEntry, saveMarks, submitMarksForApproval, reset } from '../../features/results/resultSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Send, Upload, Download, CheckCircle, AlertCircle, FileText, ChevronRight, Lock, Unlock, Clock } from 'lucide-react';
import Papa from 'papaparse';
import axios from 'axios';
import InstitutionalAlert from '../../components/InstitutionalAlert';

const ResultEntry = () => {
  const dispatch = useDispatch();
  const { results, isLoading, isSuccess, isError, message } = useSelector(state => state.results);
  const { user } = useSelector(state => state.auth);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState(searchParams.get('courseId') || '');
  const [semester, setSemester] = useState(searchParams.get('semester') || '');
  
  // Real-time Profile Permission Synchronization 
  useEffect(() => {
    const syncProfile = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get('http://localhost:5001/api/auth/profile', config);
        // If data from backend has more updated permissions than store, update store
        const { updateProfile } = await import('../../features/auth/authSlice');
        dispatch(updateProfile(data));
      } catch (err) { console.error("Permission sync failed:", err); }
    };
    if (user?.token) syncProfile();
  }, [user?.token, dispatch]);
  
  const getPresentAcademicYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    return now.getMonth() >= 6 ? `${year}-${(year + 1).toString().slice(-2)}` : `${year - 1}-${year.toString().slice(-2)}`;
  };

  const [academicYear, setAcademicYear] = useState(searchParams.get('academicYear') || getPresentAcademicYear());
  const [localResults, setLocalResults] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savingStudentId, setSavingStudentId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingFinalize, setPendingFinalize] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (courseId) params.set('courseId', courseId);
    if (semester) params.set('semester', semester);
    if (academicYear) params.set('academicYear', academicYear);
    navigate({ search: params.toString() }, { replace: true });
  }, [courseId, semester, academicYear, navigate]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get('http://localhost:5001/api/courses', config);
        const myCourses = data.filter(c => {
          if (user.role === 'admin') return true;
          const isDeptMatch = c.department?.name === user.department || c.department?.code === user.department;
          if (user.role === 'hod') return isDeptMatch;
          const isAssigned = c.facultyAssigned?.some(f => (f._id || f).toString() === user._id.toString());
          const isSemMatch = user.assignedSemesters?.some(s => s.toString() === c.semester.toString());
          return isAssigned || (isDeptMatch && isSemMatch);
        });
        setCourses(Array.isArray(myCourses) ? myCourses : []);
        if (myCourses.length > 0 && !searchParams.get('courseId')) {
           const initialCourse = myCourses[0];
           setCourseId(initialCourse._id.toString());
           setSemester(initialCourse.semester.toString());
        }
      } catch (err) { console.error('Error fetching courses', err); }
    };
    fetchCourses();
  }, [user.token, searchParams]);

  useEffect(() => {
    if (courseId && semester && academicYear) {
      dispatch(getStudentsForEntry({ courseId, semester, academicYear }));
    }
  }, [courseId, semester, academicYear, dispatch]);

  // Synchronize Course Node when Semester Sector changes
  useEffect(() => {
    if (semester && courses.length > 0) {
       const semCourses = courses.filter(c => c.semester.toString() === semester);
       const currentCourseValid = semCourses.some(c => c._id === courseId);
       
       if (!currentCourseValid && semCourses.length > 0) {
          setCourseId(semCourses[0]._id);
       } else if (semCourses.length === 0) {
          setCourseId('');
       }
    }
  }, [semester, courses]);

  useEffect(() => {
    if (results && results.length > 0) {
      setLocalResults(results.map(r => ({ ...r })));
    }
  }, [results]);

  const currentCourse = courses.find(c => c._id === courseId);

  const gradeToPoints = { 'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'F': 0 };
  const pointsToGrade = { 10: 'O', 9: 'A+', 8: 'A', 7: 'B+', 6: 'B', 5: 'C', 0: 'F' };

  const calculateMarks = (marks, type) => {
    let total = 0;
    let grade = 'F';
    const normalizedType = type?.toString().toUpperCase().trim();

    if (normalizedType === 'VIVA') {
      let score = marks.vivaScore;
      // Handle grade strings if present
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

  const handleMarkChange = (studentId, field, value) => {
    let max = 100;
    if (field === 'endSem') max = 60;
    if (field === 'mst1' || field === 'mst2' || field === 'mst3') max = 20;
    if (field === 'internalPractical') max = 40;
    if (field === 'externalPractical') max = 60;
    if (field === 'vivaScore') max = 10; // 0-10 scale

    let val = value;
    let isAbsent = false;
    
    if (field === 'vivaScore' && typeof value === 'string' && gradeToPoints[value.toUpperCase()] !== undefined) {
      val = gradeToPoints[value.toUpperCase()];
    } else if (value === 'NA' || value === 'na' || value === 'a' || value === 'A') { 
      val = 0; 
      isAbsent = true; 
    }
    else if (value === '') { 
      val = ''; 
    }
    else { 
      val = Number(value); 
      if (isNaN(val)) val = ''; 
      if (val < 0) val = 0; 
      if (val > max) val = max; 
    }

    setLocalResults(prev => prev.map(student => {
      if (student._id === studentId) {
        const updatedMarks = { ...student.marks, [field]: val };
        let updatedAbsences = [...(student.marks.absentFields || [])];
        
        if (isAbsent) { 
          if (!updatedAbsences.includes(field)) updatedAbsences.push(field); 
        } else { 
          updatedAbsences = updatedAbsences.filter(f => f !== field); 
        }

        const { total, grade } = calculateMarks(updatedMarks, currentCourse?.type);

        return { 
          ...student, 
          marks: { ...updatedMarks, absentFields: updatedAbsences }, 
          grade, 
          totalMarks: total 
        };
      }
      return student;
    }));
  };

  const handleSaveSingleMark = async (studentId, studentData = null) => {
    const student = studentData || localResults.find(r => r._id === studentId);
    if (!student) return;
    setSavingStudentId(studentId);
    try {
      const response = await dispatch(saveMarks({ 
        courseId, 
        semester, 
        academicYear, 
        results: [{ 
          studentId: student._id, 
          marks: student.marks, 
          grade: student.grade, 
          totalMarks: student.totalMarks 
        }] 
      })).unwrap();
      
      if (response?.results?.length > 0) {
          const savedResult = response.results[0];
          setLocalResults(prev => prev.map(r => r._id === studentId ? { 
            ...r, 
            resultId: savedResult._id, 
            status: savedResult.status,
            isLocked: savedResult.isLocked 
          } : r));
      }
      setShowSuccess(true);
      setTimeout(() => { setShowSuccess(false); setSavingStudentId(null); }, 2000);
    } catch (err) { setSavingStudentId(null); }
  };

  const handleToggleRowLock = async (resultId, studentId) => {
    if (!resultId) return alert("Persistence Required.");
    try {
        const { data } = await axios.post(`http://localhost:5001/api/results/toggle-lock/${resultId}`, {}, { headers: { Authorization: `Bearer ${user.token}` } });
        setLocalResults(prev => prev.map(r => r._id === studentId ? { ...r, isLocked: data.isLocked } : r));
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) { alert("Protocol Failure."); }
  };

  const handleSaveAllDrafts = async () => {
    if (localResults.length === 0) return;
    try {
      await dispatch(saveMarks({ 
        courseId, 
        semester, 
        academicYear, 
        results: localResults.map(r => ({ 
          studentId: r._id, 
          marks: r.marks, 
          grade: r.grade, 
          totalMarks: r.totalMarks 
        })) 
      })).unwrap();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) { alert("Bulk Save Failure."); }
  };

  const handleSubmitResults = async (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (isSubmitting) return;
    setPendingFinalize(true);
  };

  const confirmFinalize = async () => {
    setPendingFinalize(false);
    setIsSubmitting(true);
    try {
        // First save all as draft to ensure current state is persisted
        await dispatch(saveMarks({ 
          courseId, 
          semester, 
          academicYear, 
          results: localResults.map(r => ({ 
            studentId: r._id, 
            marks: r.marks, 
            grade: r.grade, 
            totalMarks: r.totalMarks 
          })) 
        })).unwrap();

        // Then submit
        const result = await dispatch(submitMarksForApproval({ courseId, semester, academicYear })).unwrap();
        
        if (result.count === 0) {
           alert("Zero records were finalized. Ensure all marks are saved as 'Draft' before submitting.");
        } else {
           setShowSuccess(true);
           setTimeout(() => setShowSuccess(false), 3000);
        }
        
        // Refresh data to show updated status/locks
        dispatch(getStudentsForEntry({ courseId, semester, academicYear }));
      } catch (err) { 
        console.error("Submission error:", err);
        alert(err.message || "Submission Protocol Failure."); 
      } finally {
        setIsSubmitting(false);
      }
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const uploadedData = results.data;
          setLocalResults(prev => prev.map(student => {
            const entry = uploadedData.find(d => 
              d.rollNumber?.toString() === student.rollNumber?.toString() || 
              d['Roll Number']?.toString() === student.rollNumber?.toString()
            );
            
            if (entry) {
              const vivaEntry = entry.VivaScore || entry.Viva || student.marks.vivaScore || '';
              let finalVivaScore = '';
              if (vivaEntry !== '') {
                if (gradeToPoints[vivaEntry.toString().toUpperCase()] !== undefined) {
                  finalVivaScore = gradeToPoints[vivaEntry.toString().toUpperCase()];
                } else {
                  finalVivaScore = Number(vivaEntry);
                  if (isNaN(finalVivaScore)) finalVivaScore = '';
                  else if (finalVivaScore > 10) finalVivaScore = 10;
                }
              }

              const newMarks = {
                mst1: entry.MST1 || entry['MST 1'] || student.marks.mst1 || '',
                mst2: entry.MST2 || entry['MST 2'] || student.marks.mst2 || '',
                mst3: entry.MST3 || entry['MST 3'] || student.marks.mst3 || '',
                endSem: entry.EndSem || entry['End Sem'] || entry.EndSemester || student.marks.endSem || '',
                internalPractical: entry.InternalPractical || entry.Internal || student.marks.internalPractical || '',
                externalPractical: entry.ExternalPractical || entry.External || student.marks.externalPractical || '',
                vivaScore: finalVivaScore
              };

              const { total, grade } = calculateMarks(newMarks, currentCourse?.type);
              return { ...student, marks: newMarks, totalMarks: total, grade };
            }
            return student;
          }));
        }
      });
    }
  };

  const downloadTemplate = () => {
    let headers = { rollNumber: 'Roll Number', name: 'Name' };
    
    if (currentCourse?.type?.toUpperCase() === 'THEORY') {
      headers = { ...headers, MST1: 'MST 1', MST2: 'MST 2', MST3: 'MST 3', EndSem: 'End Sem' };
    } else if (currentCourse?.type?.toUpperCase() === 'PRACTICAL') {
      headers = { ...headers, InternalPractical: 'Internal Practical', ExternalPractical: 'External Practical' };
    } else if (currentCourse?.type?.toUpperCase() === 'VIVA') {
      headers = { ...headers, VivaScore: 'Viva Grade (O, A+, A, B+, B, C, F)' };
    }

    const data = localResults.map(r => {
      const row = { rollNumber: r.rollNumber, name: r.name };
      if (currentCourse?.type?.toUpperCase() === 'THEORY') {
        row.MST1 = r.marks.mst1;
        row.MST2 = r.marks.mst2;
        row.MST3 = r.marks.mst3;
        row.EndSem = r.marks.endSem;
      } else if (currentCourse?.type?.toUpperCase() === 'PRACTICAL') {
        row.InternalPractical = r.marks.internalPractical;
        row.ExternalPractical = r.marks.externalPractical;
      } else if (currentCourse?.type?.toUpperCase() === 'VIVA') {
        row.VivaScore = pointsToGrade[r.marks.vivaScore] || r.marks.vivaScore;
      }
      return row;
    });

    const csv = Papa.unparse({ fields: Object.keys(headers), data });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `result_template_${currentCourse?.code || 'course'}.csv`;
    link.click();
  };


  return (
    <div className="min-h-full bg-slate-50 dark:bg-[#020617] p-4 md:p-10 transition-colors duration-300">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                  <button onClick={() => navigate('/faculty-dashboard')} className="p-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl text-slate-500 border border-slate-100 dark:border-slate-800 transition-all shadow-sm"><ChevronRight size={20} className="rotate-180" /></button>
                  <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">Result Entry</h1>
              </div>
              <p className="text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] ml-2">Certification Protocol Nodes</p>
            </div>
            <div className="flex gap-3">
              <button onClick={downloadTemplate} className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-50 transition-all">Download Template</button>
              <label className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all">CSV Upload<input type="file" onChange={handleCSVUpload} accept=".csv" className="hidden" /></label>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-white dark:bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl dark:shadow-none transition-all">
             <div className="space-y-1">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4">Sector Selection</p>
                <select value={semester} onChange={e=>setSemester(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 font-black text-[10px] uppercase outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                   <option value="">Semester</option>
                   {[1,2,3,4,5,6,7,8].map(s=>(<option key={s} value={s.toString()}>Sem {s}</option>))}
                </select>
             </div>
             <div className="space-y-1">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4">Course Node</p>
                <select value={courseId} onChange={e=>setCourseId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 font-black text-[10px] uppercase outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                   <option value="">Course</option>
                   {courses.filter(c => !semester || c.semester.toString() === semester).map(c=>(<option key={c._id} value={c._id}>{c.name}</option>))}
                </select>
             </div>
          </div>

          <div className="bg-white dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-2xl dark:shadow-none transition-all">
             <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                   <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                      <tr>
                         <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Roll No</th>
                         <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Participant Name</th>
                         {currentCourse?.type?.toUpperCase() === 'THEORY' && (
                            <>
                               <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">MST 1</th>
                               <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">MST 2</th>
                               <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">MST 3</th>
                               <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">End Sem</th>
                            </>
                         )}
                         {currentCourse?.type?.toUpperCase() === 'PRACTICAL' && (
                            <>
                               <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Internal</th>
                               <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">External</th>
                            </>
                         )}
                         {currentCourse?.type?.toUpperCase() === 'VIVA' && (
                            <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Viva Score</th>
                         )}
                         <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Total Unit</th>
                         <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Grade</th>
                         <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Submission Node</th>
                         <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                         <th className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Row Key</th>
                      </tr>
                   </thead>
                   <tbody>
                      {localResults.map((student, idx) => (
                         <motion.tr 
                            key={student._id} 
                            initial={{ opacity: 0, x: -10 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            transition={{ delay: idx * 0.05 }} 
                            className="border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group"
                         >
                            <td className="p-6 font-mono font-bold text-blue-600 dark:text-blue-400 text-xs tracking-tighter">{student.rollNumber}</td>
                            <td className="p-6">
                               <p className="font-black text-sm uppercase tracking-tight text-slate-900 dark:text-white">{student.name}</p>
                               <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Academic Record Node</p>
                            </td>
                            {currentCourse?.type?.toUpperCase() === 'THEORY' && (
                               <>
                                  {['mst1', 'mst2', 'mst3', 'endSem'].map(f => (
                                     <td key={f} className="p-4 text-center">
                                        <input type="text" value={student.marks[f] || ''} onChange={e=>handleMarkChange(student._id, f, e.target.value)} onBlur={()=>handleSaveSingleMark(student._id)} disabled={student.isLocked} className="w-14 h-11 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-center font-black text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all tabular-nums" />
                                     </td>
                                  ))}
                               </>
                            )}
                            {currentCourse?.type?.toUpperCase() === 'PRACTICAL' && (
                               <>
                                  {['internalPractical', 'externalPractical'].map(f => (
                                     <td key={f} className="p-4 text-center">
                                        <input type="text" value={student.marks[f] || ''} onChange={e=>handleMarkChange(student._id, f, e.target.value)} onBlur={()=>handleSaveSingleMark(student._id)} disabled={student.isLocked} className="w-14 h-11 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-center font-black text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all tabular-nums" />
                                     </td>
                                  ))}
                               </>
                            )}
                            {currentCourse?.type?.toUpperCase() === 'VIVA' && (
                               <td className="p-4 text-center">
                                  <select 
                                     value={student.marks.vivaScore} 
                                     onChange={e=>handleMarkChange(student._id, 'vivaScore', e.target.value)} 
                                     onBlur={()=>handleSaveSingleMark(student._id)} 
                                     disabled={student.isLocked} 
                                     className="w-20 h-11 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-center font-black text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                  >
                                     <option value="">Grade</option>
                                     {Object.entries(gradeToPoints).map(([grade, pts])=>(<option key={grade} value={pts}>{grade}</option>))}
                                  </select>
                               </td>
                            )}
                            <td className="p-4 text-center font-black text-xl tabular-nums text-slate-900 dark:text-white leading-none">{student.totalMarks}</td>
                            <td className="p-4 text-center">
                               <span className={`text-2xl font-black italic tracking-tighter ${student.grade === 'F' ? 'text-rose-500' : 'text-indigo-600 dark:text-indigo-400'}`}>{student.grade}</span>
                            </td>
                            <td className="p-4 text-center">
                               <p className="text-[9px] font-black uppercase tracking-tight text-slate-900 dark:text-slate-200">{student.uploaderName || 'Unassigned'}</p>
                               <p className="text-[7px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5 italic">Uploader Node</p>
                            </td>
                            <td className="p-4 text-center">
                               <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                  student.status === 'published' ? 'bg-indigo-500 text-white border-transparent shadow-lg shadow-indigo-500/20' : 
                                  student.status === 'approved' ? 'bg-emerald-500 text-white border-transparent shadow-lg shadow-emerald-500/20' : 
                                  student.status === 'submitted' ? 'bg-amber-500 text-white border-transparent shadow-lg shadow-amber-500/20' : 
                                  'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700'
                               }`}>{student.status}</span>
                            </td>
                            <td className="p-4 text-center">
                               <div className="flex items-center justify-center gap-3">
                                  <button onClick={()=>handleToggleRowLock(student.resultId, student._id)} className={`p-3 rounded-xl border transition-all ${student.isLocked?'bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-900 text-rose-500':'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-900 text-emerald-500'} hover:scale-110 shadow-sm`}>{student.isLocked?<Lock size={14}/>:<Unlock size={14}/>}</button>
                               </div>
                            </td>
                         </motion.tr>
                      ))}
                   </tbody>
                </table>
             </div>
             
             {localResults.length > 0 && (
                <div className="p-8 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-end items-center gap-6">
                    <div className="mr-auto">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Curriculum Sector</p>
                       <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tight">{currentCourse?.name} ({currentCourse?.type})</p>
                    </div>
                    <div className="flex gap-4">
                       <button onClick={handleSaveAllDrafts} className="px-8 py-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Save All Drafts</button>
                        <button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPendingFinalize(true); }} 
                          disabled={isSubmitting}
                          className={`px-12 py-5 bg-indigo-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/30 transition-all ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                        >
                          {isSubmitting ? 'Processing...' : 'Finalize Submission Protocol'}
                        </button>
                    </div>
                 </div>
             )}
          </div>
        </motion.div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity:0, y:30, scale:0.9 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:30, scale:0.9 }} className="fixed bottom-10 right-10 bg-emerald-600 text-white px-10 py-5 rounded-[2rem] shadow-2xl font-black uppercase text-[10px] tracking-[0.3em] flex items-center gap-4 z-[100] border-2 border-white/20 backdrop-blur-md"><CheckCircle size={20}/> Protocol Update Synchronized</motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingFinalize && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/60 backdrop-blur-2xl">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3.5rem] p-12 shadow-2xl border border-gray-100 dark:border-gray-800 text-center relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-600 via-primary-600 to-indigo-600" />
               <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto mb-8">
                  <Send size={32} />
               </div>
               <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">Submission Protocol</h3>
               <p className="text-slate-500 dark:text-slate-400 text-xs font-bold leading-relaxed mb-10 px-6 uppercase tracking-tight">You are about to finalize the marks list for approval. This operation will save all current drafts and lock the records for subsequent HOD/Admin verification.</p>
               
               <div className="flex flex-col gap-3">
                  <button onClick={confirmFinalize} className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-indigo-600/30 hover:scale-[1.02] transition-all">Confirm Submission</button>
                  <button onClick={() => setPendingFinalize(false)} className="w-full py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-3xl font-black uppercase text-[10px] tracking-widest transition-all">Abort Protocol</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResultEntry;
