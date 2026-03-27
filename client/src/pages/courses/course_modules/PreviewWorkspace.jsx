import React from 'react';
import { GripVertical, MonitorPlay, Maximize, X, Loader2, AlertCircle, ExternalLink, FileText } from 'lucide-react';
import Schedule from '../schedule/Schedule';
import AssignmentInterface from './AssignmentInterface';

const PreviewWorkspace = ({
  leftWidth,
  startResizing,
  isDragging,
  rightColumnRef,
  previewItem,
  setPreviewItem,
  activeSection,
  courseId,
  isTeacher,
  user,
  timetable,
  setTimetable,
  timetableImageUrl,
  setTimetableImageUrl,
  handleTimetableImageUpload,
  handleDeleteTimetableImage,
  isUploadingImage,
  selectedAssignment,
  setSelectedAssignment,
  fetchAssignments,
  setLeftWidth
}) => {
  const renderPreviewContent = () => {
    // If we're in timetable section, we always want to show the schedule/timetable image
    if (activeSection === 'timetable') {
      return (
        <Schedule 
          courseId={courseId} 
          isTeacher={isTeacher} 
          user={user} 
          timetable={timetable} 
          setTimetable={setTimetable} 
          timetableImageUrl={timetableImageUrl} 
          setTimetableImageUrl={setTimetableImageUrl} 
          handleTimetableImageUpload={handleTimetableImageUpload}
          handleDeleteTimetableImage={handleDeleteTimetableImage}
          isUploadingImage={isUploadingImage}
        />
      );
    }

    if (selectedAssignment) {
      return (
        <AssignmentInterface 
          assignment={selectedAssignment} 
          user={user} 
          isTeacher={isTeacher} 
          onBack={() => {
              setSelectedAssignment(null);
              setLeftWidth(100);
          }}
          fetchAssignments={fetchAssignments}
        />
      );
    }

    if (!previewItem) return null;
    
    const SimplePreviewWrapper = ({ children }) => (
      <div className="relative w-full h-full bg-white dark:bg-gray-900 flex flex-col rounded-2xl overflow-hidden shadow-2xl">
        {children}
      </div>
    );

    switch(previewItem.type) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-16 h-16 animate-spin text-primary-500" />
            <p className="mt-4 text-lg font-bold text-gray-500 dark:text-gray-400">Loading Preview...</p>
          </div>
        );
      case 'error':
        return (
          <SimplePreviewWrapper>
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500 hover:text-gray-700">
              <AlertCircle size={64} className="opacity-50 mb-4 text-red-500" />
              <h3 className="text-xl font-semibold mb-2">Preview Failed</h3>
              <p className="text-sm opacity-80 mb-6">Could not load the resource for preview.</p>
              <a
                href={previewItem.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold inline-flex items-center gap-2 transition-colors shadow-lg shadow-primary-500/20"
              >
                <ExternalLink size={18} />
                Open Original Resource
              </a>
            </div>
          </SimplePreviewWrapper>
        );
      case 'youtube':
        return (
          <div className="w-full bg-white dark:bg-black flex items-center justify-center h-full p-4 md:p-8">
            <div className="w-full h-auto max-h-full aspect-video shadow-2xl rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 flex items-center justify-center">
              <iframe
                src={previewItem.url}
                className="w-full h-full border-0"
                title=""
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        );
      case 'pdf':
        return (
          <SimplePreviewWrapper>
            <iframe
              src={previewItem.url}
              className="w-full h-full border-0"
              title="PDF Preview"
              loading="lazy"
            />
          </SimplePreviewWrapper>
        );

      case 'ppt':
        const officeUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(previewItem.url)}`;
        return (
          <SimplePreviewWrapper>
            <iframe
              src={officeUrl}
              className="w-full h-full border-0"
              title="PPT Preview"
              allowFullScreen
              loading="lazy"
            />
          </SimplePreviewWrapper>
        );
      default:
        return (
          <SimplePreviewWrapper>
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-400">
              <FileText size={64} className="opacity-50 mb-4" />
              <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">{previewItem.title}</h3>
              <p className="text-sm mb-6">Native preview unavailable.</p>
              <a
                href={previewItem.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold inline-flex items-center gap-2 transition-colors shadow-lg shadow-primary-500/20"
              >
                <ExternalLink size={18} />
                Open Original File
              </a>
            </div>
          </SimplePreviewWrapper>
        );
    }
  };

  return (
    <>
      <div 
        onMouseDown={startResizing} 
        className={`hidden lg:flex cursor-col-resize items-center justify-center relative z-[100] group border-l border-r border-transparent ${isDragging ? 'w-6 bg-primary-100 dark:bg-primary-900/20 shadow-none transition-none' : 'w-2 bg-gray-100/50 dark:bg-gray-800/30 hover:bg-primary-500/10 transition-all duration-300'}`}
      >
         <div className={`p-1.5 bg-primary-600 text-white rounded-full pointer-events-none shadow-lg ${isDragging ? 'opacity-100 scale-125 rotate-90 transition-none' : 'opacity-10 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-300'}`}>
           <GripVertical size={12}/>
         </div>
      </div>

      <div 
        ref={rightColumnRef}
        style={{ width: `${100 - leftWidth}%` }} 
        className={`hidden lg:flex rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden flex-col relative z-20 ${isDragging ? 'duration-0' : 'duration-300 transition-all'}`}
      >
         {isDragging && <div className="absolute inset-0 bg-transparent z-30"></div>}
         {(previewItem || activeSection === 'timetable' || selectedAssignment) ? (
            <>
               <header className="p-4 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:white dark:text-white flex justify-between items-center px-8 border-b border-gray-200 dark:border-gray-800 relative overflow-hidden shrink-0">
                  <div className="absolute top-0 left-0 w-1/4 h-[1px] bg-primary-500 animate-pulse"></div>
                  <h4 className="text-[9px] font-black uppercase tracking-[0.2em] truncate flex items-center gap-3">
                    <MonitorPlay size={14} className="text-primary-500 animate-pulse"/> 
                    {selectedAssignment ? `PROTOCOL: ${selectedAssignment.title}` : (activeSection === 'timetable' ? 'MASTER SCHEMATIC MANIFEST' : `ONLINE STREAM: ${previewItem?.title}`)}
                  </h4>
                  <div className="flex items-center gap-3">
                     <span className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest hidden sm:block">
                        {selectedAssignment ? 'VALIDATION ACTIVE' : (activeSection === 'timetable' ? 'TEMPORAL DATA' : (previewItem?.type + ' DECRYPTED'))}
                     </span>
                     <button 
                       onClick={() => {
                           if (!rightColumnRef.current) return;
                           if (!document.fullscreenElement) {
                               rightColumnRef.current.requestFullscreen();
                           } else {
                               document.exitFullscreen?.();
                           }
                       }}
                       className="px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-600 hover:text-white border border-primary-200 dark:border-primary-800 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                       title="Fullscreen"
                     >
                       <Maximize size={12} /> <span className="hidden sm:block">FULLSCREEN</span>
                     </button>
                     {(activeSection !== 'timetable' || selectedAssignment) && (
                        <button 
                          onClick={()=>{
                              setPreviewItem(null); 
                              setSelectedAssignment(null);
                              setLeftWidth(100);
                          }} 
                          className="px-4 py-2 bg-gray-200 dark:bg-white/5 hover:bg-rose-500 hover:text-white border border-gray-300 dark:border-white/10 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                        >
                          <X size={12} /> <span className="hidden sm:block">ABORT SESSION</span>
                        </button>
                     )}
                  </div>
               </header>
                <div className="flex-1 bg-white dark:bg-black relative overflow-hidden">
                   {renderPreviewContent()}
                </div>
               <footer className="px-6 py-2 bg-gray-100 dark:bg-gray-950 border-t border-gray-200 dark:border-white/5 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                       <span className="text-[7px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest">Connection Stable</span>
                     </div>
                     <span className="text-[7px] font-black text-gray-500 dark:text-gray-600 uppercase tracking-widest">Protocol v4.2.0</span>
                  </div>
                  <span className="text-[7px] font-black text-gray-400 dark:text-gray-800 uppercase tracking-tight">Enterprise Online Processing Engine</span>
               </footer>
            </>
         ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-8 bg-white dark:bg-[#0b0f19] relative transition-colors duration-500">
               <div className="absolute inset-0 opacity-10 pointer-events-none">
                  <div className="absolute top-[-5%] left-[-5%] w-[300px] h-[300px] bg-primary-600/30 rounded-full blur-[80px]"></div>
                  <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[100px]"></div>
               </div>
               <div className="relative">
                  <div className="absolute -inset-10 bg-primary-500/10 dark:bg-primary-500/10 blur-[50px] animate-pulse rounded-full"></div>
                  <div className="w-32 h-32 rounded-3xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] backdrop-blur-3xl flex items-center justify-center relative rotate-12 group hover:rotate-0 transition-transform duration-700">
                     <MonitorPlay size={64} className="text-gray-300 dark:text-gray-800/10 group-hover:text-primary-500 transition-colors" />
                  </div>
               </div>
               <div className="space-y-3 relative z-10">
                  <h3 className="text-xl font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.4em] mb-1">Workspace Idle</h3>
                  <div className="flex items-center justify-center gap-2">
                     <div className="w-1 h-1 rounded-full bg-primary-500 animate-ping"></div>
                      <p className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em]">Select content from registry</p>
                  </div>
               </div>
            </div>
         )}
      </div>
    </>
  );
};

export default PreviewWorkspace;
