import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import Webcam from 'react-webcam';
import { calculateEAR, loadModels } from '../utils/faceUtils';
import { useMFA } from '../MFAContext';
import { Check, Eye, AlertCircle } from 'lucide-react';

const BlinkCheck = () => {
  const webcamRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [blinkDetected, setBlinkDetected] = useState(false);
  const [progress, setProgress] = useState(0);
  const { completeStep, setMFAError } = useMFA();
  const detectionInterval = useRef(null);

  useEffect(() => {
    let interval = null;
    const init = async () => {
      const loaded = await loadModels();
      if (loaded) {
        setLoading(false);
        startDetection();
      } else {
         setMFAError('Failed to load Face Models');
      }
    };

    const startDetection = () => {
      interval = setInterval(async () => {
        if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
          const video = webcamRef.current.video;
          try {
            const detection = await faceapi.detectSingleFace(
              video, 
              new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
            ).withFaceLandmarks();

            if (detection) {
              const leftEye = detection.landmarks.getLeftEye();
              const rightEye = detection.landmarks.getRightEye();

              const leftEAR = calculateEAR(leftEye);
              const rightEAR = calculateEAR(rightEye);
              const avgEAR = (leftEAR + rightEAR) / 2;

              // Blink threshold typically around 0.20-0.25. 0.24 is more tolerant.
              if (avgEAR < 0.24) {
                 setBlinkDetected(true);
                 setProgress(100);
                 setTimeout(() => {
                    if (interval) clearInterval(interval);
                    completeStep('liveness');
                 }, 600);
              } else {
                 setProgress(prev => Math.min(prev + 2, 50));
              }
            }
          } catch (err) {
            console.error("Blink detection error:", err);
          }
        }
      }, 150);
    };

    init();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex flex-col items-center animate-fade-in p-6 bg-white rounded-2xl shadow-xl w-full max-w-md">
      <div className="text-xl font-semibold mb-4 text-center">Liveness Check: Blink to verify</div>
      
      <div className="relative w-full aspect-video rounded-xl overflow-hidden border-4 border-slate-100 mb-6">
        <Webcam
          ref={webcamRef}
          audio={false}
          className="w-full h-full object-cover"
        />
        {loading && (
           <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center text-white">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
           </div>
        )}
        {blinkDetected && (
           <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
              <div className="bg-green-500 text-white p-3 rounded-full animate-bounce">
                <Check className="w-8 h-8" />
              </div>
           </div>
        )}
      </div>

      <div className="w-full px-4 mb-2">
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${blinkDetected ? 'bg-green-500' : 'bg-blue-500'}`} 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-slate-500 text-sm italic">
        <Eye className="w-4 h-4" />
        <span>Blink naturally to proceed</span>
      </div>
    </div>
  );
};

export default BlinkCheck;
