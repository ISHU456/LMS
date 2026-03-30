import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.FACE_ENCRYPTION_KEY || 'default_32char_key_placeholder_v'; // Must be 32 characters
const IV_LENGTH = 16; // AES block size

/**
 * Encrypts a JSON object (like face descriptors)
 * 
 * @param {object} data - Data to encrypt
 * @returns {string} - Encrypted data (format: iv:encryptedData)
 */
export const encryptDescriptors = (data) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(JSON.stringify(data));
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

/**
 * Decrypts encrypted descriptors
 * 
 * @param {string} text - Encrypted text (format: iv:encryptedData)
 * @returns {object} - Decrypted JSON object
 */
export const decryptDescriptors = (text) => {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return JSON.parse(decrypted.toString());
};
