import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getStudentsForEntry, approveMarks, publishMarks, saveMarks, reset } from '../../features/results/resultSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Globe, ChevronRight, LayoutGrid, FileText, Bell, Send, AlertTriangle, ShieldCheck, User, Sparkles } from 'lucide-react';
import axios from 'axios';

const ResultVerification = () => {
  const dispatch = useDispatch();
  const { results, isLoading, isSuccess } = useSelector(state => state.results);
  const { user } = useSelector(state => state.auth);

  const [courseId, setCourseId] = useState('');
  const [semester, setSemester] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-26');
  const [courses, setCourses] = useState([]);
  const [rejectionReason, setRejectionReason] = useState('');

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [teacher, setTeacher] = useState(null);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editingMarks, setEditingMarks] = useState({});

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await axios.get('http://localhost:5001/api/public/settings');
        setDeadline(data.globalAlert);
      } catch (err) {
        console.error("Failed to load deadline info.");
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (courseId && courses.length > 0) {
       const selectedCourse = courses.find(c => c._id === courseId);
       if (selectedCourse?.facultyAssigned && selectedCourse.facultyAssigned.length > 0) {
         setTeacher(selectedCourse.facultyAssigned[0]);
       } else {
         setTeacher(null);
       }
    }
  }, [courseId, courses]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await axios.get('http://localhost:5001/api/courses', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setCourses(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching courses', err);
        setCourses([]);
      }
    };
    fetchCourses();
  }, [user.token]);

  useEffect(() => {
    if (courseId && semester) {
      dispatch(getStudentsForEntry({ courseId, semester, academicYear }));
    }
  }, [courseId, semester, academicYear, dispatch]);

  const handleSetDeadline = async () => {
    if (!newDeadline) return alert("Select a date-time for the protocol deadline.");
    const dateStr = new Date(newDeadline).toLocaleString('en-GB', { 
       day: '2-digit', month: '2-digit', year: 'numeric',
       hour: '2-digit', minute: '2-digit', hour12: true 
    });
    try {
      await axios.put('http://localhost:5001/api/admin/settings', {
        globalAlert: `Institutional Deadline: Final mark transmission protocol expires on ${dateStr}.`
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setDeadline(`Institutional Deadline: Final mark transmission protocol expires on ${dateStr}.`);
      alert('Institutional Protocol Deployed.');
    } catch (err) {
      alert('Protocol Sync Failure.');
    }
  };

  const handleApprove = () => {
    if (window.confirm('Approve all submitted results for this course?')) {
      dispatch(approveMarks({ courseId, semester, academicYear }));
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return alert('Please provide a reason for rejection.');
    try {
      await axios.post('http://localhost:5001/api/results/reject', { courseId, semester, academicYear, reason: rejectionReason }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setShowRejectModal(false);
      setRejectionReason('');
      dispatch(getStudentsForEntry({ courseId, semester, academicYear }));
    } catch (err) {
       console.error('Error rejecting marks', err);
       alert('Failed to reject marks.');
    }
  };

  const handlePublish = () => {
    if (window.confirm('Publish results? Students will be able to see their marks.')) {
      dispatch(publishMarks({ courseId, semester, academicYear }));
    }
  };

  const handleNotifyTeacher = async () => {
    const message = window.prompt("Enter broadcast message for the module instructor:");
    if (!message || !teacher) return;
    try {
       await axios.post('http://localhost:5001/api/admin/results/notify-faculty', {
         teacherId: teacher._id,
         courseId,
         semester,
         message
       }, {
         headers: { Authorization: `Bearer ${user.token}` }
       });
       alert('Direct inter-departmental alert transmitted.');
    } catch (err) {
       alert('Transmission fail.');
    }
  };

  const handleStartEdit = (student) => {
    setEditingStudentId(student._id);
    setEditingMarks({ ...student.marks });
  };

  const handleCancelEdit = () => {
    setEditingStudentId(null);
    setEditingMarks({});
  };

  const handleSaveRow = async (studentId) => {
    try {
      await dispatch(saveMarks({
        courseId,
        semester,
        academicYear,
        results: [{ studentId, marks: editingMarks }]
      })).unwrap();
      setEditingStudentId(null);
      alert('Row-level adjustments synchronized.');
    } catch (err) {
      alert('Sync failure: ' + err);
    }
  };

  const stats = {
    total: results.length,
    submitted: results.filter(r => r.status === 'submitted').length,
    approved: results.filter(r => r.status === 'approved').length,
    published: results.filter(r => r.status === 'published').length
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Institutional Alert Bar */}
        {deadline && (
          <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between group">
             <div className="flex items-center gap-4">
                <div className="p-2 bg-amber-500 text-white rounded-lg animate-pulse">
                   <Bell size={18} />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-amber-500">{deadline}</p>
             </div>
             <ShieldCheck size={20} className="text-amber-500 opacity-30 group-hover:opacity-100 transition-opacity" />
          </div>
        )}

        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-10 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <h1 className="text-4xl font-black uppercase tracking-tighter bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                 Verification Core
               </h1>
               <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Sector: {user.department || 'GLOBAL'}
               </div>
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Institutional Mark-List Certification & Result Governance Engine</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={handleNotifyTeacher}
              disabled={!courseId}
              className="px-6 py-4 bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/10 text-slate-300 hover:text-blue-400 rounded-2xl flex items-center gap-3 transition-all font-black text-[10px] uppercase tracking-widest disabled:opacity-30"
            >
              <Send size={16} /> Notify Instructor
            </button>
            <button 
              onClick={handleApprove}
              disabled={stats.submitted === 0}
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl flex items-center gap-3 shadow-xl shadow-emerald-500/20 transition-all font-black text-[10px] uppercase tracking-widest disabled:opacity-30 disabled:grayscale"
            >
              <CheckCircle size={18} /> Approve All
            </button>
            <button 
              onClick={() => setShowRejectModal(true)}
              disabled={stats.submitted === 0}
              className="px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl flex items-center gap-3 shadow-xl shadow-rose-500/20 transition-all font-black text-[10px] uppercase tracking-widest disabled:opacity-30 disabled:grayscale"
            >
              <XCircle size={18} /> Reject All
            </button>
            <button 
              onClick={handlePublish}
              disabled={stats.approved === 0}
              className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl flex items-center gap-3 shadow-xl shadow-cyan-500/20 transition-all font-black text-[10px] uppercase tracking-widest disabled:opacity-30 disabled:grayscale"
            >
              <Globe size={18} /> Publish Results
            </button>
            <button 
              onClick={async () => {
                if (window.confirm('Generate final semester results for all students?')) {
                   try {
                     const { data } = await axios.post('http://localhost:5001/api/results/generate-final', { semester, academicYear, department: user.department }, {
                       headers: { Authorization: `Bearer ${user.token}` }
                     });
                     alert(data.message);
                   } catch (err) {
                     alert(err.response?.data?.message || 'Failed to generate results.');
                   }
                }
              }}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl flex items-center gap-3 shadow-xl shadow-indigo-500/20 transition-all font-black text-[10px] uppercase tracking-widest"
            >
              <LayoutGrid size={18} /> Generate Final
            </button>
          </div>
        </div>

        {/* Instructor Origin Node */}
        {teacher && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 border border-slate-800 p-6 rounded-[32px] mb-8 flex items-center justify-between shadow-2xl"
            >
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl border-2 border-emerald-500/30 p-1">
                  <img src={teacher.profilePic || 'https://via.placeholder.com/150'} className="w-full h-full object-cover rounded-xl" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">Transmitting Instructor</p>
                   <h2 className="text-xl font-black text-white uppercase">{teacher.name}</h2>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{teacher.email}</p>
                </div>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Origin Protocol</p>
                 <p className="text-xs font-black text-slate-300 uppercase italic">Departmental Liaison Alpha</p>
              </div>
            </motion.div>
        )}

        {/* Real-time Statistics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
           {[
             { label: 'Identified Tokens', value: stats.total, color: 'text-slate-400', bg: 'bg-slate-900/50' },
             { label: 'Transmission Pending', value: stats.submitted, color: 'text-blue-500', bg: 'bg-blue-500/5' },
             { label: 'Authenticated', value: stats.approved, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
             { label: 'Broadcast Ready', value: stats.published, color: 'text-cyan-500', bg: 'bg-cyan-500/5' }
           ].map((stat, i) => (
             <div key={i} className={`${stat.bg} p-6 rounded-[2rem] border border-white/5 shadow-sm`}>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">{stat.label}</p>
                <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
             </div>
           ))}
        </div>

        {/* Filters & Control Protocol */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 bg-slate-900/50 p-6 rounded-3xl border border-slate-800 backdrop-blur-xl">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 italic">1. Select Academic Phase</label>
            <select 
              value={semester} 
              onChange={(e) => setSemester(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm font-bold text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-inner"
            >
              <option value="">Semester Mapping</option>
              {[1,2,3,4,5,6,7,8].map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 italic">2. Active Domain / Subject</label>
            <select 
              value={courseId} 
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm font-bold text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-inner"
            >
              <option value="">Course Selection</option>
              {courses.filter(c => !semester || c.semester === parseInt(semester)).map(c => (
                <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 italic">3. Submission Deadline Protocol</label>
            <div className="flex gap-2">
               <input 
                 type="datetime-local" 
                 value={newDeadline}
                 onChange={(e) => setNewDeadline(e.target.value)}
                 className="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-4 text-[10px] font-black uppercase text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all shadow-inner"
               />
               <button 
                 onClick={handleSetDeadline}
                 className="px-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-all shadow-lg shadow-amber-600/20"
                 title="Deploy Protocol"
               >
                 <ShieldCheck size={18} />
               </button>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-700">
                  <th className="p-4 font-semibold text-slate-300">Roll No</th>
                  <th className="p-4 font-semibold text-slate-300">Name</th>
                  {courses.find(c => c._id === courseId)?.type === 'THEORY' && (
                    <>
                      <th className="p-4 font-semibold text-slate-300 text-center">MSTs</th>
                      <th className="p-4 font-semibold text-slate-300 text-center">End Sem</th>
                    </>
                  )}
                  {courses.find(c => c._id === courseId)?.type === 'PRACTICAL' && (
                    <>
                      <th className="p-4 font-semibold text-slate-300 text-center">Int Practical</th>
                      <th className="p-4 font-semibold text-slate-300 text-center">Ext Practical</th>
                    </>
                  )}
                  {courses.find(c => c._id === courseId)?.type === 'VIVA' && (
                    <th className="p-4 font-semibold text-slate-300 text-center">Viva Score</th>
                  )}
                   <th className="p-4 font-semibold text-slate-300 text-center">Total</th>
                  <th className="p-4 font-semibold text-slate-300 text-center">Status</th>
                  <th className="p-4 font-semibold text-slate-300 text-center">Protocol Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {(Array.isArray(results) ? results : []).map((student) => {
                  const isEditing = editingStudentId === student._id;
                  const currentCourse = courses.find(c => c._id === courseId);
                  
                  return (
                    <tr key={student._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 font-mono text-emerald-400">{student.rollNumber}</td>
                      <td className="p-4 font-bold text-slate-200">{student.name}</td>
                      
                      {currentCourse?.type === 'THEORY' && (
                        <>
                          <td className="p-4 text-center">
                            <div className="flex gap-1 justify-center">
                              {['mst1', 'mst2', 'mst3'].map(field => (
                                isEditing ? (
                                  <input 
                                    key={field}
                                    type="number"
                                    value={editingMarks[field] || ''}
                                    onChange={(e) => setEditingMarks({...editingMarks, [field]: Number(e.target.value)})}
                                    className="w-12 bg-slate-700 border border-slate-600 rounded p-1 text-center text-xs font-black text-white"
                                  />
                                ) : (
                                  <span key={field} className="w-10 p-1 bg-white/5 rounded text-[10px] font-black text-slate-400">
                                    {student.marks[field] || 0}
                                  </span>
                                )
                              ))}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                             {isEditing ? (
                               <input 
                                 type="number"
                                 value={editingMarks.endSem || ''}
                                 onChange={(e) => setEditingMarks({...editingMarks, endSem: Number(e.target.value)})}
                                 className="w-16 bg-slate-700 border border-slate-600 rounded p-2 text-center text-sm font-black text-white"
                               />
                             ) : (
                               <span className="font-black text-slate-300">{student.marks.endSem || 0}</span>
                             )}
                          </td>
                        </>
                      )}
                      {currentCourse?.type === 'PRACTICAL' && (
                        <>
                          <td className="p-4 text-center">
                             {isEditing ? (
                               <input 
                                 type="number"
                                 value={editingMarks.internalPractical || ''}
                                 onChange={(e) => setEditingMarks({...editingMarks, internalPractical: Number(e.target.value)})}
                                 className="w-16 bg-slate-700 border border-slate-600 rounded p-2 text-center text-sm font-black text-white"
                               />
                             ) : (
                               <span className="font-black text-slate-300">{student.marks.internalPractical || 0}</span>
                             )}
                          </td>
                          <td className="p-4 text-center">
                             {isEditing ? (
                               <input 
                                 type="number"
                                 value={editingMarks.externalPractical || ''}
                                 onChange={(e) => setEditingMarks({...editingMarks, externalPractical: Number(e.target.value)})}
                                 className="w-16 bg-slate-700 border border-slate-600 rounded p-2 text-center text-sm font-black text-white"
                               />
                             ) : (
                               <span className="font-black text-slate-300">{student.marks.externalPractical || 0}</span>
                             )}
                          </td>
                        </>
                      )}
                      {currentCourse?.type === 'VIVA' && (
                        <td className="p-4 text-center">
                             {isEditing ? (
                               <input 
                                 type="number"
                                 value={editingMarks.vivaScore || ''}
                                 onChange={(e) => setEditingMarks({...editingMarks, vivaScore: Number(e.target.value)})}
                                 className="w-16 bg-slate-700 border border-slate-600 rounded p-2 text-center text-sm font-black text-white"
                               />
                             ) : (
                               <span className="font-black text-slate-300">{student.marks.vivaScore || 0}</span>
                             )}
                        </td>
                      )}

                      <td className="p-4 text-center">
                        <span className="text-xl font-bold font-mono text-white">
                          {(() => {
                            const { mst1, mst2, mst3, endSem, vivaScore, internalPractical, externalPractical } = student.marks || {};
                            if (courses.find(c => c._id === courseId)?.type === 'THEORY') {
                              const msts = [Number(mst1 || 0), Number(mst2 || 0), Number(mst3 || 0)];
                              const bestMST = Math.max(...msts);
                              return (bestMST + Number(endSem || 0)).toFixed(1);
                            } else if (courses.find(c => c._id === courseId)?.type === 'PRACTICAL') {
                              return ((Number(internalPractical || 0)) + (Number(externalPractical || 0))).toFixed(1);
                            } else {
                              return Number(vivaScore || 0).toFixed(1);
                            }
                          })()}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${
                          student.status === 'published' ? 'bg-cyan-500/10 text-cyan-400' :
                          student.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                          student.status === 'submitted' ? 'bg-blue-500/10 text-blue-400' :
                          student.status === 'rejected' ? 'bg-rose-500/10 text-rose-400' :
                          'bg-slate-700/50 text-slate-400'
                        }`}>
                          {student.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                          {isEditing ? (
                             <div className="flex gap-2 justify-center">
                               <button 
                                 onClick={() => handleSaveRow(student._id)}
                                 className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-500/20"
                               >
                                 <CheckCircle size={16} />
                               </button>
                               <button 
                                 onClick={handleCancelEdit}
                                 className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-lg shadow-rose-500/20"
                               >
                                 <XCircle size={16} />
                               </button>
                             </div>
                          ) : (
                             <div className="flex gap-2 justify-center">
                               <button 
                                 onClick={() => handleStartEdit(student)}
                                 className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg hover:text-white transition-all border border-white/5"
                                 title="Protocol Adjustments"
                               >
                                 <Sparkles size={16} />
                               </button>
                               <button 
                                 onClick={() => {
                                   if(window.confirm(`Generate provisional transcript for ${student.name}?`)) {
                                      window.open(`/api/results/transcript/${student._id}?courseId=${courseId}`, '_blank');
                                   }
                                 }}
                                 className="p-2 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-lg transition-all border border-indigo-500/10"
                                 title="Download Transcript"
                               >
                                 <FileText size={16} />
                               </button>
                             </div>
                          )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <h3 className="text-2xl font-bold mb-4">Reject Submission</h3>
              <p className="text-slate-400 mb-6 font-medium">Please provide a reason for rejecting these marks. This will be sent to the teacher.</p>
              
              <textarea 
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason for rejection..."
                className="w-full h-32 bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white focus:ring-2 focus:ring-rose-500 outline-none transition-all mb-6"
              />
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleReject}
                  className="flex-1 px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-500/20 transition-all"
                >
                  Confirm Reject
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResultVerification;
