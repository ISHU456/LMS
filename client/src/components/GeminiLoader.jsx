import React from 'react';
import { motion } from 'framer-motion';

const GeminiLoader = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center w-full h-full bg-black">
      <div className="relative w-24 h-24">
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-600 via-purple-500 to-red-500"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, loop: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-1 rounded-full bg-black" />
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            scale: [0.9, 1, 0.9],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 2,
            loop: Infinity,
            ease: 'easeInOut',
          }}
        >
            <div className="w-full h-full rounded-full border-2 border-primary-500/50" />
        </motion.div>
      </div>
    </div>
  );
};

export default GeminiLoader;
