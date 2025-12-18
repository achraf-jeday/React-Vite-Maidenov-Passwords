/**
 * Key Derivation Service
 *
 * Handles PBKDF2 key derivation from packing key and salt.
 * Uses Web Crypto API for secure, native browser cryptography.
 */

/**
 * Generates a random salt for PBKDF2
 * @returns {Uint8Array} 16-byte random salt
 */
export const generateSalt = () => {
  return crypto.getRandomValues(new Uint8Array(16));
};

/**
 * Converts Uint8Array to base64 string
 * @param {Uint8Array} buffer
 * @returns {string} Base64 encoded string
 */
export const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

/**
 * Converts base64 string to Uint8Array
 * @param {string} base64
 * @returns {Uint8Array}
 */
export const base64ToArrayBuffer = (base64) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

/**
 * Derives an encryption key from a packing key using PBKDF2
 *
 * @param {string} packingKey - User's packing key (master password)
 * @param {string|Uint8Array} salt - Salt (base64 string or Uint8Array)
 * @param {number} iterations - Number of PBKDF2 iterations (default: 210000)
 * @returns {Promise<CryptoKey>} Derived encryption key
 */
export const deriveKeyFromPackingKey = async (
  packingKey,
  salt,
  iterations = 210000
) => {
  try {
    // Convert salt to Uint8Array if it's a base64 string
    const saltBuffer = typeof salt === 'string'
      ? base64ToArrayBuffer(salt)
      : salt;

    // Convert packing key to buffer
    const encoder = new TextEncoder();
    const packingKeyBuffer = encoder.encode(packingKey);

    // Import the packing key as a CryptoKey for PBKDF2
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      packingKeyBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive the encryption key using PBKDF2
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      {
        name: 'AES-GCM',
        length: 256 // 256-bit key
      },
      false, // Not extractable (extra security)
      ['encrypt', 'decrypt']
    );

    return derivedKey;
  } catch (error) {
    console.error('Error deriving key:', error);
    throw new Error('Failed to derive encryption key from packing key');
  }
};

/**
 * Validates packing key format and strength
 * @param {string} packingKey
 * @returns {{valid: boolean, errors: string[]}}
 */
export const validatePackingKey = (packingKey) => {
  const errors = [];

  if (!packingKey || packingKey.length < 16) {
    errors.push('Packing key must be at least 16 characters long');
  }

  if (packingKey && !/[A-Z]/.test(packingKey)) {
    errors.push('Packing key must contain at least one uppercase letter');
  }

  if (packingKey && !/[a-z]/.test(packingKey)) {
    errors.push('Packing key must contain at least one lowercase letter');
  }

  if (packingKey && !/[0-9]/.test(packingKey)) {
    errors.push('Packing key must contain at least one number');
  }

  if (packingKey && !/[^A-Za-z0-9]/.test(packingKey)) {
    errors.push('Packing key must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};
