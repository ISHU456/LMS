import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, ShieldCheck, Sparkles } from 'lucide-react';
import WebcamCapture from './WebcamCapture';
import { useFaceDetection } from '../../hooks/useFaceDetection';

/**
 * Modern Step component for face registration/enrollment
 * @param {Function} onComplete - Callback with final descriptors
 * @param {string} email - Teacher email
 */
const FaceRegistrationStep = ({ onComplete, email }) => {
  const webcamRef = useRef(null);
  const [capturedCount, setCapturedCount] = useState(0);
  const [descriptors, setDescriptors] = useState([]);
  const [lastCaptureSuccessful, setLastCaptureSuccessful] = useState(false);
  
  const { isModelsReady, faceStatus, detection, liveness, multipleFaces } = useFaceDetection(webcamRef, true);

  const captureAngle = () => {
    if (!detection || !liveness || multipleFaces || capturedCount >= 5) return;
    
    // Add 128D descriptor to list
    const newDescriptor = {
      descriptor: Array.from(detection.descriptor),
      quality: Math.round(detection.detection.score * 100)
    };
    
    const updatedDescriptors = [...descriptors, newDescriptor];
    setDescriptors(updatedDescriptors);
    setCapturedCount(updatedDescriptors.length);
    setLastCaptureSuccessful(true);
    
    // Auto-flash effect on capture
    setTimeout(() => setLastCaptureSuccessful(false), 300);
    
    if (updatedDescriptors.length === 5) {
      onComplete(updatedDescriptors);
    }
  };

  // Auto-capture every 1.5 seconds if conditions are met
  useEffect(() => {
    let interval;
    if (capturedCount < 5 && detection && liveness && !multipleFaces) {
      interval = setInterval(() => {
        captureAngle();
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [capturedCount, detection, liveness, multipleFaces]);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
      <div className="text-center group">
         <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 font-black text-[10px] uppercase mb-4 tracking-widest border border-primary-200 dark:border-primary-800/50">
            <ShieldCheck size={14} className="text-emerald-500" />
            Biometric Enrollment Protocol
         </div>
         <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase mb-2 tracking-tight">Synchronize Identity</h3>
         <p className="text-xs text-gray-500 font-bold max-w-sm mx-auto uppercase tracking-wide">Adjust your facial angle slightly after each successful pulse capture.</p>
      </div>

      <div className="relative">
         <WebcamCapture 
           ref={webcamRef} 
           label={`Enrollment Sequence: ${capturedCount}/5`}
           status={multipleFaces ? 'Restricted: Remove obstructions' : faceStatus}
           showOverlay={!lastCaptureSuccessful}
         />
         
         <AnimatePresence>
            {lastCaptureSuccessful && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-white dark:bg-primary-500 rounded-[2.5rem] pointer-events-none" />
            )}
         </AnimatePresence>
      </div>

      <div className="space-y-4">
         <div className="grid grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800/60 shadow-inner">
                 <motion.div 
                   initial={{ width: 0 }} 
                   animate={{ width: capturedCount >= i ? '100%' : '0%' }}
                   className="h-full bg-gradient-to-r from-primary-500 to-indigo-600 shadow-sm shadow-primary-500/20" 
                 />
              </div>
            ))}
         </div>

         <motion.button 
           whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} 
           disabled={!liveness || multipleFaces || capturedCount >= 5}
           onClick={captureAngle}
           className="w-full py-4 rounded-2xl bg-primary-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary-600/30 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
         >
           <UserCheck size={18} />
           {capturedCount < 5 ? `Generate Pulse ${capturedCount + 1}` : 'Enrollment Syncing...'}
         </motion.button>
      </div>

      <div className="flex items-center justify-between text-[10px] text-gray-500 font-black uppercase tracking-widest px-2">
         <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isModelsReady ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
            <span>Engines Ready</span>
         </div>
         <div className="flex items-center gap-2">
            <Sparkles size={12} className="text-secondary-500 animate-spin-slow" />
            <span>Secure Encryption Enabled</span>
         </div>
      </div>
    </motion.div>
  );
};

export default FaceRegistrationStep;
