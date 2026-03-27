import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, 
  Clock, 
  Send, 
  Play, 
  Trophy, 
  ChevronLeft, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileCode,
  Zap,
  Info
} from 'lucide-react';
import { useSelector } from 'react-redux';

const ContestArena = () => {
    const { contestId } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);
    
    const [contest, setContest] = useState(null);
    const [activeProblem, setActiveProblem] = useState(null);
    const [code, setCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);
    const [submissions, setSubmissions] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(`http://localhost:5001/api/coding-contests/${contestId}`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setContest(res.data);
                if (res.data.problems?.length > 0) {
                    setActiveProblem(res.data.problems[0]);
                    setCode(`// Start coding here...\n\nfunction solution(input) {\n    // Implement your magic...\n    return input;\n}`);
                }
                
                // Set timer
                const end = new Date(res.data.endTime);
                const now = new Date();
                setTimeLeft(Math.max(0, Math.floor((end - now) / 1000)));
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, [contestId, user.token]);

    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0) {
            alert('Contest time is up!');
            navigate('/coding-arena');
        }
    }, [timeLeft, navigate]);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const handleRunCode = () => {
        // In this proto, "Run" will just show a success for the first test case
        setResult({ status: 'running', message: 'Executing Test Cases...' });
        setTimeout(() => {
            setResult({ status: 'success', message: 'Test Case 1 Passed. Output matches expected input.' });
        }, 1500);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setResult({ status: 'submitting', message: 'Authenticating Code Signature & Compiling...' });
        
        try {
            const res = await axios.post('http://localhost:5001/api/coding-contests/submit', {
                contestId,
                problemId: activeProblem._id,
                code,
                language: 'javascript'
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            
            setResult({ 
                status: res.data.status === 'Accepted' ? 'success' : 'failure', 
                message: `Result: ${res.data.status}. Score Earned: ${res.data.score}` 
            });
            
            // Add to local history
            setSubmissions(prev => [{ ...res.data, submittedAt: new Date() }, ...prev]);
        } catch (err) {
            setResult({ status: 'failure', message: 'Transmission Error: Internal Compiler Failure' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!contest) return (
        <div className="flex h-screen w-full items-center justify-center bg-[#030712]">
            <Terminal className="animate-pulse text-primary-500" size={48} />
        </div>
    );

    return (
        <div className="h-screen flex flex-col bg-[#030712] overflow-hidden">
            {/* Minimal Sticky Header */}
            <div className="h-16 flex items-center justify-between px-6 bg-[#030712] border-b border-gray-800 shrink-0">
                <div className="flex items-center gap-6">
                   <button 
                     onClick={() => navigate('/coding-arena')}
                     className="p-3 bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors text-gray-400"
                   >
                     <ChevronLeft size={18} />
                   </button>
                   <div>
                     <span className="text-[10px] font-black uppercase text-primary-500 tracking-widest">{contest.title}</span>
                     <h2 className="text-sm font-black uppercase tracking-tight text-white">{activeProblem?.title}</h2>
                   </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 px-5 py-2.5 bg-red-500/10 rounded-2xl border border-red-500/20">
                        <Clock size={16} className="text-red-500" />
                        <span className="font-black text-xs text-red-500 font-mono tracking-tighter uppercase">{formatTime(timeLeft)}</span>
                    </div>
                    <button className="flex items-center gap-2 px-6 py-3 bg-primary-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary-500/20 hover:scale-105 active:scale-95 transition-all">
                        <Trophy size={16} /> Leaderboard
                    </button>
                </div>
            </div>

            {/* Main Arena */}
            <div className="flex-1 flex overflow-hidden">
                {/* Fixed Side Nav for Problems */}
                <div className="w-20 bg-gray-900/40 border-r border-gray-800 flex flex-col items-center py-6 gap-4">
                    {contest.problems.map((p, i) => (
                        <button 
                           key={p._id}
                           onClick={() => setActiveProblem(p)}
                           className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-all ${activeProblem?._id === p._id ? 'bg-primary-600 text-white shadow-xl shadow-primary-500/30' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                        >
                           {String.fromCharCode(65 + i)}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Problem Definition */}
                    <div className="flex-1 max-w-[40%] overflow-y-auto p-10 border-r border-gray-800 scrollbar-hide">
                         <div className="flex items-center gap-3 mb-6">
                             <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${activeProblem?.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-500' : activeProblem?.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>
                                 {activeProblem?.difficulty}
                             </span>
                             <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest inline-flex items-center gap-2">
                                <Zap size={12} className="text-primary-500" /> {activeProblem?.points} Score
                             </span>
                         </div>
                         
                         <h1 className="text-3xl font-black uppercase tracking-tighter mb-8">{activeProblem?.title}</h1>
                         
                         <div className="prose prose-invert max-w-none space-y-8">
                             <div>
                                 <h4 className="text-[11px] font-black uppercase tracking-widest text-primary-500 mb-2 flex items-center gap-2"><Info size={14}/> Background Protocol</h4>
                                 <p className="text-gray-400 text-sm leading-relaxed font-medium">{activeProblem?.description}</p>
                             </div>

                             {activeProblem?.constraints && (
                                 <div>
                                     <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">Computational Constraints</h4>
                                     <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800 text-xs font-mono text-gray-300">
                                         {activeProblem.constraints}
                                     </div>
                                 </div>
                             )}

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div>
                                     <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-3">Sample Input Trace</h4>
                                     <pre className="bg-gray-950 p-4 rounded-xl text-xs font-mono text-primary-400 border border-primary-500/10">
                                         {activeProblem?.sampleInput || 'Standard Stream'}
                                     </pre>
                                 </div>
                                 <div>
                                     <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-3">Expected Log Output</h4>
                                     <pre className="bg-gray-950 p-4 rounded-xl text-xs font-mono text-emerald-400 border border-emerald-500/10">
                                         {activeProblem?.sampleOutput || 'Accept Condition'}
                                     </pre>
                                 </div>
                             </div>
                         </div>
                    </div>

                    {/* Integrated Code Terminal */}
                    <div className="flex-1 flex flex-col bg-gray-950 relative">
                        {/* Editor Header */}
                        <div className="h-12 bg-gray-900/50 flex items-center justify-between px-6 border-b border-gray-800 shrink-0">
                           <div className="flex items-center gap-3">
                              <FileCode size={16} className="text-primary-500" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Main.js - JavaScript (Node.js)</span>
                           </div>
                        </div>

                        {/* Text Editor Container */}
                        <div className="flex-1 relative font-mono text-sm group">
                            <textarea 
                                spellCheck="false"
                                className="w-full h-full bg-transparent p-10 outline-none text-gray-300 resize-none selection:bg-primary-500/30 font-mono leading-relaxed relative z-10"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                            />
                            {/* Line Numbers Simulation */}
                            <div className="absolute left-0 top-0 bottom-0 w-10 bg-gray-900/20 border-r border-gray-800/50 flex flex-col items-center pt-10 text-[10px] text-gray-700 leading-relaxed pointer-events-none select-none">
                                {[...Array(50)].map((_, i) => <div key={i}>{i+1}</div>)}
                            </div>
                        </div>

                        {/* Action Console */}
                        <div className="h-fit bg-gray-900/80 border-t border-gray-800 p-6 flex flex-col gap-4">
                           <AnimatePresence>
                             {result && (
                               <motion.div 
                                 initial={{ opacity: 0, y: 10 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 className={`p-4 rounded-2xl flex items-center gap-3 border ${result.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : result.status === 'failure' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-primary-500/10 border-primary-500/20 text-primary-500'}`}
                               >
                                  {result.status === 'success' ? <CheckCircle size={18} /> : result.status === 'failure' ? <XCircle size={18} /> : <AlertCircle className="animate-spin" size={18} />}
                                  <span className="text-[11px] font-black uppercase tracking-widest">{result.message}</span>
                               </motion.div>
                             )}
                           </AnimatePresence>

                           <div className="flex justify-end gap-3">
                              <button 
                                onClick={handleRunCode}
                                className="px-6 py-3 rounded-2xl bg-gray-800 text-gray-300 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-gray-700 transition-all border border-gray-700"
                              >
                                 <Play size={14} /> Local Run
                              </button>
                              <button 
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="px-8 py-3 rounded-2xl bg-primary-600 text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-primary-500 transition-all shadow-xl shadow-primary-500/20 disabled:opacity-50"
                              >
                                 <Send size={14} /> Submit Final
                              </button>
                           </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContestArena;
