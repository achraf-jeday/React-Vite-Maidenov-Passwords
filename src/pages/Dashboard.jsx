import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import DataTable from '../components/DataTable';
import TotalUsersCard from '../components/TotalUsersCard';
import {
  Box,
  Container,
  Typography
} from '@mui/material';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <Container maxWidth="xl">
      {/* Total Users Card */}
      <Box mb={3}>
        <TotalUsersCard />
      </Box>

      {/* User Management Table */}
      <Box mb={4}>
        <DataTable user={user} />
      </Box>
    </Container>
  );
};

export default Dashboard;