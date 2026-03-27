import * as faceapi from 'face-api.js';

const MODEL_PATH = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

/**
 * Utility to load face-api models from CDN
 */
export const loadFaceModels = async () => {
  try {
    console.log('Loading face-api models...');
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_PATH),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_PATH),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_PATH)
    ]);
    console.log('Face-api models loaded successfully.');
    return true;
  } catch (error) {
    console.error('Failed to load face-api models:', error);
    throw error;
  }
};

/**
 * Standardized face detection logic
 * @param {HTMLVideoElement} videoElement 
 */
export const detectFace = async (videoElement) => {
  if (!videoElement) return null;
  
  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 512,
    scoreThreshold: 0.5
  });

  return await faceapi.detectSingleFace(videoElement, options)
    .withFaceLandmarks()
    .withFaceDescriptor();
};

/**
 * Simple liveness check: distance between landmarks over short period OR head pitch/roll
 * (For this demo, we'll return the detection and include a placeholder for liveness)
 * @param {faceapi.FaceDetection} detection 
 */
export const validateLiveness = (detection) => {
  if (!detection) return false;
  // A real implementation would compare landmarks over multiple frames
  // Here we check for a reasonable score and basic face orientation (landmarks present)
  return detection.detection.score > 0.8; 
};
