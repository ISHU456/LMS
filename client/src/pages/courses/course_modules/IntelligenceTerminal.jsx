import React, { useState } from 'react';
import { Layout, Plus, Zap, Trash2, Edit3, X, Check, Info, Youtube, Book, ClipboardCheck, Download, CheckCircle, Clock, Map } from 'lucide-react';
import { motion } from 'framer-motion';
import AssignmentHub from './AssignmentHub';

const IntelligenceTerminal = ({
  activeSection,
  isAdminHOD,
  setShowUploadForm,
  showUploadForm,
  timetable,
  isTeacher,
  courseId,
  user,
  handleDeleteScheduleItem,
  assignments,
  resources,
  previewItem,
  isStudent,
  handleMarkComplete,
  handlePreview,
  handleDelete,
  completedItems,
  updateScheduleInDB,
  selectedAssignment,
  setSelectedAssignment,
  fetchAssignments,
  studentSubmissions
}) => {
  const [editingIdx, setEditingIdx] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const startEditing = (idx, item) => {
    setEditingIdx(idx);
    setEditFormData({ ...item });
  };

  const cancelEditing = () => {
    setEditingIdx(null);
    setEditFormData({});
  };

  const saveEdit = async (idx) => {
    const updated = [...timetable];
    updated[idx] = editFormData;
    if (await updateScheduleInDB({ schedule: updated })) {
        setEditingIdx(null);
    }
  };

  return (
    <div className="flex-1 min-h-0 glass p-6 rounded-2xl border border-white dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 shadow-xl flex flex-col gap-4 overflow-hidden">
       <div className="flex items-center justify-between">
          <h3 className="text-sm font-black dark:text-white uppercase tracking-tighter flex items-center gap-3">
            <Layout size={18} className="text-primary-500"/> Course Intelligence Terminal
          </h3>
          {isAdminHOD && (
            <button 
              onClick={() => setShowUploadForm(!showUploadForm)}
              className="p-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-primary-600 hover:text-white transition-all shadow-md"
            >
              <Plus size={16}/>
            </button>
          )}
       </div>

       <div className="flex-1 pr-2 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
       {activeSection === 'timetable' ? (
          <div className="grid grid-cols-1 gap-3">
             {timetable.map((t, i) => (
                <div 
                  key={i} 
                  className={`p-4 bg-white/40 dark:bg-gray-800/20 rounded-xl border transition-all font-sans ${editingIdx === i ? 'border-primary-500 bg-primary-50/10' : 'border-gray-100 dark:border-gray-700'}`}
                >
                   {editingIdx === i ? (
                     <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                           <input type="text" value={editFormData.day} onChange={e=>setEditFormData({...editFormData, day: e.target.value})} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-[10px] font-bold uppercase outline-none focus:ring-1 ring-primary-500" placeholder="Day" />
                           <input type="text" value={editFormData.time} onChange={e=>setEditFormData({...editFormData, time: e.target.value})} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-[10px] font-bold uppercase outline-none focus:ring-1 ring-primary-500" placeholder="Time" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                           <input type="text" value={editFormData.room} onChange={e=>setEditFormData({...editFormData, room: e.target.value})} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-[10px] font-bold uppercase outline-none focus:ring-1 ring-primary-500" placeholder="Room" />
                           <select value={editFormData.type} onChange={e=>setEditFormData({...editFormData, type: e.target.value})} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-[10px] font-black uppercase pointer-events-auto">
                              {['lecture', 'lab', 'tutorial', 'seminar'].map(x => <option key={x} value={x}>{x}</option>)}
                           </select>
                        </div>
                        <input type="text" value={editFormData.activity} onChange={e=>setEditFormData({...editFormData, activity: e.target.value})} className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-[10px] font-bold uppercase outline-none focus:ring-1 ring-primary-500" placeholder="Protocol Activity" />
                        <div className="flex gap-2">
                           <button onClick={()=>saveEdit(i)} className="flex-1 py-2 bg-primary-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-primary-700">Save Changes</button>
                           <button onClick={cancelEditing} className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"><X size={14}/></button>
                        </div>
                     </div>
                   ) : (
                    <div className="flex justify-between items-center group">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-xl flex flex-col items-center justify-center font-black text-[9px] uppercase shadow-inner">
                            <span>{t.day.substring(0, 3)}</span>
                         </div>
                         <div className="flex flex-col">
                            <h4 className="text-xs font-black dark:text-white uppercase tracking-tight">{t.activity}</h4>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{t.time} • {t.room}</p>
                            {t.addedBy && <p className="text-[7px] font-bold text-primary-500 uppercase tracking-widest mt-0.5">By {t.addedBy}</p>}
                         </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap size={14} className="text-gray-200 dark:text-gray-700 group-hover:text-primary-500 transition-colors mr-2" />
                        {isTeacher && (
                          <>
                            <button onClick={() => startEditing(i, t)} className="p-2 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all">
                              <Edit3 size={14} />
                            </button>
                            <button onClick={() => handleDeleteScheduleItem(i)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all">
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                   )}
                </div>
             ))}
          </div>
        ) : activeSection === 'assignments' ? (
          <AssignmentHub 
            courseId={courseId || '664b44558e88990011223344'} 
            isTeacher={isTeacher} 
            user={user} 
            selectedAssignment={selectedAssignment}
            setSelectedAssignment={setSelectedAssignment}
            assignments={assignments}
            fetchAssignments={fetchAssignments}
            studentSubmissions={studentSubmissions}
          />
        ) : (
          (() => {
            const filtered = (resources.filter(r => {
              if (activeSection === 'ebooks') return r.type !== 'youtube' && r.type !== 'yt';
              if (activeSection === 'yt-links') return r.type === 'youtube' || r.type === 'yt';
              return true;
            }));
            
            if (filtered.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                   <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                     <Info size={32} className="text-gray-300" />
                   </div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Registry sector is empty.</p>
                </div>
              );
            }

            return filtered.map((item, idx) => (
              <div 
                 key={item._id} 
                 className={`p-4 rounded-2xl border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group relative overflow-hidden font-sans ${previewItem?.id === item._id ? 'bg-primary-50 border-primary-500 dark:bg-primary-900/30' : 'bg-white/40 dark:bg-gray-800/10 border-transparent dark:border-gray-800 hover:bg-white/90 dark:hover:bg-gray-800/80 hover:shadow-xl hover:border-primary-500/30'}`}
              >
                <div className="flex items-center gap-4 min-w-0 w-full md:w-auto flex-1">
                   <div className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-xl transition-all duration-500 group-hover:scale-105 ${item.type === 'youtube' || item.type === 'yt' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                     {(item.type === 'youtube' || item.type === 'yt') ? <Youtube size={20} /> : <Book size={20} />}
                   </div>
                   <div className="min-w-0 w-full">
                     <h4 className="text-[13px] font-black dark:text-white break-words whitespace-normal uppercase tracking-tight mb-1 group-hover:text-primary-600 transition-colors">{item.title}</h4>
                     <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[8px] font-black text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md uppercase tracking-widest truncate max-w-full">{(item.type || 'PROTOCOL').toUpperCase()} ASSET</span>
                        <span className="text-[8px] font-black text-primary-500 bg-primary-100 dark:bg-primary-900/30 px-2 py-0.5 rounded-md uppercase tracking-widest shrink-0">{item.points || 15} XP ACTIVE</span>
                        {completedItems.has(item._id) ? (
                          <span className="flex items-center gap-1 text-[8px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md uppercase tracking-widest shrink-0 transition-colors">
                             <CheckCircle size={10} /> SYNCED
                          </span>
                        ) : (
                          isStudent && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleMarkComplete(item); }}
                              className="flex items-center gap-1 text-[8px] font-black text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/10 hover:bg-primary-100 dark:hover:bg-primary-900/30 px-2 py-0.5 rounded-md uppercase tracking-widest shrink-0 transition-colors cursor-pointer"
                            >
                              <div className="w-2.5 h-2.5 border border-primary-500 rounded-sm"></div> MARK CHECKPOINT
                            </button>
                          )
                        )}
                     </div>
                   </div>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0 self-start md:self-center">
                  {(item.fileUrl || item.fileData) && item.type !== 'youtube' && item.type !== 'yt' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); window.open(item.fileUrl || `http://localhost:5000/api/resources/file/${item._id}`, '_blank'); }}
                      className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all"
                      title="Download"
                    >
                      <Download size={14} />
                    </button>
                  )}
                  {activeSection !== 'assignments' && (
                    <button 
                      onClick={()=>handlePreview(item)} 
                      className={`px-4 py-2 rounded-lg font-black text-[9px] uppercase shadow-md transition-all tracking-widest ${previewItem?.id === item._id ? 'bg-primary-600 text-white' : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-primary-600 hover:text-white'}`}
                    >
                      {previewItem?.id === item._id ? 'VIEWING' : 'PREVIEW'}
                    </button>
                  )}
                  {isTeacher && (
                    <button onClick={(e)=>{e.stopPropagation(); handleDelete(item);}} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                      <Trash2 size={14}/>
                    </button>
                  )}
               </div>
             </div>
           ));
         })()
       )}
       </div>
    </div>
  );
};

export default IntelligenceTerminal;
