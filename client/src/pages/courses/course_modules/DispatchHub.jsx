import { Target, Zap, Loader2, Upload } from 'lucide-react';

const DispatchHub = ({
  isAdminHOD,
  activeSection,
  handleUploadCombined,
  newTitle,
  setNewTitle,
  newType,
  setNewType,
  newPoints,
  setNewPoints,
  newUrl,
  setNewUrl,
  handleCreateAssignment,
  asgnTitle,
  setAsgnTitle,
  asgnDue,
  setAsgnDue,
  asgnMarks,
  setAsgnMarks,
  handleTimetableImageUpload,
  isUploadingImage
}) => {
  if (!isAdminHOD) return null;

  return (
    <div className="glass p-6 rounded-[2rem] border-2 border-primary-500/10 bg-white/50 dark:bg-gray-900/50 shadow-xl shrink-0 overflow-hidden">
       <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black dark:text-white uppercase tracking-tighter flex items-center gap-2">
            <Target size={20} className="text-primary-500"/> Dispatch Hub
          </h3>
          <span className="text-[9px] font-black text-primary-500 bg-primary-50 dark:bg-primary-900/30 px-2.5 py-1 rounded-full uppercase tracking-widest">{activeSection.replace('-', ' ')}</span>
       </div>
       
       {activeSection === 'timetable' ? (
             <div className="space-y-6">
                <div className="p-8 bg-blue-50/50 dark:bg-blue-900/10 border-2 border-dashed border-blue-200 dark:border-blue-900/30 rounded-[2rem] text-center space-y-4">
                   <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mx-auto">
                      <Zap size={24} className="text-blue-500" />
                   </div>
                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Master Timetable Schematic</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase leading-relaxed px-4">Upload the physical roadmap for synchronization across all member terminals.</p>
                   </div>
                   
                   <div className="relative group">
                      <input 
                        type="file" 
                        id="hub-sch-up" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleTimetableImageUpload}
                        disabled={isUploadingImage}
                      />
                      <label 
                        htmlFor="hub-sch-up" 
                        className={`w-full py-3 flex items-center justify-center gap-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer ${isUploadingImage ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95'}`}
                      >
                         {isUploadingImage ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                         {isUploadingImage ? 'SYNCING...' : 'INITIATE UPLOAD'}
                      </label>
                   </div>
                </div>
             </div>
        ) : activeSection !== 'assignments' ? (
         <form onSubmit={handleUploadCombined} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-gray-400 ml-1">Asset Title</label>
                  <input 
                    type="text" 
                    value={newTitle} 
                    onChange={e=>setNewTitle(e.target.value)} 
                    placeholder="Identification..." 
                    className="w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-2 outline-none focus:border-primary-500 font-bold text-xs" 
                    required 
                  />
               </div>
               <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-gray-400 ml-1">Logic Type</label>
                  <select 
                    value={newType} 
                    onChange={e=>setNewType(e.target.value)} 
                    className="w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-2 outline-none font-bold uppercase text-[10px]"
                  >
                     <option value="pdf">Document</option>
                     <option value="ebook">Ebook</option>
                     <option value="youtube">Source Node</option>
                     <option value="ppt">Presentation</option>
                  </select>
               </div>
            </div>

            <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-gray-400 ml-1">Progress Value (Points)</label>
                <input 
                  type="number" 
                  value={newPoints} 
                  onChange={e=>setNewPoints(e.target.value)} 
                  className="w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-2 outline-none font-bold text-xs text-primary-500" 
                />
            </div>

            <div className="space-y-1">
               <label className="text-[8px] font-black uppercase text-gray-400 ml-1">Binary Access URL</label>
               <input 
                type="url" 
                value={newUrl} 
                onChange={e=>setNewUrl(e.target.value)} 
                placeholder="https://cloud.engine..." 
                className="w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-2 outline-none text-primary-600 text-[10px] font-mono" 
               />
            </div>
            <button type="submit" className="w-full py-3 bg-primary-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg hover:bg-primary-700 transition-all tracking-widest">
              DEPLOY RESOURCE
            </button>
         </form>
       ) : (
         <form onSubmit={handleCreateAssignment} className="space-y-3">
            <input type="text" value={asgnTitle} onChange={e=>setAsgnTitle(e.target.value)} placeholder="Signal Tasking..." className="w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-2 font-bold text-xs" required />
            <div className="grid grid-cols-2 gap-3">
               <input type="datetime-local" value={asgnDue} onChange={e=>setAsgnDue(e.target.value)} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-2 text-[9px] font-black" required />
               <input type="number" value={asgnMarks} onChange={e=>setAsgnMarks(e.target.value)} placeholder="Marks" className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-2 font-black text-xs" required />
            </div>
            <button type="submit" className="w-full py-3 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg transition-all tracking-widest">
              PUBLISH PROTOCOL
            </button>
         </form>
       )}
    </div>
  );
};

export default DispatchHub;
