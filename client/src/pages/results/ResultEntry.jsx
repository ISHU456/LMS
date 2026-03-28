import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getStudentsForEntry, saveMarks, submitMarksForApproval, reset } from '../../features/results/resultSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Send, Upload, Download, CheckCircle, AlertCircle, FileText, ChevronRight, Lock, Unlock, Clock } from 'lucide-react';
import Papa from 'papaparse';
import axios from 'axios';

const ResultEntry = () => {
  const dispatch = useDispatch();
  const { results, isLoading, isSuccess, isError, message } = useSelector(state => state.results);
  const { user } = useSelector(state => state.auth);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [courseId, setCourseId] = useState(searchParams.get('courseId') || '');
  const [semester, setSemester] = useState(searchParams.get('semester') || '');
  
  // Calculate dynamic default academic year (e.g., 2025-26 for March 2026)
  const getPresentAcademicYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    // Academic years usually start in July (month 6)
    return now.getMonth() >= 6 
      ? `${year}-${(year + 1).toString().slice(-2)}` 
      : `${year - 1}-${year.toString().slice(-2)}`;
  };

  const [academicYear, setAcademicYear] = useState(searchParams.get('academicYear') || getPresentAcademicYear());
  const [courses, setCourses] = useState([]);
  const [localResults, setLocalResults] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savingStudentId, setSavingStudentId] = useState(null);

  // Sync URL with filters
  useEffect(() => {
    const params = new URLSearchParams();
    if (courseId) params.set('courseId', courseId);
    if (semester) params.set('semester', semester);
    if (academicYear) params.set('academicYear', academicYear);
    navigate({ search: params.toString() }, { replace: true });
  }, [courseId, semester, academicYear, navigate]);

  // Fetch courses assigned to teacher
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get('http://localhost:5001/api/courses', config);
        
        // Flexible Filtering for Admin / HOD / Teacher
        const myCourses = data.filter(c => {
          if (user.role === 'admin') return true;
          
          const isDeptMatch = c.department?.name === user.department || c.department?.code === user.department;
          if (user.role === 'hod') return isDeptMatch;

          // Teacher Logic
          const isAssigned = c.facultyAssigned?.some(f => (f._id || f).toString() === user._id.toString());
          const isSemMatch = user.assignedSemesters?.length > 0 ? user.assignedSemesters.includes(c.semester) : false;
          
          return isAssigned || (isDeptMatch && isSemMatch);
        });
        
        setCourses(Array.isArray(myCourses) ? myCourses : []);
        
        // Only set initial defaults if nothing is in URL
        if (myCourses.length > 0 && !searchParams.get('courseId')) {
           const initialCourse = myCourses[0];
           setCourseId(initialCourse._id.toString());
           setSemester(initialCourse.semester.toString());
        }
      } catch (err) {
        console.error('Error fetching courses', err);
      }
    };
    fetchCourses();
  }, [user.token, searchParams]);

  // Fetch students when filters change
  useEffect(() => {
    if (courseId && semester && academicYear) {
      dispatch(getStudentsForEntry({ courseId, semester, academicYear }));
    }
  }, [courseId, semester, academicYear, dispatch]);

  // Sync local state with Redux results
  useEffect(() => {
    if (results && results.length > 0) {
      setLocalResults(results.map(r => ({ ...r })));
    }
  }, [results]);

  const handleMarkChange = (studentId, field, value) => {
    // 1. Enforce constraints based on field
    let max = 100;
    if (field === 'endSem') max = 60;
    if (field === 'mst1' || field === 'mst2' || field === 'mst3') max = 20;
    if (field === 'internalPractical') max = 40;
    if (field === 'externalPractical') max = 60;

    let val = value;
    let isAbsent = false;

    if (value === 'NA' || value === 'na' || value === 'a' || value === 'A') {
        val = 0;
        isAbsent = true;
    } else if (value === '') {
        val = '';
    } else {
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

        // Calculate Grade immediately for persistent saving
        let total = 0;
        if (currentCourse?.type?.toUpperCase() === 'THEORY') {
            const msts = [Number(updatedMarks.mst1)||0, Number(updatedMarks.mst2)||0, Number(updatedMarks.mst3)||0];
            // Take sum of best 2 MSTs
            const bestTwoSum = msts.sort((a, b) => b - a).slice(0, 2).reduce((sum, val) => sum + val, 0);
            total = bestTwoSum + (Number(updatedMarks.endSem)||0);
        } else if (currentCourse?.type?.toUpperCase() === 'PRACTICAL') {
            total = (Number(updatedMarks.internalPractical)||0) + (Number(updatedMarks.externalPractical)||0);
        }

        let calculatedGrade = 'F';
        if (total >= 90) calculatedGrade = 'O';
        else if (total >= 80) calculatedGrade = 'A+';
        else if (total >= 70) calculatedGrade = 'A';
        else if (total >= 60) calculatedGrade = 'B+';
        else if (total >= 50) calculatedGrade = 'B';
        else if (total >= 40) calculatedGrade = 'C';

        const updatedStudent = { 
            ...student, 
            marks: { ...updatedMarks, absentFields: updatedAbsences },
            grade: calculatedGrade,
            totalMarks: total
        };

        // Auto-save logic: Trigger save if all fields are complete
        const cType = currentCourse?.type?.toUpperCase();
        const m = updatedStudent.marks;
        const isTheoryComplete = cType === 'THEORY' && m.mst1 !== '' && m.mst2 !== '' && m.mst3 !== '' && m.endSem !== '';
        const isPracticalComplete = cType === 'PRACTICAL' && m.internalPractical !== '' && m.externalPractical !== '';
        
        if ((isTheoryComplete || isPracticalComplete) && !student.isLocked) {
             // We'll call save slightly delayed or in next tick to allow state to settle
             setTimeout(() => handleSaveSingleMark(student._id, updatedStudent), 100);
        }

        return updatedStudent;
      }
      return student;
    }));
  };

  const isLocked = localResults.length > 0 && localResults.some(r => r.isLocked);
  const currentCourse = courses.find(c => c._id === courseId);

  const handleSaveSingleMark = async (studentId, studentData = null) => {
    const student = studentData || localResults.find(r => r._id === studentId);
    if (!student) return;

    setSavingStudentId(studentId);
    const data = {
      courseId,
      semester,
      academicYear,
      results: [{ 
        studentId: student._id, 
        marks: student.marks, 
        grade: student.grade,
        totalMarks: student.totalMarks 
      }]
    };
    
    try {
      const response = await dispatch(saveMarks(data)).unwrap();
      
      // Update local state results with resultId immediately to allow locking
      if (response?.results?.length > 0) {
          const savedResult = response.results[0];
          setLocalResults(prev => prev.map(r => r._id === studentId ? { ...r, resultId: savedResult._id, status: savedResult.status } : r));
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSavingStudentId(null);
      }, 2000);
    } catch (err) {
      setSavingStudentId(null);
      console.error("Save failed:", err);
    }
  };

  const handleToggleRowLock = async (resultId, studentId) => {
    if (!resultId) {
        alert("Persistence Required: Save marks for this student profile before attempting to modify record lock status.");
        return;
    }
    try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.post(`http://localhost:5001/api/results/toggle-lock/${resultId}`, {}, config);
        
        setLocalResults(prev => prev.map(r => r._id === studentId ? { ...r, isLocked: data.isLocked } : r));
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
        console.error("TOGGLE LOCK ERROR:", err);
        alert(err.response?.data?.message || "Protocol Failure: Unable to toggle record lock state.");
    }
  };

  const handleSaveDraft = () => {
    // 1. Validation
    if (currentCourse?.type === 'THEORY') {
        const incomplete = localResults.some(r => r.marks.mst1 === '' || r.marks.mst2 === '' || r.marks.mst3 === '' || r.marks.endSem === '');
        if (incomplete) {
            alert('Validation Error: All MST and EndSem fields must be filled for Theory subjects.');
            return;
        }
    } else if (currentCourse?.type === 'PRACTICAL') {
        const incomplete = localResults.some(r => !r.grade);
        if (incomplete) {
            alert('Validation Error: Grade must be selected for all students for Practical subjects.');
            return;
        }
    }

    const data = {
      courseId,
      semester,
      academicYear,
      results: localResults.map(r => ({ studentId: r._id, marks: r.marks, grade: r.grade }))
    };
    dispatch(saveMarks(data));
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleLockMarks = async () => {
    if (!courseId) return alert('Select course first.');
    if (window.confirm('PERMANENT ACTION: This will lock marks for ALL students in this sector. Proceed?')) {
        try {
            await axios.post('http://localhost:5001/api/results/lock', { courseId, semester, academicYear }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setShowSuccess(true);
            dispatch(getStudentsForEntry({ courseId, semester, academicYear }));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to lock marks');
        }
    }
  };

  const handleSubmitResults = () => {
    if (window.confirm('Are you sure you want to submit? No further edits will be allowed after approval.')) {
      const data = { courseId, semester, academicYear };
      dispatch(submitMarksForApproval(data));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleUnlockMarks = async () => {
    if (!courseId) return alert('Select course first.');
    if (window.confirm('ADMIN ACTION: This will UNLOCK marks for ALL students in this sector for further editing. Proceed?')) {
        try {
            await axios.post('http://localhost:5001/api/results/unlock', { courseId, semester, academicYear }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setShowSuccess(true);
            dispatch(getStudentsForEntry({ courseId, semester, academicYear }));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to unlock marks');
        }
    }
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const uploadedData = results.data;
          setLocalResults(prev => prev.map(student => {
            const entry = uploadedData.find(d => d.rollNumber === student.rollNumber);
            if (entry) {
              return {
                ...student,
                marks: {
                  mst1: entry.MST1 || '',
                  mst2: entry.MST2 || '',
                  mst3: entry.MST3 || '',
                  endSem: entry.EndSem || '',
                }
              };
            }
            return student;
          }));
        }
      });
    }
  };

  const handleUpdateDeadline = async (deadline) => {
    if (!courseId || !currentCourse) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`http://localhost:5001/api/courses/${currentCourse.code}/deadline`, { marksDeadline: deadline }, config);
      setShowSuccess(true);
      // Reload courses to get updated deadline
      const { data } = await axios.get('http://localhost:5001/api/courses', config);
      setCourses(data);
    } catch (err) {
      alert("Failed to update locking deadline");
    }
  };

  const downloadTemplate = () => {
    const data = localResults.map(r => ({
      rollNumber: r.rollNumber,
      name: r.name,
      MST1: r.marks.mst1,
      MST2: r.marks.mst2,
      MST3: r.marks.mst3,
      EndSem: r.marks.endSem,
    }));
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `result_template_${courseId}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-8 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
                <button 
                  onClick={() => navigate('/faculty-dashboard')}
                  className="p-2 bg-white hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-900 transition-all border border-gray-200 shadow-sm"
                >
                  <ChevronRight size={20} className="rotate-180" />
                </button>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">
                  Result Management
                </h1>
            </div>
            <p className="text-gray-500 font-medium">Record and submit academic performance data.</p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={downloadTemplate}
              className="px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl flex items-center gap-2 transition-all border border-gray-200 shadow-sm font-bold text-xs uppercase tracking-widest"
            >
              <Download size={18} />
              Download Template
            </button>
            <label className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-blue-500/20 font-bold text-xs uppercase tracking-widest">
              <Upload size={18} />
              CSV Upload
              <input type="file" onChange={handleCSVUpload} accept=".csv" className="hidden" />
            </label>
          </div>
        </div>

        {/* Filters - White Theme */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40">
          <div>
            <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-[0.2em]">Target Semester</label>
            <select 
              value={semester} 
              onChange={(e) => {
                const s = e.target.value;
                setSemester(s);
                // Clear course if it doesn't match the new semester
                const course = courses.find(c => c._id === courseId);
                if (course && course.semester.toString() !== s) {
                    setCourseId('');
                }
              }}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none font-black uppercase text-xs text-gray-700"
            >
              <option value="">Select Semester</option>
              {(user.assignedSemesters?.length > 0 ? user.assignedSemesters : [1,2,3,4,5,6,7,8]).map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-[0.2em]">My Assigned Courses</label>
            <select 
              value={courseId} 
              onChange={(e) => {
                const id = e.target.value;
                setCourseId(id);
                const course = courses.find(c => c._id === id);
                if (course && !semester) {
                  setSemester(course.semester.toString());
                }
              }}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-black uppercase text-xs text-gray-700"
            >
              <option value="">Select Assignment</option>
              {(Array.isArray(courses) ? (semester ? courses.filter(c => c.semester.toString() === semester) : courses) : []).map(c => (
                <option key={c._id} value={c._id.toString()}>{c.code} - {c.name} (Sem {c.semester})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Table - White Theme */}
        <div className="bg-white rounded-3xl border border-gray-100 relative overflow-hidden shadow-2xl shadow-gray-200/50">
          {isLoading && (
            <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
              <p className="text-blue-600 font-extrabold uppercase tracking-[0.3em] text-[10px]">Processing Results...</p>
            </div>
          )}

          <div className="max-h-[600px] overflow-y-auto custom-scrollbar overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-20">
                <tr className="bg-gray-50 border-b border-gray-200 shadow-sm">
                  <th className="p-4 font-black text-gray-400 uppercase tracking-widest text-[10px]">Roll No</th>
                  <th className="p-4 font-black text-gray-400 uppercase tracking-widest text-[10px]">Student Details</th>
                  {currentCourse?.type?.toUpperCase() === 'THEORY' && (
                    <>
                      <th className="p-4 font-black text-gray-400 uppercase tracking-widest text-[10px] text-center">MST 1 <br/><span className="text-[8px] text-gray-500 font-bold">(MAX 20)</span></th>
                      <th className="p-4 font-black text-gray-400 uppercase tracking-widest text-[10px] text-center">MST 2 <br/><span className="text-[8px] text-gray-500 font-bold">(MAX 20)</span></th>
                      <th className="p-4 font-black text-gray-400 uppercase tracking-widest text-[10px] text-center">MST 3 <br/><span className="text-[8px] text-gray-500 font-bold">(MAX 20)</span></th>
                      <th className="p-4 font-black text-gray-400 uppercase tracking-widest text-[10px] text-center">End Sem <br/><span className="text-[8px] text-gray-500 font-bold">(MAX 60)</span></th>
                    </>
                  )}
                  {currentCourse?.type?.toUpperCase() === 'PRACTICAL' && (
                    <>
                      <th className="p-4 font-black text-gray-400 uppercase tracking-widest text-[10px] text-center">Internal <br/><span className="text-[8px] text-gray-500 font-bold">(MAX 40)</span></th>
                      <th className="p-4 font-black text-gray-400 uppercase tracking-widest text-[10px] text-center">External <br/><span className="text-[8px] text-gray-500 font-bold">(MAX 60)</span></th>
                    </>
                  )}
                  <th className="p-4 font-black text-gray-400 uppercase tracking-widest text-[10px] text-center">Total (100)</th>
                  <th className="p-4 font-black text-gray-400 uppercase tracking-widest text-[10px] text-center">Grade</th>
                  <th className="p-4 font-black text-gray-400 uppercase tracking-widest text-[10px] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {(Array.isArray(localResults) ? localResults : []).map((student) => {
                  const m = student.marks || { mst1: '', mst2: '', mst3: '', endSem: '', internalPractical: '', externalPractical: '', absentFields: [] };
                  const isApproved = student.status === 'approved' || student.status === 'published';
                  const isPastDeadline = currentCourse?.marksDeadline && new Date() > new Date(currentCourse.marksDeadline);
                  const isRowLocked = student.isLocked || isLocked || isPastDeadline;
                  const disabled = isApproved || isRowLocked;

                  return (
                  <tr key={student._id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-mono text-indigo-600 text-xs font-bold">{student.rollNumber}</td>
                    <td className="p-4">
                        <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{student.name}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{student.enrollmentNumber}</p>
                    </td>
                    
                    {currentCourse?.type?.toUpperCase() === 'THEORY' && (
                      <>
                        <td className="p-4 text-center">
                            <input 
                                type="text"
                                value={m.absentFields?.includes('mst1') ? 'NA' : (m.mst1 ?? '')} 
                                placeholder="0"
                                onChange={(e) => handleMarkChange(student._id, 'mst1', e.target.value)} 
                                onBlur={() => handleSaveSingleMark(student._id)}
                                disabled={disabled} 
                                className={`w-16 border rounded-xl p-3 text-center text-xs font-black transition-all outline-none focus:ring-2 focus:ring-blue-500 ${
                                    m.absentFields?.includes('mst1') 
                                    ? 'bg-rose-50 border-rose-200 text-rose-600' 
                                    : 'bg-white border-gray-200 text-gray-800'
                                }`} 
                            />
                        </td>
                        <td className="p-4 text-center">
                            <input 
                                type="text" 
                                value={m.absentFields?.includes('mst2') ? 'NA' : (m.mst2 ?? '')} 
                                placeholder="0"
                                onChange={(e) => handleMarkChange(student._id, 'mst2', e.target.value)} 
                                onBlur={() => handleSaveSingleMark(student._id)}
                                disabled={disabled} 
                                className={`w-16 border rounded-xl p-3 text-center text-xs font-black transition-all outline-none focus:ring-2 focus:ring-blue-500 ${
                                    m.absentFields?.includes('mst2') 
                                    ? 'bg-rose-50 border-rose-200 text-rose-600' 
                                    : 'bg-white border-gray-200 text-gray-800'
                                }`} 
                            />
                        </td>
                        <td className="p-4 text-center">
                            <input 
                                type="text" 
                                value={m.absentFields?.includes('mst3') ? 'NA' : (m.mst3 ?? '')} 
                                placeholder="0"
                                onChange={(e) => handleMarkChange(student._id, 'mst3', e.target.value)} 
                                onBlur={() => handleSaveSingleMark(student._id)}
                                disabled={disabled} 
                                className={`w-16 border rounded-xl p-3 text-center text-xs font-black transition-all outline-none focus:ring-2 focus:ring-blue-500 ${
                                    m.absentFields?.includes('mst3') 
                                    ? 'bg-rose-50 border-rose-200 text-rose-600' 
                                    : 'bg-white border-gray-200 text-gray-800'
                                }`} 
                            />
                        </td>
                        <td className="p-4 text-center">
                            <input 
                                type="text" 
                                value={m.absentFields?.includes('endSem') ? 'NA' : (m.endSem ?? '')} 
                                placeholder="0"
                                onChange={(e) => handleMarkChange(student._id, 'endSem', e.target.value)} 
                                onBlur={() => handleSaveSingleMark(student._id)}
                                disabled={disabled} 
                                className={`w-20 border rounded-xl p-3 text-center text-xs font-black transition-all outline-none focus:ring-2 focus:ring-blue-500 ${
                                    m.absentFields?.includes('endSem') 
                                    ? 'bg-rose-50 border-rose-200 text-rose-600' 
                                    : 'bg-white border-gray-200 text-gray-800'
                                }`} 
                            />
                        </td>
                      </>
                    )}

                    {currentCourse?.type?.toUpperCase() === 'PRACTICAL' && (
                      <>
                        <td className="p-4 text-center">
                            <input 
                                type="text" 
                                value={m.absentFields?.includes('internalPractical') ? 'NA' : (m.internalPractical ?? '')} 
                                placeholder="0"
                                onChange={(e) => handleMarkChange(student._id, 'internalPractical', e.target.value)} 
                                onBlur={() => handleSaveSingleMark(student._id)}
                                disabled={disabled} 
                                className={`w-16 border rounded-xl p-3 text-center text-xs font-black transition-all outline-none focus:ring-2 focus:ring-blue-500 ${
                                    m.absentFields?.includes('internalPractical') 
                                    ? 'bg-rose-50 border-rose-200 text-rose-600' 
                                    : 'bg-white border-gray-200 text-gray-800'
                                }`} 
                            />
                        </td>
                        <td className="p-4 text-center">
                            <input 
                                type="text" 
                                value={m.absentFields?.includes('externalPractical') ? 'NA' : (m.externalPractical ?? '')} 
                                placeholder="0"
                                onChange={(e) => handleMarkChange(student._id, 'externalPractical', e.target.value)} 
                                onBlur={() => handleSaveSingleMark(student._id)}
                                disabled={disabled} 
                                className={`w-16 border rounded-xl p-3 text-center text-xs font-black transition-all outline-none focus:ring-2 focus:ring-blue-500 ${
                                    m.absentFields?.includes('externalPractical') 
                                    ? 'bg-rose-50 border-rose-200 text-rose-600' 
                                    : 'bg-white border-gray-200 text-gray-800'
                                }`} 
                            />
                        </td>
                      </>
                    )}

                    <td className="p-4 text-center">
                      <span className="text-xl font-black font-mono text-gray-900">
                        {currentCourse?.type?.toUpperCase() === 'THEORY' 
                          ? (() => {
                              const msts = [Number(m.mst1)||0, Number(m.mst2)||0, Number(m.mst3)||0];
                              const bestTwoSum = msts.sort((a, b) => b - a).slice(0, 2).reduce((sum, val) => sum + val, 0);
                              return (bestTwoSum + (Number(m.endSem)||0)).toFixed(1);
                            })()
                          : (currentCourse?.type?.toUpperCase() === 'PRACTICAL' 
                              ? (Number(m.internalPractical)||0) + (Number(m.externalPractical)||0) 
                              : student.grade || '---')
                        }
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {(() => {
                        let total = 0;
                        if (currentCourse?.type?.toUpperCase() === 'THEORY') {
                            const msts = [Number(m.mst1)||0, Number(m.mst2)||0, Number(m.mst3)||0];
                            const bestTwoSum = msts.sort((a, b) => b - a).slice(0, 2).reduce((sum, val) => sum + val, 0);
                            total = bestTwoSum + (Number(m.endSem)||0);
                        } else if (currentCourse?.type?.toUpperCase() === 'PRACTICAL') {
                            total = (Number(m.internalPractical)||0) + (Number(m.externalPractical)||0);
                        } else if (student.grade) {
                            return <span className="text-lg font-black text-blue-600">{student.grade}</span>;
                        } else {
                            return <span className="text-gray-300 italic text-[10px] font-black uppercase tracking-widest">Pending</span>;
                        }
                        
                        let g = 'F';
                        if (total >= 90) g = 'O';
                        else if (total >= 80) g = 'A+';
                        else if (total >= 70) g = 'A';
                        else if (total >= 60) g = 'B+';
                        else if (total >= 50) g = 'B';
                        else if (total >= 40) g = 'C';

                        return (
                            <div className="flex flex-col items-center">
                                <span className={`text-lg font-black ${g === 'F' ? 'text-rose-500' : 'text-emerald-500'}`}>{g}</span>
                                <span className="text-[7px] font-black text-gray-400 shadow-sm px-1 rounded uppercase tracking-tighter">Auto</span>
                            </div>
                        );
                      })()}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                            onClick={() => handleToggleRowLock(student.resultId, student._id)}
                            className={`p-2 rounded-xl transition-all border shadow-sm ${
                                student.isLocked 
                                ? 'bg-amber-50 text-amber-600 border-amber-200' 
                                : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            }`}
                            title={student.isLocked ? "Click to unlock row for editing" : "Record is editable"}
                        >
                            {student.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                        </button>

                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                            student.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            student.status === 'submitted' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                            student.status === 'draft' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            'bg-gray-100 text-gray-400 border-gray-200'
                        }`}>
                            {student.status === 'not_started' ? 'DRAFT' : student.status}
                        </span>
                        
                        {!disabled && (
                            <button 
                                onClick={() => handleSaveSingleMark(student._id)}
                                disabled={savingStudentId === student._id}
                                className={`p-2.5 rounded-xl transition-all border shadow-sm ${
                                  savingStudentId === student._id 
                                  ? 'bg-blue-100 text-blue-600 border-blue-200 animate-pulse' 
                                  : 'bg-white hover:bg-blue-600 text-blue-600 hover:text-white border-blue-200'
                                }`}
                                title="Save Profile"
                            >
                                {savingStudentId === student._id ? (
                                  <div className="animate-spin h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full" />
                                ) : <Save size={14} />}
                            </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
                {localResults.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan="7" className="p-12 text-center text-slate-500">
                      No students found. Please select filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Integrated Actions Footer - Attached to Marklist */}
          {localResults.length > 0 && (
            <div className="sticky bottom-0 z-40 flex flex-wrap justify-end gap-5 p-6 bg-gray-50/90 backdrop-blur-md border-t border-gray-100">
              <div className="mr-auto flex flex-col justify-center text-left">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active Batch</p>
                  <p className="text-sm font-black text-indigo-600 uppercase tracking-tight">{currentCourse?.name} ({currentCourse?.code})</p>
              </div>
              
              <button 
                onClick={handleSaveDraft}
                disabled={isLocked || localResults.some(r => r.status === 'approved')}
                className="px-6 py-3.5 bg-white hover:bg-gray-100 rounded-xl flex items-center gap-2 transition-all text-gray-700 font-extrabold text-[10px] uppercase tracking-widest border border-gray-200 shadow-sm disabled:opacity-30"
              >
                <Save size={16} />
                Save Selection
              </button>
              
              <button 
                onClick={handleSubmitResults}
                disabled={isLocked || localResults.some(r => r.status === 'submitted' || r.status === 'approved')}
                className={`px-8 py-3.5 rounded-xl flex items-center gap-2 transition-all shadow-lg text-white font-extrabold text-[10px] uppercase tracking-widest ${
                  (isLocked || localResults.some(r => r.status === 'submitted' || r.status === 'approved'))
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105 shadow-indigo-600/20'
                }`}
              >
                <Send size={16} />
                Finalize & Submit
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Toast Notification */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 bg-green-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50 overflow-hidden"
          >
            <CheckCircle className="text-white" />
            <div>
              <p className="font-bold">Success!</p>
              <p className="text-sm text-green-100">Action completed successfully.</p>
            </div>
            <motion.div 
              initial={{ width: '100%' }}
              animate={{ width: 0 }}
              transition={{ duration: 3 }}
              className="absolute bottom-0 left-0 h-1 bg-green-300"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResultEntry;
