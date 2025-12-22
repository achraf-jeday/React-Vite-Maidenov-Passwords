import { createAuthenticatedRequest, ensureFreshToken, isTokenExpired } from './authService';
import OAUTH_CONFIG from '../config/oauth';

/**
 * API Service for making authenticated requests to Drupal
 */
class ApiService {
  constructor() {
    this.baseURL = ''; // Use empty baseURL to leverage Vite proxy
  }

  /**
   * Set the base URL for API requests
   */
  setBaseURL(url) {
    this.baseURL = url;
  }

  /**
   * Check if token is expired and handle accordingly
   * Returns true if we can proceed, false if we should abort
   */
  async ensureValidToken() {
    const accessToken = localStorage.getItem(OAUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = localStorage.getItem(OAUTH_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);

    // If no tokens at all, caller should handle (likely redirect to login)
    if (!accessToken && !refreshToken) {
      return false;
    }

    // If token is expired or about to expire, refresh it proactively
    try {
      await ensureFreshToken();
      return true;
    } catch (error) {
      // Token refresh failed, clear tokens
      localStorage.removeItem(OAUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(OAUTH_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(OAUTH_CONFIG.STORAGE_KEYS.EXPIRES_AT);
      localStorage.removeItem(OAUTH_CONFIG.STORAGE_KEYS.USER_INFO);
      return false;
    }
  }

  /**
   * Make a GET request
   */
  async get(endpoint, options = {}) {
    // Ensure token is valid before making request
    const canProceed = await this.ensureValidToken();
    if (!canProceed) {
      throw new Error('Authentication required');
    }

    const url = `${this.baseURL}${endpoint}`;
    const response = await createAuthenticatedRequest(url, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      ...options
    });

    return this.handleResponse(response);
  }

  /**
   * Make a POST request
   */
  async post(endpoint, data, options = {}) {
    // Ensure token is valid before making request
    const canProceed = await this.ensureValidToken();
    if (!canProceed) {
      throw new Error('Authentication required');
    }

    const url = `${this.baseURL}${endpoint}`;
    const response = await createAuthenticatedRequest(url, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify(data),
      ...options
    });

    return this.handleResponse(response);
  }

  /**
   * Make a PUT request
   */
  async put(endpoint, data, options = {}) {
    // Ensure token is valid before making request
    const canProceed = await this.ensureValidToken();
    if (!canProceed) {
      throw new Error('Authentication required');
    }

    const url = `${this.baseURL}${endpoint}`;
    const response = await createAuthenticatedRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    });

    return this.handleResponse(response);
  }

  /**
   * Make a PATCH request
   */
  async patch(endpoint, data, options = {}) {
    // Ensure token is valid before making request
    const canProceed = await this.ensureValidToken();
    if (!canProceed) {
      throw new Error('Authentication required');
    }

    const url = `${this.baseURL}${endpoint}`;
    const response = await createAuthenticatedRequest(url, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options
    });

    return this.handleResponse(response);
  }

  /**
   * Make a DELETE request
   */
  async delete(endpoint, options = {}) {
    // Ensure token is valid before making request
    const canProceed = await this.ensureValidToken();
    if (!canProceed) {
      throw new Error('Authentication required');
    }

    const url = `${this.baseURL}${endpoint}`;
    const response = await createAuthenticatedRequest(url, {
      method: 'DELETE',
      ...options
    });

    return this.handleResponse(response);
  }

  /**
   * Handle API response
   */
  async handleResponse(response) {
    if (!response.ok) {
      // For authentication errors, provide a clearer message
      if (response.status === 401) {
        throw new Error('Authentication required');
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return response.text();
  }

  /**
   * Get current user's profile
   */
  async getCurrentUser() {
    return this.get('/oauth/userinfo');
  }

  /**
   * Get user's content (example)
   */
  async getUserContent() {
    return this.get('/jsonapi/node/user_content');
  }

  /**
   * Create new content
   */
  async createContent(type, data) {
    return this.post(`/jsonapi/node/${type}`, data);
  }

  /**
   * Update content
   */
  async updateContent(type, id, data) {
    return this.patch(`/jsonapi/node/${type}/${id}`, data);
  }

  /**
   * Delete content
   */
  async deleteContent(type, id) {
    return this.delete(`/jsonapi/node/${type}/${id}`);
  }

  /**
   * Check if user has a packing key set
   */
  async hasPackingKey() {
    return this.get('/api/user/packing-key/exists');
  }

  /**
   * Set or update user's packing key
   */
  async setPackingKey(packingKey, packingKeyConfirmation, salt) {
    const data = {
      packing_key: packingKey,
      packing_key_confirm: packingKeyConfirmation,
      salt: salt
    };
    return this.post('/api/user/packing-key', data);
  }

  /**
   * Validate user's packing key
   */
  async validatePackingKey(packingKey) {
    return this.post('/api/user/validate-packing-key', { packing_key: packingKey });
  }
}

// Create and export singleton instance
const apiService = new ApiService();
export default apiService;

/**
 * Hook for using API service
 */
export const useApi = () => {
  return apiService;
};