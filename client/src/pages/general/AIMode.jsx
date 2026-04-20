import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Send, X, Sparkles, BrainCircuit, 
  Zap, Rocket, MessageSquare, ArrowLeft,
  Loader2, User, Shield, Mic, 
  Trash2, History, AlertCircle, CheckCircle2,
  Lock, Key, ZapOff, Database, Cpu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { playNotificationSound } from '../../utils/soundUtils';
import { updateProfile } from '../../features/auth/authSlice';

const AIMode = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "# Neural Overdrive Active\n\nWelcome to the specialized **AI Beast Mode**. I am your high-performance academic core. My logic processors are peaked for complex derivation and strategic research.\n\n**Warning:** Every query consumes 1 Neural Credit. Use them wisely.", 
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [credits, setCredits] = useState(user?.credits || 0);
  const [limitReached, setLimitReached] = useState(false);
  const [requestSent, setRequestSent] = useState(user?.aiCreditsRequested || false);
  const [sessionId, setSessionId] = useState(`session_${Date.now()}`);
  
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);

  // Sync credits when user profile updates (e.g., after admin grant)
  useEffect(() => {
    if (user?.credits !== undefined) {
      setCredits(user.credits);
      if (user.credits > 0) setLimitReached(false);
    }
    if (user?.aiCreditsRequested !== undefined) {
      setRequestSent(user.aiCreditsRequested);
    }
  }, [user?.credits, user?.aiCreditsRequested]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (historyOpen) fetchHistory();
  }, [historyOpen]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/chatbot/history', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setChatHistory(res.data);
    } catch (err) {
      console.error("Failed to fetch history");
    }
  };

  const handleSend = async (e, messageOverride = null) => {
    if (e) e.preventDefault();
    const finalInput = messageOverride || input;
    if (!finalInput.trim() || !user || isLoading || credits <= 0) return;
 
    const userMsg = { id: Date.now(), text: finalInput, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    if (!messageOverride) setInput('');
    setIsLoading(true);
 
    try {
      const res = await axios.post('http://localhost:5001/api/chatbot/ask', {
        message: finalInput,
        sessionId: sessionId,
        history: messages.map(m => ({ role: m.sender === 'bot' ? 'model' : 'user', parts: [{ text: m.text }] }))
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
 
      const botMsg = { 
        id: Date.now() + 1, 
        text: res.data.response, 
        sender: 'bot', 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, botMsg]);
      setCredits(res.data.remainingCredits);
      dispatch(updateProfile({ credits: res.data.remainingCredits }));
      if (res.data.remainingCredits <= 0) setLimitReached(true);
      
      playNotificationSound();
    } catch (err) {
      if (err.response?.status === 403) {
        setLimitReached(true);
      }
      const errorMsg = { 
        id: Date.now() + 1, 
        text: "Neural Link interrupted. Please check credits or connection.", 
        sender: 'bot', 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoiceRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Neural voice synthesis is not supported on this device/browser.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript.trim()) {
        setInput(transcript);
        setIsListening(false);
        // Direct dispatch for zero-latency voice interaction
        handleSend(null, transcript);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const requestCredits = async () => {
    try {
      await axios.post('http://localhost:5001/api/chatbot/request-credits', {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setRequestSent(true);
    } catch (err) {
      alert("Failed to send request.");
    }
  };

  const loadSession = (session) => {
    setSessionId(session.sessionId);
    const msgs = session.messages.map((m, idx) => ({
      id: idx,
      text: m.content,
      sender: m.role === 'assistant' ? 'bot' : 'user',
      timestamp: m.timestamp
    }));
    setMessages(msgs);
    setHistoryOpen(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const deleteSession = async (sessionId) => {
    if (!window.confirm("Terminate this neural log indefinitely?")) return;
    try {
      await axios.delete(`http://localhost:5001/api/chatbot/delete/${sessionId}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setChatHistory(prev => prev.filter(s => s.sessionId !== sessionId));
    } catch (err) {
      alert("Failed to terminate session.");
    }
  };

  const grantCreditsToEmail = async () => {
    const email = document.getElementById('studentEmailInp').value;
    if (!email) return;
    try {
      // We need a backend endpoint to grant by email or we can use the existing grant/:userId
      // For now, let's assume we fetch user by email first or have an endpoint that takes email
      // To keep it simple and within existing logic, I'll update the backend to support email or just use email as ID if we handle it
      await axios.post(`http://localhost:5001/api/chatbot/grant-by-email`, { email }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      alert(`Credits synchronized for ${email}`);
      document.getElementById('studentEmailInp').value = '';
    } catch (err) {
      alert("User not found or protocol failed.");
    }
  };

  const clearChat = () => {
    setSessionId(`session_${Date.now()}`);
    setMessages([{ 
      id: 1, 
      text: "# New Session Initialized\n\nReady for fresh parameters.", 
      sender: 'bot',
      timestamp: new Date()
    }]);
  };

  return (
    <AnimatePresence>
      <motion.div 
        key="ai-mode-beast"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[5000] bg-[#030712] flex flex-col overflow-hidden text-gray-100"
      >
        {/* --- BEAST MODE AMBIENT BACKGROUND - OPTIMIZED --- */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1e1b4b_0%,#030712_100%)]" />
          
          {/* Static Ambient Glows (Non-Animated for Performance) */}
          <div className="absolute top-1/4 left-1/4 w-[60vw] h-[60vw] rounded-full bg-orange-600/5 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[50vw] h-[50vw] rounded-full bg-indigo-600/5 blur-[120px]" />

          {/* Grid Overlay */}
          <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.05]" style={{backgroundImage: 'radial-gradient(#4f46e5 0.5px, transparent 0.5px)', backgroundSize: '24px 24px'}} />
        </div>

        {/* --- HEADER --- */}
        <header className="relative z-10 px-8 py-5 border-b border-white/5 bg-gray-950/40 backdrop-blur-3xl flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button 
              onClick={() => navigate('/')}
              className="group p-3 rounded-2xl bg-white/5 hover:bg-orange-600/20 text-gray-400 hover:text-orange-500 transition-all"
            >
              <ArrowLeft size={22} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-rose-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(234,88,12,0.4)]">
                <Zap size={24} />
              </div>
              <div>
                <h1 className="text-xl font-black uppercase tracking-tighter leading-none mb-1 text-white">AI OVERDRIVE</h1>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">BEAST MODE ENGAGED</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className={`px-5 py-2.5 rounded-2xl border ${credits > 0 ? 'bg-indigo-600/10 border-indigo-500/20' : 'bg-rose-600/10 border-rose-500/20'} flex items-center gap-3`}>
               {credits > 0 ? <Zap size={14} className="text-indigo-400" /> : <ZapOff size={14} className="text-rose-400" />}
               <span className={`text-[10px] font-black uppercase tracking-widest ${credits > 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                 {user?.role === 'teacher' ? 'Faculty Focus: ' : 'Neural Bank: '} {credits} Credits
               </span>
            </div>
          </div>
        </header>

        {/* --- MAIN INTERFACE: PERSISTENT SIDEBAR --- */}
        <main className="relative z-10 flex-1 flex overflow-hidden">
          
          <aside className="hidden lg:flex w-80 bg-gray-950/40 backdrop-blur-3xl border-r border-white/5 flex-col p-6 overflow-hidden">
             {/* Neural Logs Section */}
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                  <Database size={14} className="text-indigo-400" /> Neural Logs
                </h3>
             </div>
             
             <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar mb-8">
                {chatHistory.length > 0 ? chatHistory.map((session, i) => (
                  <div key={i} className="group relative">
                    <button 
                      onClick={() => loadSession(session)}
                      className="w-full text-left p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/40 hover:bg-indigo-600/5 transition-all"
                    >
                      <p className="text-[9px] font-bold text-gray-500 mb-1">{new Date(session.lastActive).toLocaleDateString()}</p>
                      <p className="text-[11px] font-black text-gray-200 uppercase tracking-tight line-clamp-1 group-hover:text-white">{session.title}</p>
                    </button>
                    {user?.role === 'admin' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteSession(session.sessionId); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-rose-600/20 text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-600 hover:text-white"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                )) : (
                  <div className="text-center py-20 opacity-20">
                     <p className="text-[9px] uppercase font-black tracking-widest">Logs Clear</p>
                  </div>
                )}
             </div>

             {/* Admin Control Center - Credit Injector */}
             {user?.role === 'admin' && (
               <div className="mt-auto border-t border-white/10 pt-8 space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">Admin Protocols</h4>
                    <div className="flex gap-2">
                       <input 
                         id="studentEmailInp"
                         type="text" 
                         placeholder="Inquiry User Email..."
                         className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-[10px] font-bold outline-none focus:border-indigo-500 transition-all"
                       />
                       <button 
                         onClick={() => grantCreditsToEmail()}
                         className="bg-indigo-600 text-white p-2.5 rounded-xl hover:shadow-[0_0_15px_rgba(79,70,229,0.4)] transition-all"
                         title="Inject Credits"
                       >
                         <Zap size={14} />
                       </button>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-indigo-900/20 border border-indigo-500/20">
                     <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                        <Lock size={10} /> Tier-1 Auth Status
                     </p>
                     <p className="text-[10px] font-bold text-gray-300 uppercase italic">Advanced administrative override active.</p>
                  </div>
               </div>
             )}
          </aside>

          <div className="flex-1 flex flex-col relative">
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-6 py-10 md:px-24 space-y-10 no-scrollbar"
            >
              {messages.map((msg) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id}
                  className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex w-full ${msg.sender === 'user' ? 'gap-8 max-w-[85%] flex-row-reverse' : 'max-w-full'}`}>
                    {msg.sender === 'user' && (
                      <div className="w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center border border-orange-500 bg-orange-600 shadow-[0_0_30px_rgba(234,88,12,0.4)] mt-2">
                        <User size={24} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className={`relative px-10 py-8 rounded-2xl text-base leading-relaxed transition-all duration-300 ${
                        msg.sender === 'user' 
                          ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-2xl border border-white/10' 
                          : 'bg-white/5 border border-white/10 backdrop-blur-3xl text-gray-100 font-medium hover:bg-white/[0.08] shadow-inner'
                      }`}>
                         {msg.sender === 'bot' ? (
                          <div className="prose prose-md prose-invert max-w-none prose-headings:text-orange-500 prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tighter prose-strong:text-indigo-400 prose-code:text-orange-400 prose-pre:bg-black/40 prose-pre:rounded-[2rem] prose-pre:p-8 prose-pre:border prose-pre:border-white/5">
                             <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                          </div>
                        ) : <p className="font-extrabold text-lg tracking-tight">{msg.text}</p>}
                      </div>
                      <p className={`text-[10px] font-black text-white/10 uppercase tracking-[0.4em] mt-4 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Sync Priority High
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <div className="flex items-center gap-6">
                  <div className="flex gap-2">
                    <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 rounded-full bg-orange-500" />
                    <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1]" />
                    <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 rounded-full bg-rose-500" />
                  </div>
                </div>
              )}
            </div>

            {/* Credit Limit Overlay */}
            <AnimatePresence>
              {limitReached && (
                <motion.div 
                  initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                  animate={{ opacity: 1, backdropFilter: "blur(10px)" }}
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center p-8 bg-gray-950/60"
                >
                  <div className="max-w-md w-full glass bg-gray-900/80 border border-rose-500/30 rounded-[3rem] p-10 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.5)]" />
                    <div className="w-20 h-20 rounded-3xl bg-rose-600/20 text-rose-500 flex items-center justify-center mx-auto mb-8 shadow-inner">
                       <Lock size={40} />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-4">Core Limit Reached</h2>
                    <p className="text-sm text-gray-400 leading-relaxed mb-10">
                      Free tokens exhausted. Admin authorization required for extended sessions.
                    </p>
                    
                    {requestSent ? (
                      <div className="px-6 py-4 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center gap-3">
                        <CheckCircle2 size={20} />
                        <span className="text-xs font-black uppercase tracking-widest">Pending Review</span>
                      </div>
                    ) : (
                      <button 
                        onClick={requestCredits}
                        className="w-full py-5 bg-indigo-600 text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:bg-orange-600 transition-all flex items-center justify-center gap-3"
                      >
                        <Key size={16} /> Authorize Sync
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-4 md:px-12 md:pb-6">
               <div className="max-w-4xl mx-auto bg-white rounded-2xl p-2 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                 <form onSubmit={handleSend} className="flex items-center gap-2 pl-4">
                   <input 
                     type="text"
                     value={input}
                     onChange={(e) => setInput(e.target.value)}
                     placeholder={credits > 0 ? "Strategic Input Required..." : "Authorizing..."}
                     disabled={isLoading || credits <= 0}
                     className="flex-1 py-2.5 px-2 bg-transparent border-none outline-none font-bold text-base text-gray-900 placeholder:text-gray-500 placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest transition-all"
                   />
                   <div className="flex items-center gap-1.5 pr-1.5">
                       <button 
                         type="button" 
                         onClick={toggleVoiceRecognition}
                         className={`p-2 transition-all hidden sm:block ${isListening ? 'text-rose-500 animate-pulse scale-110' : 'text-gray-800 hover:text-orange-600'}`}
                       >
                         {isListening ? <Mic size={20} className="fill-current" /> : <Mic size={20} />}
                       </button>
                       <motion.button
                         whileHover={{ scale: 1.05 }}
                         whileTap={{ scale: 0.95 }}
                         type="submit"
                         disabled={isLoading || !input.trim() || credits <= 0}
                         className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all ${
                           credits > 0 
                             ? 'bg-orange-600 text-white shadow-[0_0_20px_rgba(234,88,12,0.4)] hover:bg-orange-500' 
                             : 'bg-gray-800 text-gray-600 opacity-50'
                         }`}
                       >
                         <Send size={18} />
                       </motion.button>
                   </div>
                 </form>
               </div>
            </div>
          </div>
        </main>


        <style>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          .glass { backdrop-filter: blur(20px); }
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
};

export default AIMode;
