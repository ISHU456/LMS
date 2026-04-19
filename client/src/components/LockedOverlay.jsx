import { motion } from 'framer-motion';
import { Lock as LockIcon, UserPlus, LogIn } from 'lucide-react';

import { Link } from 'react-router-dom';

const LockedOverlay = ({ title = "Secure Content Locked", message = "Authentication required to access the academic matrix." }) => {
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center p-6 pb-20 overflow-hidden">
      {/* Blur Background */}
      <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-2xl" />
      
      {/* Animated Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px] animate-pulse" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 w-full max-w-xs bg-white dark:bg-[#0f172a] p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.12)] text-center flex flex-col items-center"
      >
        <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-inner ring-1 ring-amber-500/20">
          <LockIcon size={32} strokeWidth={2.5} />

        </div>

        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-3 leading-none">
          {title}
        </h2>
        
        <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 mb-8 leading-relaxed uppercase tracking-widest max-w-[200px]">
          {message}
        </p>

        <div className="w-full flex flex-col gap-2">
          <Link 
            to="/login"
            className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:bg-primary-600 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <LogIn size={14} /> Init Access
          </Link>
          
          <Link 
            to="/register"
            className="w-full py-2 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 font-black text-[9px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2"
          >
            Register Profile
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-50 dark:border-gray-800/50 w-full flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Protocol Enforced</span>
        </div>
      </motion.div>
    </div>
  );
};

export default LockedOverlay;
