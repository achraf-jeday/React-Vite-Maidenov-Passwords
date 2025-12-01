import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import DataTable from '../components/DataTable';
import {
  Box,
  Container,
  Typography
} from '@mui/material';

const Dashboard = () => {
  const { user } = useAuth();

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