import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, validateEmail, validatePassword } from '../services/registerService';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  InputAdornment,
  IconButton,
  Fade,
  Grow
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  CheckCircle,
  Email,
  Person,
  Lock
} from '@mui/icons-material';

/**
 * Register Form Component
 * Handles user registration with email validation and password confirmation
 */
const RegisterForm = () => {
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    passwordConfirm: ''
  });

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field-specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Username validation (optional but if provided should be at least 3 chars)
    if (formData.username && formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters long';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.message;
      }
    }

    // Password confirmation validation
    if (!formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Please confirm your password';
    } else if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await registerUser({
        email: formData.email,
        username: formData.username || formData.email,
        password: formData.password
      });

      // Success!
      setSuccess(true);
      setRegisteredUser(response);

    } catch (error) {
      // Handle backend validation errors
      if (error.status === 400 || error.status === 422) {
        const backendErrors = {};

        // Parse backend error message for email/username uniqueness
        const message = error.message || '';
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('email') && (lowerMessage.includes('already') || lowerMessage.includes('exists'))) {
          backendErrors.email = 'This email is already registered. Please use a different email or login.';
        } else if (lowerMessage.includes('username') && (lowerMessage.includes('already') || lowerMessage.includes('exists') || lowerMessage.includes('taken'))) {
          backendErrors.username = 'This username is already taken. Please choose a different username.';
        } else if (error.errors && typeof error.errors === 'object' && Object.keys(error.errors).length > 0) {
          // Handle structured errors from backend
          Object.assign(backendErrors, error.errors);
        } else {
          backendErrors.general = message || 'Registration failed. Please check your information and try again.';
        }

        setErrors(backendErrors);
      } else {
        setErrors({
          general: error.message || 'Registration failed. Please try again later.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Success message component
  if (success) {
    return (
      <Grow in={success} timeout={800}>
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
              p: 5,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 3
            }}
          >
            <Fade in={success} timeout={1000}>
              <Box>
                <CheckCircle
                  sx={{
                    fontSize: 80,
                    mb: 2,
                    animation: 'bounce 1s ease-in-out'
                  }}
                />
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                  Registration Successful!
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, opacity: 0.95 }}>
                  Welcome, <strong>{registeredUser?.username}</strong>!
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                  Your account has been created successfully.
                </Typography>
                <Typography variant="body2" sx={{ mb: 4, opacity: 0.9 }}>
                  Email: {registeredUser?.email}
                </Typography>

                <Button
                  component={Link}
                  to="/login"
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: 'white',
                    color: '#667eea',
                    fontWeight: 600,
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    '&:hover': {
                      bgcolor: '#f5f5f5'
                    }
                  }}
                >
                  Go to Login
                </Button>
              </Box>
            </Fade>
          </Paper>
        </Box>
      </Grow>
    );
  }

  // Registration form
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
          Create Account
        </Typography>

        <Typography
          variant="body2"
          sx={{
            textAlign: 'center',
            color: '#666',
            mb: 3
          }}
        >
          Join Maidenov Passwords to securely manage your credentials
        </Typography>

        {errors.general && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errors.general}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Email Field */}
            <TextField
              fullWidth
              required
              type="email"
              name="email"
              label="Email Address"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                )
              }}
            />

            {/* Username Field (Optional) */}
            <TextField
              fullWidth
              type="text"
              name="username"
              label="Username (Optional)"
              placeholder="Leave blank to use your email"
              value={formData.username}
              onChange={handleChange}
              error={!!errors.username}
              helperText={errors.username || 'If left blank, your email will be used as username'}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="action" />
                  </InputAdornment>
                )
              }}
            />

            {/* Password Field */}
            <TextField
              fullWidth
              required
              type={showPassword ? 'text' : 'password'}
              name="password"
              label="Password"
              placeholder="Enter a strong password"
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password || 'Min 8 chars, uppercase, lowercase, number, special char'}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            {/* Password Confirmation Field */}
            <TextField
              fullWidth
              required
              type={showPasswordConfirm ? 'text' : 'password'}
              name="passwordConfirm"
              label="Confirm Password"
              placeholder="Re-enter your password"
              value={formData.passwordConfirm}
              onChange={handleChange}
              error={!!errors.passwordConfirm}
              helperText={errors.passwordConfirm}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                      edge="end"
                      disabled={loading}
                    >
                      {showPasswordConfirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 1,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '16px',
                bgcolor: '#667eea',
                '&:hover': {
                  bgcolor: '#5568d3'
                }
              }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  <span>Creating Account...</span>
                </Box>
              ) : (
                'Create Account'
              )}
            </Button>

            {/* Login Link */}
            <Typography
              variant="body2"
              sx={{
                textAlign: 'center',
                color: '#666',
                mt: 1
              }}
            >
              Already have an account?{' '}
              <Link
                to="/login"
                style={{
                  color: '#667eea',
                  textDecoration: 'none',
                  fontWeight: 600
                }}
              >
                Sign In
              </Link>
            </Typography>
          </Box>
        </form>
      </Paper>

      {/* Bounce animation keyframes */}
      <style>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </Box>
  );
};

export default RegisterForm;
