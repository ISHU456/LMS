import React from 'react';
import { motion } from 'framer-motion';
import { X, Layers, Upload, ClipboardCheck, Megaphone } from 'lucide-react';

const ContentUploader = ({
  showUploadForm,
  setShowUploadForm,
  newTitle,
  setNewTitle,
  newType,
  setNewType,
  newUrl,
  setNewUrl,
  fileInputRef,
  selectedFile,
  setSelectedFile,
  handleUploadCombined,
  isUploading,
  uploadProgress,
  asgnTitle,
  setAsgnTitle,
  asgnDue,
  setAsgnDue,
  asgnDesc,
  setAsgnDesc,
  handleCreateAssignment,
  announcementTitle,
  setAnnouncementTitle,
  announcementContent,
  setAnnouncementContent,
  handleCreateAnnouncement
}) => {
  if (!showUploadForm) return null;

  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="shrink-0 bg-white dark:bg-[#0b0f19] rounded-[2rem] border-2 border-primary-500/20 shadow-2xl overflow-hidden mb-4"
    >
      <div className="p-8 space-y-6">
        <div className="flex justify-between items-center mb-2">
          <div className="flex flex-col">
            <h2 className="text-xl font-black dark:text-white uppercase tracking-tighter">Content Uploader</h2>
            <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest">Authorized Faculty Override Only</p>
          </div>
          <button onClick={() => setShowUploadForm(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex justify-center">
          {/* Resource Signal */}
          <div className="w-full max-w-xl space-y-4 p-6 rounded-3xl bg-gray-50 dark:bg-gray-800/20 border border-gray-100 dark:border-white/5">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><Layers size={18}/></div>
                <h3 className="text-xs font-black dark:text-white uppercase tracking-widest">Asset Parameters</h3>
             </div>
             <input 
               type="text" placeholder="Asset Title" value={newTitle} onChange={(e)=>setNewTitle(e.target.value)}
               className="w-full bg-white dark:bg-gray-800 border-0 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 ring-primary-500 uppercase tracking-tight"
             />
             <select 
               value={newType} onChange={(e)=>setNewType(e.target.value)}
               className="w-full bg-white dark:bg-gray-800 border-0 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-tight"
             >
               <option value="ebook">EBOOK (PDF/DOC)</option>
               <option value="youtube">EXTERNAL VIDEO (LINK)</option>
               <option value="notes">LECTURE NOTES</option>
             </select>
             {newType === 'youtube' ? (
               <input 
                 type="text" placeholder="URL Endpoint" value={newUrl} onChange={(e)=>setNewUrl(e.target.value)}
                 className="w-full bg-white dark:bg-gray-800 border-0 rounded-xl px-4 py-3 text-xs font-bold ring-red-500/20 ring-1"
               />
             ) : (
               <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                 <div className="w-full bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl px-4 py-5 flex flex-col items-center justify-center gap-2 group-hover:border-primary-500 transition-all">
                    <Upload size={20} className="text-gray-400 group-hover:text-primary-500" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{selectedFile ? selectedFile.name : 'Select File'}</span>
                 </div>
                 <input type="file" ref={fileInputRef} className="hidden" onChange={(e)=>setSelectedFile(e.target.files[0])}/>
               </div>
             )}
             <button 
               onClick={handleUploadCombined} disabled={isUploading}
               className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all"
             >
               {isUploading ? `UPLOADING ${uploadProgress}%` : 'UPLOAD CONTENT'}
             </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ContentUploader;
