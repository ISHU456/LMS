import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getMyResults } from '../../features/results/resultSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Award, BookOpen, GraduationCap, TrendingUp, FileText, Globe, ShieldCheck, Lock } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const StudentResults = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { studentResults, isLoading } = useSelector(state => state.results);

  useEffect(() => {
    dispatch(getMyResults());
  }, [dispatch]);


  return (
    <div className="max-w-[1400px] mx-auto p-4 sm:p-8 space-y-8 pb-20 bg-[var(--bg-light)] dark:bg-[var(--bg-dark)] min-h-screen transition-colors will-change-transform">
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full"
            />
        </div>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
      {/* Dynamic Alert Banner */}
      {studentResults?.message && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-indigo-600/10 border border-indigo-500/20 p-4 sm:p-6 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6"
          >
            <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-500/20">
                    <ShieldCheck size={24} />
                </div>
                <div>
                   <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest leading-none">Institutional Protocol</h3>
                   <p className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-tighter italic">{studentResults.message}</p>
                </div>
            </div>
            
            {studentResults?.pdfUrl && (
                <a 
                  href={studentResults.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  download={`${user.rollNumber}_Sem${user.semester}.pdf`}
                  className="px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-2 shrink-0 animate-pulse"
                >
                  <Download size={16} /> Download Official Transcript
                </a>
            )}
          </motion.div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Summary Metrics */}
        <div className="lg:col-span-1 space-y-6">
            <div className="p-6 sm:p-10 bg-slate-900/90 dark:bg-[#080c14]/90 backdrop-blur-xl border border-slate-800 rounded-[3rem] relative overflow-hidden group">
            <TrendingUp className="absolute -right-4 -top-4 text-slate-800/20 w-32 sm:w-48 h-32 sm:h-48 -rotate-12 transition-all duration-500 group-hover:scale-110 group-hover:text-indigo-500/10" />
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 block">Semester GPA</span>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl sm:text-7xl font-black text-white tracking-tighter">
                {typeof studentResults?.sgpa === 'number' ? studentResults.sgpa.toFixed(2) : (studentResults?.sgpa || '0.00')}
              </span>
              <span className="text-slate-500 font-black text-xs sm:text-sm uppercase">Points</span>
            </div>
          </div>

          <div className="p-6 sm:p-10 bg-white/70 dark:bg-[#080c14]/70 backdrop-blur-xl border border-gray-100 dark:border-slate-800/60 rounded-[3rem] shadow-xl relative overflow-hidden">
             {!studentResults?.pdfUrl && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 z-10">
                   <Lock className="text-indigo-500 mb-4" size={48} />
                   <h4 className="text-white font-black uppercase text-[10px] sm:text-xs tracking-widest">Transcript Locked</h4>
                   <p className="text-[8px] text-slate-400 font-black uppercase tracking-tighter mt-2">Certified PDF is pending administrative archival.</p>
                </div>
             )}
             <div className="flex flex-col gap-4">
                {studentResults?.pdfUrl ? (
                   <a 
                     href={studentResults.pdfUrl}
                     target="_blank"
                     rel="noreferrer"
                     className="w-full p-4 sm:p-6 bg-emerald-600 text-white rounded-[1.5rem] sm:rounded-[2rem] font-black text-[10px] sm:text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:scale-[1.02] shadow-2xl"
                   >
                     <Globe size={18} sm:size={20} /> View Cloud Record
                   </a>
                ) : (
                   <div className="w-full p-4 sm:p-6 bg-slate-800 text-slate-500 rounded-[1.5rem] sm:rounded-[2rem] font-black text-[10px] sm:text-xs uppercase tracking-widest flex items-center justify-center gap-3 cursor-not-allowed">
                     <Download size={18} sm:size={20} /> Marksheet Unavailable
                   </div>
                )}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                   <div className="p-3 sm:p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/10">
                      <p className="text-[8px] font-black text-indigo-500 uppercase mb-1">Credits Earned</p>
                      <p className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400">{studentResults?.totalCredits || 0}</p>
                   </div>
                   <div className="p-3 sm:p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/10">
                      <p className="text-[8px] font-black text-emerald-500 uppercase mb-1">Status</p>
                      <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter text-[12px] sm:text-[14px]">
                        {studentResults?.isPublished ? 'Published' : 'Preview'}
                      </p>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Right: Detailed Breakdown */}
        <div className="lg:col-span-2">
          {/* Desktop Table View */}
          <div className="hidden sm:block bg-white/70 dark:bg-[#080c14]/70 backdrop-blur-xl border border-gray-100 dark:border-slate-800/60 rounded-[3rem] shadow-xl overflow-hidden p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Course Name</th>
                    <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Credit</th>
                    <th className="p-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">Marks</th>
                    <th className="p-6 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                  {studentResults?.results?.length > 0 ? (
                    studentResults.results.map((r, idx) => (
                      <motion.tr 
                        key={r._id || idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all"
                      >
                        <td className="p-6">
                           <div>
                              <p className="text-xs font-bold dark:text-white uppercase tracking-tighter">{r.course?.name}</p>
                              <p className="text-[10px] font-medium text-slate-500">{r.course?.code}</p>
                           </div>
                        </td>
                        <td className="p-6 text-center text-xs font-bold text-slate-600 dark:text-slate-400">{r.course?.credits || 4}</td>
                        <td className="p-6 text-center text-xs font-bold text-slate-900 dark:text-white">{(r.totalMarks || 0).toFixed(1)}</td>
                        <td className="p-6">
                          <div className="flex justify-center text-[10px] font-black">
                            <span className={`px-4 py-1.5 rounded-lg border uppercase tracking-widest ${
                              ['A', 'B'].includes(r.grade?.charAt(0)) ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                              r.grade === 'F' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                              'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            }`}>
                              {r.grade || 'NA'}
                            </span>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="p-20 text-center">
                        <FileText size={48} className="mx-auto text-indigo-500 opacity-20 mb-4" />
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">No results available.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden space-y-4">
            {studentResults?.results?.length > 0 ? (
              studentResults.results.map((r, idx) => (
                <motion.div 
                   key={r._id || idx}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: idx * 0.05 }}
                   className="bg-white/70 dark:bg-[#080c14]/70 backdrop-blur-xl border border-gray-100 dark:border-slate-800/60 rounded-[2rem] p-6 shadow-sm"
                >
                   <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                         <h4 className="text-sm font-bold dark:text-white uppercase tracking-tighter leading-tight">{r.course?.name}</h4>
                         <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-widest">{r.course?.code}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-widest ${
                        ['A', 'B'].includes(r.grade?.charAt(0)) ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        r.grade === 'F' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                        'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                         {r.grade || 'NA'}
                      </div>
                   </div>
                   <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-slate-800">
                      <div className="text-center">
                         <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Credits</p>
                         <p className="text-xs font-bold dark:text-white">{r.course?.credits || 4}</p>
                      </div>
                      <div className="text-center">
                         <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">Marks</p>
                         <p className="text-xs font-bold dark:text-white">{(r.totalMarks || 0).toFixed(1)}</p>
                      </div>
                      <div className="text-center">
                         <p className="text-[8px] font-medium text-slate-400 uppercase tracking-widest mb-1">Audit Status</p>
                         <ShieldCheck size={14} className="text-indigo-500 mx-auto" />
                      </div>
                   </div>
                </motion.div>
              ))
            ) : (
                <div className="p-10 bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800 text-center">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No results available.</p>
                </div>
            )}
          </div>
        </div>
      </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default StudentResults;
