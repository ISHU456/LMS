import { useState, useEffect, useCallback, useRef } from 'react';
import * as faceapi from 'face-api.js';
import { loadFaceModels, detectFace, validateLiveness } from '../utils/faceApiUtils';

/**
 * Custom Hook for logic-only face detection and liveness checking
 * @param {HTMLVideoElement} videoElementRef - Current video from webcam
 * @param {boolean} active - Whether to run the loop
 */
export const useFaceDetection = (videoElementRef, active = false) => {
  const [isModelsReady, setIsModelsReady] = useState(false);
  const [faceStatus, setFaceStatus] = useState('Initializing Biometrics...');
  const [detection, setDetection] = useState(null);
  const [liveness, setLiveness] = useState(false);
  const [multipleFaces, setMultipleFaces] = useState(false);

  // Load models once
  useEffect(() => {
    loadFaceModels().then(() => setIsModelsReady(true)).catch(e => setFaceStatus(`Error: ${e.message}`));
  }, []);

  const runDetection = useCallback(async () => {
    const video = videoElementRef.current?.video || videoElementRef.current;
    if (!video || !isModelsReady || !active) return;
    
    try {
      // For detecting multiple faces, we need to use detectAllFaces
      const allDetections = await faceapi.detectAllFaces(
        video, 
        new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
      );

      if (allDetections.length > 1) {
        setMultipleFaces(true);
        setFaceStatus('Multiple faces detected! Authentication restricted.');
        setDetection(null);
        return;
      }
      
      setMultipleFaces(false);
      const det = await detectFace(video);
      
      if (det) {
        setFaceStatus('Face detected! Matching patterns...');
        setDetection(det);
        setLiveness(validateLiveness(det));
      } else {
        setFaceStatus('Look directly at the camera...');
        setDetection(null);
        setLiveness(false);
      }
    } catch (err) {
      console.error(err);
      setFaceStatus('Scanning Error - Retrying...');
    }
  }, [videoElementRef, isModelsReady, active]);

  useEffect(() => {
    let interval;
    if (active) {
      interval = setInterval(() => {
        runDetection();
      }, 500); // 500ms loop for optimization
    }
    return () => clearInterval(interval);
  }, [active, runDetection]);

  return { isModelsReady, faceStatus, detection, liveness, multipleFaces };
};
