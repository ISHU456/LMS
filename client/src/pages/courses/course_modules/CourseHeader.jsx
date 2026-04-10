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
    <header className="h-16 lg:h-20 bg-white/80 dark:bg-[#030712]/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-4 lg:px-6 flex items-center justify-between shrink-0 z-40 shadow-sm transition-all duration-300">
      <div className="flex items-center gap-2 lg:gap-3 overflow-hidden">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0">
            <PanelLeft size={20} className="text-gray-500" />
        </button>
        <div className="flex flex-col overflow-hidden">
          <div className="flex items-center gap-2">
            <h1 className="text-sm lg:text-2xl font-black dark:text-white tracking-tighter uppercase leading-none truncate max-w-[120px] sm:max-w-none">
              {courseInfo?.name || courseId || 'Registry'} 
            </h1>
            <div className="bg-primary-100 dark:bg-primary-900/30 px-1.5 py-0.5 rounded text-[8px] lg:text-[9px] font-black text-primary-600 dark:text-primary-400 border border-primary-500/20 shadow-sm shrink-0">
                {courseId}
            </div>
          </div>
          <p className="text-[8px] lg:text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.1em] mt-0.5 truncate">
              {courseInfo?.department?.name || 'Academic Dept'} • Level {Math.floor(progress/10) + 1}
          </p>
        </div>
      </div>

      {!isTeacher && (
        <div className="hidden xl:flex flex-1 max-w-xl mx-6 space-y-1.5">
           <div className="relative w-full">
              <div className="flex justify-between items-end mb-1 px-1">
                 <span className="text-[8px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest flex items-center gap-2"><Target size={10}/> Course Mastery Protocol</span>
                 <span className="text-[10px] font-black dark:text-white">{progress}%</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner border border-white dark:border-white/5">
                 <motion.div 
                   initial={{ width: 0 }} 
                   animate={{ width: `${progress}%` }} 
                   className="h-full bg-gradient-to-r from-primary-600 to-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.3)]" 
                 />
              </div>
           </div>
        </div>
      )}

      <div className="flex items-center gap-2 lg:gap-4 shrink-0">
         <div className="hidden sm:flex flex-col items-end">
            <div className="text-[8px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Live</div>
            <p className="text-[10px] font-black dark:text-white uppercase">{onlineStudents} Members</p>
         </div>
         <Link to="/community" className="w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl lg:rounded-2xl hover:bg-primary-600 hover:text-white transition-all shadow-xl">
            <Megaphone size={18}/>
         </Link>
         {canManage && (
           <button 
             onClick={() => navigate(`/live-class/${courseId}`)}
             className="flex items-center justify-center gap-2 rounded-xl lg:rounded-2xl bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white px-3 lg:px-4 py-2 lg:py-3 font-black text-[8px] lg:text-[10px] uppercase tracking-widest transition-all h-10 lg:h-12"
           >
             <Radio size={14} /> <span className="hidden md:block">Deploy Live</span>
           </button>
         )}
      </div>
    </header>
  );
};

export default CourseHeader;
