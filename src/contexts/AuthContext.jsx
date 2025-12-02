import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authenticateWithDrupal, refreshAccessToken, logoutFromDrupal, getUserInfo, buildAuthorizationUrl, exchangeCodeForTokens } from '../services/authService';
import OAUTH_CONFIG from '../config/oauth';

// Create Auth Context
const AuthContext = createContext({});

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authenticated
  const checkAuthStatus = useCallback(async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem(OAUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = localStorage.getItem(OAUTH_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);

      if (!accessToken && !refreshToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Try to get user info or refresh token
      try {
        const userInfo = await getUserInfo();
        setUser(userInfo);
      } catch (refreshError) {
        // Try to refresh token
        try {
          const newTokens = await refreshAccessToken();
          if (newTokens) {
            const userInfo = await getUserInfo();
            setUser(userInfo);
          } else {
            throw new Error('Unable to refresh tokens');
          }
        } catch (error) {
          // Clear stored tokens and user
          localStorage.removeItem(OAUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
          localStorage.removeItem(OAUTH_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
          localStorage.removeItem(OAUTH_CONFIG.STORAGE_KEYS.EXPIRES_AT);
          localStorage.removeItem(OAUTH_CONFIG.STORAGE_KEYS.USER_INFO);
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize auth on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');

      if (code && state) {
        try {
          // Verify state parameter
          const storedState = localStorage.getItem(OAUTH_CONFIG.STORAGE_KEYS.STATE);
          if (state !== storedState) {
            throw new Error('Invalid state parameter');
          }

          // Exchange code for tokens
          const authResult = await exchangeCodeForTokens(code);

          if (authResult.access_token) {
            // Get user info
            const userInfo = await getUserInfo();
            setUser(userInfo);

            // Redirect to main app (remove OAuth params)
            const redirectUrl = window.location.origin;
            window.location.href = redirectUrl;
          } else {
            throw new Error('No access token received');
          }
        } catch (error) {
          console.error('OAuth callback error:', error);
          setError('Authentication failed');
        }
      }
    };

    handleOAuthCallback();
  }, []);

  // Login function (OAuth2 Authorization Code Flow)
  const login = useCallback(async () => {
    try {
      setError(null);
      // Build authorization URL and redirect to Drupal OAuth login page
      const authUrl = await buildAuthorizationUrl();
      if (authUrl) {
        window.location.href = authUrl;
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to initiate login');
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await logoutFromDrupal();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state and storage
      setUser(null);
      localStorage.removeItem(OAUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(OAUTH_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(OAUTH_CONFIG.STORAGE_KEYS.EXPIRES_AT);
      localStorage.removeItem(OAUTH_CONFIG.STORAGE_KEYS.USER_INFO);
      localStorage.removeItem(OAUTH_CONFIG.STORAGE_KEYS.STATE);
      localStorage.removeItem(OAUTH_CONFIG.STORAGE_KEYS.CODE_VERIFIER);
    }
  }, []);

  // Check if token is expired
  const isTokenExpired = useCallback(() => {
    const expiresAt = localStorage.getItem(OAUTH_CONFIG.STORAGE_KEYS.EXPIRES_AT);
    if (!expiresAt) return true;

    const expiryTime = parseInt(expiresAt, 10);
    const currentTime = Date.now();
    return currentTime >= expiryTime;
  }, []);

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    checkAuthStatus,
    isTokenExpired,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use Auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;