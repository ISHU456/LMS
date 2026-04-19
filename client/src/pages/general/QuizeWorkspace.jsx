import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Save, RotateCcw, ChevronLeft, 
  Layout, Settings, Terminal, Bug, 
  PanelLeft, PanelRight, ShieldCheck, Sparkles, Brain, Lock as LockIcon
} from 'lucide-react';


import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';

const QuizeWorkspace = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);
    const [challenge, setChallenge] = useState(null);
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [activeTab, setActiveTab] = useState('problem'); // problem, test, output, history
    const [isRunning, setIsRunning] = useState(false);
    const [output, setOutput] = useState(null);
    const [stdin, setStdin] = useState('');
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const fetchChallenge = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const res = await axios.get(`http://localhost:5001/api/coding/challenges/${id}`, config);
                setChallenge(res.data);
                setCode(res.data.starterCode?.[language] || '// Write your solution here');
            } catch (err) {
                console.error(err);
                navigate('/quize-arena');
            }
        };
        fetchChallenge();
    }, [id, user.token, language]);

    const handleRun = async () => {
        setIsRunning(true);
        setActiveTab('output');
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const res = await axios.post('http://localhost:5001/api/coding/run', { code, language, stdin }, config);
            setOutput(res.data);
            setHistory(prev => [{ type: 'run', ...res.data, timestamp: new Date() }, ...prev]);
        } catch (err) {
            setOutput({ success: false, message: "Execution Timeout or System Error" });
        } finally {
            setIsRunning(false);
        }
    };

    const handleSubmit = async () => {
        setIsRunning(true);
        setActiveTab('output');
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const res = await axios.post('http://localhost:5001/api/coding/submit', { challengeId: id, code, language }, config);
            setOutput(res.data);
            setHistory(prev => [{ type: 'submit', ...res.data, timestamp: new Date() }, ...prev]);
        } catch (err) {
             setOutput({ success: false, message: "Validation Service Error" });
        } finally {
            setIsRunning(false);
        }
    };


    if (!challenge) return <div className="h-screen bg-[#080c14] flex items-center justify-center"><div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"/></div>;

    return (
        <div className="h-screen bg-[#080c14] flex flex-col">
            {/* Header */}
            <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0b0f1a]">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/quize-arena')} className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-all">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                            <Terminal size={18} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-black text-white uppercase tracking-tight">{challenge.title}</h2>
                                {challenge.isWeeklyTest && (
                                    <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/30 rounded text-[8px] font-black text-rose-500 uppercase flex items-center gap-1">
                                        <Zap size={8} /> Weekly Test
                                    </span>
                                )}
                            </div>
                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{challenge.difficulty}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <select 
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl outline-none focus:border-emerald-500 transition-all"
                    >
                        {challenge.allowedLanguages?.map(lang => (
                             <option key={lang} value={lang} className="bg-[#0b0f1a]">
                                {lang === 'cpp' ? 'C++ 20' : lang === 'python' ? 'Python 3' : lang === 'java' ? 'Java 17' : lang.charAt(0).toUpperCase() + lang.slice(1)}
                             </option>
                        ))}
                        {(!challenge.allowedLanguages || challenge.allowedLanguages.length === 0) && (
                            <>
                                <option value="javascript">JavaScript</option>
                                <option value="python">Python 3</option>
                                <option value="java">Java 17</option>
                                <option value="cpp">C++ 20</option>
                            </>
                        )}
                    </select>
                    <button 
                        onClick={handleRun}
                        disabled={isRunning}
                        className="px-6 py-2.5 bg-white/10 text-white border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2"
                        title="Run with custom stdin"
                    >
                        {isRunning && activeTab === 'output' ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Play size={14} />}
                        Run Trace
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={isRunning}
                        className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                    >
                        {isRunning && activeTab === 'output' ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <ShieldCheck size={14} />}
                        Submit Final
                    </button>
                </div>
            </div>

            {/* Workspace Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: Description */}
                <div className="w-1/3 border-r border-white/5 flex flex-col bg-[#0b0f1a]">
                    <div className="flex border-b border-white/5">
                        <button 
                            onClick={() => setActiveTab('problem')} 
                            className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'problem' ? 'border-emerald-500 text-white bg-white/5' : 'border-transparent text-gray-500 hover:text-white'}`}
                        >
                            Description
                        </button>
                        <button 
                            onClick={() => setActiveTab('test')} 
                            className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'test' ? 'border-emerald-500 text-white bg-white/5' : 'border-transparent text-gray-500 hover:text-white'}`}
                        >
                            Tests
                        </button>
                        <button 
                            onClick={() => setActiveTab('history')} 
                            className={`px-6 py-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'history' ? 'border-emerald-500 text-white bg-white/5' : 'border-transparent text-gray-500 hover:text-white'}`}
                        >
                            History
                        </button>
                    </div>

                    
                    <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                        <AnimatePresence mode="wait">
                            {activeTab === 'problem' && (
                                <motion.div key="p" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-8">
                                    <div>
                                        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-4">Problem Statement</h3>
                                        <p className="text-sm font-bold text-gray-400 leading-relaxed">{challenge.problemStatement}</p>
                                    </div>

                                    {challenge.examples?.map((ex, i) => (
                                        <div key={i} className="space-y-4">
                                            <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Example {i+1}</h4>
                                            <div className="bg-black/40 rounded-2xl p-6 border border-white/5 font-mono text-xs space-y-2">
                                                <p className="text-gray-500 italic"><span className="text-emerald-400 font-bold">Input:</span> {ex.input}</p>
                                                <p className="text-gray-500 italic"><span className="text-rose-400 font-bold">Output:</span> {ex.output}</p>
                                                {ex.explanation && <p className="text-gray-600 border-t border-white/5 pt-2 mt-2">Ex: {ex.explanation}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}

                            {activeTab === 'test' && (
                                <motion.div key="t" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                     <div className="flex items-center justify-between">
                                         <h3 className="text-xl font-black text-white uppercase tracking-tight mb-4">Test Protocols</h3>
                                         <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Select to execute</p>
                                     </div>
                                     {challenge.testCases?.map((tc, i) => (
                                         <button 
                                             key={i} 
                                             onClick={() => {
                                                 if (tc.isPublic) {
                                                     setStdin(tc.input);
                                                     handleRun();
                                                 }
                                             }}
                                             disabled={!tc.isPublic || isRunning}
                                             className={`w-full p-6 border transition-all rounded-2xl flex items-center justify-between text-left group ${
                                                 tc.isPublic 
                                                 ? 'bg-white/5 border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 cursor-pointer' 
                                                 : 'bg-black/20 border-white/5 opacity-60 cursor-not-allowed'
                                             }`}
                                         >
                                             <div>
                                                 <p className="text-[10px] font-black text-gray-500 uppercase">Suite {i+1}</p>
                                                 <pre className="text-xs text-white mt-1 font-mono truncate max-w-[200px]">{tc.isPublic ? tc.input : "HIDDEN"}</pre>
                                             </div>
                                             <div className="flex items-center gap-4">
                                                 <div className="text-right">
                                                     <p className="text-[10px] font-black text-gray-500 uppercase">Type</p>
                                                     <p className={`text-[10px] font-black uppercase ${tc.isPublic ? 'text-emerald-500' : 'text-orange-500'}`}>{tc.isPublic ? 'Public' : 'Secret'}</p>
                                                 </div>
                                                 {tc.isPublic && <Play size={14} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-all" />}
                                             </div>
                                         </button>
                                     ))}
                                 </motion.div>
                            )}

                            {activeTab === 'history' && (
                                <motion.div key="h" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                    <h3 className="text-xl font-black text-white uppercase tracking-tight mb-4">Neural History</h3>
                                    {history.map((h, i) => (
                                        <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                                            <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                                                <span className={h.type === 'submit' ? 'text-indigo-400' : 'text-gray-500'}>{h.type} trace</span>
                                                <span className={h.success ? 'text-emerald-500' : 'text-rose-500'}>{h.success ? 'Passed' : 'Failed'}</span>
                                            </div>
                                            <p className="text-xs text-gray-400">{h.message}</p>
                                            <div className="text-[7px] text-gray-600 text-right">{h.timestamp.toLocaleTimeString()}</div>
                                        </div>
                                    ))}
                                    {history.length === 0 && <p className="text-[10px] text-gray-600 font-black uppercase text-center mt-20">No traces recorded</p>}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>

                {/* Right Panel: Editor & Terminal */}
                <div className="flex-1 flex flex-col bg-[#080c14]">
                    <div className="flex-1 relative">
                        {/* Fake Editor Header */}
                        <div className="absolute top-0 left-0 right-0 h-10 border-b border-white/5 bg-[#0b0f1a]/50 flex items-center justify-between px-6 z-10 backdrop-blur-md">
                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em]">main.{language === 'javascript' ? 'js' : language === 'python' ? 'py' : language === 'java' ? 'java' : 'cpp'}</span>
                            <Sparkles size={14} className="text-emerald-500 animate-pulse" />
                        </div>
                        <textarea 
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="w-full h-full pt-14 p-10 bg-transparent text-emerald-400 font-mono text-sm outline-none resize-none spellcheck-false"
                            spellCheck="false"
                        />
                    </div>

                    {/* Integrated Terminal Area */}
                    <div className="h-64 border-t border-white/5 bg-[#0b0f1a] flex flex-col">
                        <div className="flex items-center justify-between px-6 py-3 border-b border-white/5">
                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Terminal size={14} /> Neural Terminal
                            </h4>
                            {output && (
                                <div className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${output.success ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                    {output.success ? 'Validated' : 'Error'}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 flex overflow-hidden">
                            <div className="w-1/4 border-r border-white/5 p-4 space-y-3">
                                <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Standard Input (stdin)</p>
                                <textarea 
                                    value={stdin}
                                    onChange={(e) => setStdin(e.target.value)}
                                    placeholder="Provide input sequence..."
                                    className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-3 text-[10px] font-mono text-emerald-500 outline-none resize-none"
                                />
                            </div>
                            <div className="flex-1 p-6 font-mono text-xs overflow-y-auto custom-scrollbar">
                                <AnimatePresence mode="wait">
                                    {activeTab === 'output' ? (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                            {output ? (
                                                <div className="space-y-4">
                                                    <p className={output.success ? "text-emerald-400" : "text-rose-400"}>{output.message}</p>
                                                    {output.success && (
                                                        <div className="grid grid-cols-3 gap-6 pt-4 border-t border-white/5">
                                                            <div>
                                                                <p className="text-[8px] text-gray-600 uppercase mb-1">Runtime</p>
                                                                <p className="text-white font-black">{output.runtime}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[8px] text-gray-600 uppercase mb-1">Status</p>
                                                                <p className="text-white font-black">STABLE</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[8px] text-gray-600 uppercase mb-1">Reward</p>
                                                                <p className="text-emerald-500 font-black">+{output.coinsEarned} XP</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {output.output && (
                                                        <div className="mt-4 p-4 bg-black/40 rounded-xl border border-white/5">
                                                            <p className="text-[8px] text-gray-600 uppercase mb-2">Standard Output</p>
                                                            <pre className="text-white whitespace-pre-wrap">{output.output}</pre>
                                                        </div>
                                                    )}
                                                    {output.error && (
                                                        <div className="mt-4 p-4 bg-rose-500/10 rounded-xl border border-rose-500/20">
                                                            <p className="text-[8px] text-rose-400 uppercase mb-2">Diagnostic Error</p>
                                                            <pre className="text-rose-500 whitespace-pre-wrap">{output.error}</pre>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-gray-600 italic animate-pulse">Awaiting neural trace execution...</p>
                                            )}
                                        </motion.div>
                                    ) : (
                                        <div className="text-gray-700 flex flex-col items-center justify-center h-full opacity-30">
                                            <Bug size={32} />
                                            <p className="text-[9px] font-black uppercase tracking-widest mt-2">Initialize trace to view diagnostic data</p>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizeWorkspace;
