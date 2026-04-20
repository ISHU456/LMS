import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Trophy, Book, ClipboardCheck, GraduationCap, Clock, Sparkles, 
    Shield, Award, Download, ExternalLink, Check, Users, Medal, 
    Star, Trash2, Zap, Crown, Flame, Target
} from 'lucide-react';
import axios from 'axios';
import { useSelector } from 'react-redux';

const CompletionPreview = ({
  progress,
  completedItems,
  resources,
  assignments,
  displayName,
  courseInfo,
  courseId,
  isTeacher,
  gamificationState,
  studentSubmissions = []
}) => {
  const { user } = useSelector(state => state.auth);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`http://localhost:5001/api/courses/${courseId}/students`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setStudents(res.data);
    } catch (err) {
      console.error("Failed to fetch learners", err);
    }
    setIsLoading(false);
  };

  const removeStudent = async (studentId) => {
    if (!isTeacher) return;
    if (!window.confirm("Are you sure you want to remove this student from the course?")) return;
    try {
      await axios.delete(`http://localhost:5001/api/courses/${courseId}/students/${studentId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      fetchStudents(); // Refresh
    } catch (err) {
      alert("Removal failed. Verify credentials.");
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [courseId, isTeacher]);

  const isCompleted = progress >= 100;
  const canPreview = progress >= 75;

  // Sync personal XP with backend leaderboard data if available
  const currentUserData = students.find(s => s._id === user?._id);
  const studentXp = currentUserData ? currentUserData.xp : (gamificationState?.xp || 0);
  
  let earnedBadge = currentUserData ? currentUserData.badge : "Student";
  if (!currentUserData) {
    if (progress >= 100) earnedBadge = "Quantum Scholar";
    else if (progress >= 80) earnedBadge = "Neural Navigator";
    else if (progress >= 50) earnedBadge = "Rapid Resolver";
    else if (progress >= 20) earnedBadge = "Core Guardian";
  }

  const getRankBadge = (rank) => {
    if (rank === 1) return { label: 'GOLD MEDALIST', color: 'bg-amber-500', icon: Crown, shadow: 'shadow-amber-500/50' };
    if (rank === 2) return { label: 'SILVER MEDALIST', color: 'bg-slate-400', icon: Medal, shadow: 'shadow-slate-400/50' };
    if (rank === 3) return { label: 'BRONZE MEDALIST', color: 'bg-orange-600', icon: Award, shadow: 'shadow-orange-600/50' };
    return null;
  };

  if (isTeacher) {
    const badges = [
      { title: "Gold Medal", desc: "Supreme Academic Dominance (Rank 1)", color: "bg-gradient-to-br from-amber-400 to-yellow-600", icon: Crown, glow: "shadow-amber-500/50" },
      { title: "Silver Medal", desc: "Exceptional Cognitive Agility (Rank 2)", color: "bg-gradient-to-br from-gray-300 to-gray-500", icon: Medal, glow: "shadow-gray-400/50" },
      { title: "Bronze Medal", desc: "Dedicated High Performance (Rank 3)", color: "bg-gradient-to-br from-orange-400 to-amber-800", icon: Award, glow: "shadow-orange-500/50" },
      { title: "Quantum Scholar", desc: "100% Completion Achievement", color: "bg-gradient-to-br from-indigo-500 to-purple-700", icon: Sparkles, glow: "shadow-indigo-500/50" }
    ];

    return (
      <div className="flex flex-col gap-8 min-h-full pb-20 p-4 md:p-8 relative bg-white dark:bg-[#0b0f19]">
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10 w-full">
          {/* Leaderboard Section */}
          <div className="lg:col-span-2 glass p-8 rounded-[3rem] border border-white dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 shadow-2xl relative overflow-hidden group">
            <div className="flex items-center justify-between mb-10">
                <h3 className="text-xl font-bold dark:text-white uppercase tracking-tighter flex items-center gap-3">
                    <Users size={28} className="text-primary-500" /> Professional Learner Registry
                </h3>
                <div className="flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-100 dark:border-primary-800">
                    <span className="text-[9px] font-bold text-primary-600 uppercase tracking-widest leading-none">{students.length} VERIFIED NODES</span>
                </div>
            </div>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
              {students.length > 0 ? students.map((student, idx) => {
                const rankMeta = getRankBadge(student.rank);
                return (
                    <div key={student._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-700 hover:border-primary-500/50 transition-all hover:shadow-2xl hover:-translate-y-1 group/row gap-6">
                        <div className="flex items-center gap-6 flex-1">
                            <div className="relative shrink-0">
                                {student.profilePic ? (
                                    <img src={student.profilePic} alt={student.name} className="w-16 h-16 rounded-2xl object-cover shadow-xl border-2 border-white dark:border-gray-700" />
                                ) : (
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-xl">
                                        {student.name.charAt(0)}
                                    </div>
                                )}
                                <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center font-bold text-[12px] shadow-lg border-2 border-white dark:border-gray-800 ${student.rank === 1 ? 'bg-amber-500 text-white' : student.rank === 2 ? 'bg-slate-300 text-gray-800' : student.rank === 3 ? 'bg-orange-600 text-white' : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'}`}>
                                    {student.rank}
                                </div>
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="text-sm font-bold dark:text-white uppercase tracking-tight truncate">{student.name}</h4>
                                    {rankMeta && (
                                        <div className={`px-2 py-0.5 rounded-md ${rankMeta.color} text-white text-[7px] font-bold tracking-widest shadow-lg ${rankMeta.shadow}`}>
                                            {rankMeta.label}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{student.rollNumber || student.enrollmentNumber || 'ID-UNKNOWN'}</p>
                                    <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                                    <span className="text-[9px] font-bold text-primary-500 uppercase">{student.badge}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-8 w-full sm:w-auto">
                            <div className="flex flex-col sm:items-end w-24">
                                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-2">Sync Progress</span>
                                <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden">
                                    <div className={`h-full bg-emerald-500 rounded-full transition-all duration-1000 ${student.progress === 100 ? 'animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]' : ''}`} style={{width: `${student.progress}%`}} />
                                </div>
                                <span className="text-[9px] font-bold dark:text-white mt-1">{student.progress}%</span>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">XP Power</span>
                                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1"><Zap size={12} fill="currentColor"/> {student.xp.toLocaleString()}</span>
                            </div>
                            <button 
                                onClick={() => removeStudent(student._id)}
                                className="p-3 text-rose-500 bg-rose-50 dark:bg-rose-900/20 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm opacity-0 group-hover/row:opacity-100"
                                title="Remove Student from Course"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                );
              }) : (
                <div className="py-20 text-center flex flex-col items-center gap-4">
                    <Users size={48} className="text-gray-200" />
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Digital Registry Empty</p>
                </div>
              )}
            </div>
          </div>

          {/* Badges Guide */}
          <div className="glass p-8 rounded-[3rem] border border-white dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 shadow-2xl relative overflow-hidden flex flex-col h-fit">
            <h3 className="text-lg font-bold dark:text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
              <Medal size={24} className="text-amber-500" /> Achievement Protocol
            </h3>
            <div className="flex flex-col gap-5">
              {badges.map((badge, idx) => (
                <div key={idx} className="flex gap-4 p-5 rounded-3xl bg-gray-50 dark:bg-gray-800/30 border border-transparent hover:border-primary-500/20 transition-all group/badge">
                  <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-white shadow-xl transition-transform group-hover/badge:scale-110 group-hover/badge:rotate-3 ${badge.color} ${badge.glow}`}>
                    <badge.icon size={24} />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h4 className="text-[11px] font-bold dark:text-white uppercase tracking-tight mb-1">{badge.title}</h4>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide leading-relaxed">{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 p-6 bg-primary-600 rounded-[2rem] text-white relative overflow-hidden text-center">
                <Crown className="absolute top-2 right-2 text-white/20" size={40} />
                <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2 opacity-80">Season High Potential</h4>
                <p className="text-xs font-bold leading-relaxed">System automatically upgrades active nodes based on XP velocity.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Student View (Existing)
  return (
    <div className="flex flex-col gap-8 min-h-full pb-20 p-4 md:p-8 relative bg-white dark:bg-[#0b0f19]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        <div className="glass p-8 rounded-[3rem] border border-white dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-bl-full pointer-events-none group-hover:bg-primary-500/10 transition-colors duration-700" />
          <h3 className="text-lg font-bold dark:text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
            <Trophy size={24} className="text-amber-500 animate-pulse" /> Achievement Matrix
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Resources Mastered', val: `${completedItems.size} / ${resources.length}`, icon: Book, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
              { label: 'Assignments Submitted', val: `${studentSubmissions.length} / ${assignments.length}`, icon: ClipboardCheck, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
              { label: 'Mastery Level', val: `${currentUserData?.rank || Math.floor(progress / 20) + 1} Rank`, icon: GraduationCap, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
              { label: 'Time Invested', val: `${Math.round(progress * 1.5)}h Approx`, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' }
            ].map((stat, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-white/40 dark:bg-gray-800/30 rounded-2xl border border-white/40 dark:border-white/5 hover:border-primary-500/20 transition-all group/stat">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} transition-all`}>
                    <stat.icon size={18} />
                  </div>
                  <span className="text-[9px] font-bold uppercase text-gray-500 dark:text-gray-400 tracking-widest">{stat.label}</span>
                </div>
                <span className="text-xs font-bold dark:text-white uppercase px-3 py-1 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700">{stat.val}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-4 bg-primary-50 dark:bg-primary-900/10 rounded-2xl border border-primary-100 dark:border-primary-900/30 flex flex-col items-center text-center">
               <Trophy size={20} className="text-primary-500 mb-2" />
               <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Current Rank</span>
               <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase">{earnedBadge}</span>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex flex-col items-center text-center">
               <Star size={20} className="text-amber-500 mb-2" />
               <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">XP Power</span>
               <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">{studentXp.toLocaleString()}</span>
            </div>
          </div>

          <div className="mt-6 p-6 bg-gradient-to-br from-primary-600 to-indigo-700 rounded-[2rem] shadow-xl shadow-primary-500/20 relative overflow-hidden text-white flex flex-col items-center text-center">
            <Sparkles className="absolute top-4 right-4 text-white/40" size={32} />
            <p className="text-[9px] font-bold uppercase tracking-widest mb-2 text-primary-100">Total Completion Score</p>
            <h4 className="text-2xl font-bold mb-4 tracking-tighter drop-shadow-lg">{progress}%</h4>
            <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden mt-2 p-0.5 relative">
              <div 
                className="h-full bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.9)] relative overflow-hidden"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Certificate Section */}
        <div className="glass p-8 rounded-[3rem] border border-white dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 shadow-2xl flex flex-col items-center justify-center relative group">
           <div className="text-center mb-10 relative">
             <h3 className="text-lg font-bold dark:text-white uppercase tracking-tighter mb-2">Digital Credentials</h3>
             <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">Generated upon verified completion of all sector modules.</p>
           </div>
           
           <div className="relative w-full max-w-sm aspect-[1.4/1] rounded-2xl p-0.5 overflow-hidden group/cert shadow-[0_20px_60px_rgba(0,0,0,0.1)] hover:-translate-y-2 transition-transform duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500 via-indigo-600 to-primary-500 animate-[spin_4s_linear_infinite] opacity-40 group-hover/cert:opacity-100 transition-opacity" />
              <div className="relative h-full bg-white dark:bg-[#0a0a0a] rounded-[14px] p-6 flex flex-col justify-between items-center text-center border-4 border-gray-100 dark:border-gray-800 z-10">
                 {!canPreview && (
                   <div className="absolute inset-0 z-20 backdrop-blur-md bg-white/60 dark:bg-black/80 flex flex-col items-center justify-center p-8">
                     <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ yoyo: Infinity, duration: 2 }} className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-4 shadow-inner ring-1 ring-red-500/20">
                       <Shield size={28} />
                     </motion.div>
                     <p className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] text-center max-w-[200px]">Achieve 75% progress to unlock secure preview.</p>
                   </div>
                 )}
                 <div className="flex justify-between w-full relative z-10"><div className="w-6 h-6 border-t-[3px] border-l-[3px] border-primary-500/50 rounded-tl-sm" /><div className="w-6 h-6 border-t-[3px] border-r-[3px] border-primary-500/50 rounded-tr-sm" /></div>
                 <div className="space-y-3 relative z-10">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-full mb-1 border border-primary-100 dark:border-gray-800 shadow-inner group-hover/cert:scale-110"><Star size={20} className="text-amber-500" fill="currentColor" /></div>
                      <h4 className="text-[7px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-[0.3em]">Official Achievement Certificate</h4>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[6px] font-bold text-gray-400 uppercase tracking-[0.2em]">Presented To</p>
                      <h2 className="font-serif text-lg font-bold dark:text-white group-hover/cert:text-primary-500 uppercase tracking-widest">{displayName}</h2>
                      <p className="text-[8px] font-bold text-primary-500 uppercase tracking-widest">{earnedBadge}</p>
                    </div>
                 </div>
                 <div className="flex justify-between w-full mt-4 items-end relative z-10"><div className="w-6 h-6 border-b-[3px] border-l-[3px] border-primary-500/50 rounded-bl-sm" /><div className="w-8 h-8 flex items-center justify-center text-amber-500 group-hover/cert:rotate-[360deg] duration-1000 bg-gray-50 dark:bg-gray-900 rounded-full"><Award size={18} /></div><div className="w-6 h-6 border-b-[3px] border-r-[3px] border-primary-500/50 rounded-br-sm" /></div>
              </div>
           </div>
           
           <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-sm">
              <button disabled={!isCompleted} className={`px-6 py-4 rounded-2xl font-bold text-[9px] uppercase tracking-widest transition-all ${isCompleted ? 'bg-primary-600 text-white shadow-xl hover:scale-[1.02]' : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'}`}><Download size={14} /> Download</button>
              <button className="px-6 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold text-[9px] uppercase tracking-widest shadow-xl hover:scale-[1.02] transition-all"><ExternalLink size={14} /> Share</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CompletionPreview;
