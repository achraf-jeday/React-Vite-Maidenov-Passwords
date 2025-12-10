import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Box } from '@mui/material';
import LoginForm from './components/LoginForm';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout />
      </Router>
    </AuthProvider>
  );
}

function AppLayout() {
  const { user } = useAuth();
  const isLoginPage = window.location.pathname === '/login' || window.location.pathname === '/auth/callback';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        ...(isLoginPage ? {
          // Full-screen layout for login page
          width: '100vw',
          height: '100vh',
          margin: 0,
          padding: 0
        } : {})
      }}
    >
      {/* Global Header - only show when not on login page */}
      {!isLoginPage && <Header />}

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          // Always center content for login form consistency
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          ...(isLoginPage ? {
            // Full-screen for login
            width: '100%',
            height: '100%',
            margin: 0,
            padding: 0,
            backgroundColor: '#f5f5f5'
          } : {
            // Normal layout for other pages
            py: { xs: 3, sm: 4, md: 5 },
            px: { xs: 2, sm: 3, md: 4, lg: 6 },
            mt: 0,
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
          })
        }}
      >
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/auth/callback" element={<LoginForm />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" />} />

          {/* 404 route */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;