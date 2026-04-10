import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Clock, Zap, CheckCircle2, XCircle, 
  ChevronRight, AlertCircle, Trophy, Star, ShieldAlert
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

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const res = await axios.get(`http://localhost:5001/api/gamification/quizzes/${quizId}`, config);
        setQuiz(res.data);
        setTimeLeft(res.data.timeLimit * 60);
        setIsLoading(false);
      } catch (err) {
        alert("Failed to initialize arena.");
        onClose();
      }
    };
    fetchQuiz();
  }, [quizId, user.token]);

  useEffect(() => {
    if (timeLeft > 0 && !isFinished) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !isFinished && quiz) {
      handleFinish();
    }
  }, [timeLeft, isFinished, quiz]);

  useEffect(() => {
    const handleBlur = () => setTabSwitches(prev => prev + 1);
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, []);

  const handleAnswer = (optionIdx) => {
    setAnswers({ ...answers, [currentQ]: optionIdx });
  };

  const handleFinish = async () => {
    if (isFinished) return;
    setIsFinished(true);
    
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    let score = 0;
    const finalAnswers = quiz.questions.map((q, idx) => {
      const isCorrect = answers[idx] === q.correctAnswer;
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
    } catch (err) {
      alert("Sync failure: " + err.message);
    }
  };

  if (isLoading) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="fixed inset-0 z-[7000] bg-[#030712] flex flex-col font-sans"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,#4361ee_0%,transparent_70%)]" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-8 py-6 border-b border-white/5 bg-gray-950/50 backdrop-blur-2xl flex items-center justify-between">
        <div className="flex items-center gap-6">
           <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-[0_0_30px_rgba(79,70,229,0.3)]">
              <Zap size={22} className="fill-current" />
           </div>
           <div>
              <h2 className="text-xl font-bold text-white uppercase tracking-tighter">{quiz.title}</h2>
              <div className="flex items-center gap-4 mt-1">
                 <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                    <Clock size={12} /> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')} REAMAINING
                 </div>
                 {tabSwitches > 0 && (
                   <div className="flex items-center gap-2 text-[10px] font-bold text-rose-500 uppercase tracking-widest bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/20">
                      <ShieldAlert size={12} /> {tabSwitches} UNAUTHORIZED EXITS
                   </div>
                 )}
              </div>
           </div>
        </div>
        {!isFinished && (
           <button onClick={handleFinish} className="px-8 py-3 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all shadow-xl">Abort & Sync</button>
        )}
      </header>

      <main className="flex-1 relative z-10 flex flex-col items-center justify-center p-8">
        <AnimatePresence mode="wait">
          {!isFinished ? (
            <motion.div 
              key="quiz-body"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-3xl w-full"
            >
              <div className="mb-12">
                 <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">
                    <span>Inquiry {currentQ + 1} of {quiz.questions.length}</span>
                    <span>{Math.round((currentQ + 1) / quiz.questions.length * 100)}% Momentum</span>
                 </div>
                 <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-indigo-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentQ + 1) / quiz.questions.length) * 100}%` }}
                    />
                 </div>
              </div>

              <h3 className="text-3xl font-bold text-white mb-10 leading-tight">
                {quiz.questions[currentQ].question}
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {quiz.questions[currentQ].options.map((opt, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    className={`group relative p-6 rounded-3xl border text-left transition-all duration-300 ${
                      answers[currentQ] === idx 
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_40px_rgba(79,70,229,0.3)]' 
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/[0.08] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-6">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border-2 transition-all ${
                         answers[currentQ] === idx ? 'bg-white text-indigo-600 border-white' : 'bg-white/5 border-white/5 group-hover:border-white/20'
                       }`}>
                          {String.fromCharCode(65 + idx)}
                       </div>
                       <span className="text-lg font-medium">{opt}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-12 flex justify-between">
                 <button 
                   disabled={currentQ === 0}
                   onClick={() => setCurrentQ(prev => prev - 1)}
                   className="px-6 py-3 text-gray-500 hover:text-white disabled:opacity-20 transition-all font-bold uppercase text-[10px] tracking-widest"
                 >
                   Previous Phase
                 </button>
                 {currentQ === quiz.questions.length - 1 ? (
                   <button 
                     onClick={handleFinish}
                     className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all"
                   >
                     Initialize Extraction
                   </button>
                 ) : (
                   <button 
                     onClick={() => setCurrentQ(prev => prev + 1)}
                     className="px-10 py-4 bg-white/10 text-white border border-white/10 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-white/20 transition-all flex items-center gap-3"
                   >
                     Next Sequence <ChevronRight size={16} />
                   </button>
                 )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="results-body"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-lg w-full bg-white/5 border border-white/10 rounded-[3.5rem] p-12 text-center relative overflow-hidden"
            >
               <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/10 to-transparent pointer-events-none" />
               
               {results ? (
                 <>
                   <div className="w-24 h-24 rounded-[2rem] bg-indigo-600 text-white flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(79,70,229,0.4)]">
                     <Trophy size={48} />
                   </div>
                   <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Sync Complete</h2>
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mb-8">Performance Data Verified</p>
                   
                   <div className="grid grid-cols-2 gap-4 mb-10">
                      <div className="bg-white/5 border border-white/5 rounded-3xl p-6">
                         <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Coins Earned</div>
                         <div className="text-3xl font-black text-white flex items-center justify-center gap-2">
                           <Star size={20} className="text-yellow-500 fill-current" /> {results.coinsEarned}
                         </div>
                      </div>
                      <div className="bg-white/5 border border-white/5 rounded-3xl p-6">
                         <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Global Rank</div>
                         <div className="text-3xl font-black text-white italic">#{results.rank}</div>
                      </div>
                   </div>

                   {results.newBadges?.length > 0 && (
                     <div className="mb-10">
                        <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-4">New Achievements Unlocked</p>
                        <div className="flex justify-center gap-4">
                           {results.newBadges.map(b => (
                             <div key={b._id} className="group relative">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-yellow-600 to-amber-300 p-0.5 shadow-xl">
                                   <div className="w-full h-full bg-gray-900 rounded-2xl flex items-center justify-center">
                                      <img src={b.icon} alt={b.name} className="w-10 h-10 object-contain" />
                                   </div>
                                </div>
                                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-black text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">{b.name}</div>
                             </div>
                           ))}
                        </div>
                     </div>
                   )}

                   <button 
                     onClick={onClose}
                     className="w-full py-5 bg-white text-black rounded-3xl font-black uppercase text-xs tracking-[0.2em] hover:bg-indigo-500 hover:text-white transition-all shadow-xl"
                   >
                     Return to Hub
                   </button>
                 </>
               ) : (
                 <div className="py-20 flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-6" />
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Validating Neural Link...</p>
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
