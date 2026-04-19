import { useState, useRef } from 'react';
import { UploadCloud, File, CheckCircle, Clock, AlertTriangle, MessageSquare, Download, Users, Edit3, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useGamification } from '../../hooks/useGamification';

const Assignments = ({ isEmbedded = false }) => {
  const { user } = useSelector(state => state.auth);
  const studentId = user?._id;
  const { gamification, submitAssignment } = useGamification(studentId);
  const [activeTab, setActiveTab] = useState('pending');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Drag and drop state
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);

  const isTeacher = user?.role === 'teacher' || user?.role === 'hod';

  const assignmentsDB = [
    { id: 1, title: 'Build Full-Stack LMS', type: 'project', course: 'CS899', deadline: '2026-04-15T23:59:00', maxMarks: 100, status: 'pending', group: true },
    { id: 2, title: 'Algorithm Complexity Analysis', type: 'assignment', course: 'CS301', deadline: '2026-03-22T23:59:00', maxMarks: 20, status: 'pending', group: false },
    { id: 3, title: 'Operating Systems PCB Design', type: 'assignment', course: 'CS401', deadline: '2026-03-10T23:59:00', maxMarks: 50, status: 'graded', marksObtained: 46, group: false, feedback: 'Excellent memory matrix optimization!' },
  ];

  const getLocalAssignmentStatus = (task) => {
    if (task.status === 'graded') return 'graded';
    const courseProgress = gamification?.progressByCourseId?.[task.course];
    const completed = new Set(courseProgress?.completedAssignmentIds || []);
    return completed.has(task.id) ? 'submitted' : 'pending';
  };

  const tasksWithLocalStatus = assignmentsDB.map((t) => ({
    ...t,
    localStatus: getLocalAssignmentStatus(t),
  }));

  const filteredTasks = tasksWithLocalStatus.filter((task) => task.localStatus === activeTab);

  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); if (e.type === "dragenter" || e.type === "dragover") setDragActive(true); else if (e.type === "dragleave") setDragActive(false); };
  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); if (e.dataTransfer.files && e.dataTransfer.files[0]) setUploadedFile(e.dataTransfer.files[0].name); };
  const handleChange = (e) => { e.preventDefault(); if (e.target.files && e.target.files[0]) setUploadedFile(e.target.files[0].name); };

  const openUploader = (task) => { setSelectedTask(task); setIsSubmitModalOpen(true); };

  const handleSubmitDeliverable = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;
    if (!uploadedFile) return;
    if (isTeacher) return;

    await submitAssignment({
      courseId: selectedTask.course,
      assignmentId: selectedTask.id,
    });

    setIsSubmitModalOpen(false);
    setUploadedFile(null);
    setSelectedTask(null);
    setActiveTab('submitted');
  };

  return (
    <div className={`min-h-[calc(100vh-73px)] bg-gray-50 dark:bg-[#0f172a] ${isEmbedded ? 'p-0' : 'p-4 md:p-8'} flex justify-center`}>
      <div className="w-full max-w-6xl space-y-8">
        
        {/* Header */}
        <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isEmbedded ? 'pt-4' : ''}`}>
           <div>
              <h1 className={`${isEmbedded ? 'text-2xl' : 'text-3xl'} font-extrabold text-gray-900 dark:text-white capitalize tracking-tight flex items-center gap-3`}>
                 <Edit3 size={isEmbedded ? 24 : 32} className="text-primary-500" /> Assignment & Project Hub
              </h1>
              <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Manage deliverables, track strict deadlines, and review detailed faculty remarks.</p>
           </div>

           {isTeacher && (
              <button className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition shadow-lg shadow-primary-500/30">
                 <Plus size={20} /> Create Assignment
              </button>
           )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 p-1 bg-gray-200 dark:bg-gray-800/80 rounded-xl w-fit">
           {['pending', 'submitted', 'graded'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2 rounded-lg font-bold text-sm capitalize transition-all ${activeTab === tab ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                 {tab}
              </button>
           ))}
        </div>

        {/* Tasks Grid */}
        <div className="space-y-4">
           <AnimatePresence>
             {filteredTasks.map((task, i) => {
               // Calculate urgency
               const daysLeft = Math.ceil((new Date(task.deadline) - new Date()) / (1000 * 60 * 60 * 24));
               const isUrgent = daysLeft > 0 && daysLeft <= 3 && task.localStatus === 'pending';
               
               return (
                 <motion.div key={task.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className={`glass p-6 md:p-8 rounded-3xl border-2 flex flex-col md:flex-row items-start md:items-center gap-6 relative shadow-lg ${isUrgent ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-900/10' : 'border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50'}`}>
                    
                    {/* Status Badge */}
                    <div className="absolute top-6 right-6">
                       <span className={`px-3 py-1 text-xs font-black uppercase tracking-widest rounded-full flex items-center gap-1 ${
                         task.localStatus === 'graded' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                         task.localStatus === 'pending' && daysLeft < 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                         'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                       }`}>
                         {task.localStatus === 'graded' ? <CheckCircle size={14}/> : task.localStatus === 'pending' && daysLeft < 0 ? <AlertTriangle size={14}/> : <Clock size={14}/>}
                         {task.localStatus === 'pending' && daysLeft < 0 ? 'LATE' : task.localStatus}
                       </span>
                    </div>

                    <div className="flex-1 w-full pt-6 md:pt-0">
                       <div className="flex items-center gap-3 mb-2">
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-bold rounded-md border border-gray-200 dark:border-gray-700">{task.course}</span>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${task.type === 'project' ? 'text-purple-500' : 'text-primary-500'}`}>{task.type}</span>
                          {task.group && <span className="flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 rounded-full font-bold uppercase"><Users size={12}/> Group Eligible</span>}
                       </div>
                       
                       <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-tight mb-2 pr-20">{task.title}</h3>
                       
                       <div className="flex items-center gap-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                          <span className={`flex items-center gap-1.5 ${isUrgent ? 'text-amber-600 font-bold' : ''}`}>
                             <Clock size={16}/> {daysLeft > 0 ? `${daysLeft} days remaining` : 'Deadline Passed'} • {new Date(task.deadline).toLocaleDateString()}
                          </span>
                       </div>

                       {task.localStatus === 'graded' && (
                         <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/80 rounded-xl border-l-[4px] border-l-emerald-500">
                            <div className="flex justify-between items-center mb-2">
                               <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2"><MessageSquare size={16} className="text-emerald-500"/> Faculty Remark Attached</p>
                               <span className="font-black text-xl text-emerald-600 dark:text-emerald-400">{task.marksObtained}/{task.maxMarks} pts</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">"{task.feedback}"</p>
                         </div>
                       )}
                    </div>

                    <div className="shrink-0 w-full md:w-auto flex flex-col items-center justify-center gap-3 mt-4 md:mt-0 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                       <div className="text-center mb-2">
                         <span className="text-3xl font-black text-gray-900 dark:text-white">{task.maxMarks}</span>
                         <span className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Total Pts</span>
                       </div>
                       <button className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-bold rounded-lg transition"><Download size={16}/> Briefing</button>
                       {task.localStatus === 'pending' && !isTeacher && (
                         <button onClick={() => openUploader(task)} className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-lg transition shadow-md shadow-primary-500/20"><UploadCloud size={16}/> Turn In</button>
                       )}
                    </div>
                 </motion.div>
               );
             })}
           </AnimatePresence>
        </div>

      </div>

      {/* --- SUBMISSION DRAG-AND-DROP MODAL --- */}
      <AnimatePresence>
         {isSubmitModalOpen && selectedTask && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSubmitModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm"></motion.div>
             <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-white dark:bg-gray-900 w-full max-w-2xl rounded-3xl p-8 shadow-2xl z-10 border border-gray-200 dark:border-gray-800">
               <button onClick={() => setIsSubmitModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 dark:hover:text-white"><X size={24}/></button>
               
               <div className="mb-6">
                 <h2 className="text-2xl font-black dark:text-white">Submit {selectedTask.type === 'project' ? 'Project' : 'Assignment'} Deliverable</h2>
                 <p className="text-sm text-gray-500 font-medium">Target mapping: <span className="font-bold text-gray-900 dark:text-gray-300">{selectedTask.title}</span></p>
               </div>
               
                <form className="space-y-6" onSubmit={handleSubmitDeliverable} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
                 <div className={`relative w-full h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-colors bg-white dark:bg-[#121929] ${dragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : uploadedFile ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10' : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleChange} />
                    
                    {uploadedFile ? (
                      <div className="flex flex-col items-center">
                         <div className="w-16 h-16 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 rounded-full flex items-center justify-center mb-3">
                           <File size={32} />
                         </div>
                         <p className="font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-[300px]">{uploadedFile}</p>
                         <button type="button" onClick={()=>setUploadedFile(null)} className="text-xs text-gray-500 mt-2 hover:underline font-bold">Swap file</button>
                      </div>
                    ) : (
                      <>
                        <UploadCloud size={48} className={`mb-4 ${dragActive ? 'text-primary-500' : 'text-gray-400'}`} />
                        <p className="text-lg font-bold text-gray-600 dark:text-gray-300 text-center px-4">Drag & drop your compiled payload here</p>
                        <p className="text-sm text-gray-500 mt-1 mb-4">Supported: PDF, ZIP, DOCX</p>
                        <button type="button" onClick={() => fileInputRef.current.click()} className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold rounded-lg shadow-md hover:scale-105 transition-transform">Locate File</button>
                      </>
                    )}
                 </div>

                <div>
                    <label className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-2 block">Optional Private Instructor Notes</label>
                    <textarea rows="3" className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-primary-500 font-medium resize-none shadow-inner" placeholder="E.g., Documenting edge cases encountered during compilation..."></textarea>
                 </div>

                <button type="submit" disabled={!uploadedFile} className={`w-full py-4 rounded-xl font-black text-lg shadow-xl outline-none transition-all ${uploadedFile ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/30 focus:scale-[0.98]' : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'}`}>
                    Submit securely for grading
                 </button>
               </form>
             </motion.div>
           </div>
         )}
      </AnimatePresence>

    </div>
  );
};
export default Assignments;
