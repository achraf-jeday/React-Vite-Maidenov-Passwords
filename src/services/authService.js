import OAUTH_CONFIG from '../config/oauth';

/**
 * Generate a random string for state parameter
 */
const generateRandomString = (length = 32) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
};

/**
 * Generate PKCE code verifier and challenge
 */
const generateCodeChallenge = async (codeVerifier) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);

  // Convert the digest to a base64url string
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

/**
 * Build OAuth2 authorization URL
 */
export const buildAuthorizationUrl = async () => {
  const state = generateRandomString();
  const codeVerifier = generateRandomString(128);
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Store state and code verifier for later use
  localStorage.setItem(OAUTH_CONFIG.STORAGE_KEYS.STATE, state);
  localStorage.setItem(OAUTH_CONFIG.STORAGE_KEYS.CODE_VERIFIER, codeVerifier);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: OAUTH_CONFIG.OAUTH_CONFIG.CLIENT_ID,
    redirect_uri: OAUTH_CONFIG.OAUTH_CONFIG.redirect_uri,
    scope: OAUTH_CONFIG.OAUTH_CONFIG.scope,
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });

  return `${OAUTH_CONFIG.OAUTH_ENDPOINTS.authorize}?${params.toString()}`;
};

/**
 * Exchange authorization code for tokens
 */
export const exchangeCodeForTokens = async (authorizationCode) => {
  const codeVerifier = localStorage.getItem(OAUTH_CONFIG.STORAGE_KEYS.CODE_VERIFIER);

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: OAUTH_CONFIG.OAUTH_CONFIG.CLIENT_ID,
    client_secret: OAUTH_CONFIG.OAUTH_CONFIG.CLIENT_SECRET,
    code: authorizationCode,
    redirect_uri: OAUTH_CONFIG.OAUTH_CONFIG.redirect_uri,
    code_verifier: codeVerifier
  });

  const response = await fetch(OAUTH_CONFIG.OAUTH_ENDPOINTS.token, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: params
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to exchange code for tokens');
  }

  // Store tokens
  if (data.access_token) {
    localStorage.setItem(OAUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN, data.access_token);
  }
  if (data.refresh_token) {
    localStorage.setItem(OAUTH_CONFIG.STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token);
  }
  if (data.expires_in) {
    const expiresAt = Date.now() + (data.expires_in * 1000);
    localStorage.setItem(OAUTH_CONFIG.STORAGE_KEYS.EXPIRES_AT, expiresAt.toString());
  }

  return data;
};

/**
 * Module-level variable to track ongoing refresh request
 * This prevents multiple simultaneous refresh token requests (race condition fix)
 */
let refreshPromise = null;

/**
 * Refresh access token
 * Uses singleton promise pattern to prevent concurrent refresh requests
 */
export const refreshAccessToken = async () => {
  // If a refresh is already in progress, return the existing promise
  // This prevents race conditions when multiple API calls fail simultaneously
  if (refreshPromise) {
    return refreshPromise;
  }

  // Create a new refresh promise
  refreshPromise = (async () => {
    try {
      const refreshToken = localStorage.getItem(OAUTH_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: OAUTH_CONFIG.CLIENT_ID,
        client_secret: OAUTH_CONFIG.CLIENT_SECRET,
        refresh_token: refreshToken
      });

      const response = await fetch(OAUTH_CONFIG.OAUTH_ENDPOINTS.token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: params
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error('Failed to parse OAuth response: ' + parseError.message);
      }

      if (!response.ok) {
        console.error('Token refresh failed:', {
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          error_description: data.error_description
        });

        // If refresh token is invalid/expired, clear tokens and redirect to login
        if (response.status === 400 && (data.error === 'invalid_grant' || data.error === 'invalid_request')) {
          localStorage.removeItem(OAUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(OAUTH_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(OAUTH_CONFIG.STORAGE_KEYS.EXPIRES_AT);
          localStorage.removeItem(OAUTH_CONFIG.STORAGE_KEYS.USER_INFO);
          throw new Error('Session expired. Please log in again.');
        }

        throw new Error(data.error || data.error_description || 'Failed to refresh token');
      }

      // Store new tokens
      if (data.access_token) {
        localStorage.setItem(OAUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN, data.access_token);
      }
      if (data.refresh_token) {
        localStorage.setItem(OAUTH_CONFIG.STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token);
      }
      if (data.expires_in) {
        const expiresAt = Date.now() + (data.expires_in * 1000);
        localStorage.setItem(OAUTH_CONFIG.STORAGE_KEYS.EXPIRES_AT, expiresAt.toString());
      }

      return data;
    } finally {
      // Always clear the promise when done (success or failure)
      // This allows future refresh requests to proceed
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

/**
 * Get user information from OAuth2 userinfo endpoint
 */
export const getUserInfo = async () => {
  const accessToken = localStorage.getItem(OAUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);

  if (!accessToken) {
    throw new Error('No access token available');
  }

  const response = await fetch(OAUTH_CONFIG.OAUTH_ENDPOINTS.userInfo, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'No error text');
    console.error('getUserInfo - Error response:', {
      status: response.status,
      statusText: response.statusText,
      errorText: errorText
    });
    throw new Error(`Failed to get user info: ${response.status} ${response.statusText}`);
  }

  const userInfo = await response.json();
  localStorage.setItem(OAUTH_CONFIG.STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));

  return userInfo;
};

/**
 * Revoke tokens
 */
export const revokeTokens = async () => {
  const accessToken = localStorage.getItem(OAUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);

  if (!accessToken) {
    return;
  }

  const params = new URLSearchParams({
    token: accessToken,
    token_type_hint: 'access_token',
    client_id: OAUTH_CONFIG.CLIENT_ID,
    client_secret: OAUTH_CONFIG.CLIENT_SECRET
  });

  try {
    const response = await fetch(OAUTH_CONFIG.OAUTH_ENDPOINTS.revoke, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params
    });
  } catch (error) {
    // Continue with local cleanup even if revoke fails
  }

  // Always clear tokens locally regardless of server response
  localStorage.removeItem(OAUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(OAUTH_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(OAUTH_CONFIG.STORAGE_KEYS.EXPIRES_AT);
  localStorage.removeItem(OAUTH_CONFIG.STORAGE_KEYS.USER_INFO);
};

/**
 * Main authentication function for password grant (ROPC)
 * Authenticates user directly with username/password
 */
export const authenticateWithDrupal = async (username, password) => {
  try {
    const params = new URLSearchParams({
      grant_type: 'password',
      client_id: OAUTH_CONFIG.OAUTH_CONFIG.CLIENT_ID,
      client_secret: OAUTH_CONFIG.OAUTH_CONFIG.CLIENT_SECRET,
      username: username,
      password: password,
      scope: OAUTH_CONFIG.OAUTH_CONFIG.scope
    });

    const response = await fetch(OAUTH_CONFIG.OAUTH_ENDPOINTS.token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params,
      mode: 'cors', // Enable CORS
      credentials: 'omit' // Don't send cookies with cross-origin requests
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to authenticate');
    }

    // Store tokens
    if (data.access_token) {
      localStorage.setItem(OAUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN, data.access_token);
    }
    if (data.refresh_token) {
      localStorage.setItem(OAUTH_CONFIG.STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token);
    }
    if (data.expires_in) {
      const expiresAt = Date.now() + (data.expires_in * 1000);
      localStorage.setItem(OAUTH_CONFIG.STORAGE_KEYS.EXPIRES_AT, expiresAt.toString());
    }

    return { success: true, tokens: data };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Logout from Drupal
 */
export const logoutFromDrupal = async () => {
  try {
    await revokeTokens();
  } catch (error) {
    console.error('Logout error:', error);
    // Continue with local logout even if revoke fails
  }
};

/**
 * Check if token needs refresh (within 2 minutes of expiry)
 */
export const shouldRefreshToken = () => {
  const expiresAt = localStorage.getItem(OAUTH_CONFIG.STORAGE_KEYS.EXPIRES_AT);
  const refreshToken = localStorage.getItem(OAUTH_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);

  if (!expiresAt || !refreshToken) {
    return false;
  }

  const expiryTime = parseInt(expiresAt, 10);
  const currentTime = Date.now();
  const timeUntilExpiry = expiryTime - currentTime;

  // Refresh if less than 2 minutes (120000ms) until expiry
  return timeUntilExpiry < 120000;
};

/**
 * Ensure token is fresh before making API request
 */
export const ensureFreshToken = async () => {
  const accessToken = localStorage.getItem(OAUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);

  // If no access token, can't refresh
  if (!accessToken) {
    return false;
  }

  if (shouldRefreshToken()) {
    try {
      await refreshAccessToken();
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }
  return true;
};

/**
 * Create authenticated API request with access token
 * Automatically refreshes token if 401 Unauthorized is received
 */
export const createAuthenticatedRequest = async (url, options = {}) => {
  const accessToken = localStorage.getItem(OAUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);

  const request = fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': accessToken ? `Bearer ${accessToken}` : '',
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });

  // Handle automatic token refresh on 401 errors
  const response = await request;

  if (response.status === 401) {
    try {
      // Try to refresh the token
      await refreshAccessToken();

      // Retry the original request with new token
      const newAccessToken = localStorage.getItem(OAUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);

      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': newAccessToken ? `Bearer ${newAccessToken}` : '',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
    } catch (refreshError) {
      console.error('Automatic token refresh failed:', refreshError);
      // Token refresh failed, return the original 401 response
      return response;
    }
  }

  return response;
};