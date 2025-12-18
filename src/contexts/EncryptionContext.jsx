import React, { createContext, useContext, useState, useCallback } from 'react';
import { deriveKeyFromPackingKey } from '../services/keyDerivationService';

/**
 * Encryption Context
 *
 * Manages the encryption key in memory during the session.
 * Key is derived from packing key + salt and stored only in React state.
 * Key is lost on page refresh - user must re-enter packing key.
 */

// Create Encryption Context
const EncryptionContext = createContext({});

// Encryption Provider Component
export const EncryptionProvider = ({ children }) => {
  // Encryption key stored in memory only (CryptoKey object)
  const [encryptionKey, setEncryptionKey] = useState(null);

  // Status indicating if vault is unlocked
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Loading state for key derivation
  const [isDerivingKey, setIsDerivingKey] = useState(false);

  /**
   * Derives and stores encryption key from packing key and salt
   *
   * @param {string} packingKey - User's packing key (master password)
   * @param {string} salt - Base64 encoded salt from backend
   * @returns {Promise<boolean>} True if successful, false otherwise
   */
  const deriveAndStoreKey = useCallback(async (packingKey, salt) => {
    try {
      setIsDerivingKey(true);

      // Derive encryption key using PBKDF2
      const key = await deriveKeyFromPackingKey(packingKey, salt);

      // Store in memory
      setEncryptionKey(key);
      setIsUnlocked(true);

      return true;
    } catch (error) {
      console.error('Failed to derive encryption key:', error);
      setEncryptionKey(null);
      setIsUnlocked(false);
      return false;
    } finally {
      setIsDerivingKey(false);
    }
  }, []);

  /**
   * Clears the encryption key from memory
   * Should be called on logout or when user locks vault
   */
  const clearKey = useCallback(() => {
    setEncryptionKey(null);
    setIsUnlocked(false);
  }, []);

  /**
   * Gets the current encryption key
   * Throws error if key is not available
   *
   * @returns {CryptoKey} The encryption key
   */
  const getKey = useCallback(() => {
    if (!encryptionKey) {
      throw new Error('Encryption key not available. Please unlock your vault first.');
    }
    return encryptionKey;
  }, [encryptionKey]);

  /**
   * Checks if the vault is unlocked and key is available
   *
   * @returns {boolean} True if vault is unlocked
   */
  const checkIsUnlocked = useCallback(() => {
    return isUnlocked && encryptionKey !== null;
  }, [isUnlocked, encryptionKey]);

  const value = {
    // State
    isUnlocked,
    isDerivingKey,
    encryptionKey,

    // Methods
    deriveAndStoreKey,
    clearKey,
    getKey,
    checkIsUnlocked
  };

  return (
    <EncryptionContext.Provider value={value}>
      {children}
    </EncryptionContext.Provider>
  );
};

/**
 * Custom hook to use Encryption context
 * Provides access to encryption key management
 */
export const useEncryption = () => {
  const context = useContext(EncryptionContext);
  if (!context) {
    throw new Error('useEncryption must be used within an EncryptionProvider');
  }
  return context;
};

export default EncryptionContext;
