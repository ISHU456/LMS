import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, BrainCircuit } from 'lucide-react';

const GeminiLoader = ({ text = "Synthesizing Neural Data...", fullScreen = false }) => {
  const containerClass = fullScreen 
    ? "fixed inset-0 z-[999] flex flex-col items-center justify-center bg-white dark:bg-[#030712]"
    : "flex flex-col items-center justify-center w-full p-12 min-h-[400px]";

  return (
    <div className={containerClass}>
      {/* Dynamic Background Gradients */}
      {fullScreen && (
        <>
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 dark:bg-blue-600/5 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 dark:bg-purple-600/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        </>
      )}

      <div className="relative flex items-center justify-center">
        {/* Outer Orbital Rings */}
        <motion.div
           className="absolute w-32 h-32 rounded-full border border-blue-500/20 dark:border-blue-400/10"
           animate={{ rotate: 360 }}
           transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
           className="absolute w-24 h-24 rounded-full border border-purple-500/20 dark:border-purple-400/10"
           animate={{ rotate: -360 }}
           transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />

        {/* Pulsing Glow Orb */}
        <motion.div
           className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 via-purple-500 to-rose-500 blur-[30px] opacity-40 dark:opacity-60 absolute"
           animate={{
             scale: [1, 1.4, 1],
             opacity: [0.3, 0.6, 0.3],
           }}
           transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Core Icon Container */}
        <motion.div
           className="relative z-10 w-16 h-16 rounded-3xl bg-white dark:bg-slate-900 shadow-2xl flex items-center justify-center border border-slate-100 dark:border-slate-800"
           animate={{
              y: [0, -8, 0],
              boxShadow: ["0 10px 25px -5px rgba(0,0,0,0.1)", "0 25px 50px -12px rgba(0,0,0,0.25)", "0 10px 25px -5px rgba(0,0,0,0.1)"]
           }}
           transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <BrainCircuit className="text-blue-600 dark:text-blue-400" size={32} />
          <motion.div 
            className="absolute -top-1 -right-1"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Sparkles className="text-amber-500" size={16} />
          </motion.div>
        </motion.div>
      </div>
      
      <motion.div 
         initial={{ opacity: 0, y: 10 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.3 }}
         className="mt-10 flex flex-col items-center"
      >
        <div className="flex items-center gap-2 mb-2">
            <span className="h-[1px] w-8 bg-gradient-to-r from-transparent to-slate-200 dark:to-slate-800" />
            <span className="text-[10px] font-black uppercase tracking-[0.5em] bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-rose-600">
               NEURAL SYNC
            </span>
            <span className="h-[1px] w-8 bg-gradient-to-l from-transparent to-slate-200 dark:to-slate-800" />
        </div>
        <div className="flex flex-col items-center gap-1">
            <span className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">
               {text}
            </span>
            <div className="flex gap-1 mt-2">
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-blue-500/40 dark:bg-blue-400/40"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                ))}
            </div>
        </div>
      </motion.div>
    </div>
  );
};

export default GeminiLoader;


