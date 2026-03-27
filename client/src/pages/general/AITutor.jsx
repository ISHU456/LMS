import React from 'react';
import Chatbot from '../../components/Chatbot';
import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft, BrainCircuit, GraduationCap, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const AITutor = () => {
  return (
    <div className="min-h-screen bg-[#fafbfc] dark:bg-[#030712] flex flex-col relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-8 md:px-12 flex flex-col md:flex-row items-center justify-between border-b border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md">
        <div className="flex items-center gap-6 mb-4 md:mb-0">
          <Link to="/" className="p-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 transition-all">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={18} className="text-amber-500" />
              <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">AI Academic Assistant</h1>
            </div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Personalized 24/7 Learning Tutor</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-4">
            <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">Topper Mode</span>
            <span className="text-[9px] font-bold text-gray-400 uppercase">Powered by Gemini Pro</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
            <BrainCircuit size={24} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8 relative z-10 max-w-[1600px]">
        
        {/* Sidebar Info */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 shadow-xl">
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6">How to use</h3>
            <ul className="space-y-6">
              {[
                { icon: GraduationCap, title: "Academic Doubts", desc: "Ask about any complex topic from your curriculum." },
                { icon: Zap, title: "Exam Strategy", desc: "Get tips on how to score better in specific subjects." },
                { icon: BrainCircuit, title: "Concept Deep-dive", desc: "Request structured explanations with examples." }
              ].map((item, i) => (
                <li key={i} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                    <item.icon size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase mb-1">{item.title}</h4>
                    <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-br from-primary-600 to-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-primary-600/20 overflow-hidden relative group">
            <div className="relative z-10">
              <h3 className="text-lg font-black uppercase tracking-tight mb-2">Need Help?</h3>
              <p className="text-xs font-bold opacity-80 mb-6 leading-relaxed">Our AI is fine-tuned to help you master your engineering subjects with ease.</p>
              <button className="w-full py-3 bg-white text-primary-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all">
                View Tutorial
              </button>
            </div>
            <Sparkles size={120} className="absolute -bottom-10 -right-10 opacity-10 group-hover:rotate-12 transition-transform duration-500" />
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col">
          <Chatbot variant="inline" className="h-full shadow-2xl" />
        </div>

      </main>
    </div>
  );
};

export default AITutor;
