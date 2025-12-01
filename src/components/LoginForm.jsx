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
    <div className="login-container" style={{
      width: '100%',
      maxWidth: '400px',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%'
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
              background: '#007bff',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease'
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
        </form>
      </div>
    </div>
  );
};

export default LoginForm;