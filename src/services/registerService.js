/**
 * Registration Service
 * Handles user registration with Drupal backend
 */

const BASE_URL = ''; // Use empty for Vite proxy

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.email - User's email address
 * @param {string} userData.password - User's password
 * @param {string} userData.username - Optional username (defaults to email)
 * @returns {Promise<Object>} - Registration response
 */
export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${BASE_URL}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        username: userData.username || userData.email
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle validation errors from backend
      if (response.status === 400 || response.status === 422) {
        throw {
          status: response.status,
          message: data.message || 'Registration failed',
          errors: data.errors || {}
        };
      }
      throw new Error(data.message || 'Registration failed');
    }

    return data;
  } catch (error) {
    // Re-throw structured errors
    if (error.status) {
      throw error;
    }
    // Network or other errors
    throw {
      status: 500,
      message: error.message || 'Network error. Please try again.',
      errors: {}
    };
  }
};

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result with isValid and message
 */
export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength) {
    return {
      isValid: false,
      message: `Password must be at least ${minLength} characters long`
    };
  }

  if (!hasUpperCase || !hasLowerCase) {
    return {
      isValid: false,
      message: 'Password must contain both uppercase and lowercase letters'
    };
  }

  if (!hasNumber) {
    return {
      isValid: false,
      message: 'Password must contain at least one number'
    };
  }

  if (!hasSpecialChar) {
    return {
      isValid: false,
      message: 'Password must contain at least one special character'
    };
  }

  return {
    isValid: true,
    message: 'Password is strong'
  };
};

export default {
  registerUser,
  validateEmail,
  validatePassword
};
