const API_URL = 'http://localhost:5001/api/auth';

/**
 * Service for face authentication API calls
 */
export const faceAuthService = {
  /**
   * Registers a user's face descriptors
   * @param {string} email 
   * @param {Array<Object>} descriptors - Array of descriptor objects (e.g., { descriptor: [], quality: 90 })
   */
  registerFace: async (email, descriptors) => {
    try {
      const response = await fetch(`${API_URL}/register-face-public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, descriptors })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Face registration failed');
      return data;
    } catch (error) {
      console.error('registerFace Service Error:', error);
      throw error;
    }
  },

  /**
   * Logins a user using a single face descriptor matching stored ones
   * @param {string} email 
   * @param {Array<number>} descriptor - 128D face descriptor
   */
  loginFace: async (email, descriptor) => {
    try {
      const response = await fetch(`${API_URL}/login-face`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, descriptor })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Face login failed');
      
      // If success, data usually contains the JWT token and user info
      if (data.token) {
        localStorage.setItem('user', JSON.stringify(data));
      }
      return data;
    } catch (error) {
      console.error('loginFace Service Error:', error);
      throw error;
    }
  }
};
