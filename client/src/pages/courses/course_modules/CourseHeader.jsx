import React from 'react';
import { PanelLeft, Target, Award, Megaphone, Radio } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const CourseHeader = ({
  sidebarOpen,
  setSidebarOpen,
  courseInfo,
  courseId,
  progress,
  gamificationState,
  onlineStudents,
  isTeacher,
  canManage,
  navigate
}) => {
  return (
    <header className="h-20 bg-white/80 dark:bg-[#030712]/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-6 flex items-center justify-between shrink-0 z-40 shadow-sm transition-all duration-300">
      <div className="flex items-center gap-3">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <PanelLeft size={24} className="text-gray-500" />
        </button>
        <div className="flex flex-col max-w-full">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black dark:text-white tracking-tighter uppercase leading-none truncate">
              {courseInfo?.name || courseId || 'Registry'} 
            </h1>
            <div className="bg-primary-100 dark:bg-primary-900/30 px-2 py-1 rounded-md text-[9px] font-black text-primary-600 dark:text-primary-400 border border-primary-500/20 shadow-sm">
                {courseId}
            </div>
          </div>
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.1em] mt-1">
              {courseInfo?.department?.name || 'Academic Dept'} • Node A-2 • Level {Math.floor(progress/10) + 1}
          </p>
        </div>
      </div>

      {!isTeacher && (
        <div className="flex-1 max-w-xl mx-10 space-y-2">
           <div className="relative">
              <div className="flex justify-between items-end mb-1 px-1">
                 <span className="text-[9px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest flex items-center gap-2"><Target size={12}/> Course Mastery Protocol</span>
                 <span className="text-xs font-black dark:text-white">{progress}%</span>
              </div>
              <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner border border-white dark:border-white/5">
                 <motion.div 
                   initial={{ width: 0 }} 
                   animate={{ width: `${progress}%` }} 
                   className="h-full bg-gradient-to-r from-primary-600 to-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.5)]" 
                 />
              </div>
           </div>

           <div className="relative opacity-60 hover:opacity-100 transition-opacity duration-300">
              <div className="flex justify-between items-end mb-1 px-1">
                 <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2"><Award size={12}/> Overall Academic Weight</span>
                 <span className="text-[10px] font-black dark:text-white">L{Math.floor((gamificationState?.xp || 0) / 100)} PROXY</span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden border border-white/5 shadow-inner">
                 <motion.div 
                   initial={{ width: 0 }} 
                   animate={{ width: `${(gamificationState?.xp || 0) % 100}%` }} 
                   className="h-full bg-emerald-500" 
                 />
              </div>
           </div>
        </div>
      )}

      <div className="flex items-center gap-5">
         <div className="flex flex-col items-end">
            <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Activity Feed</div>
            <p className="text-xs font-black dark:text-white uppercase">{onlineStudents} Members</p>
         </div>
         <Link to="/community" className="w-12 h-12 flex items-center justify-center bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl hover:bg-primary-600 hover:text-white transition-all shadow-xl">
            <Megaphone size={20}/>
         </Link>
         {canManage && (
           <button 
             onClick={() => navigate(`/live-class/${courseId}`)}
             className="flex items-center gap-2 rounded-2xl bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white px-4 py-3 font-black text-[10px] uppercase tracking-widest transition-all h-12"
           >
             <Radio size={16} /> <span className="hidden sm:block">Deploy Live</span>
           </button>
         )}
      </div>
    </header>
  );
};

export default CourseHeader;
