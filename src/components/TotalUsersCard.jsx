import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import { api } from '../services/api';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';

const TotalUsersCard = () => {
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchTotalCount = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch first page to get total count from metadata
      const result = await api.getUsers(1, 1, '', [{ id: 'name', desc: false }]);
      setTotalCount(result.total);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching total count:', err);
      setError('Failed to fetch total user count. Please check your authentication and permissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTotalCount();

    // Set up interval to refresh every 30 seconds
    const interval = setInterval(fetchTotalCount, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card
      elevation={3}
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: 3,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '100px',
          height: '100px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          transform: 'translate(20px, -20px)'
        }
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h6" fontWeight="700" sx={{ letterSpacing: '0.5px' }}>
              Total Users
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              Across all pages and departments
            </Typography>
          </Box>
          <Tooltip title="Refresh Total Count">
            <IconButton
              onClick={fetchTotalCount}
              disabled={loading}
              sx={{
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                },
                '&:disabled': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Box display="flex" alignItems="center" gap={2}>
          {loading ? (
            <CircularProgress size={28} sx={{ color: 'white' }} />
          ) : (
            <Typography variant="h2" fontWeight="800" sx={{ letterSpacing: '2px' }}>
              {totalCount.toLocaleString()}
            </Typography>
          )}
          <Box>
            <Chip
              label={loading ? 'Loading...' : 'Live Count'}
              color="success"
              size="small"
              variant="outlined"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                color: 'white',
                fontWeight: 600
              }}
            />
          </Box>
        </Box>

        {!loading && (
          <Typography variant="caption" sx={{ opacity: 0.8, mt: 1, display: 'block' }}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Typography>
        )}

        {error && (
          <Box mt={2}>
            <Alert
              severity="error"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                '& .MuiAlert-icon': {
                  color: 'white'
                }
              }}
            >
              {error}
            </Alert>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TotalUsersCard;