import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Protected Route Component
 * Wraps routes that require authentication
 */
const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner"></div>
        <p>Checking authentication...</p>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required roles
  if (requiredRoles.length > 0) {
    const userRoles = user?.roles || [];
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return (
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You don't have the required permissions to access this page.</p>
        </div>
      );
    }
  }

  // Render protected content
  return children;
};

export default ProtectedRoute;

/**
 * Higher-order component for creating protected routes
 */
export const withAuth = (Component, requiredRoles = []) => {
  return function AuthenticatedComponent(props) {
    return (
      <ProtectedRoute requiredRoles={requiredRoles}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
};