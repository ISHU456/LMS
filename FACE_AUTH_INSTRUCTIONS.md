# Face-API Models Setup Instruction

To run the face authentication system smoothly, the `face-api.js` models must be accessible.

## Option 1: Use CDN (Currently Implemented)
The application is pre-configured to load models from:
`https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/`

This is the easiest way to get started and requires no manual downloads.

## Option 2: Local Hosting (Recommended for Production)
For faster load times and offline support, you can host the models locally:

1. **Download Models**:
   Download the following model files from the [official face-api.js models repo](https://github.com/vladmandic/face-api/tree/master/model):
   - `tiny_face_detector_model-shard1`
   - `tiny_face_detector_model-weights_manifest.json`
   - `face_landmark_68_model-shard1`
   - `face_landmark_68_model-weights_manifest.json`
   - `face_recognition_model-shard1`
   - `face_recognition_model-weights_manifest.json`

2. **Move to Public Folder**:
   Create a folder named `models` inside your React project's `public` directory:
   `client/public/models/`

3. **Update Utility**:
   In `client/src/utils/faceApiUtils.js`, change the `MODEL_PATH` to:
   ```javascript
   const MODEL_PATH = '/models';
   ```

## Requirements
- Browser with `getUserMedia` support (Chrome, Firefox, Edge, Safari).
- Server must serve assets over HTTPS (or `localhost` for development).
