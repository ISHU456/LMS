import React, { useState, useEffect } from 'react';
import { 
    ClipboardCheck, FileText, Send, Clock, Activity, 
    CheckCircle2, AlertCircle, Eye, Download, Users, 
    X, Check, Save, Zap, Brain, Trophy, Trash2, Plus
} from 'lucide-react';
import axios from 'axios';

const AssignmentInterface = ({ assignment, user, isTeacher, onBack, fetchAssignments }) => {
    const [submissions, setSubmissions] = useState([]);
    const [submissionFile, setSubmissionFile] = useState(null);
    const [quizAnswers, setQuizAnswers] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [gradingData, setGradingData] = useState({}); // Keyed by submission ID: { id: { marks, feedback } }
    
    // Student Proctoring & Identity States
    const [isIdentityVerified, setIsIdentityVerified] = useState(false);
    const [studentIdentity, setStudentIdentity] = useState({
        name: user?.name || '',
        email: user?.email || '',
        rollNumber: ''
    });

    const fetchSubmissions = async () => {
        try {
            const res = await axios.get(`http://localhost:5001/api/assignments/submissions/${assignment._id}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setSubmissions(res.data);
        } catch (e) {
            console.error("Failed to fetch", e);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, [assignment._id]);

    const [isReattempting, setIsReattempting] = useState(false);
    const [viewMode, setViewMode] = useState('submissions'); 

    const userSubmission = submissions.find(s => s.student._id === user._id || s.student === user._id);

    if (userSubmission && !isTeacher && !isReattempting) {
        return (
            <div className="h-full bg-white dark:bg-[#0b0f19] flex items-center justify-center p-8 font-sans">
                <div className="max-w-xl w-full text-center space-y-10">
                    <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
                        <div className="w-32 h-32 bg-emerald-600 text-white rounded-[3rem] mx-auto flex items-center justify-center shadow-3xl shadow-emerald-500/40 relative z-10 rotate-12">
                            <CheckCircle2 size={64}/>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <h2 className="text-4xl font-black dark:text-white uppercase tracking-tighter">Mission Success</h2>
                        <p className="text-xs font-bold text-emerald-500 uppercase tracking-[0.2em]">Sector Protocol Complete & Transmitted</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 bg-gray-50/50 dark:bg-gray-900/40 p-8 rounded-[3rem] border border-gray-100 dark:border-gray-800">
                        <div className="p-6 bg-white dark:bg-gray-950 rounded-3xl border border-gray-100 dark:border-gray-800 flex flex-col items-center">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Achieved Score</span>
                            <span className="text-3xl font-black dark:text-white">{userSubmission.marksObtained || 0}</span>
                            <span className="text-[10px] font-bold text-gray-400">Out of {assignment.totalMarks}</span>
                        </div>
                        <div className="p-6 bg-white dark:bg-gray-950 rounded-3xl border border-gray-100 dark:border-gray-800 flex flex-col items-center">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Academic Status</span>
                            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight mt-2">{userSubmission.status}</span>
                            <span className="text-[8px] font-bold text-gray-400 uppercase mt-1">Verified Node</span>
                        </div>
                        <div className="p-6 bg-white dark:bg-gray-950 rounded-3xl border border-gray-100 dark:border-gray-800 flex flex-col items-center">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Retries</span>
                            <span className="text-3xl font-black text-indigo-500">{userSubmission.attemptCount || 1}</span>
                            <span className="text-[8px] font-bold text-gray-400 uppercase mt-1">Attempts Logged</span>
                        </div>
                    </div>

                    <div className="p-10 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/30">
                        <Trophy size={32} className="text-indigo-500 mx-auto mb-4"/>
                        <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest leading-loose">
                            {userSubmission.marksObtained >= (assignment.totalMarks * 0.8) ? "Exceptional Protocol Execution. Data Sync Perfect." : "Protocol Transmitted. Neural Link Stabilized."}
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => setIsReattempting(true)} className="flex-1 py-5 bg-primary-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-primary-700 transition-all shadow-xl active:scale-95">Reattempt Protocol</button>
                        <button onClick={onBack} className="flex-[2] py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95">Return to Sector Map</button>
                    </div>
                </div>
            </div>
        );
    }

    const handleSubmitWork = async () => {
        if (assignment.type === 'quiz' && !isIdentityVerified) {
            return alert("Identity Verification Required for Transmission.");
        }
        
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('assignmentId', assignment._id);
        formData.append('studentId', user._id);
        
        // Append Identity Data
        formData.append('studentNotes', JSON.stringify({
            verifiedIdentity: studentIdentity,
            proctoringFlag: 'Verified Sector Node'
        }));

        if (assignment.type === 'quiz') {
            const answersArray = assignment.quizQuestions.map((_, i) => quizAnswers[i]);
            formData.append('quizAnswers', JSON.stringify(answersArray));
        }
        if (submissionFile) formData.append('files', submissionFile);

        try {
            await axios.post('http://localhost:5001/api/assignments/submit', formData, {
                headers: { 
                    Authorization: `Bearer ${user.token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            alert("Transmission Success: Sector Protocol Uploaded.");
            if (fetchAssignments) fetchAssignments();
            if (onBack) onBack();
        } catch (err) {
            alert(err.response?.data?.message || "Transmission Failure.");
        }
        setIsSubmitting(false);
    };

    const handleGrade = async (subId) => {
        const sub = submissions.find(s => s._id === subId);
        const marks = gradingData[subId]?.marks !== undefined ? gradingData[subId].marks : (sub.marksObtained ?? sub.automatedScore ?? 0);
        const feedback = gradingData[subId]?.feedback !== undefined ? gradingData[subId].feedback : (sub.facultyFeedback ?? "");

        try {
            await axios.put(`http://localhost:5001/api/assignments/grade/${subId}`, {
                marks,
                feedback,
                teacherId: user._id
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            fetchSubmissions();
            alert("Protocol Node Graded Successfully.");
        } catch (e) {
            console.error(e);
            alert("Grading transmission failed.");
        }
    };

    const handleDeleteSubmission = async (subId) => {
        if (!window.confirm("WARNING: Irreversible Action. Eradicate this neural submission?")) return;
        try {
            await axios.delete(`http://localhost:5001/api/assignments/submissions/${subId}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            fetchSubmissions();
            alert("Response Eradicated.");
        } catch (e) {
            alert("Eradication Failed.");
        }
    };


    if (isTeacher) {
        return (
            <div className="flex flex-col h-full bg-[#fcfdfe] dark:bg-[#0b0f19] font-sans overflow-hidden">
                <header className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-3xl sticky top-0 z-20">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-2xl flex items-center justify-center shadow-inner">
                         <ClipboardCheck size={24}/>
                      </div>
                      <div>
                         <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter">{assignment.title}</h3>
                         <div className="flex items-center gap-3">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{submissions.length} Verified Solutions</p>
                            <span className="text-[10px] text-gray-300">|</span>
                            <div className="flex gap-2 p-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                <button 
                                    onClick={() => setViewMode('submissions')}
                                    className={`px-3 py-1 text-[8px] font-black uppercase rounded-md transition-all ${viewMode === 'submissions' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm' : 'text-gray-400'}`}
                                >
                                    Submissions
                                </button>
                                <button 
                                    onClick={() => setViewMode('preview')}
                                    className={`px-3 py-1 text-[8px] font-black uppercase rounded-md transition-all ${viewMode === 'preview' ? 'bg-white dark:bg-gray-700 text-primary-600 shadow-sm' : 'text-gray-400'}`}
                                >
                                    Master Key
                                </button>
                            </div>
                         </div>
                      </div>
                   </div>
                   <button onClick={onBack} className="p-3 text-gray-400 hover:text-rose-500 bg-gray-50 dark:bg-gray-800 rounded-2xl scale-90 hover:scale-100 transition-all cursor-pointer"><X/></button>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                   {viewMode === 'submissions' ? (
                       <div className="grid grid-cols-1 gap-4">
                           {submissions.map(sub => (
                              <div key={sub._id} className="p-6 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-3xl hover:border-primary-500/50 transition-all group/sub">
                                 <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                    <div className="flex items-center gap-5">
                                       <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-black shadow-lg">
                                           {sub.student.name.charAt(0)}
                                       </div>
                                       <div>
                                          <h4 className="text-base font-black dark:text-white uppercase tracking-tight">{sub.student.name}</h4>
                                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 mb-2">{sub.student.email}</p>
                                          <div className="flex gap-2 items-center">
                                            {sub.status === 'graded' && (
                                              <div className="px-3 py-1 bg-emerald-600 text-white text-[8px] font-black uppercase rounded-lg shadow-lg shadow-emerald-500/10">Graded</div>
                                            )}
                                            {sub.marksObtained !== undefined && (
                                              <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase rounded-lg border border-emerald-100 dark:border-emerald-800 inline-flex items-center gap-2">
                                                <Trophy size={10}/> Score: {sub.marksObtained}/{assignment.totalMarks}
                                              </div>
                                            )}
                                          </div>
                                       </div>
                                    </div>

                                    <div className="flex items-center gap-4 justify-end flex-wrap md:flex-nowrap">
                                       <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 p-2 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-inner">
                                          <div className="flex flex-col items-center px-4 border-r border-gray-100 dark:border-gray-800">
                                             <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-1">Set Grade</span>
                                             <input 
                                               type="number" 
                                               defaultValue={sub.marksObtained || sub.automatedScore || 0}
                                               onChange={(e) => setGradingData({
                                                  ...gradingData, 
                                                  [sub._id]: { ...gradingData[sub._id], marks: e.target.value }
                                               })}
                                               className="w-12 bg-transparent text-center text-sm font-black dark:text-white outline-none"
                                             />
                                          </div>
                                          <div className="px-4">
                                             <input 
                                               placeholder="Faculty Feedback..."
                                               defaultValue={sub.facultyFeedback}
                                               onChange={(e) => setGradingData({
                                                  ...gradingData, 
                                                  [sub._id]: { ...gradingData[sub._id], feedback: e.target.value }
                                               })}
                                               className="bg-transparent text-[10px] font-bold dark:text-gray-300 outline-none w-32"
                                             />
                                          </div>
                                          <button 
                                            onClick={() => handleGrade(sub._id)}
                                            className="p-3 bg-primary-600 text-white rounded-xl shadow-lg hover:bg-primary-700 transition-all cursor-pointer"
                                          >
                                             <Save size={18}/>
                                          </button>
                                       </div>
                                       
                                       <button 
                                         onClick={() => handleDeleteSubmission(sub._id)}
                                         className="p-4 text-rose-500 bg-rose-50 dark:bg-rose-900/20 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm cursor-pointer"
                                         title="Eradicate Protocol"
                                       >
                                          <Trash2 size={18}/>
                                       </button>

                                       {sub.files?.length > 0 && (
                                          <button 
                                            onClick={() => window.open(sub.files[0].fileUrl, '_blank')}
                                            className="p-4 text-primary-500 bg-primary-50 dark:bg-primary-900/20 rounded-2xl hover:bg-primary-500 hover:text-white transition-all shadow-sm cursor-pointer"
                                          >
                                             <Eye size={18}/>
                                          </button>
                                       )}
                                    </div>
                                 </div>
                              </div>
                           ))}
                           {submissions.length === 0 && (
                              <div className="py-24 text-center flex flex-col items-center gap-4 opacity-40">
                                 <Activity size={56} className="text-gray-400 animate-pulse" />
                                 <p className="text-xs font-black uppercase tracking-widest">No Sector Activity Recorded</p>
                              </div>
                           )}
                       </div>
                   ) : (
                       <div className="max-w-3xl mx-auto space-y-12 py-10">
                            {assignment.quizQuestions.map((q, idx) => (
                                <div key={idx} className="p-10 bg-white dark:bg-[#0b0f19] rounded-[3.5rem] border border-gray-100 dark:border-white/5 shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4">
                                        <Zap size={24} className="text-amber-500/20" />
                                    </div>
                                    <h4 className="text-lg font-black dark:text-white uppercase mb-10 leading-relaxed px-4">
                                        <span className="text-primary-500 mr-4">Protocol {idx+1}:</span> {q.question}
                                    </h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        {q.options.map((opt, oIdx) => (
                                            <div 
                                                key={oIdx}
                                                className={`p-6 border rounded-3xl flex items-center justify-between transition-all ${q.correctAnswer === oIdx ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-500 ring-2 ring-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'bg-gray-50/50 dark:bg-gray-900/40 border-gray-100 dark:border-white/5 opacity-60'}`}
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all ${q.correctAnswer === oIdx ? 'bg-amber-500 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                                                        {q.correctAnswer === oIdx ? <CheckCircle2 size={24}/> : String.fromCharCode(65 + oIdx)}
                                                    </div>
                                                    <span className={`text-[13px] font-bold uppercase transition-colors ${q.correctAnswer === oIdx ? 'text-amber-700 dark:text-amber-400' : 'text-gray-500'}`}>
                                                        {opt}
                                                    </span>
                                                </div>
                                                {q.correctAnswer === oIdx && (
                                                    <div className="px-4 py-2 bg-amber-500 text-white text-[8px] font-black uppercase rounded-lg shadow-lg tracking-widest">Master Answer</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                       </div>
                   )}
                </div>
            </div>
        );
    }

    if (assignment.type === 'quiz' && !isIdentityVerified) {
        return (
            <div className="h-full bg-white dark:bg-[#0b0f19] flex items-center justify-center p-8 font-sans">
                <div className="max-w-xl w-full space-y-10 text-center relative">
                    <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl" />
                    <div className="w-24 h-24 bg-primary-600 text-white rounded-[2.5rem] mx-auto flex items-center justify-center shadow-3xl shadow-primary-500/30 animate-pulse mb-12">
                        <Brain size={40}/>
                    </div>
                    
                    <div className="space-y-4">
                        <h2 className="text-4xl font-black dark:text-white uppercase tracking-tighter">Identity Protocol Check</h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Mandatory Verification for Sector Access</p>
                    </div>

                    <div className="space-y-6 bg-gray-50/50 dark:bg-gray-900/40 p-10 rounded-[3rem] border border-gray-100 dark:border-gray-800 shadow-xl">
                        <div className="space-y-2 text-left">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-2">Learner Name</label>
                            <input 
                                value={studentIdentity.name}
                                onChange={e => setStudentIdentity({...studentIdentity, name: e.target.value})}
                                className="w-full bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl px-5 py-4 text-sm font-bold uppercase outline-none focus:ring-2 ring-primary-500/50"
                                placeholder="Neural Subject 01"
                            />
                        </div>
                        <div className="space-y-2 text-left">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-2">Verification Email</label>
                            <input 
                                value={studentIdentity.email}
                                onChange={e => setStudentIdentity({...studentIdentity, email: e.target.value})}
                                className="w-full bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl px-5 py-4 text-sm font-bold uppercase outline-none focus:ring-2 ring-primary-500/50"
                                placeholder="protocol@lms.edu"
                            />
                        </div>
                        <div className="space-y-2 text-left">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-2">Sector ID (Roll Number)</label>
                            <input 
                                value={studentIdentity.rollNumber}
                                onChange={e => setStudentIdentity({...studentIdentity, rollNumber: e.target.value.toUpperCase()})}
                                className="w-full bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl px-5 py-4 text-sm font-bold uppercase outline-none focus:ring-2 ring-primary-500/50"
                                placeholder="CS-2024-001"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={onBack} className="px-8 py-5 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-3xl font-black text-[11px] uppercase tracking-widest hover:bg-gray-200 transition-all flex-1">Abort Access</button>
                        <button 
                            disabled={!studentIdentity.name || !studentIdentity.email || !studentIdentity.rollNumber}
                            onClick={() => setIsIdentityVerified(true)}
                            className="px-10 py-5 bg-primary-600 text-white rounded-3xl font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-primary-500/40 hover:scale-[1.02] active:scale-95 transition-all flex-[2] disabled:opacity-50"
                        >
                            Confirm Identity & Start Protocol
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-[#030712] font-sans">
            <header className="p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-start bg-white/80 dark:bg-gray-900/80 backdrop-blur-3xl sticky top-0 z-10 font-sans">
               <div className="flex-1 pr-12">
                  <div className="flex items-center gap-3 mb-3">
                      <div className="px-3 py-1 bg-primary-500 text-white text-[8px] font-black uppercase rounded-lg shadow-lg shadow-primary-500/20">Active Session</div>
                      <div className="px-3 py-1 bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[8px] font-black uppercase rounded-lg">Semi-Proctored Mode</div>
                  </div>
                  <h2 className="text-3xl font-black dark:text-white uppercase tracking-tighter mb-2">{assignment.title}</h2>
                  <div className="flex gap-4 mt-4">
                     <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        <Users size={12}/> Verified Subject: <span className="text-primary-500 ml-1">{studentIdentity.rollNumber}</span>
                     </div>
                     <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        <Clock size={12}/> End Window: <span className="text-rose-500 ml-1">{new Date(assignment.dueDate).toLocaleTimeString()}</span>
                     </div>
                  </div>
               </div>
               <button onClick={() => {
                   if (window.confirm("Abort Protocol? All unsaved node data will be purged.")) onBack();
               }} className="p-4 text-gray-400 hover:text-rose-500 bg-white dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-[1.5rem] transition-all cursor-pointer shadow-lg shadow-black/5 hover:scale-110 active:scale-90"><X size={24}/></button>
            </header>

            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                <div className="max-w-3xl mx-auto space-y-12">
                    {assignment.type === 'quiz' ? (
                        <>
                            {assignment.quizQuestions.map((q, idx) => (
                                <div key={idx} className="p-10 bg-white dark:bg-[#0b0f19] rounded-[3.5rem] border border-gray-100 dark:border-white/5 shadow-2xl hover:border-primary-500/30 transition-all relative group/q">
                                    <div className="absolute top-[-10px] left-10 px-4 py-1.5 bg-primary-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">Protocol Node {idx + 1}</div>
                                    <h4 className="text-lg font-black dark:text-white uppercase mb-10 leading-relaxed pt-4">
                                        {q.question}
                                    </h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        {q.options.map((opt, oIdx) => (
                                            <div 
                                                key={oIdx}
                                                onClick={() => setQuizAnswers({...quizAnswers, [idx]: oIdx})}
                                                className={`p-6 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-3xl flex items-center justify-between cursor-pointer transition-all hover:border-primary-500/50 hover:bg-white dark:hover:bg-gray-800 ${quizAnswers[idx] === oIdx ? 'ring-2 ring-primary-500 border-primary-500 bg-white dark:bg-gray-800 shadow-xl' : ''}`}
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${quizAnswers[idx] === oIdx ? 'bg-primary-600 border-primary-600 text-white shadow-lg rotate-[360deg] duration-500' : 'border-gray-200 dark:border-gray-700'}`}>
                                                        {quizAnswers[idx] === oIdx ? <Check size={16}/> : <span className="text-[10px] font-black text-gray-400 uppercase">{String.fromCharCode(65 + oIdx)}</span>}
                                                    </div>
                                                    <span className={`text-[13px] font-bold uppercase tracking-tight transition-colors ${quizAnswers[idx] === oIdx ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                                        {opt}
                                                    </span>
                                                </div>
                                                {quizAnswers[idx] === oIdx && <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse"></div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : (
                        <div className="max-w-xl mx-auto py-20 text-center space-y-10">
                            <div className="w-40 h-40 bg-white dark:bg-gray-900 rounded-[3rem] mx-auto flex items-center justify-center text-primary-500 border border-gray-100 dark:border-white/5 shadow-3xl relative pointer-events-none">
                               <div className="absolute inset-4 bg-primary-500/5 rounded-[2rem] animate-pulse"></div>
                               <FileText size={56} className="relative z-10"/>
                            </div>
                            <div>
                               <h3 className="text-3xl font-black dark:text-white uppercase tracking-tighter">PDF Solution Matrix</h3>
                               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4 leading-loose">Please upload your verified response node. <br/> Maximum payload allocation: 10MB.</p>
                            </div>
                            <div className="relative group/upload">
                                <input 
                                    type="file" 
                                    accept="application/pdf"
                                    onChange={e => setSubmissionFile(e.target.files[0])}
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                />
                                <div className="py-20 border-[4px] border-dashed border-gray-200 dark:border-gray-800 rounded-[4rem] flex flex-col items-center justify-center gap-5 transition-all group-hover/upload:border-primary-500 group-hover/upload:bg-white dark:group-hover/upload:bg-gray-900 active:scale-[0.98] shadow-inner bg-gray-100/50 dark:bg-gray-950/50">
                                    <div className="w-14 h-14 bg-gray-200 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-400 group-hover/upload:bg-primary-500 group-hover/upload:text-white transition-all shadow-lg">
                                        <Plus size={32} />
                                    </div>
                                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest">{submissionFile ? submissionFile.name : 'Select PDF Protocol'}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="max-w-3xl mx-auto pb-24 mt-20 flex gap-6">
                    <button 
                         onClick={() => { if (window.confirm("Abort Protocol?")) onBack(); }}
                         className="px-8 py-6 bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-white/5 rounded-[2.5rem] font-black text-xs uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95"
                    >
                         <X size={18}/> Abort
                    </button>
                    <button 
                        onClick={handleSubmitWork}
                        disabled={isSubmitting || (assignment.type === 'pdf' && !submissionFile) || (assignment.type === 'quiz' && Object.keys(quizAnswers).length < assignment.quizQuestions.length)}
                        className="flex-1 py-6 bg-primary-600 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.4em] hover:bg-primary-700 shadow-3xl shadow-primary-500/40 transition-all flex items-center justify-center gap-4 disabled:opacity-50 disabled:grayscale cursor-pointer group"
                    >
                        {isSubmitting ? <Zap className="animate-spin" size={24}/> : <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"/>}
                        Transmit Submission
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignmentInterface;
