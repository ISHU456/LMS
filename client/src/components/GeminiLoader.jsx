import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const GeminiLoader = ({ text = "Synthesizing Data...", fullScreen = false }) => {
  const containerClass = fullScreen 
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-[#030712]/80 backdrop-blur-3xl"
    : "flex flex-col items-center justify-center w-full p-12";

  return (
    <div className={containerClass}>
      <div className="relative flex items-center justify-center">
        {/* Outer Glow Orb */}
        <motion.div
           className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 via-purple-500 to-rose-500 blur-[20px] opacity-60 dark:opacity-80 absolute"
           animate={{
             scale: [1, 1.5, 1],
             rotate: [0, 90, 180, 270, 360],
           }}
           transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Core Star / Icon */}
        <motion.div
           className="relative z-10 w-12 h-12 rounded-full bg-white dark:bg-gray-900 shadow-xl flex items-center justify-center border border-gray-100 dark:border-gray-800"
           animate={{
              scale: [0.9, 1.1, 0.9],
           }}
           transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="text-purple-600 dark:text-purple-400" size={24} />
        </motion.div>
      </div>
      
      <motion.div 
         initial={{ opacity: 0, y: 5 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.2 }}
         className="mt-6 flex flex-col items-center"
      >
        <span className="text-[10px] font-black uppercase tracking-[0.4em] bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
           Lattice Connection
        </span>
        <span className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-1">
           {text}
        </span>
      </motion.div>
    </div>
  );
};

export default GeminiLoader;

