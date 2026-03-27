import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getMyResults } from '../../features/results/resultSlice';
import { motion } from 'framer-motion';
import { Download, Award, BookOpen, GraduationCap, TrendingUp, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const StudentResults = () => {
  const dispatch = useDispatch();
  const { studentResults, isLoading } = useSelector(state => state.results);
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    dispatch(getMyResults());
  }, [dispatch]);

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(44, 62, 80);
    doc.text('ACADEMIC MARKSHEET', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Student Name: ${user.name}`, 20, 40);
    doc.text(`Roll Number: ${user.rollNumber || 'N/A'}`, 20, 48);
    doc.text(`Enrollment: ${user.enrollmentNumber || 'N/A'}`, 20, 56);
    doc.text(`Semester: ${user.semester}`, 140, 40);
    doc.text(`Batch: ${user.batch || '2023-27'}`, 140, 48);

    // Table
    const tableData = (studentResults?.results || []).map(r => [
      r.course?.code || 'N/A',
      r.course?.name || 'N/A',
      r.marks?.mst1 || 0,
      r.marks?.mst2 || 0,
      r.marks?.mst3 || 0,
      r.marks?.endSem || 0,
      r.totalMarks || 0,
      r.grade || 'F'
    ]);

    doc.autoTable({
      startY: 70,
      head: [['Code', 'Subject', 'MST1', 'MST2', 'MST3', 'EndSem', 'Total', 'Grade']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
    });

    // Summary
    const finalY = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(14);
    doc.text(`SGPA: ${studentResults.sgpa}`, 20, finalY);
    doc.text(`Total Credits: ${studentResults.totalCredits}`, 140, finalY);

    doc.save(`Marksheet_${user.name}_Sem${user.semester}.pdf`);
  };

  if (isLoading) return <div className="p-8 text-center text-white">Loading results...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-5xl mx-auto"
      >
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase">
              Academic <span className="text-blue-500">Performance</span>
            </h1>
            <p className="text-slate-400 mt-2 font-medium">Semester {user.semester} Overview</p>
          </div>
          <button 
            onClick={generatePDF}
            className="group px-6 py-3 bg-white text-slate-950 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-200 transition-all shadow-2xl shadow-white/10 active:scale-95"
          >
            <Download size={20} className="group-hover:bounce" />
            Download Marksheet
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 p-8 rounded-3xl border border-blue-500/20 backdrop-blur-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full group-hover:bg-blue-500/20 transition-all" />
            <TrendingUp className="text-blue-400 mb-4" size={32} />
            <h3 className="text-slate-400 uppercase text-xs font-bold tracking-widest mb-1">Current SGPA</h3>
            <p className="text-5xl font-black text-white">{studentResults.sgpa}</p>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 p-8 rounded-3xl border border-purple-500/20 backdrop-blur-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-bl-full group-hover:bg-purple-500/20 transition-all" />
            <Award className="text-purple-400 mb-4" size={32} />
            <h3 className="text-slate-400 uppercase text-xs font-bold tracking-widest mb-1">Total Credits</h3>
            <p className="text-5xl font-black text-white">{studentResults.totalCredits}</p>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-orange-600/20 to-amber-600/20 p-8 rounded-3xl border border-orange-500/20 backdrop-blur-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-bl-full group-hover:bg-orange-500/20 transition-all" />
            <GraduationCap className="text-orange-400 mb-4" size={32} />
            <h3 className="text-slate-400 uppercase text-xs font-bold tracking-widest mb-1">Academic Standing</h3>
            <p className="text-5xl font-black text-white">{studentResults.sgpa >= 3.5 ? 'Elite' : studentResults.sgpa >= 3 ? 'Good' : 'Standard'}</p>
          </motion.div>
        </div>

        {/* Results List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <BookOpen className="text-blue-500" />
            Subject Breakdown
          </h2>
          
          {(studentResults?.results || []).map((r, idx) => (
            <motion.div 
              key={r._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center font-bold text-xl text-blue-400 border border-slate-700">
                  {r.grade}
                </div>
                <div>
                  <h4 className="text-xl font-bold">{r.course.name}</h4>
                  <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">{r.course.code} • {r.course.credits} Credits</p>
                </div>
              </div>

              <div className="flex gap-8 items-center bg-black/20 px-8 py-3 rounded-2xl border border-slate-800/50">
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">MST (Best 2)</p>
                  <p className="font-bold text-slate-300">
                    {(() => {
                      const msts = [Number(r.marks.mst1 || 0), Number(r.marks.mst2 || 0), Number(r.marks.mst3 || 0)].sort((a,b) => b-a);
                      return (msts[0] + msts[1]);
                    })()}
                  </p>
                </div>
                <div className="w-px h-8 bg-slate-800" />
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">End Sem</p>
                  <p className="font-bold text-slate-300">
                    {r.marks.endSem || 0}
                  </p>
                </div>
                <div className="w-px h-8 bg-slate-800" />
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Total</p>
                  <p className="font-black text-2xl text-white">
                    {r.totalMarks}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}

          {(!studentResults?.results || studentResults.results.length === 0) && (
            <div className="p-20 text-center bg-slate-900/50 rounded-3xl border border-dashed border-slate-800">
              <div className="bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="text-slate-500" size={32} />
              </div>
              <p className="text-slate-400 font-medium">{studentResults.message || 'No results published yet for this semester.'}</p>
              <p className="text-slate-600 text-sm mt-2">Check back after exams or contact your department.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default StudentResults;
