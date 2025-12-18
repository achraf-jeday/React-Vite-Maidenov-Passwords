import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/apiService';
import { refreshAccessToken } from '../services/authService';
import { useEncryption } from '../contexts/EncryptionContext';
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
 * Packing Key Validation Form Component
 * Validates an existing packing key and redirects to dashboard on success
 */
const PackingKeyValidationForm = () => {
  const navigate = useNavigate();
  const { deriveAndStoreKey } = useEncryption();
  const [packingKey, setPackingKey] = useState('');
  const [showPackingKey, setShowPackingKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!packingKey.trim()) {
      setError('Packing key is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Step 1: Validate packing key with backend (also returns salt)
      const response = await apiService.validatePackingKey(packingKey.trim());

      if (response && response.valid) {
        // Step 2: Extract salt from response
        const salt = response.salt;

        if (!salt) {
          throw new Error('Salt not returned from server');
        }

        // Step 3: Derive encryption key and store in memory
        const keyDerived = await deriveAndStoreKey(packingKey.trim(), salt);

        if (!keyDerived) {
          throw new Error('Failed to derive encryption key');
        }

        setSuccess(true);
        toast.success('Packing key validated successfully!');

        try {
          // Refresh the access token
          await refreshAccessToken();

          // Navigate to dashboard after token refresh
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        } catch (refreshError) {
          console.error('Token refresh failed after packing key validation:', refreshError);
          // Still navigate to dashboard even if refresh fails
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        }
      } else {
        setError('Invalid packing key. Please try again.');
      }
    } catch (error) {
      console.error('Packing key validation failed:', error);
      setError(error.message || 'Failed to validate packing key. Please try again.');
      toast.error('Validation failed. Please try again.');
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
                  Welcome Back!
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, opacity: 0.95 }}>
                  Your packing key has been validated successfully.
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
          Validate Your Packing Key
        </Typography>

        <Typography
          variant="body2"
          sx={{
            textAlign: 'center',
            color: '#666',
            mb: 3
          }}
        >
          Enter your packing key to access your password vault
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
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
              placeholder="Enter your packing key"
              value={packingKey}
              onChange={(e) => setPackingKey(e.target.value)}
              error={!!error}
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
                  <span>Validating...</span>
                </Box>
              ) : (
                'Validate Packing Key'
              )}
            </Button>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={() => navigate('/packing-key/set')}
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
              Change Packing Key
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

export default PackingKeyValidationForm;