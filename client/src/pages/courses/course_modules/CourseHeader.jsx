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
  navigate,
  isLive
}) => {
  return (
    <header className="h-16 lg:h-20 bg-white/80 dark:bg-[#030712]/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-4 lg:px-6 flex items-center justify-between shrink-0 z-40 shadow-sm transition-all duration-300">
      <div className="flex items-center gap-2 lg:gap-3 overflow-hidden w-1/4">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0">
            <PanelLeft size={20} className="text-gray-500" />
        </button>
        <div className="flex flex-col overflow-hidden">
          <div className="flex items-center gap-2">
            <h1 className="text-xs lg:text-base font-medium dark:text-white tracking-tighter uppercase leading-none truncate">
              {courseInfo?.name || courseId || 'Registry'} 
            </h1>
            <div className="bg-primary-100 dark:bg-primary-900/30 px-1.5 py-0.5 rounded text-[8px] lg:text-[9px] font-medium text-primary-600 dark:text-primary-400 border border-primary-500/20 shadow-sm shrink-0">
                {courseId}
            </div>
          </div>
          <p className="text-[8px] lg:text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-[0.1em] mt-0.5 truncate">
              {courseInfo?.department?.name || 'Academic Dept'}
          </p>
        </div>
      </div>

      <div className="flex-1 flex justify-center items-center gap-4">
         {canManage ? (
           <button 
             onClick={() => navigate(`/live-class/${courseId}`)}
             className="flex items-center justify-center gap-2 rounded-xl lg:rounded-2xl bg-emerald-600 text-white hover:bg-emerald-500 px-6 lg:px-8 py-2 lg:py-3 font-medium text-[10px] lg:text-[12px] uppercase tracking-[0.15em] transition-all h-10 lg:h-12 shadow-xl shadow-emerald-500/20 active:scale-95"
           >
             <Radio size={16} /> <span className="hidden md:block">Start Live Class</span>
           </button>
         ) : !isTeacher && (
           <button 
             onClick={() => isLive ? navigate(`/live-class/${courseId}`) : null}
             disabled={!isLive}
             className={`flex items-center justify-center gap-2 rounded-xl lg:rounded-2xl px-6 lg:px-8 py-2 lg:py-3 font-medium text-[10px] lg:text-[12px] uppercase tracking-[0.15em] transition-all h-10 lg:h-12 border ${isLive ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 animate-pulse hover:bg-emerald-500 hover:text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-800/50 text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-800 cursor-not-allowed'} active:scale-95`}
           >
             <Radio size={16} /> <span className="hidden md:block">Join Live Session</span>
           </button>
         )}

         {isLive && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
               <span className="text-[10px] font-medium text-emerald-600 uppercase tracking-widest">Active Now</span>
            </div>
         )}
      </div>

      <div className="flex items-center justify-end gap-2 lg:gap-4 shrink-0 w-1/4">
         <div className="hidden sm:flex flex-col items-end">
            <div className="text-[8px] font-medium text-emerald-500 uppercase tracking-widest flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Live</div>
            <p className="text-[10px] font-medium dark:text-white uppercase">{onlineStudents} Members</p>
         </div>
         <Link to="/community" className="w-10 h-10 lg:w-11 lg:h-11 flex items-center justify-center bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:bg-primary-600 hover:text-white transition-all shadow-xl">
            <Megaphone size={18}/>
         </Link>
      </div>
    </header>
  );
};

export default CourseHeader;
