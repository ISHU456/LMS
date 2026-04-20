import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, X, Send, Bot, User, Sparkles, 
  Loader2, Minimize2, Trash2, Lock, ArrowLeft, 
  Zap, BrainCircuit, Rocket, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { playNotificationSound } from '../utils/soundUtils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLocation, Link } from 'react-router-dom';

const Chatbot = ({ variant = 'floating', className = '', noAutoScroll = false }) => {
  const [isOpen, setIsOpen] = useState(variant === 'inline');
  const [messages, setMessages] = useState([
    { id: 1, text: "System online. Intelligence Terminal active. Optimized by Gemini 2.0. How can I assist your scholarship?", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  // Extract subject context from URL if available
  const getSubjectContext = () => {
    const path = location.pathname;
    if (path.includes('/courses/')) {
      const parts = path.split('/');
      return parts[parts.length - 1] || parts[parts.length - 2];
    }
    return null;
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: "smooth", 
        block: "nearest", // Prevents scrolling the whole page
        inline: "start" 
      });
    }
  };

  useEffect(() => {
    if (isOpen && !noAutoScroll) {
      scrollToBottom();
    }
  }, [messages, isOpen, noAutoScroll]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const userMessage = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const subject = getSubjectContext();
      const res = await axios.post('http://localhost:5001/api/chatbot/ask', { 
        message: input,
        subject: subject,
        history: messages 
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      const botMessage = { id: Date.now() + 1, text: res.data.response, sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);
      playNotificationSound();
    } catch (err) {
      console.error(err);
      const errorMessage = { id: Date.now() + 1, text: "I'm having trouble connecting right now. Please try again later!", sender: 'bot' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([{ id: 1, text: "Thread purged. Node ready for new assignment.", sender: 'bot' }]);
  };

  const chatWindow = (
    <div className={`flex flex-col h-full bg-white dark:bg-[#030712] rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-800/50 overflow-hidden relative w-full h-full`}>
      
      {/* --- BOOST MODE BACKGROUND --- */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary-500/20 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Auth Lock Overlay */}
      {!user && (
        <div className="absolute inset-0 z-[60] backdrop-blur-xl bg-white/60 dark:bg-black/60 flex flex-col items-center justify-center p-10 text-center">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-primary-500 to-indigo-600 shadow-2xl flex items-center justify-center mb-8 text-white"
          >
            <Lock size={36} />
          </motion.div>
          <h4 className="text-2xl font-black text-gray-900 dark:text-white mb-3 uppercase tracking-tighter">Secure AI Access</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 font-medium leading-relaxed">Unlock the full power of Gemini AI to accelerate your academic performance.</p>
          <Link 
            to="/login" 
            className="px-10 py-4 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/30"
          >
            Login to Explore
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 p-5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {variant === 'floating' && (
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                title="Close AI Dashboard"
              >
                <X size={22} className="text-gray-400 hover:text-rose-500 transition-colors" />
              </button>
            )}
            <div className="flex items-center gap-3">
              <motion.div layoutId="chatbot-icon" className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center relative overflow-hidden group border border-primary-100 dark:border-primary-500/20">
                <BrainCircuit size={20} className="relative z-10 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform" />
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 bg-gradient-to-br from-transparent via-primary-500/5 to-transparent p-4"
                />
              </motion.div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-[0.2em] leading-none">Intelligence Terminal</h3>
                  <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">Secure Sync</span>
                </div>
                <div className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                  <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div> Gemini 2.0 Advanced Reasoning Engine
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={clearChat} className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/10 text-gray-400 hover:text-rose-500 rounded-xl transition-colors border border-gray-100 dark:border-gray-800" title="Flush Thread">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gray-50/30 dark:bg-[#030712]/50">
        {messages.map((msg) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={msg.id} 
            className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-6 w-full ${msg.sender === 'user' ? 'max-w-[90%] flex-row-reverse' : 'max-w-full flex-row'}`}>
              <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-xl border mt-1 transition-transform hover:scale-110 ${
                msg.sender === 'user' 
                  ? 'bg-primary-600 text-white border-primary-500 shadow-primary-500/20' 
                  : 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/20'
              }`}>
                {msg.sender === 'user' ? <User size={20} /> : <Bot size={20} />}
              </div>
              <div className={`flex-1 relative px-6 py-5 rounded-[2.5rem] text-sm font-bold leading-relaxed transition-all ${
                msg.sender === 'user' 
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-tr-none border border-gray-100 dark:border-gray-700 shadow-xl' 
                  : 'bg-white/40 dark:bg-white/5 backdrop-blur-xl text-gray-800 dark:text-gray-100 border border-white/20 dark:border-white/10 shadow-sm rounded-tl-none'
              }`}>
                {msg.sender === 'user' ? (
                  msg.text
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-gray-100 dark:prose-pre:bg-gray-900/50 prose-pre:p-6 prose-pre:rounded-3xl prose-code:text-primary-600 dark:prose-code:text-primary-400 prose-headings:text-indigo-600 dark:prose-headings:text-indigo-400">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                )}
                
                {msg.sender === 'bot' && (
                  <div className="absolute top-4 right-4 opacity-[0.03] pointer-events-none">
                    <BrainCircuit size={48} />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex gap-4 max-w-[80%]">
              <div className="w-10 h-10 rounded-2xl bg-white dark:bg-gray-800 text-indigo-600 border border-gray-100 dark:border-gray-700 flex items-center justify-center shadow-lg">
                <Loader2 size={20} className="animate-spin" />
              </div>
              <div className="px-6 py-4 rounded-[2rem] rounded-tl-none bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
                <div className="flex gap-1">
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                </div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse ml-2">Synthesizing Response...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="relative z-20 p-6 bg-white dark:bg-[#030712] border-t border-gray-100 dark:border-gray-800/50">
        <form onSubmit={handleSend} className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Synchronize query..."
              disabled={!user}
              className="w-full pl-6 pr-14 py-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-transparent focus:border-primary-500/50 dark:focus:border-indigo-500/50 outline-none font-black text-sm text-gray-900 dark:text-white transition-all disabled:opacity-50 shadow-inner"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 hidden md:block">
              <Zap size={18} />
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={isLoading || !user}
            className="w-14 h-14 bg-gradient-to-br from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white rounded-2xl transition-all shadow-xl shadow-primary-500/20 disabled:opacity-50 flex items-center justify-center flex-shrink-0"
          >
            <Send size={24} />
          </motion.button>
        </form>

      </div>
    </div>
  );

  if (variant === 'inline') {
    return <div className={`w-full h-full min-h-[500px] ${className}`}>{chatWindow}</div>;
  }

  return (
    <>
      <div className={`fixed bottom-6 right-6 z-[1000] floating-chatbot-launcher ${className}`}>
        {/* Launch Button */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: 8, boxShadow: '0 20px 40px -10px rgba(79, 70, 229, 0.4)' }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-primary-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xl shadow-primary-500/20 border-2 border-white/20 dark:border-white/10 backdrop-blur-xl relative group overflow-hidden"
        >
          <motion.div layoutId="chatbot-icon" className="relative z-10 transition-colors">
            <AnimatePresence mode="wait">
              {isOpen ? (
                <X size={22} key="x" className="text-white" />
              ) : (
                <div key="chat-icon" className="relative">
                  <MessageSquare size={22} className="text-white" />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-2 -right-2 text-amber-300"
                  >
                    <Sparkles size={12} fill="currentColor" />
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
          
          {/* Animated Background Pulse */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 bg-white/20 rounded-full blur-xl"
          />

          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5"
          />
          
          {/* Sparkle effects on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <Sparkles size={10} className="absolute top-2 left-3 text-amber-300 animate-pulse" />
            <Sparkles size={8} className="absolute bottom-3 right-3 text-blue-200 animate-pulse" />
          </div>
        </motion.button>
      </div>

      {/* Floating Popup Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            layoutId="chatbot-window"
            initial={{ opacity: 0, y: 40, scale: 0.9, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-28 right-8 z-[2000] w-[400px] h-[600px] max-w-[95vw] max-h-[80vh] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.4)] rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-gray-800"
          >
            {chatWindow}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
