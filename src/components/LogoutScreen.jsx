import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Fade,
  Grow
} from '@mui/material';
import { ExitToApp } from '@mui/icons-material';

/**
 * Logout Screen Component
 * Displays a transition screen while logging out
 */
const LogoutScreen = () => {
  return (
    <Grow in={true} timeout={800}>
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
          <Fade in={true} timeout={1000}>
            <Box>
              <ExitToApp
                sx={{
                  fontSize: 80,
                  mb: 2,
                  animation: 'fadeOut 1s ease-in-out'
                }}
              />
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                Logging Out...
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, opacity: 0.95 }} component="span">
                Your session is being securely terminated.
              </Typography>
              <Typography variant="body2" sx={{ mb: 4, opacity: 0.9 }} component="span">
                Redirecting to login page...
              </Typography>
              <CircularProgress color="inherit" />
            </Box>
          </Fade>
        </Paper>
      </Box>
    </Grow>
  );
};

export default LogoutScreen;
