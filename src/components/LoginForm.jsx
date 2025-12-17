import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authenticateWithDrupal, getUserInfo } from '../services/authService';
import apiService from '../services/apiService';
import OAUTH_CONFIG from '../config/oauth';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Person,
  Lock,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';

/**
 * Login Form Component
 * Handles seamless authentication with Drupal using ROPC (Resource Owner Password Credentials)
 */
const LoginForm = () => {
  const { loading: authLoading, error, checkAuthStatus } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

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

    // Clear any previous error
    setLoginError('');

    if (!username || !password) {
      setLoginError('Please enter both username and password');
      return;
    }

    setLoading(true);

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

        let expiresAt = null;
        if (data.expires_in) {
          expiresAt = Date.now() + (data.expires_in * 1000);
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
        // Set error state instead of showing alert
        setLoginError(data.error_description || data.error || 'Invalid username or password');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setLoginError('Login failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '500px',
        padding: '20px'
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 2
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            textAlign: 'center',
            fontWeight: 700,
            color: '#333',
            mb: 1
          }}
        >
          Maidenov Passwords
        </Typography>

        <Typography
          variant="body2"
          sx={{
            textAlign: 'center',
            color: '#666',
            mb: 3
          }}
        >
          Sign in to access your password vault
        </Typography>

        {loginError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {loginError}
          </Alert>
        )}

        <form onSubmit={handleLogin}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              fullWidth
              label="Username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (loginError) setLoginError('');
              }}
              disabled={loading}
              required
              autoComplete="username"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: '#666' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#667eea',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#667eea',
                },
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (loginError) setLoginError('');
              }}
              disabled={loading}
              required
              autoComplete="current-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: '#666' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#667eea',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#667eea',
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              fullWidth
              sx={{
                mt: 1,
                py: 1.5,
                bgcolor: '#667eea',
                fontSize: '16px',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: 1.5,
                '&:hover': {
                  bgcolor: '#5568d3',
                },
                '&.Mui-disabled': {
                  bgcolor: '#ccc',
                },
              }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  <span>Signing in...</span>
                </Box>
              ) : (
                'Sign In'
              )}
            </Button>

            {loading && (
              <Typography
                variant="body2"
                sx={{
                  textAlign: 'center',
                  color: '#666',
                  fontSize: '14px'
                }}
              >
                Authenticating with Drupal...
              </Typography>
            )}

            <Typography
              variant="body2"
              sx={{
                textAlign: 'center',
                color: '#666',
                mt: 2
              }}
            >
              Don't have an account?{' '}
              <Link
                to="/register"
                style={{
                  color: '#667eea',
                  textDecoration: 'none',
                  fontWeight: 600
                }}
              >
                Create Account
              </Link>
            </Typography>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default LoginForm;
