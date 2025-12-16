import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authenticateWithDrupal, getUserInfo } from '../services/authService';
import apiService from '../services/apiService';
import OAUTH_CONFIG from '../config/oauth';

/**
 * Login Form Component
 * Handles seamless authentication with Drupal using ROPC (Resource Owner Password Credentials)
 */
const LoginForm = () => {
  const { loading, error, checkAuthStatus } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Function to trigger auth state update after login
  const triggerAuthUpdate = async () => {
    try {
      await checkAuthStatus();
      // Force a small delay to ensure auth state is updated
      setTimeout(() => {
        // This will trigger a re-render and the ProtectedRoute will now allow access
      }, 100);
    } catch (error) {
      console.error('Auth update failed:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      alert('Please enter both username and password');
      return;
    }

    try {
      // Authenticate directly with Drupal using ROPC flow
      const params = new URLSearchParams({
        grant_type: 'password',
        client_id: OAUTH_CONFIG.CLIENT_ID,
        client_secret: OAUTH_CONFIG.CLIENT_SECRET,
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
        body: params
      });

      const data = await response.json();

      if (response.ok) {
        // Store tokens
        localStorage.setItem(OAUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN, data.access_token);
        localStorage.setItem(OAUTH_CONFIG.STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token);
        if (data.expires_in) {
          const expiresAt = Date.now() + (data.expires_in * 1000);
          localStorage.setItem(OAUTH_CONFIG.STORAGE_KEYS.EXPIRES_AT, expiresAt.toString());
        }

        // Fetch and store user info
        try {
          const userInfo = await getUserInfo();
          localStorage.setItem(OAUTH_CONFIG.STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));
        } catch (userInfoError) {
          console.error('Failed to get user info:', userInfoError);
          // Continue without user info, AuthContext will handle this
        }

        // Trigger auth state update to notify AuthContext
        await triggerAuthUpdate();

        // Check if user has a packing key set
        try {
          const hasPackingKey = await apiService.hasPackingKey();

          if (hasPackingKey && hasPackingKey.exists) {
            // User has a packing key, redirect to validation form
            navigate('/packing-key/validate');
          } else {
            // User doesn't have a packing key, redirect to set form
            navigate('/packing-key/set');
          }
        } catch (packingKeyError) {
          console.error('Packing key check failed:', packingKeyError);
          // If packing key check fails, redirect to set form as fallback
          navigate('/packing-key/set');
        }
      } else {
        alert('Login failed: ' + (data.error || 'Invalid credentials'));
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed: ' + error.message);
    }
  };

  return (
    <div className="login-container" style={{
      width: '100%',
      maxWidth: '400px',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      boxSizing: 'border-box'
    }}>
      <div className="login-box" style={{
        background: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{
          textAlign: 'center',
          color: '#333',
          marginBottom: '30px',
          fontSize: '24px',
          fontWeight: '600'
        }}>
          Maidenov Passwords
        </h1>

        <form className="login-form" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }} onSubmit={handleLogin}>
          <div className="form-group" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <label htmlFor="username" style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#555'
            }}>
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
              style={{
                padding: '12px 16px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                transition: 'border-color 0.3s ease'
              }}
            />
          </div>

          <div className="form-group" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <label htmlFor="password" style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#555'
            }}>
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              style={{
                padding: '12px 16px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px',
                transition: 'border-color 0.3s ease'
              }}
            />
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
            style={{
              background: loading ? '#9ca3af' : '#667eea',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (!loading) e.target.style.background = '#5568d3';
            }}
            onMouseLeave={(e) => {
              if (!loading) e.target.style.background = '#667eea';
            }}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          {loading && (
            <p className="login-hint" style={{
              textAlign: 'center',
              color: '#666',
              fontSize: '14px'
            }}>
              Authenticating with Drupal...
            </p>
          )}

          {error && (
            <p className="error-message" style={{
              color: 'red',
              textAlign: 'center',
              fontSize: '14px'
            }}>
              {error}
            </p>
          )}

          {/* Register Link */}
          <p style={{
            textAlign: 'center',
            color: '#666',
            fontSize: '14px',
            marginTop: '20px'
          }}>
            Don't have an account?{' '}
            <Link
              to="/register"
              style={{
                color: '#667eea',
                textDecoration: 'none',
                fontWeight: '600'
              }}
            >
              Create Account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;