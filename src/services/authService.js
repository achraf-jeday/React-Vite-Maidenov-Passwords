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

  return `${OAUTH_CONFIG.DRUPAL_BASE_URL}${OAUTH_CONFIG.OAUTH_ENDPOINTS.authorize}?${params.toString()}`;
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

  const response = await fetch(`/oauth/token`, {
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
 * Refresh access token
 */
export const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem(OAUTH_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: OAUTH_CONFIG.OAUTH_CONFIG.CLIENT_ID,
    client_secret: OAUTH_CONFIG.OAUTH_CONFIG.CLIENT_SECRET,
    refresh_token: refreshToken
  });

  const response = await fetch(`/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: params
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to refresh token');
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
};

/**
 * Get user information from OAuth2 userinfo endpoint
 */
export const getUserInfo = async () => {
  const accessToken = localStorage.getItem(OAUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);

  if (!accessToken) {
    throw new Error('No access token available');
  }

  const response = await fetch(`/oauth/userinfo`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to get user info');
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
    client_id: OAUTH_CONFIG.OAUTH_CONFIG.CLIENT_ID,
    client_secret: OAUTH_CONFIG.OAUTH_CONFIG.CLIENT_SECRET
  });

  try {
    const response = await fetch(`/oauth/revoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`
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

    const response = await fetch(`${OAUTH_CONFIG.DRUPAL_BASE_URL}${OAUTH_CONFIG.OAUTH_ENDPOINTS.token}`, {
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
 * Create authenticated API request with access token
 */
export const createAuthenticatedRequest = (url, options = {}) => {
  const accessToken = localStorage.getItem(OAUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': accessToken ? `Bearer ${accessToken}` : '',
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });
};