/**
 * Crypto Service
 *
 * Handles AES-GCM encryption and decryption using Web Crypto API.
 * Each encrypted value includes its own IV (Initialization Vector) prepended to the ciphertext.
 */

import { arrayBufferToBase64, base64ToArrayBuffer } from './keyDerivationService';

/**
 * Encrypts plaintext using AES-GCM
 *
 * @param {string} plaintext - Text to encrypt
 * @param {CryptoKey} key - AES-GCM encryption key
 * @returns {Promise<string>} Base64 encoded string containing IV + ciphertext + auth tag
 */
export const encrypt = async (plaintext, key) => {
  try {
    // Handle empty or null values
    if (plaintext === null || plaintext === undefined || plaintext === '') {
      return '';
    }

    // Generate a random 12-byte IV for this encryption
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Convert plaintext to buffer
    const encoder = new TextEncoder();
    const plaintextBuffer = encoder.encode(plaintext);

    // Encrypt the data
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      plaintextBuffer
    );

    // Combine IV + ciphertext into a single buffer
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);

    // Return as base64 string
    return arrayBufferToBase64(combined);
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypts ciphertext using AES-GCM
 *
 * @param {string} encryptedBase64 - Base64 encoded string containing IV + ciphertext
 * @param {CryptoKey} key - AES-GCM decryption key
 * @returns {Promise<string>} Decrypted plaintext
 */
export const decrypt = async (encryptedBase64, key) => {
  try {
    // Handle empty or null values
    if (encryptedBase64 === null || encryptedBase64 === undefined || encryptedBase64 === '') {
      return '';
    }

    // Decode from base64
    const combined = base64ToArrayBuffer(encryptedBase64);

    // Extract IV (first 12 bytes)
    const iv = combined.slice(0, 12);

    // Extract ciphertext (remaining bytes)
    const ciphertext = combined.slice(12);

    // Decrypt the data
    const plaintextBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      ciphertext
    );

    // Convert buffer to string
    const decoder = new TextDecoder();
    return decoder.decode(plaintextBuffer);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data. The packing key may be incorrect.');
  }
};

/**
 * Encrypts multiple fields at once
 *
 * @param {Object} fields - Object with field names and values to encrypt
 * @param {CryptoKey} key - AES-GCM encryption key
 * @returns {Promise<Object>} Object with encrypted field values
 */
export const encryptFields = async (fields, key) => {
  const encrypted = {};

  for (const [fieldName, value] of Object.entries(fields)) {
    encrypted[fieldName] = await encrypt(value, key);
  }

  return encrypted;
};

/**
 * Decrypts multiple fields at once
 *
 * @param {Object} encryptedFields - Object with field names and encrypted values
 * @param {CryptoKey} key - AES-GCM decryption key
 * @returns {Promise<Object>} Object with decrypted field values
 */
export const decryptFields = async (encryptedFields, key) => {
  const decrypted = {};

  for (const [fieldName, encryptedValue] of Object.entries(encryptedFields)) {
    decrypted[fieldName] = await decrypt(encryptedValue, key);
  }

  return decrypted;
};
