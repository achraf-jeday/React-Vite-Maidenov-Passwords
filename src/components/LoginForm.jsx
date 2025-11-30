import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authenticateWithDrupal } from '../services/authService';

/**
 * Login Form Component
 * Handles seamless authentication with Drupal using ROPC (Resource Owner Password Credentials)
 */
const LoginForm = () => {
  const { loading, error, checkAuthStatus } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      alert('Please enter both username and password');
      return;
    }

    try {
      // Authenticate directly with Drupal using ROPC flow
      // Use proxy to avoid CORS issues
      const params = new URLSearchParams({
        grant_type: 'password',
        client_id: 'test-frontend',
        client_secret: 'test-secret-key-12345',
        username: username,
        password: password,
        scope: 'basic'
      });

      const response = await fetch('/oauth/token', {
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
        localStorage.setItem('maidenov_access_token', data.access_token);
        localStorage.setItem('maidenov_refresh_token', data.refresh_token);
        if (data.expires_in) {
          const expiresAt = Date.now() + (data.expires_in * 1000);
          localStorage.setItem('maidenov_token_expires_at', expiresAt.toString());
        }

        // Redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        alert('Login failed: ' + (data.error || 'Invalid credentials'));
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed: ' + error.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Maidenov Passwords</h1>
        <p className="login-subtitle">Sign in to access your dashboard</p>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
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
            <p className="login-hint">
              Authenticating with Drupal...
            </p>
          )}

          {error && (
            <p className="error-message" style={{color: 'red'}}>
              {error}
            </p>
          )}
        </form>

        <div className="login-footer">
          <p className="oauth-info">
            Your credentials are sent directly to Drupal for secure authentication.
            No redirects, seamless experience!
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;