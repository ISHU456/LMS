import * as faceapi from 'face-api.js';

const MODEL_URL = '/models';

let isLoaded = false;

export const loadModels = async () => {
  if (isLoaded) return true;
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    ]);
    isLoaded = true;
    return true;
  } catch (err) {
    console.error('Error loading face models:', err);
    return false;
  }
};

/**
 * Calculates Eye Aspect Ratio (EAR) for liveness detection (blink)
 */
export const calculateEAR = (eyeLandmarks) => {
  // Landmarks for eye: 6 points. P1-P6
  // EAR = (|P2-P6| + |P3-P5|) / (2 * |P1-P4|)
  // Points are (x, y) coordinates
  const p1 = eyeLandmarks[0];
  const p2 = eyeLandmarks[1];
  const p3 = eyeLandmarks[2];
  const p4 = eyeLandmarks[3];
  const p5 = eyeLandmarks[4];
  const p6 = eyeLandmarks[5];

  const dist = (pt1, pt2) => Math.sqrt(Math.pow(pt1.x - pt2.x, 2) + Math.pow(pt1.y - pt2.y, 2));

  const vert1 = dist(p2, p6);
  const vert2 = dist(p3, p5);
  const horiz = dist(p1, p4);

  return (vert1 + vert2) / (2 * horiz);
};
