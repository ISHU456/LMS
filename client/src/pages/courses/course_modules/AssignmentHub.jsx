import React, { useState, useEffect } from 'react';
import { 
    ClipboardCheck, FileText, Plus, Send, Clock, Activity, 
    CheckCircle2, AlertCircle, Eye, Download, Users, Edit3, 
    Trash2, X, Check, Save, Sparkles, Brain, Trophy, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const AssignmentHub = ({ courseId, isTeacher, user, selectedAssignment, setSelectedAssignment, assignments, fetchAssignments, studentSubmissions = [] }) => {
    const [activeTab, setActiveTab] = useState('list'); // 'list' or 'create'
    const [filter, setFilter] = useState('all');
    
    // Creation State
    const [newAssignment, setNewAssignment] = useState({
        title: '',
        description: '',
        type: 'pdf',
        dueDate: '',
        totalMarks: 10,
        quizQuestions: [
            { question: '', options: ['', '', '', ''], correctAnswer: 0 }
        ]
    });
    const [pdfFile, setPdfFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

    // Submission State (For Students)
    const [submissionFile, setSubmissionFile] = useState(null);
    const [quizAnswers, setQuizAnswers] = useState({});

    // Grading State
    const [gradingData, setGradingData] = useState({ marks: 0, feedback: '' });

    const handleAiGenerate = async () => {
        if (!newAssignment.title) return alert("Please specify a Protocol Title first for Neural Mapping.");
        setIsGeneratingQuiz(true);
        try {
            const res = await axios.post('http://localhost:5001/api/chatbot/generate-quiz', {
                topic: newAssignment.title,
                count: 5
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            setNewAssignment({...newAssignment, quizQuestions: res.data});
        } catch (err) {
            console.error("Neural Mapping FAILURE:", err);
            alert("Neural Link Interrupted: Generation failed.");
        }
        setIsGeneratingQuiz(false);
    };

    const handleDeleteAssignment = async (e, asgnId) => {
        e.stopPropagation();
        if (!window.confirm('Permanently eradicate this assignment and all its submissions?')) return;
        try {
            await axios.delete(`http://localhost:5001/api/assignments/${asgnId}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            if (selectedAssignment?._id === asgnId) setSelectedAssignment(null);
            fetchAssignments();
        } catch (err) {
            alert(err.response?.data?.message || 'Eradication failed.');
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        
        // Final validation before deployment
        if (!newAssignment.dueDate) return alert("Temporal Node Failure: Please set a specific Protocol Deadline.");
        
        setIsSubmitting(true);
        const formData = new FormData();
        Object.keys(newAssignment).forEach(key => {
            if (key === 'quizQuestions') {
                if (newAssignment.type === 'quiz') {
                    formData.append(key, JSON.stringify(newAssignment[key]));
                }
            } else {
                formData.append(key, newAssignment[key]);
            }
        });
        formData.append('courseId', courseId);
        formData.append('facultyId', user._id);
        if (pdfFile) formData.append('file', pdfFile);

        try {
            await axios.post('http://localhost:5001/api/assignments/create', formData, {
                headers: { 
                    Authorization: `Bearer ${user.token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setNewAssignment({ 
                title: '', 
                description: '', 
                type: 'pdf', 
                dueDate: '', 
                totalMarks: 10, 
                quizQuestions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0 }] 
            });
            setPdfFile(null);
            fetchAssignments();
            setActiveTab('list');
        } catch (err) {
            console.error("Assignment Sector Deployment Failure:", err.response?.data || err);
            alert(err.response?.data?.message || "Creation failed: Verification node rejected.");
        }
        setIsSubmitting(false);
    };

    const renderList = () => (
        <div className="space-y-4 pr-2 overflow-y-auto max-h-[600px] custom-scrollbar">
            {assignments.length === 0 && (
                <div className="py-20 text-center flex flex-col items-center gap-4">
                    <ClipboardCheck size={48} className="text-gray-200" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No Assignments Deployed</p>
                </div>
            )}
            {assignments.map(asgn => {
                const mySubmission = studentSubmissions.find(s => (s.assignment?._id === asgn._id) || (s.assignment === asgn._id));
                const isCompleted = !!mySubmission;

                return (
                 <div key={asgn._id}
                      onClick={() => setSelectedAssignment(asgn)}
                      className={`relative p-6 border-2 transition-all group cursor-pointer rounded-3xl ${selectedAssignment?._id === asgn._id ? 'border-primary-500 bg-primary-50/10' : 'bg-white/40 dark:bg-gray-800/20 border-transparent dark:border-gray-800 hover:border-primary-500/30'}`}
                 >
                     {isTeacher && (
                         <button
                             onClick={(e) => handleDeleteAssignment(e, asgn._id)}
                             className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 hover:bg-rose-500 hover:text-white shadow-sm z-10"
                             title="Delete Assignment"
                         >
                             <Trash2 size={14}/>
                         </button>
                     )}
                     <div className="flex justify-between items-start gap-4">
                         <div className="flex gap-4 min-w-0">
                             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isCompleted ? 'bg-emerald-100 dark:bg-emerald-900/30' : asgn.type === 'quiz' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-500' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-500'}`}>
                                 {isCompleted ? <CheckCircle2 size={24} className="text-emerald-500"/> : (asgn.type === 'quiz' ? <Brain size={24}/> : <FileText size={24}/>)}
                             </div>
                             <div className="min-w-0">
                                 <div className="flex items-center gap-2 mb-1">
                                     <h4 className="text-[13px] font-black dark:text-white uppercase truncate">{asgn.title}</h4>
                                     <span className="text-[7px] font-black px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 uppercase tracking-widest">{asgn.type.toUpperCase()}</span>
                                     {isCompleted && (
                                         <span className="text-[7px] font-black px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                                             <Check size={8}/> SUBMITTED
                                         </span>
                                     )}
                                 </div>
                                 <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 line-clamp-1">{asgn.description}</p>
                                 <div className="flex flex-wrap items-center gap-4">
                                     <span className="text-[9px] font-black text-primary-500 flex items-center gap-1"><Clock size={12}/> {new Date(asgn.dueDate).toLocaleDateString()}</span>
                                     {isCompleted ? (
                                         <span className="text-[9px] font-black text-emerald-500 flex items-center gap-1">
                                             <Trophy size={12}/> {mySubmission.marksObtained || 0}/{asgn.totalMarks} ACHIEVED
                                         </span>
                                     ) : (
                                         <span className="text-[9px] font-black text-indigo-500 flex items-center gap-1"><Trophy size={12}/> {asgn.totalMarks} MARKS</span>
                                     )}
                                 </div>
                             </div>
                         </div>
                     </div>
                 </div>
                );
            })}
        </div>
    );

    const renderCreate = () => (
        <form onSubmit={handleCreate} className="space-y-6 bg-white/50 dark:bg-gray-900/40 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 text-primary-500">Protocol Title</label>
                    <input 
                        required
                        value={newAssignment.title}
                        onChange={e => setNewAssignment({...newAssignment, title: e.target.value})}
                        className="w-full bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl px-5 py-3 text-xs font-bold uppercase outline-none focus:ring-2 ring-primary-500/50" 
                        placeholder="Neural Network Fundamentals"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Sector Type</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={()=>setNewAssignment({...newAssignment, type: 'pdf'})} className={`py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${newAssignment.type === 'pdf' ? 'bg-rose-500 text-white border-rose-500 shadow-xl shadow-rose-500/20' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'}`}>PDF ASSIGN</button>
                        <button type="button" onClick={()=>setNewAssignment({...newAssignment, type: 'quiz'})} className={`py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${newAssignment.type === 'quiz' ? 'bg-amber-500 text-white border-amber-500 shadow-xl shadow-amber-500/20' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'}`}>QUIZ PROTOCOL</button>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Detailed Matrix Description</label>
                <textarea 
                    required
                    value={newAssignment.description}
                    onChange={e => setNewAssignment({...newAssignment, description: e.target.value})}
                    rows="3"
                    className="w-full bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl px-5 py-3 text-xs font-bold outline-none focus:ring-2 ring-primary-500/50 custom-scrollbar" 
                    placeholder="Provide operational guidelines for this sector..."
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Temporal Deadline</label>
                    <input 
                        required
                        type="datetime-local"
                        value={newAssignment.dueDate}
                        onChange={e => setNewAssignment({...newAssignment, dueDate: e.target.value})}
                        className="w-full bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl px-5 py-3 text-[10px] font-bold uppercase outline-none focus:ring-2 ring-primary-500/50" 
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Reward Cap (Marks)</label>
                    <input 
                        required
                        type="number"
                        value={newAssignment.totalMarks}
                        onChange={e => setNewAssignment({...newAssignment, totalMarks: e.target.value})}
                        className="w-full bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl px-5 py-3 text-xs font-bold uppercase outline-none focus:ring-2 ring-primary-500/50" 
                    />
                </div>
            </div>

            {newAssignment.type === 'pdf' ? (
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Secure PDF Asset Upload</label>
                    <div className="relative group/upload">
                        <input 
                            type="file" 
                            accept="application/pdf"
                            onChange={e => setPdfFile(e.target.files[0])}
                            className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className="py-8 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl flex flex-col items-center justify-center gap-3 transition-colors group-hover/upload:border-primary-500/50 bg-gray-50/50 dark:bg-gray-900/30">
                            <Download className="text-gray-300 group-hover/upload:text-primary-500 transition-colors" size={32}/>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{pdfFile ? pdfFile.name : 'Inject PDF Molecule'}</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            Neural Quiz Mapping (Structured)
                            <Sparkles size={10} className="text-amber-500 animate-pulse" />
                        </label>
                        <div className="flex items-center gap-2">
                            <button 
                                type="button"
                                onClick={handleAiGenerate}
                                disabled={isGeneratingQuiz}
                                className={`text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl border flex items-center gap-2 transition-all ${isGeneratingQuiz ? 'bg-amber-50 border-amber-500 text-amber-600 animate-pulse' : 'bg-gray-900 text-white border-gray-900 hover:bg-black'}`}
                            >
                                {isGeneratingQuiz ? 'Neural Mapping...' : (
                                    <>
                                        <Brain size={12}/> GENERATE AI QUIZ
                                    </>
                                )}
                            </button>
                            <button 
                                type="button"
                                onClick={() => setNewAssignment({
                                    ...newAssignment, 
                                    quizQuestions: [...newAssignment.quizQuestions, { question: '', options: ['', '', '', ''], correctAnswer: 0 }]
                                })}
                                className="text-[9px] font-black text-primary-500 uppercase tracking-widest bg-primary-50 dark:bg-primary-900/20 px-3 py-1.5 rounded-xl border border-primary-100 dark:border-primary-900/30 hover:bg-primary-600 hover:text-white transition-all h-[36px]"
                            >
                                <Plus size={10} className="inline mr-1"/> ADD PROTOCOL NODE
                            </button>
                        </div>
                    </div>
                    
                    <div className="space-y-8">
                        {newAssignment.quizQuestions.map((q, idx) => (
                            <div key={idx} className="p-6 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-[2rem] space-y-4 shadow-inner group">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-primary-500/50 uppercase">Question #{idx + 1}</span>
                                    {newAssignment.quizQuestions.length > 1 && (
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                const updated = newAssignment.quizQuestions.filter((_, i) => i !== idx);
                                                setNewAssignment({...newAssignment, quizQuestions: updated});
                                            }}
                                            className="p-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={14}/>
                                        </button>
                                    )}
                                </div>
                                <input 
                                    required
                                    value={q.question}
                                    onChange={e => {
                                        const updated = [...newAssignment.quizQuestions];
                                        updated[idx].question = e.target.value;
                                        setNewAssignment({...newAssignment, quizQuestions: updated});
                                    }}
                                    className="w-full bg-gray-50/30 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-2 text-xs font-bold dark:text-white outline-none focus:border-primary-500"
                                    placeholder="Enter Protocol Question..."
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {q.options.map((opt, oIdx) => (
                                        <div key={oIdx} className="flex items-center gap-3 bg-gray-50/50 dark:bg-gray-950/30 p-2 rounded-2xl border border-gray-100 dark:border-gray-900 group/opt hover:border-primary-500/30 transition-all">
                                            <div 
                                                onClick={() => {
                                                    const updated = [...newAssignment.quizQuestions];
                                                    updated[idx].correctAnswer = oIdx;
                                                    setNewAssignment({...newAssignment, quizQuestions: updated});
                                                }}
                                                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer shrink-0 transition-all ${q.correctAnswer === oIdx ? 'bg-primary-600 border-primary-600 text-white shadow-lg' : 'border-gray-200 dark:border-gray-800'}`}
                                            >
                                                {q.correctAnswer === oIdx ? <Check size={16}/> : <span className="text-[10px] font-black text-gray-400">{String.fromCharCode(65 + oIdx)}</span>}
                                            </div>
                                            <input 
                                                required
                                                value={opt}
                                                onChange={e => {
                                                    const updated = [...newAssignment.quizQuestions];
                                                    updated[idx].options[oIdx] = e.target.value;
                                                    setNewAssignment({...newAssignment, quizQuestions: updated});
                                                }}
                                                className={`flex-1 bg-transparent px-2 py-1 text-[10px] font-bold outline-none dark:text-gray-200 ${q.correctAnswer === oIdx ? 'text-primary-600' : ''}`}
                                                placeholder={`Inject Option ${String.fromCharCode(65 + oIdx)}...`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full py-4 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:bg-primary-700 shadow-xl shadow-primary-500/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
                {isSubmitting ? <Zap className="animate-spin" size={18}/> : <Save size={18}/>}
                INITIATE SECTOR DEPLOYMENT
            </button>
        </form>
    );

    const handleGradeSubmission = async (subId) => {
        try {
            await axios.put(`http://localhost:5001/api/assignments/grade/${subId}`, {
                marks: gradingData.marks,
                feedback: gradingData.feedback,
                teacherId: user._id
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            fetchAssignments();
            alert("Grade deployed to neural registry.");
        } catch (err) {
            alert("Grading protocol failed.");
        }
    };

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!submissionFile && selectedAssignment.type === 'pdf') return alert("Please specify a submission molecule.");
        
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('assignmentId', selectedAssignment._id);
        formData.append('studentId', user._id);
        if (submissionFile) formData.append('file', submissionFile);
        if (selectedAssignment.type === 'quiz') formData.append('quizAnswers', JSON.stringify(quizAnswers));

        try {
            await axios.post('http://localhost:5001/api/assignments/submit', formData, {
                headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'multipart/form-data' }
            });
            alert("Neural Submission Successful.");
            setSubmissionFile(null);
            fetchAssignments();
        } catch (err) {
            alert(err.response?.data?.message || "Submission node rejected.");
        }
        setIsSubmitting(false);
    };

    const renderDetail = () => {
        const asgn = selectedAssignment;
        const mySub = studentSubmissions.find(s => (s.assignment?._id === asgn._id) || (s.assignment === asgn._id));
        const isGraded = mySub?.status === 'graded';

        return (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-full flex flex-col gap-6 bg-white/40 dark:bg-gray-900/40 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSelectedAssignment(null)} className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-2xl hover:bg-primary-500 hover:text-white transition-all"><X size={18}/></button>
                        <div>
                            <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter">{asgn.title}</h3>
                            <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest">{asgn.type} Sector Profile</p>
                        </div>
                    </div>
                    {mySub && (
                        <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 ${isGraded ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                            {isGraded ? <CheckCircle2 size={16}/> : <Clock size={16}/>}
                            <span className="text-[10px] font-black uppercase tracking-widest">{isGraded ? 'APPROVED & GRADED' : 'PENDING REVIEW'}</span>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8">
                    {/* Protocol Meta */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 bg-white dark:bg-gray-800/30 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-2">Maximum Marks</span>
                            <div className="text-xl font-black dark:text-white flex items-center gap-2"><Trophy size={18} className="text-amber-500"/> {asgn.totalMarks}</div>
                        </div>
                        <div className="p-6 bg-white dark:bg-gray-800/30 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-2">Protocol Deadline</span>
                            <div className="text-xs font-black dark:text-white flex items-center gap-2 text-rose-500"><Clock size={16}/> {new Date(asgn.dueDate).toLocaleString()}</div>
                        </div>
                        <div className="p-6 bg-primary-600 rounded-3xl text-white shadow-xl shadow-primary-500/20">
                            <span className="text-[8px] font-black uppercase tracking-widest block mb-2 opacity-80">Sync Progress</span>
                            <div className="text-xl font-black flex items-center gap-2">{mySub ? (isGraded ? `${mySub.marksObtained} / ${asgn.totalMarks}` : 'SUBMITTED') : 'NOT STARTED'}</div>
                        </div>
                    </div>

                    {/* Operational Guidelines */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2">Operational Guidelines</h4>
                        <div className="p-6 bg-gray-50 dark:bg-gray-950/30 rounded-3xl border border-gray-100 dark:border-gray-800 text-xs font-bold leading-relaxed dark:text-gray-300">
                            {asgn.description}
                        </div>
                    </div>

                    {/* Submission Node */}
                    {mySub ? (
                        <div className="space-y-6">
                            <div className="flex flex-col gap-6">
                                <div className="p-8 bg-emerald-500/5 dark:bg-emerald-500/10 border-2 border-emerald-500/20 rounded-[2.5rem] relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg"><Send size={20}/></div>
                                            <div>
                                                <h4 className="text-sm font-black dark:text-white uppercase">Your Protocol Submission</h4>
                                                <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Digital Node: {mySub._id.substring(mySub._id.length-8)}</p>
                                            </div>
                                        </div>
                                        {isGraded && (
                                            <div className="text-right">
                                                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{mySub.marksObtained} <span className="text-xs text-gray-400">/ {asgn.totalMarks}</span></div>
                                                <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Verified Multiplier</div>
                                            </div>
                                        )}
                                    </div>
                                    {mySub.facultyFeedback && (
                                        <div className="p-6 bg-white/50 dark:bg-gray-900/50 rounded-2xl border border-emerald-200 dark:border-emerald-800/30">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Sparkles size={12} className="text-primary-500"/>
                                                <span className="text-[9px] font-black text-primary-500 uppercase tracking-widest">Faculty Feedback Matrix</span>
                                            </div>
                                            <p className="text-xs font-bold font-sans dark:text-gray-300 italic">"{mySub.facultyFeedback}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        !isTeacher && (
                            <form onSubmit={handleFileUpload} className="space-y-6">
                                <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] px-2">Initiate Pulse Submission</h4>
                                {asgn.type === 'pdf' ? (
                                    <div className="relative group/up">
                                        <input type="file" required onChange={e=>setSubmissionFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                        <div className="py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl flex flex-col items-center justify-center gap-2 group-hover/up:border-primary-500/50 transition-all bg-white dark:bg-gray-950/20">
                                            <Download className="text-gray-300 group-hover/up:text-primary-500 transition-all" size={32}/>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{submissionFile ? submissionFile.name : 'Inject Solution Molecule (PDF)'}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-40 flex items-center justify-center bg-amber-500/5 rounded-3xl border border-amber-500/20 border-dashed">
                                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Quiz protocol should be initiated from the master link.</p>
                                    </div>
                                )}
                                <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-primary-700 shadow-xl transition-all">DEPOY SUBMISSION PROTOCOL</button>
                            </form>
                        )
                    )}
                </div>
            </motion.div>
        );
    };

    return (
        <div className="flex flex-col gap-8 h-full">
            {selectedAssignment ? renderDetail() : (
                <>
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-6">
                            <button 
                                onClick={() => setActiveTab('list')}
                                className={`text-xs font-black uppercase tracking-widest pb-3 px-2 transition-all relative ${activeTab === 'list' ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                Active Registry
                                {activeTab === 'list' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary-500 rounded-full" />}
                            </button>
                            {isTeacher && (
                                <button 
                                    onClick={() => { setActiveTab('create'); setSelectedAssignment(null); }}
                                    className={`text-xs font-black uppercase tracking-widest pb-3 px-2 transition-all relative ${activeTab === 'create' ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Deploy Sector
                                    {activeTab === 'create' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary-500 rounded-full" />}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 min-h-0">
                        <AnimatePresence mode="wait">
                            {activeTab === 'list' && (
                                <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                    {renderList()}
                                </motion.div>
                            )}
                            {activeTab === 'create' && (
                                <motion.div key="create" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
                                    {renderCreate()}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </>
            )}
        </div>
    );
};

export default AssignmentHub;
