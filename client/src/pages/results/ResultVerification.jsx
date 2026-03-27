import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getStudentsForEntry, approveMarks, publishMarks, reset } from '../../features/results/resultSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Globe, ChevronRight, LayoutGrid, FileText } from 'lucide-react';
import axios from 'axios';

const ResultVerification = () => {
  const dispatch = useDispatch();
  const { results, isLoading, isSuccess } = useSelector(state => state.results);
  const { user } = useSelector(state => state.auth);

  const [courseId, setCourseId] = useState('');
  const [semester, setSemester] = useState('');
  const [academicYear, setAcademicYear] = useState('2023-24');
  const [courses, setCourses] = useState([]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await axios.get('/api/courses', {
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

  const handleApprove = () => {
    if (window.confirm('Approve all submitted results for this course?')) {
      dispatch(approveMarks({ courseId, semester, academicYear }));
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return alert('Please provide a reason for rejection.');
    try {
      await axios.post('/api/results/reject', { courseId, semester, academicYear, reason: rejectionReason }, {
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

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
              Result Verification
            </h1>
            <p className="text-slate-400 mt-2">Verify, approve and publish student results.</p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleApprove}
              disabled={results.every(r => r.status !== 'submitted')}
              className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-all ${
                results.every(r => r.status !== 'submitted')
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
              }`}
            >
              <CheckCircle size={18} />
              Approve All
            </button>
            <button 
              onClick={() => setShowRejectModal(true)}
              disabled={results.every(r => r.status !== 'submitted')}
              className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-all ${
                results.every(r => r.status !== 'submitted')
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/20'
              }`}
            >
              <XCircle size={18} />
              Reject All
            </button>
            <button 
              onClick={handlePublish}
              disabled={results.every(r => r.status !== 'approved')}
              className={`px-6 py-2 rounded-lg flex items-center gap-2 transition-all ${
                results.every(r => r.status !== 'approved')
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
              }`}
            >
              <Globe size={18} />
              Publish
            </button>
            <button 
              onClick={async () => {
                if (window.confirm('Generate final semester results for all students? This will calculate SGPA and final percentages.')) {
                   try {
                     const { data } = await axios.post('/api/results/generate-final', { semester, academicYear, department: user.department }, {
                       headers: { Authorization: `Bearer ${user.token}` }
                     });
                     alert(data.message);
                   } catch (err) {
                     alert(err.response?.data?.message || 'Failed to generate results.');
                   }
                }
              }}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all font-bold"
            >
              <LayoutGrid size={18} />
              Generate Final
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Subject / Course</label>
            <select 
              value={courseId} 
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            >
              <option value="">Select Course</option>
              {courses.map(c => (
                <option key={c._id} value={c._id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Semester</label>
            <select 
              value={semester} 
              onChange={(e) => setSemester(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">Select Semester</option>
              {[1,2,3,4,5,6,7,8].map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Academic Year</label>
            <select 
              value={academicYear} 
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="2023-24">2023-24</option>
              <option value="2024-25">2024-25</option>
            </select>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {(Array.isArray(results) ? results : []).map((student) => {
                  const total = (student.marks.mst1 || 0) + (student.marks.mst2 || 0) + (student.marks.mst3 || 0) + (student.marks.endSem || 0);
                  return (
                    <tr key={student._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 font-mono text-emerald-400">{student.rollNumber}</td>
                      <td className="p-4">{student.name}</td>
                      
                      {courses.find(c => c._id === courseId)?.type === 'THEORY' && (
                        <>
                          <td className="p-4 text-center">{(student.marks.mst1 + student.marks.mst2 + student.marks.mst3)/3}</td>
                          <td className="p-4 text-center">{student.marks.endSem}</td>
                        </>
                      )}
                      {courses.find(c => c._id === courseId)?.type === 'PRACTICAL' && (
                        <>
                          <td className="p-4 text-center">{student.marks.internalPractical}</td>
                          <td className="p-4 text-center">{student.marks.externalPractical}</td>
                        </>
                      )}
                      {courses.find(c => c._id === courseId)?.type === 'VIVA' && (
                        <td className="p-4 text-center">{student.marks.vivaScore}</td>
                      )}

                      <td className="p-4 text-center">
                        <span className="text-xl font-bold font-mono text-white">
                          {(() => {
                            const { mst1, mst2, mst3, endSem, vivaScore, internalPractical, externalPractical } = student.marks || {};
                            if (courses.find(c => c._id === courseId)?.type === 'THEORY') {
                              const msts = [Number(mst1 || 0), Number(mst2 || 0), Number(mst3 || 0)].sort((a, b) => b - a);
                              return (msts[0] + msts[1] + Number(endSem || 0)).toFixed(1);
                            } else if (courses.find(c => c._id === courseId)?.type === 'PRACTICAL') {
                              return ((Number(internalPractical || 0)) + (Number(externalPractical || 0))).toFixed(1);
                            } else {
                              return Number(vivaScore || 0).toFixed(1);
                            }
                          })()}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          student.status === 'published' ? 'bg-cyan-500/10 text-cyan-400' :
                          student.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                          student.status === 'submitted' ? 'bg-blue-500/10 text-blue-400' :
                          student.status === 'rejected' ? 'bg-rose-500/10 text-rose-400' :
                          'bg-slate-700 text-slate-400'
                        }`}>
                          {student.status.toUpperCase()}
                        </span>
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
