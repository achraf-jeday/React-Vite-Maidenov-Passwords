import React from 'react';
import { useAuth } from '../hooks/useAuth';

/**
 * Dashboard Component (Protected)
 * Shows after successful authentication
 */
const Dashboard = () => {
  const { user, logout, userName, userEmail, userRoles } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {userName}!</h1>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="dashboard-content">
        <div className="user-info-card">
          <h2>User Information</h2>
          <div className="info-item">
            <strong>Name:</strong> {userName}
          </div>
          {userEmail && (
            <div className="info-item">
              <strong>Email:</strong> {userEmail}
            </div>
          )}
          <div className="info-item">
            <strong>User ID:</strong> {user?.id || user?.user_id || 'N/A'}
          </div>
          {userRoles.length > 0 && (
            <div className="info-item">
              <strong>Roles:</strong> {userRoles.join(', ')}
            </div>
          )}
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Protected Content</h3>
            <p>This content is only visible to authenticated users.</p>
          </div>

          <div className="dashboard-card">
            <h3>User Actions</h3>
            <p>Here you can add user-specific functionality.</p>
          </div>

          <div className="dashboard-card">
            <h3>API Access</h3>
            <p>Use the access token to make authenticated API requests.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;