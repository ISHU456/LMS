import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, LayoutGrid, CheckCircle2, Globe, Sparkles, Filter, 
  ChevronRight, ArrowUpDown, Download, Printer, ShieldCheck,
  Zap, AlertCircle, Loader2, Search, MoreHorizontal, Unlock,
  XCircle, Bell, Clock, Archive, Upload, Cloud, RefreshCw, GraduationCap, Building
} from 'lucide-react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminResultHub = ({ user }) => {
  const [semester, setSemester] = useState(() => localStorage.getItem('adminResultSem') || '1');
  const [academicYear, setAcademicYear] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    return now.getMonth() >= 6 ? `${year}-${(year + 1).toString().slice(-2)}` : `${year - 1}-${year.toString().slice(-2)}`;
  });
  const [department, setDepartment] = useState(() => localStorage.getItem('adminResultDept') || 'All');
  const [section, setSection] = useState(() => localStorage.getItem('adminResultSec') || 'all');
  const [departments, setDepartments] = useState([]);
  const [data, setData] = useState({ students: [], courses: [], matrix: {}, studentFinals: {} });
  const [loading, setLoading] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [syncingId, setSyncingId] = useState(null);
  const [batchSyncing, setBatchSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'rollNumber', direction: 'asc' });
  const [publishing, setPublishing] = useState(false);

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
      const { data } = await axios.get(`http://localhost:5001/api/results/semester-summary?semester=${semester}&academicYear=${academicYear}&department=${department}&section=${section}`, {
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
    localStorage.setItem('adminResultSec', section);
  }, [semester, academicYear, department, section]);

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

  const generateTranscriptPDF = (student) => {
    const doc = new jsPDF();
    const results = data.matrix[student._id] || {};
    const final = data.studentFinals?.[student._id] || {};
    const courses = data.courses.filter(c => results[c._id]);
    
    // Header
    doc.setFillColor(15, 23, 42); // bg-slate-900
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("INSTITUTIONAL GRADE TRANSCRIPT", 20, 25);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`ACADEMIC NODE: ${academicYear} | SEMESTER: ${semester} | DEPT: ${student.department || department}`, 20, 35);
    
    // Student Info
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(14);
    doc.text("IDENTITY PROFILE", 20, 60);
    
    autoTable(doc, {
      startY: 65,
      head: [['Field', 'Identity Data']],
      body: [
        ['FULL NAME', student.name.toUpperCase()],
        ['ROLL NUMBER', student.rollNumber],
        ['ENROLLMENT No', student.enrollmentNumber || 'N/A'],
        ['DEPARTMENT', student.department || department],
        ['SEMESTER', semester]
      ],
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: { 0: { fontStyle: 'bold', width: 40 } }
    });

    // Results Table
    doc.text("CURRICULAR PERFORMANCE LATTICE", 20, doc.lastAutoTable.finalY + 15);
    
    const tableData = courses.map(c => {
      const r = results[c._id];
      return [c.code, c.name, c.credits || 4, r.totalMarks, r.grade || 'F'];
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Code', 'Subject Name', 'Credits', 'Obtained', 'Grade']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 10, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 5 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    // Summary
    const totalObtained = courses.reduce((sum, c) => sum + (results[c._id]?.totalMarks || 0), 0);
    const avgMarks = final.percentage || (courses.length > 0 ? (totalObtained / courses.length).toFixed(2) : 0);
    
    doc.setFontSize(12);
    doc.rect(20, doc.lastAutoTable.finalY + 10, 170, 30);
    doc.text(`CONSOLIDATED SGPA: ${final.sgpa || 'NOT COMPILED'}`, 30, doc.lastAutoTable.finalY + 20);
    doc.text(`PERCENTAGE: ${avgMarks}% | STATUS: ${final.isPublished ? 'OFFICIALLY PUBLISHED' : 'PRE-RELEASE PROTOTYPE'}`, 30, doc.lastAutoTable.finalY + 30);
    
    // Footer
    const footerY = 280;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("E-TRANSCRIPT CERTIFIED BY NEURAL GOVERNANCE NODE | VOID IF ALTERED", 105, footerY, { align: 'center' });
    doc.text(`Generation Date: ${new Date().toLocaleString()}`, 105, footerY + 5, { align: 'center' });

    doc.save(`transcript_${student.rollNumber}_sem${semester}.pdf`);
  };

  const generateAndSyncTranscript = async (student) => {
    // 1. Generate PDF
    const doc = new jsPDF();
    const results = data.matrix[student._id] || {};
    const final = data.studentFinals?.[student._id] || {};
    const courses = data.courses.filter(c => results[c._id]);
    
    // Header
    doc.setFillColor(15, 23, 42); // bg-slate-900
    doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.text("OFFICIAL ACADEMIC TRANSCRIPT", 20, 26);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`DIGITAL CERTIFICATION NODE | SEMESTER: ${semester} | CYCLE: ${academicYear}`, 20, 34);
    doc.text(`SECURITY HASH: ${Math.random().toString(36).substring(2, 15).toUpperCase()}`, 20, 40);
    
    // Identity Profile
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(14);
    doc.text("IDENTITY PROFILE", 20, 60);
    autoTable(doc, {
      startY: 65,
      head: [['Field', 'Identity Data']],
      body: [
        ['STUDENT NAME', student.name.toUpperCase()],
        ['ROLL NUMBER', student.rollNumber],
        ['ENROLLMENT No', student.enrollmentNumber || 'N/A'],
        ['DEPARTMENT', student.department || department],
        ['SEMESTER', semester]
      ],
      theme: 'plain',
    });

    // Curricular Lattice
    const tableData = courses.map(c => {
      const r = results[c._id];
      return [c.code, c.name, c.credits || 4, r.totalMarks, r.grade || 'F'];
    });
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Code', 'Subject', 'CR', 'Marks', 'Grade']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }
    });

    // Final Node
    const totalObtained = courses.reduce((sum, c) => sum + (results[c._id]?.totalMarks || 0), 0);
    doc.rect(20, doc.lastAutoTable.finalY + 10, 170, 30);
    doc.text(`SGPA: ${final.sgpa || 'COMM-SYNC'}`, 30, doc.lastAutoTable.finalY + 20);
    doc.text(`PERCENTAGE: ${final.percentage || 'N/A'}% | OFFICIAL RECORD`, 30, doc.lastAutoTable.finalY + 30);

    const pdfBlob = doc.output('blob');
    doc.save(`transcript_${student.rollNumber}_sem${semester}.pdf`);

    // 2. Upload to Cloud
    try {
      setSyncingId(student._id);
      const formData = new FormData();
      formData.append('transcript', pdfBlob, `${student.rollNumber}_Sem${semester}.pdf`);
      formData.append('studentId', student._id);
      formData.append('semester', semester);
      formData.append('academicYear', academicYear);

      await axios.post('http://localhost:5001/api/results/upload-transcript', formData, {
        headers: { 
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      fetchSummary();
    } catch (err) {
      alert("Digital archival failure. Verify cloud connectivity.");
    } finally {
      setSyncingId(null);
    }
  };

  const handleBatchSync = async () => {
    const compiledStudents = data.students.filter(s => data.studentFinals?.[s._id]?.sgpa);
    if (compiledStudents.length === 0) {
      alert("No compiled results detected. Please run 'Compile Final Results' first.");
      return;
    }
    if (!window.confirm(`BATCH PROTOCOL: Generate and cloud-sync transcripts for all ${compiledStudents.length} compiled students?`)) return;

    setBatchSyncing(true);
    for (const student of compiledStudents) {
       if (data.studentFinals?.[student._id]?.pdfUrl) continue; // Skip already synced
       await generateAndSyncTranscript(student);
    }
    setBatchSyncing(false);
    alert("Batch sync protocol finalized.");
  };

  const handlePublishSector = async () => {
    if (!window.confirm(`BROADCAST PROTOCOL: Publish all compiled results for ${department} Sem ${semester}? Students will gain immediate visibility of their academic standing.`)) return;
    try {
      setPublishing(true);
      await axios.post('http://localhost:5001/api/results/publish-final', {
        semester, academicYear, department
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert('Academic Broadcast Successfully Deployed.');
      fetchSummary();
    } catch (err) {
      alert('Broadcast transmission failure.');
    } finally {
      setPublishing(false);
    }
  };

  const filteredStudents = data.students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    // Primary sort by section if viewing all sections
    if (section === 'all' && a.section !== b.section) {
      return (a.section || '').localeCompare(b.section || '');
    }
    // Secondary sort by user's choice
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
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
        <div className="min-w-0">
          <h2 className="text-3xl lg:text-4xl font-black dark:text-white uppercase tracking-tighter flex flex-wrap items-center gap-4">
             <BarChart3 className="text-red-600 w-8 h-8 lg:w-10 lg:h-10" /> Semester Result Hub
          </h2>
          <p className="text-[10px] lg:text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] mt-3 italic leading-relaxed">
            Multi-Dimensional Performance Lattice & Digital Compilation Engine
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:flex gap-3 w-full lg:w-auto h-fit">
          <button 
            onClick={fetchSummary}
            className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 lg:border-none lg:bg-transparent text-gray-400 hover:text-red-500 rounded-2xl flex items-center justify-center transition-all active:scale-95"
            title="Refresh Feed"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          
          <button 
            onClick={handlePublishDeadline}
            className="px-5 md:px-6 py-4 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-amber-600 hover:text-white transition-all flex items-center justify-center gap-2 group"
          >
            <Bell size={14} className="group-hover:animate-bounce" /> <span className="hidden sm:inline">Broadcast</span> Deadline
          </button>
          
          <button 
             onClick={handlePublishSector}
             disabled={publishing || data.students.length === 0}
             className="px-5 md:px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {publishing ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
            <span className="hidden sm:inline">Publish</span> Sector
          </button>
          
          <button 
            onClick={handleCompile}
            disabled={compiling || data.students.length === 0}
            className="flex-1 lg:flex-none px-6 md:px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-xl shadow-red-600/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {compiling ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} className="group-hover:animate-pulse" />}
            Compile Final
          </button>
        </div>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6 p-6 lg:p-10 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] lg:rounded-[3rem] shadow-sm">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Academic Cycle</label>
          <div className="relative group">
            <GraduationCap size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors" />
            <select 
              value={semester} 
              onChange={(e) => setSemester(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800/50 border-none focus:ring-2 focus:ring-red-500/20 rounded-2xl py-5 pl-14 pr-8 text-[11px] font-black uppercase tracking-widest dark:text-white outline-none appearance-none cursor-pointer group-hover:bg-gray-100 dark:group-hover:bg-gray-800 transition-all"
            >
              {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s.toString()}>Semester {s}</option>)}
            </select>
            <ChevronRight size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Department Node</label>
          <div className="relative group">
            <Building size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors" />
            <select 
              value={department} 
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800/50 border-none focus:ring-2 focus:ring-red-500/20 rounded-2xl py-5 pl-14 pr-8 text-[11px] font-black uppercase tracking-widest dark:text-white outline-none appearance-none cursor-pointer group-hover:bg-gray-100 dark:group-hover:bg-gray-800 transition-all"
            >
              <option value="All">All Departments</option>
              {departments.map(d => (
                <option key={d._id} value={d.name}>{d.name}</option>
              ))}
            </select>
            <ChevronRight size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Cohort Section</label>
          <div className="relative group">
            <LayoutGrid size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors" />
            <select 
              value={section} 
              onChange={(e) => setSection(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800/50 border-none focus:ring-2 focus:ring-red-500/20 rounded-2xl py-5 pl-14 pr-8 text-[11px] font-black uppercase tracking-widest dark:text-white outline-none appearance-none cursor-pointer group-hover:bg-gray-100 dark:group-hover:bg-gray-800 transition-all shadow-inner"
            >
              <option value="all">Global Roster</option>
              <option value="A">Section Alpha (A)</option>
              <option value="B">Section Beta (B)</option>
              <option value="C">Section Gamma (C)</option>
            </select>
            <ChevronRight size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 rotate-90" />
          </div>
        </div>

        <div className="md:col-span-full xl:col-span-1 space-y-3">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Identity Filter</label>
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Query Name or Roll Number for detailed sync..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-800/50 border-none focus:ring-2 focus:ring-red-500/20 rounded-2xl py-5 pl-14 pr-8 text-[11px] font-black uppercase tracking-widest dark:text-white outline-none group-hover:bg-gray-100 dark:group-hover:bg-gray-800 transition-all shadow-inner"
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
                <th className="p-6 text-center min-w-[200px] bg-indigo-50/30 dark:bg-indigo-900/10">
                   <div className="flex items-center justify-center gap-2">
                       <Download className="text-indigo-600" size={14} />
                      <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Official Transcript</span>
                   </div>
                </th>
                <th className="p-6 text-center min-w-[100px] bg-slate-50 dark:bg-slate-800">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pub. Status</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={data.courses.length + 3} className="p-20 text-center">
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
                        <div className="flex flex-col">
                          <span className="text-xs font-black uppercase tracking-tighter text-slate-900 dark:text-white">{student.name}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-black text-indigo-500 uppercase">{student.rollNumber}</span>
                            <span className="text-[9px] font-black px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded-md">SEC {student.section || 'A'}</span>
                          </div>
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

                    <td className="p-6 bg-indigo-50/10 dark:bg-indigo-900/5">
                       <div className="flex flex-col items-center gap-2">
                          {data.studentFinals?.[student._id]?.pdfUrl ? (
                             <a 
                               href={data.studentFinals[student._id].pdfUrl} 
                               target="_blank" 
                               rel="noreferrer"
                               className="px-6 py-3 bg-white dark:bg-gray-800 text-emerald-600 border-2 border-emerald-500 rounded-2xl font-black text-[9px] uppercase tracking-tighter flex items-center gap-2 w-full justify-center hover:bg-emerald-50 transition-all shadow-xl shadow-emerald-500/10"
                             >
                                <Download size={14} /> View Official PDF
                             </a>
                          ) : data.studentFinals?.[student._id]?.sgpa ? (
                             <button 
                                onClick={() => generateAndSyncTranscript(student)}
                                disabled={syncingId === student._id}
                                className="px-6 py-3 bg-red-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-tighter flex items-center gap-2 w-full justify-center hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 disabled:opacity-50 active:scale-95"
                             >
                                {syncingId === student._id ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
                                Download PDF Result
                             </button>
                          ) : (
                             <div className="px-6 py-3 bg-gray-100 text-gray-400 rounded-2xl font-black text-[9px] uppercase tracking-tighter flex items-center gap-2 w-full justify-center border border-dashed border-gray-300 italic opacity-50">
                                Pre-Compilation
                             </div>
                          )}
                       </div>
                    </td>

                    <td className="p-6 text-center">
                        {data.studentFinals?.[student._id]?.isPublished ? (
                           <div className="flex items-center justify-center text-emerald-500 gap-1 bg-emerald-50 dark:bg-emerald-500/10 py-2 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                              <CheckCircle2 size={12} />
                              <span className="text-[8px] font-black uppercase">LIVE</span>
                           </div>
                        ) : (
                           <div className="flex items-center justify-center text-slate-400 gap-1 bg-slate-50 dark:bg-slate-800 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                              <Archive size={12} />
                              <span className="text-[8px] font-black uppercase">DRAFT</span>
                           </div>
                        )}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                   <td colSpan={data.courses.length + 3} className="p-32 text-center opacity-30 text-[10px] font-black uppercase tracking-widest italic">
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
