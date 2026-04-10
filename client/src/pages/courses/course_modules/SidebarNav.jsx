import { Link } from 'react-router-dom';
import { PanelLeft, ArrowLeft, Plus, GripVertical, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SidebarNav = ({ 
  sidebarOpen, 
  setSidebarOpen, 
  isTeacher, 
  showUploadForm, 
  setShowUploadForm, 
  sectionTabs, 
  activeSection, 
  setActiveSection, 
  initials, 
  displayName, 
  roleLabel,
  sidebarWidth,
  isSidebarDragging,
  startSidebarResizing,
  isUploaderHub = false,
  courseId
}) => {
  return (
    <aside 
      style={{ width: window.innerWidth < 1024 ? '280px' : (sidebarOpen ? sidebarWidth : 80) }}
      className={`fixed lg:relative inset-y-0 left-0 bg-white dark:bg-[#0b0f19] border-r border-gray-100 dark:border-gray-800 flex flex-col shrink-0 z-[101] relative shadow-2xl transition-all duration-300 ${!sidebarOpen && 'w-20'} ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
    >
      {/* Resize Handle (The Slider) */}
      {/* Resize Handle (The Slider) */}
      {sidebarOpen && (
        <div 
          onMouseDown={startSidebarResizing}
          className={`absolute right-[-4px] top-0 w-2 h-full cursor-col-resize transition-all z-[60] flex items-center justify-center group/sidebar-resizer ${isSidebarDragging ? 'bg-primary-500/10' : 'bg-transparent hover:bg-primary-500/5'}`}
        >
          <div className={`p-1 bg-primary-600 text-white rounded-full shadow-lg transition-all duration-300 ${isSidebarDragging ? 'opacity-100 scale-110' : 'opacity-0 group-hover/sidebar-resizer:opacity-100 scale-75'}`}>
             <GripVertical size={10}/>
          </div>
        </div>
      )}

      <div className={`p-4 border-b border-gray-50 dark:border-gray-800/50 sticky top-0 bg-white dark:bg-[#0b0f19] z-20 ${sidebarOpen ? 'p-8 flex justify-between items-center' : 'p-4 flex flex-col gap-5 items-center justify-center'}`}>
        <div className="flex items-center gap-4">
          <Link to="/courses" className="w-10 h-10 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/80 rounded-2xl text-gray-400 hover:text-primary-600 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700 shrink-0">
            <ArrowLeft size={18} />
          </Link>
          
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl text-gray-500">
            <X size={20} />
          </button>
          
          {sidebarOpen && (
            <Link to="/profile" className="flex items-center gap-3 transition-opacity duration-200 hover:opacity-80">
               <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-[10px] font-black shadow-lg shrink-0">
                 {initials}
               </div>
               <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-black dark:text-white uppercase truncate">{displayName}</span>
                  <span className="text-[8px] font-black text-primary-500 uppercase flex items-center gap-1">
                    <div className="w-1 h-1 bg-primary-500 rounded-full animate-pulse"></div> {roleLabel}
                  </span>
               </div>
            </Link>
          )}
        </div>

        {!sidebarOpen && (
           <Link to="/profile" className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-[12px] font-black shadow-lg shrink-0 hover:scale-105 transition-transform" title="Profile">
             {initials}
           </Link>
        )}
        {sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 hidden lg:flex bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-primary-600 rounded-xl transition-all h-10 w-10 items-center justify-center"
          >
            <PanelLeft size={18} />
          </button>
        )}
      </div>

      {!sidebarOpen && (
        <div className="px-4 pb-4 border-b border-gray-50 dark:border-gray-800/50 flex justify-center hidden lg:flex">
           <button
             onClick={() => setSidebarOpen(true)}
             className="p-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-xl transition-all h-10 w-10 flex items-center justify-center"
           >
             <PanelLeft size={18} />
           </button>
        </div>
      )}

      <nav className={`flex-1 py-10 space-y-2 overflow-y-auto custom-scrollbar min-h-0 ${sidebarOpen ? 'px-6' : 'px-3'}`}>
        {isTeacher && courseId && (
          <div className="mb-4">
            <Link 
              to={`/courses/${courseId}/upload`}
              className={`w-full flex items-center gap-4 rounded-[1.5rem] transition-all duration-300 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-900 hover:text-white ${sidebarOpen ? 'px-5 py-4' : 'h-12 justify-center'}`}
            >
              <Plus size={18} />
              <span className={`text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 h-0'}`}>Upload Hub</span>
            </Link>
          </div>
        )}

        {sectionTabs.map((t) => (
          <button 
            key={t.id} 
            onClick={() => {
              if (isUploaderHub) {
                window.location.href = `/course-inner/${courseId}?section=${t.id}`;
              } else {
                setActiveSection(t.id);
                if (window.innerWidth < 1024) setSidebarOpen(false);
              }
            }} 
            className={`w-full flex items-center relative rounded-2xl transition-all duration-300 group ${activeSection === t.id ? t.active + ' shadow-lg' : 'bg-transparent text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/30 hover:text-gray-900 dark:hover:text-white'} ${sidebarOpen ? 'px-4 py-2' : 'h-12 w-12 mx-auto justify-center'} mb-1`}
          >
            <div className={`flex items-center relative z-10 ${sidebarOpen ? 'w-full justify-between' : 'justify-center w-full'}`}>
              <div className={`flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'}`}>
                <div className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center transition-colors ${activeSection === t.id ? 'bg-white/20 text-white' : t.color}`}>
                  <t.icon size={16} />
                </div>
                {sidebarOpen && (
                  <span className="text-[9px] font-black uppercase tracking-widest leading-none whitespace-nowrap">{t.label}</span>
                )}
              </div>
              {activeSection === t.id && sidebarOpen && (
                <div className="w-1.5 h-1.5 bg-white rounded-full relative z-10 animate-pulse" />
              )}
            </div>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default SidebarNav;
