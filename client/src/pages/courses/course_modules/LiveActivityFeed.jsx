import React, { useState } from 'react';
import { Calendar as CalendarIcon, Radio, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LiveActivityFeed = ({
  activeSection,
  isTeacher,
  schedDay,
  setSchedDay,
  schedType,
  setSchedType,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  schedRoom,
  setSchedRoom,
  schedActivity,
  setSchedActivity,
  handleAddScheduleItem,
  announcements
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const today = new Date();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const days = [];
    // Padding
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 md:h-9" />);
    }
    // Real days
    for (let d = 1; d <= totalDays; d++) {
      const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
      days.push(
        <div 
          key={d} 
          className={`h-8 md:h-9 flex items-center justify-center text-[9px] font-black rounded-lg transition-all border ${isToday ? 'bg-primary-600 text-white border-primary-500 shadow-lg shadow-primary-500/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 border-transparent hover:border-gray-200 dark:hover:border-gray-700'}`}
        >
          {d}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
           <h4 className="text-[10px] font-black dark:text-white uppercase tracking-tighter">{monthNames[month]} {year}</h4>
           <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentDate(new Date(year, month - 1))}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400"
              >
                <ChevronLeft size={14} />
              </button>
              <button 
                onClick={() => setCurrentDate(new Date(year, month + 1))}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400"
              >
                <ChevronRight size={14} />
              </button>
           </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
            <div key={d} className="text-[8px] font-black text-gray-300 dark:text-gray-600 uppercase">{d}</div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="glass p-5 rounded-[2.5rem] border border-white dark:border-gray-800 bg-white/40 dark:bg-gray-900/40 shadow-lg shrink-0 backdrop-blur-3xl overflow-hidden group flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black dark:text-white uppercase tracking-widest flex items-center gap-2">
          <Radio size={15} className="text-primary-500 animate-pulse"/> Temporal Activity Feed
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[600px] pr-1 space-y-4">
           <div className="space-y-3">
              {announcements.length > 0 ? announcements.map(anc => (
                 <div key={anc._id} className="flex gap-3 p-4 bg-white/60 dark:bg-gray-800/40 rounded-[1.5rem] border border-gray-100 dark:border-gray-700 hover:border-primary-500/30 transition-all group/anc shadow-sm">
                    <div className="w-10 h-10 shrink-0 bg-primary-500/10 text-primary-600 rounded-xl flex items-center justify-center group-hover/anc:scale-110 transition-transform overflow-hidden border border-primary-500/20">
                      {anc.author?.profilePic ? (
                         <img src={anc.author.profilePic} alt={anc.author?.name || 'User'} className="w-full h-full object-cover" />
                      ) : (
                         <MessageCircle size={18}/>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                       <p className="flex items-center gap-2 text-[10px] font-black text-gray-900 dark:text-white truncate uppercase tracking-tight">
                          {anc.author?.name ? <span className="text-primary-600 dark:text-primary-400">{anc.author.name.split(' ')[0]}</span> : null}
                          <span className="opacity-20">|</span>
                          {anc.title}
                       </p>
                       <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 line-clamp-1 truncate mt-0.5">{anc.content}</p>
                    </div>
                 </div>
              )) : (
                 <div className="py-10 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-900 mx-auto flex items-center justify-center text-gray-300">
                      <Radio size={24}/>
                    </div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">No online signals detected.</p>
                 </div>
              )}
           </div>
      </div>
    </div>
  );
};

export default LiveActivityFeed;
