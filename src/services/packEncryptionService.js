/**
 * Pack Encryption Service
 *
 * Handles encryption and decryption of pack data.
 * Encrypts specific fields: name, email, username, password, link, notes
 */

import { encryptFields, decryptFields } from './cryptoService';

/**
 * Fields that should be encrypted in a pack
 */
const ENCRYPTED_FIELDS = ['name', 'email', 'username', 'password', 'link', 'notes'];

/**
 * Encrypts pack data before sending to backend
 *
 * @param {Object} packData - Pack data object
 * @param {CryptoKey} encryptionKey - Derived encryption key
 * @returns {Promise<Object>} Pack data with encrypted fields
 */
export const encryptPackData = async (packData, encryptionKey) => {
  try {
    if (!encryptionKey) {
      throw new Error('Encryption key is required');
    }

    // Create a copy of pack data
    const encryptedPack = { ...packData };

    // Extract fields to encrypt
    const fieldsToEncrypt = {};
    ENCRYPTED_FIELDS.forEach(field => {
      if (packData[field] !== undefined) {
        fieldsToEncrypt[field] = packData[field] || '';
      }
    });

    // Encrypt all fields
    const encryptedFields = await encryptFields(fieldsToEncrypt, encryptionKey);

    // Replace original fields with encrypted values
    Object.assign(encryptedPack, encryptedFields);

    return encryptedPack;
  } catch (error) {
    console.error('Error encrypting pack data:', error);
    throw new Error('Failed to encrypt pack data');
  }
};

/**
 * Decrypts pack data received from backend
 *
 * @param {Object} encryptedPackData - Pack data with encrypted fields
 * @param {CryptoKey} encryptionKey - Derived encryption key
 * @returns {Promise<Object>} Pack data with decrypted fields
 */
export const decryptPackData = async (encryptedPackData, encryptionKey) => {
  try {
    if (!encryptionKey) {
      throw new Error('Encryption key is required');
    }

    // Create a copy of pack data
    const decryptedPack = { ...encryptedPackData };

    // Extract encrypted fields
    const fieldsToDecrypt = {};
    ENCRYPTED_FIELDS.forEach(field => {
      if (encryptedPackData[field] !== undefined) {
        fieldsToDecrypt[field] = encryptedPackData[field] || '';
      }
    });

    // Decrypt all fields
    const decryptedFields = await decryptFields(fieldsToDecrypt, encryptionKey);

    // Replace encrypted fields with decrypted values
    Object.assign(decryptedPack, decryptedFields);

    return decryptedPack;
  } catch (error) {
    console.error('Error decrypting pack data:', error);
    throw new Error('Failed to decrypt pack data. The packing key may be incorrect.');
  }
};

/**
 * Encrypts an array of packs
 *
 * @param {Array} packs - Array of pack objects
 * @param {CryptoKey} encryptionKey - Derived encryption key
 * @returns {Promise<Array>} Array of packs with encrypted fields
 */
export const encryptPacks = async (packs, encryptionKey) => {
  return Promise.all(
    packs.map(pack => encryptPackData(pack, encryptionKey))
  );
};

/**
 * Decrypts an array of packs
 *
 * @param {Array} encryptedPacks - Array of pack objects with encrypted fields
 * @param {CryptoKey} encryptionKey - Derived encryption key
 * @returns {Promise<Array>} Array of packs with decrypted fields
 */
export const decryptPacks = async (encryptedPacks, encryptionKey) => {
  return Promise.all(
    encryptedPacks.map(pack => decryptPackData(pack, encryptionKey))
  );
};
