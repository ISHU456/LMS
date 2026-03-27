import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import WebcamCapture from './WebcamCapture';
import { useFaceDetection } from '../../hooks/useFaceDetection';
import { faceAuthService } from '../../services/faceAuthService';

/**
 * Modern Step component for face login/authentication
 * @param {string} email - User email for matching
 * @param {Function} onSuccess - Callback when authenticated
 * @param {Function} onError - Callback when error occurs
 */
const FaceLoginStep = ({ email, onSuccess, onError }) => {
  const webcamRef = useRef(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  const [lastMatchResult, setLastMatchResult] = useState(null); // 'success', 'fail'
  
  const { isModelsReady, faceStatus, detection, liveness, multipleFaces } = useFaceDetection(webcamRef, true);

  const handleFaceLogin = async () => {
    if (!detection || !liveness || multipleFaces || !isModelsReady || isAuthenticating) return;
    
    setIsAuthenticating(true);
    setLastMatchResult(null);

    try {
      const result = await faceAuthService.loginFace(email, Array.from(detection.descriptor));
      setLastMatchResult('success');
      setTimeout(() => {
        onSuccess(result);
      }, 1000);
    } catch (err) {
      console.error(err);
      setLastMatchResult('fail');
      setErrorCount(prev => prev + 1);
      onError(err.message || 'Face identity not confirmed.');
      setTimeout(() => {
        setIsAuthenticating(false);
        setLastMatchResult(null);
      }, 2000);
    }
  };

  // Auto-attempt login if high confidence
  useEffect(() => {
    let timeout;
    if (detection && liveness && !multipleFaces && !isAuthenticating && !lastMatchResult) {
      // Small delay before auto-auth
      timeout = setTimeout(() => {
        if (detection.detection.score > 0.9) {
          handleFaceLogin();
        }
      }, 1000);
    }
    return () => clearTimeout(timeout);
  }, [detection, liveness, multipleFaces, isAuthenticating]);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
      <div className="text-center group">
         <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase mb-4 tracking-widest border border-indigo-200 dark:border-indigo-800/50">
            <ShieldCheck size={14} className="text-primary-500" />
            Biometric Clearance Protocol
         </div>
         <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase mb-2 tracking-tight">Identity Verification</h3>
         <p className="text-xs text-gray-500 font-bold max-w-sm mx-auto uppercase tracking-wide">Look directly at the sensor to confirm your academic credentials.</p>
      </div>

      <div className="relative group overflow-hidden rounded-[2.5rem]">
         <WebcamCapture 
           ref={webcamRef} 
           label={isAuthenticating ? 'System Authenticating...' : 'Ready for Scan'}
           status={multipleFaces ? 'Restricted: Too many faces' : faceStatus}
           showOverlay={!isAuthenticating}
         />
         
         {/* Verification Scanning Line Overlay */}
         {isAuthenticating && !lastMatchResult && (
           <motion.div 
             initial={{ top: '0%' }} 
             animate={{ top: '100%' }} 
             transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
             className="absolute left-0 right-0 h-1 bg-primary-500 shadow-[0_0_15px_rgba(67,97,238,0.8)] z-10 pointer-events-none" 
           />
         )}

         {/* Result Overlays */}
         <AnimatePresence>
            {lastMatchResult === 'success' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center z-20 pointer-events-none backdrop-blur-sm">
                 <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center">
                    <UserCheck size={48} className="text-emerald-500 mb-2 animate-bounce" />
                    <span className="text-xs font-black uppercase text-gray-900">Access Granted</span>
                 </div>
              </motion.div>
            )}
            
            {lastMatchResult === 'fail' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-red-500 rounded-[2.5rem] flex items-center justify-center z-20 pointer-events-none backdrop-blur-sm">
                 <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center">
                    <AlertCircle size={48} className="text-red-500 mb-2 animate-pulse" />
                    <span className="text-xs font-black uppercase text-gray-900">Identity Mismatch</span>
                 </div>
              </motion.div>
            )}
         </AnimatePresence>
      </div>

      <div className="space-y-4">
         <motion.button 
           whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} 
           disabled={!liveness || multipleFaces || isAuthenticating || !isModelsReady}
           onClick={handleFaceLogin}
           className={`w-full py-4 rounded-2xl text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 ${
             lastMatchResult === 'success' ? 'bg-emerald-600 shadow-emerald-600/30' : 
             lastMatchResult === 'fail' ? 'bg-red-600 shadow-red-600/30' : 
             'bg-indigo-600 shadow-indigo-600/30 hover:bg-indigo-700 disabled:opacity-50'
           }`}
         >
           <UserCheck size={18} />
           {isAuthenticating ? 'Verifying Identity...' : 'Initiate Biometric Scan'}
         </motion.button>
         
         {errorCount >= 2 && (
            <p className="text-center text-[10px] font-black uppercase tracking-widest text-red-500 animate-pulse">
               Multiple mismatches. Ensure consistent lighting & head position.
            </p>
         )}
      </div>

      <div className="flex items-center justify-between text-[10px] text-gray-500 font-black uppercase tracking-widest px-2 group">
         <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isModelsReady ? 'bg-indigo-500' : 'bg-red-500'} animate-pulse`} />
            <span className="group-hover:text-indigo-500 transition-colors">Neural Engines Enabled</span>
         </div>
         <div className="flex items-center gap-2">
            <Sparkles size={12} className="text-secondary-500 animate-spin-slow transition-transform" />
            <span>High-Fashion AI Security</span>
         </div>
      </div>
    </motion.div>
  );
};

export default FaceLoginStep;
