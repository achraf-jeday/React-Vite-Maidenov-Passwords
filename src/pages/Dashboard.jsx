import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEncryption } from '../contexts/EncryptionContext';
import apiService from '../services/apiService';
import DataTable from '../components/DataTable';
import {
  Box,
  Container,
  CircularProgress,
  Typography
} from '@mui/material';

const Dashboard = () => {
  const { user } = useAuth();
  const { isUnlocked } = useEncryption();
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [hasPackingKey, setHasPackingKey] = useState(false);

  useEffect(() => {
    const checkPackingKeyAndVaultStatus = async () => {
      try {
        // Check if user has a packing key set
        const response = await apiService.hasPackingKey();
        const userHasPackingKey = response?.exists || response?.has_packing_key || false;
        setHasPackingKey(userHasPackingKey);

        // If user doesn't have a packing key, redirect to set it
        if (!userHasPackingKey) {
          console.log('No packing key found, redirecting to set packing key');
          navigate('/packing-key/set');
          return;
        }

        // If user has packing key but vault is locked, redirect to validate
        if (userHasPackingKey && !isUnlocked) {
          console.log('Vault is locked, redirecting to packing key validation');
          navigate('/packing-key/validate');
          return;
        }

        // Otherwise, user can access dashboard
        setIsChecking(false);
      } catch (error) {
        console.error('Error checking packing key status:', error);
        // On error, assume they need to set/validate packing key
        navigate('/packing-key/validate');
      }
    };

    checkPackingKeyAndVaultStatus();
  }, [navigate, isUnlocked]);

  // Show loading state while checking
  if (isChecking) {
    return (
      <Container maxWidth="xl">
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
          flexDirection="column"
          gap={2}
        >
          <CircularProgress size={48} />
          <Typography variant="body1" color="text.secondary">
            Loading your vault...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Only render DataTable if vault is unlocked
  return (
    <Container maxWidth="xl">
      {/* User Management Table */}
      <Box mb={4}>
        <DataTable user={user} />
      </Box>
    </Container>
  );
};

export default Dashboard;