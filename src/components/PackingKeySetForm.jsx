import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import { refreshAccessToken } from '../services/authService';
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
  Lock,
  Visibility,
  VisibilityOff,
  CheckCircle
} from '@mui/icons-material';
import toast from 'react-hot-toast';

/**
 * Packing Key Set/Update Form Component
 * Allows users to set or update their packing key with confirmation
 */
const PackingKeySetForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    packingKey: '',
    packingKeyConfirm: ''
  });

  const [showPackingKey, setShowPackingKey] = useState(false);
  const [showPackingKeyConfirm, setShowPackingKeyConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

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

    // Packing key validation
    if (!formData.packingKey.trim()) {
      newErrors.packingKey = 'Packing key is required';
    } else if (formData.packingKey.length < 8) {
      newErrors.packingKey = 'Packing key must be at least 8 characters long';
    }

    // Packing key confirmation validation
    if (!formData.packingKeyConfirm.trim()) {
      newErrors.packingKeyConfirm = 'Please confirm your packing key';
    } else if (formData.packingKey !== formData.packingKeyConfirm) {
      newErrors.packingKeyConfirm = 'Packing keys do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await apiService.setPackingKey(
        formData.packingKey.trim(),
        formData.packingKeyConfirm.trim()
      );

      // Check for successful response - backend might return different structure
      const isSuccess = response && (
        response.success === true ||
        response.status === 'success' ||
        response.message ||
        Object.keys(response).length > 0
      );

      if (isSuccess) {
        setSuccess(true);
        toast.success('Packing key saved successfully!');

        // SECURITY: Clear the packing key from memory immediately
        setFormData({ packingKey: '', packingKeyConfirm: '' });

        try {
          // Refresh the access token to get a new one
          // This handles the case where the old token was revoked by the server
          const refreshResult = await refreshAccessToken();

          // Navigate to dashboard after token refresh
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } catch (refreshError) {
          console.error('Token refresh failed after packing key update:', refreshError);
          // Still navigate to dashboard even if refresh fails
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        }
      } else {
        setErrors({
          general: 'Failed to save packing key. Please try again.'
        });
      }
    } catch (error) {
      console.error('Packing key save failed:', error);
      setErrors({
        general: error.message || 'Failed to save packing key. Please try again.'
      });
      toast.error('Save failed. Please try again.');
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
                  Packing Key Set Successfully!
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, opacity: 0.95 }}>
                  Your packing key has been saved securely.
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                  Please remember your packing key - you'll need it to access your vault.
                </Typography>
                <Typography variant="body2" sx={{ mb: 4, opacity: 0.9 }}>
                  Redirecting to dashboard...
                </Typography>
                <CircularProgress color="inherit" />
              </Box>
            </Fade>
          </Paper>
        </Box>
      </Grow>
    );
  }

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
          Set Your Packing Key
        </Typography>

        <Typography
          variant="body2"
          sx={{
            textAlign: 'center',
            color: '#666',
            mb: 3
          }}
        >
          Create a strong packing key to secure your password vault
        </Typography>

        {errors.general && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errors.general}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              fullWidth
              required
              type={showPackingKey ? 'text' : 'password'}
              name="packingKey"
              label="Packing Key"
              placeholder="Enter a strong packing key"
              value={formData.packingKey}
              onChange={handleChange}
              error={!!errors.packingKey}
              helperText={errors.packingKey || 'Min 8 characters'}
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
                      onClick={() => setShowPackingKey(!showPackingKey)}
                      edge="end"
                      disabled={loading}
                    >
                      {showPackingKey ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <TextField
              fullWidth
              required
              type={showPackingKeyConfirm ? 'text' : 'password'}
              name="packingKeyConfirm"
              label="Confirm Packing Key"
              placeholder="Re-enter your packing key"
              value={formData.packingKeyConfirm}
              onChange={handleChange}
              error={!!errors.packingKeyConfirm}
              helperText={errors.packingKeyConfirm}
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
                      onClick={() => setShowPackingKeyConfirm(!showPackingKeyConfirm)}
                      edge="end"
                      disabled={loading}
                    >
                      {showPackingKeyConfirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

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
                  <span>Saving...</span>
                </Box>
              ) : (
                'Save Packing Key'
              )}
            </Button>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={() => navigate('/dashboard')}
              disabled={loading}
              sx={{
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '16px',
                color: '#667eea',
                borderColor: '#667eea',
                '&:hover': {
                  borderColor: '#5568d3',
                  color: '#5568d3'
                }
              }}
            >
              Skip for Now
            </Button>
          </Box>
        </form>
      </Paper>

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

export default PackingKeySetForm;
