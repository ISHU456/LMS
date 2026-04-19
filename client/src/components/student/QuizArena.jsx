import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Clock, Zap, CheckCircle2, XCircle, 
  ChevronRight, AlertCircle, Trophy, Star, ShieldAlert,
  Sparkles, RotateCcw
} from 'lucide-react';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile } from '../../features/auth/authSlice';

const QuizArena = ({ quizId, onClose }) => {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  
  const [quiz, setQuiz] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [results, setResults] = useState(null);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [startTime] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const [isFeedbackStage, setIsFeedbackStage] = useState(false);
  const [showReattemptNotice, setShowReattemptNotice] = useState(false);
  const [hasPreviousAttempt, setHasPreviousAttempt] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const res = await axios.get(`http://localhost:5001/api/gamification/quizzes/${quizId}`, config);
        setQuiz(res.data);
        setTimeLeft(res.data.timeLimit * 60);

        // Check if user has already attempted this quiz
        const attemptsRes = await axios.get(`http://localhost:5001/api/gamification/quizzes`, config);
        const thisQuiz = attemptsRes.data.find(q => q._id === quizId);
        if (thisQuiz && thisQuiz.isCompleted) {
            setHasPreviousAttempt(true);
            setShowReattemptNotice(true);
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Quiz fetch error:", err);
        if (onClose) onClose();
        else window.history.back();
      }
    };
    fetchQuiz();
  }, [quizId, user.token]);

  useEffect(() => {
    if (timeLeft > 0 && !isFinished && !showReattemptNotice) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !isFinished && quiz && !showReattemptNotice) {
      handleFinish();
    }
  }, [timeLeft, isFinished, quiz, showReattemptNotice]);

  useEffect(() => {
    const handleBlur = () => {
        if (!isFinished && !showReattemptNotice) setTabSwitches(prev => prev + 1);
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [isFinished, showReattemptNotice]);

  const handleAnswer = (optionIdx) => {
    setAnswers({ ...answers, [currentQ]: optionIdx });
  };

  const handleFinish = async () => {
    if (isFinished) return;
    setIsFinished(true);
    
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    let score = 0;
    const finalAnswers = quiz.questions.map((q, idx) => {
      const isCorrect = answers[idx] !== undefined && q.options[answers[idx]] === q.correctAnswer;
      if (isCorrect) score += (quiz.totalPoints / quiz.questions.length);
      return { questionId: q._id, selectedOption: answers[idx], isCorrect };
    });

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.post('http://localhost:5001/api/gamification/quizzes/submit', {
        quizId,
        score: Math.round(score),
        timeTaken,
        answers: finalAnswers,
        tabSwitches
      }, config);
      
      setResults(res.data);
      dispatch(updateProfile({ coins: res.data.totalCoins }));
      setIsFeedbackStage(true); // Go to feedback first
    } catch (err) {
      alert("Sync failure: " + err.message);
    }
  };

  const handleReattempt = () => {
    // Reset all states
    setAnswers({});
    setCurrentQ(0);
    setIsFinished(false);
    setResults(null);
    setTabSwitches(0);
    setTimeLeft(quiz.timeLimit * 60);
    setIsFeedbackStage(false);
    setShowReattemptNotice(false);
  };

  if (isLoading) return (
    <div className="fixed inset-0 z-[7500] bg-slate-900 flex flex-col items-center justify-center p-10">
        <Brain size={48} className="text-emerald-500 animate-pulse mb-6" />
        <p className="text-[10px] font-black text-white uppercase tracking-[0.5em] animate-pulse">Initializing Neural Interface...</p>
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="fixed inset-0 z-[7000] bg-[#f0f2f5] flex flex-col font-sans text-slate-900"
    >
      {/* Reattempt Notice Modal */}
      <AnimatePresence>
        {showReattemptNotice && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[8000] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6"
            >
                <motion.div 
                    initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                    className="max-w-md w-full bg-white dark:bg-[#0b0f1a] rounded-[3rem] p-10 border border-slate-200 dark:border-white/10 shadow-2xl text-center"
                >
                    <div className="w-20 h-20 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-8 border border-amber-500/20">
                        <AlertCircle size={40} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4 italic">Re-Attempt Protocol Detected</h3>
                    <p className="text-sm font-bold text-slate-500 dark:text-gray-400 leading-relaxed mb-8">
                        You have already established a record for this assessment. In accordance with neural governance, <span className="text-rose-500">Scholar Coins will not be awarded</span> for this subsequent attempt. Only your proficiency metrics will be logged.
                    </p>
                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => setShowReattemptNotice(false)}
                            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            Acknowledge & Proceed
                        </button>
                        <button 
                            onClick={() => onClose ? onClose() : window.history.back()}
                            className="w-full py-4 text-slate-400 hover:text-slate-600 font-black uppercase text-[10px] tracking-widest transition-all"
                        >
                            Abort Re-Attempt
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="relative z-10 px-8 py-4 border-b border-slate-300 bg-[#e8eff9] flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
           <div className="w-12 h-12 rounded-lg bg-[#2c4c91] flex items-center justify-center text-white shadow-md">
              <Zap size={22} className="fill-current" />
           </div>
           <div>
              <h2 className="text-xl font-black text-[#2c4c91] uppercase tracking-tighter">{quiz.title}</h2>
              <div className="flex items-center gap-4 mt-1">
                 <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <Clock size={12} className="text-rose-600" /> <span className="text-rose-600 font-black">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span> REMAINING
                 </div>
                 {tabSwitches > 0 && (
                   <div className="flex items-center gap-2 text-[10px] font-bold text-rose-500 uppercase tracking-widest bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      <ShieldAlert size={12} /> {tabSwitches} PROCTORING ALERTS
                   </div>
                 )}
              </div>
           </div>
        </div>
        {!isFinished && !showReattemptNotice && (
           <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                 <p className="text-[10px] font-black text-slate-400 uppercase">Section</p>
                 <p className="text-xs font-black text-[#2c4c91] uppercase">General Proficiency</p>
              </div>
              <button onClick={handleFinish} className="px-8 py-3 bg-[#2c4c91] text-white rounded-lg text-xs font-black uppercase tracking-widest hover:bg-[#1e3a75] transition-all shadow-md">Submit Exam</button>
           </div>
        )}
      </header>

      <main className="flex-1 relative z-10 flex overflow-hidden">
        <AnimatePresence mode="wait">
          {!isFinished ? (
            <div className="flex w-full h-full">
              {/* LEFT: QUESTION AREA */}
              <div className="flex-1 flex flex-col h-full bg-white p-8 overflow-y-auto">
                <motion.div 
                  key={`q-${currentQ}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="max-w-4xl w-full mx-auto space-y-8"
                >
                  <div className="flex items-center gap-4 py-2 border-b border-slate-100">
                     <span className="px-3 py-1 bg-[#2c4c91] text-[10px] font-black text-white rounded">QUESTION {currentQ + 1}</span>
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marks: +4 | -1</span>
                  </div>

                  <h3 className="text-2xl font-bold text-slate-800 leading-relaxed bg-slate-50 p-6 rounded-xl border border-slate-100">
                    {quiz.questions[currentQ].text}
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    {quiz.questions[currentQ].options.map((opt, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleAnswer(idx)}
                        className={`group relative p-6 rounded-xl border text-left transition-all duration-200 ${
                          answers[currentQ] === idx 
                            ? 'bg-[#e8f0fe] border-[#2c4c91] text-[#2c4c91] shadow-sm' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-6">
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 transition-all ${
                             answers[currentQ] === idx ? 'bg-[#2c4c91] text-white border-[#2c4c91]' : 'bg-white text-slate-400 border-slate-200'
                           }`}>
                              {String.fromCharCode(65 + idx)}
                           </div>
                           <span className="text-lg font-bold">{opt}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-12 flex items-center justify-between border-t border-slate-100 pt-8">
                     <div className="flex gap-4">
                        <button 
                          disabled={currentQ === 0}
                          onClick={() => setCurrentQ(prev => prev - 1)}
                          className="px-6 py-3 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-lg transition-all font-black uppercase text-[10px] tracking-widest"
                        >
                          Previous
                        </button>
                        <button 
                         className="px-6 py-3 border border-amber-500 text-amber-600 hover:bg-amber-50 rounded-lg transition-all font-black uppercase text-[10px] tracking-widest"
                        >
                          Mark for Review
                        </button>
                     </div>
                     
                     <div className="flex gap-4">
                        <button 
                          onClick={() => setAnswers({...answers, [currentQ]: undefined})}
                          className="px-6 py-3 text-slate-400 hover:text-rose-600 transition-all font-black uppercase text-[10px] tracking-widest"
                        >
                          Clear Selection
                        </button>
                        
                        {currentQ === quiz.questions.length - 1 ? (
                          <button 
                            onClick={handleFinish}
                            className="px-10 py-3 bg-[#2c4c91] text-white rounded-lg font-black uppercase text-[10px] tracking-widest shadow-md hover:bg-[#1e3a75] transition-all"
                          >
                            Save & Finish
                          </button>
                        ) : (
                          <button 
                            onClick={() => setCurrentQ(prev => prev + 1)}
                            className="px-10 py-3 bg-[#2c4c91] text-white rounded-lg font-black uppercase text-[10px] tracking-widest shadow-md hover:bg-[#1e3a75] transition-all"
                          >
                            Save & Next
                          </button>
                        )}
                     </div>
                  </div>
                </motion.div>
              </div>

              {/* RIGHT: PALETTE AREA */}
              <div className="w-[350px] border-l border-slate-300 bg-[#f8f9fa] flex flex-col">
                <div className="p-6 border-b border-slate-200 flex items-center gap-4 bg-white">
                   <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center font-black text-2xl text-slate-400 border border-slate-200 overflow-hidden shadow-inner">
                      {user.profilePic ? <img src={user.profilePic} className="w-full h-full object-cover" /> : user.name[0]}
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate</p>
                      <p className="text-sm font-black text-[#2c4c91] uppercase truncate max-w-[150px]">{user.name}</p>
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Question Palette</p>
                   <div className="grid grid-cols-5 gap-3">
                      {quiz.questions.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentQ(idx)}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-black transition-all ${
                            currentQ === idx ? 'ring-2 ring-[#2c4c91] ring-offset-2 ring-offset-[#f8f9fa]' : ''
                          } ${
                            answers[idx] !== undefined 
                            ? 'bg-[#2c4c91] text-white shadow-sm' 
                            : 'bg-white text-slate-400 border border-slate-200 hover:border-[#2c4c91]'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="p-6 bg-white border-t border-slate-200">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Legend</p>
                   <div className="grid grid-cols-2 gap-y-3">
                      <div className="flex items-center gap-2">
                         <div className="w-4 h-4 rounded bg-[#2c4c91]" />
                         <span className="text-[9px] font-black text-slate-500 uppercase">Answered</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <div className="w-4 h-4 rounded bg-white border border-slate-200" />
                         <span className="text-[9px] font-black text-slate-500 uppercase">Not Visited</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <div className="w-4 h-4 rounded bg-amber-500" />
                         <span className="text-[9px] font-black text-slate-500 uppercase">Review</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <div className="w-4 h-4 rounded-full border-2 border-[#2c4c91]" />
                         <span className="text-[9px] font-black text-slate-500 uppercase">Current</span>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          ) : (
            <motion.div 
              key="results-body"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-5xl w-full bg-white rounded-[2rem] shadow-2xl p-10 lg:p-16 my-10 overflow-y-auto custom-scrollbar mx-auto"
            >
               {results ? (
                 isFeedbackStage ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                        <div className="text-center">
                            <div className="w-20 h-20 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-inner animate-bounce">
                                <Sparkles size={40} />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2 italic">Submission Successful</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Neural link stabilization required</p>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-[2.5rem] p-10 text-center shadow-inner">
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-1">Neural Refinement Feedback</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-10">Rate this evaluation to reveal results</p>
                            
                            <div className="flex justify-center gap-4 mb-10">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button 
                                        key={star}
                                        onClick={() => setRating(star)}
                                        className={`transition-all ${rating >= star ? 'text-amber-500 scale-125' : 'text-slate-300 grayscale opacity-30 hover:opacity-100'}`}
                                    >
                                        <Star size={40} fill={rating >= star ? 'currentColor' : 'none'} />
                                    </button>
                                ))}
                            </div>

                            <textarea 
                                placeholder="Any neural insights or technical feedback regarding this assessment protocol?"
                                className="w-full bg-white border border-slate-200 rounded-3xl p-6 text-sm font-bold text-slate-700 outline-none focus:border-[#2c4c91] transition-all mb-8 shadow-sm min-h-[150px]"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />

                            <button 
                                onClick={() => setIsFeedbackStage(false)} // Reveal results after feedback
                                className="w-full py-6 bg-[#2c4c91] text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-[#1e3a75] transition-all active:scale-95"
                            >
                                Submit Feedback & Reveal Metrics
                            </button>
                        </div>
                    </motion.div>
                 ) : (
                    <div className="space-y-12">
                        {/* Header Summary */}
                        <div className="text-center border-b border-slate-100 pb-12 relative">
                           {results.isFirstAttempt && (
                               <motion.div 
                                 initial={{ rotate: -15, scale: 0 }}
                                 animate={{ rotate: -15, scale: 1 }}
                                 className="absolute -top-10 left-0 bg-yellow-400 text-black px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl border-2 border-white"
                               >
                                   Scholar Coins Earned!
                               </motion.div>
                           )}
                           <div className="w-24 h-24 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-inner">
                              <Trophy size={48} strokeWidth={1.5} />
                           </div>
                           <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-2 italic">Neural Sync Complete</h2>
                           <p className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Evaluation Results Synthesized</p>
                        </div>

                        {/* Performance Grids */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                           <div className="bg-slate-50 border border-slate-100 rounded-3xl p-8 text-center group hover:bg-[#2c4c91] hover:text-white transition-all duration-300">
                              <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Total Score</p>
                              <p className="text-4xl font-black italic">{results.score} / {results.maxScore || 100}</p>
                           </div>
                           <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 text-center group hover:bg-emerald-500 hover:text-white transition-all duration-300">
                              <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Accuracy</p>
                              <p className="text-4xl font-black">{Math.round((results.score / (results.maxScore || 1)) * 100)}%</p>
                           </div>
                           <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center space-y-2">
                              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-emerald-600">
                                 <span>Correct</span>
                                 <span>{results.correct ?? results.score}</span>
                              </div>
                              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-rose-500">
                                 <span>Wrong</span>
                                 <span>{results.wrong ?? (results.totalQuestions || 0) - (results.correct || 0)}</span>
                              </div>
                              <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-2">
                                 <div 
                                    className="h-full bg-emerald-500 transition-all duration-1000" 
                                    style={{ width: `${(results.correct / (results.totalQuestions || 1)) * 100}%` }} 
                                 />
                              </div>
                           </div>
                           <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-8 text-center relative overflow-hidden group hover:scale-105 transition-transform duration-500">
                              <p className="text-[10px] font-black uppercase tracking-widest mb-2 text-indigo-600 font-black">Scholar Coins</p>
                              <p className="text-4xl font-black text-indigo-600">+{results.coinsEarned}</p>
                              {!results.isFirstAttempt && (
                                  <div className="absolute inset-0 bg-slate-200/50 backdrop-blur-[2px] flex items-center justify-center">
                                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] rotate-12">No Coins Awarded</span>
                                  </div>
                              )}
                           </div>
                           <div className="bg-amber-50 border border-amber-100 rounded-3xl p-8 text-center group hover:bg-amber-500 hover:text-white transition-all">
                              <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Rank Trace</p>
                              <p className="text-4xl font-black italic">#{results.rank}</p>
                           </div>
                        </div>

                        {/* Detailed question Analysis */}
                        <div className="space-y-6">
                           <div className="flex items-center gap-4">
                              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">Assessment Node Integrity</h3>
                              <div className="h-[2px] flex-1 bg-slate-100" />
                           </div>
                           
                           <div className="grid grid-cols-1 gap-4">
                              {quiz.questions.map((q, idx) => {
                                 const isCorrect = answers[idx] !== undefined && q.options[answers[idx]] === q.correctAnswer;
                                 const isSkipped = answers[idx] === undefined;
                                 return (
                                   <div key={idx} className={`p-6 rounded-2xl border ${isCorrect ? 'bg-emerald-50/30 border-emerald-100' : isSkipped ? 'bg-slate-50 border-slate-100' : 'bg-rose-50/30 border-rose-100'}`}>
                                      <div className="flex items-start justify-between gap-4">
                                         <div className="flex-1">
                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-2 italic">Node {idx + 1}</p>
                                            <h4 className="text-lg font-bold text-slate-800 mb-4">{q.text}</h4>
                                            <div className="space-y-2">
                                               <div className={`text-xs font-bold p-3 rounded-xl flex items-center justify-between ${isCorrect ? 'bg-emerald-500/10 text-emerald-700' : 'bg-rose-500/10 text-rose-700'}`}>
                                                  <span>Trace: {isSkipped ? 'NULL_REFERENCE' : q.options[answers[idx]]}</span>
                                                  {isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                               </div>
                                               {!isCorrect && (
                                                  <div className="text-xs font-bold p-3 bg-emerald-500/10 text-emerald-700 rounded-xl">
                                                     Stabilized Reference: {q.correctAnswer}
                                                  </div>
                                               )}
                                            </div>
                                         </div>
                                      </div>
                                   </div>
                                 );
                              })}
                           </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-12 border-t border-slate-100">
                           <button 
                             onClick={handleReattempt}
                             className="flex-1 py-5 bg-white border-2 border-slate-200 text-slate-600 rounded-3xl font-black uppercase text-xs tracking-widest hover:border-[#2c4c91] hover:text-[#2c4c91] transition-all flex items-center justify-center gap-2"
                           >
                             <RotateCcw size={16} /> Protocol Re-attempt
                           </button>
                           <button 
                             onClick={() => onClose ? onClose() : window.history.back()}
                             className="flex-1 py-5 bg-[#2c4c91] text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-[#1e3a75] transition-all"
                           >
                             Terminate & Refactor
                           </button>
                        </div>
                    </div>
                 )
               ) : (
                 <div className="py-20 flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-[#2c4c91]/30 border-t-[#2c4c91] rounded-full animate-spin mb-6" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Submission Trace...</p>
                 </div>
               )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </motion.div>
  );
};

export default QuizArena;
