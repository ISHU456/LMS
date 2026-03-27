import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import Webcam from 'react-webcam';
import { Camera, CameraOff, Sparkles } from 'lucide-react';

/**
 * Reusable Webcam wrapper with framer-motion borders
 */
const WebcamCapture = forwardRef(({ label = 'System Ready', status = 'Waiting...', showOverlay = true, onUserMediaError }, ref) => {
  const webcamRef = useRef(null);

  // Expose webcam instance to parent components
  useImperativeHandle(ref, () => ({
    get video() { return webcamRef.current?.video; },
    getScreenshot(options) { return webcamRef.current?.getScreenshot(options); }
  }));

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user"
  };

  return (
    <div className="relative w-full max-w-lg mx-auto overflow-hidden rounded-[2.5rem] border-2 border-primary-500/20 shadow-2xl bg-black/5 dark:bg-white/5 backdrop-blur-3xl group">
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={videoConstraints}
        className="w-full h-full object-cover scale-x-[-1]" // Mirrored for better UX
        onUserMediaError={onUserMediaError}
      />
      
      {/* Dynamic Overlay Bounding Box */}
      {showOverlay && (
        <div className="absolute inset-0 border-[3px] border-primary-500/30 rounded-[2.5rem] animate-pulse pointer-events-none" />
      )}

      {/* Modern Status Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/40 backdrop-blur-xl flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${status.includes('No face') ? 'bg-red-500/20 border-red-500/40 text-red-500' : 'bg-primary-500/20 border-primary-500/40 text-primary-400'}`}>
               <Camera size={16} />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-primary-400 mb-0.5">{label}</p>
               <p className="text-xs font-bold text-white leading-tight uppercase tracking-tight">{status}</p>
            </div>
         </div>
         <Sparkles size={18} className="text-primary-400 animate-spin-slow" />
      </div>
    </div>
  );
});

export default WebcamCapture;
