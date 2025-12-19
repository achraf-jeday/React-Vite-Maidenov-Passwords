import React from 'react';
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Divider,
  Switch,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip
} from '@mui/material';
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  LaptopMac as LaptopIcon
} from '@mui/icons-material';

const Security = () => {
  const [passwords, setPasswords] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(false);

  const handlePasswordChange = (e) => {
    setPasswords({
      ...passwords,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    console.log('Password change requested');
  };

  const activeSessions = [
    { id: 1, device: 'Chrome on Windows', location: 'New York, USA', lastActive: '2 minutes ago', current: true },
    { id: 2, device: 'Safari on iPhone', location: 'Los Angeles, USA', lastActive: '1 hour ago', current: false },
    { id: 3, device: 'Firefox on MacOS', location: 'San Francisco, USA', lastActive: '2 days ago', current: false }
  ];

  return (
    <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Security Settings
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Change Password */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Change Password
          </Typography>
          <form onSubmit={handlePasswordSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                type="password"
                label="Current Password"
                name="currentPassword"
                value={passwords.currentPassword}
                onChange={handlePasswordChange}
                variant="outlined"
              />
              <TextField
                fullWidth
                type="password"
                label="New Password"
                name="newPassword"
                value={passwords.newPassword}
                onChange={handlePasswordChange}
                variant="outlined"
                helperText="Must be at least 8 characters with uppercase, lowercase, and numbers"
              />
              <TextField
                fullWidth
                type="password"
                label="Confirm New Password"
                name="confirmPassword"
                value={passwords.confirmPassword}
                onChange={handlePasswordChange}
                variant="outlined"
              />
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" color="secondary">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #63408b 100%)'
                    }
                  }}
                >
                  Update Password
                </Button>
              </Box>
            </Box>
          </form>
        </Box>

        <Divider />

        {/* Two-Factor Authentication */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Two-Factor Authentication
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add an extra layer of security to your account
              </Typography>
            </Box>
            <Switch
              checked={twoFactorEnabled}
              onChange={(e) => setTwoFactorEnabled(e.target.checked)}
            />
          </Box>
          {twoFactorEnabled && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Two-factor authentication is enabled. You'll need to enter a code from your authenticator app when logging in.
            </Alert>
          )}
        </Box>

        <Divider />

        {/* Active Sessions */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Active Sessions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            These devices are currently signed in to your account
          </Typography>
          <List>
            {activeSessions.map((session) => (
              <ListItem
                key={session.id}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  bgcolor: session.current ? 'action.hover' : 'background.paper'
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LaptopIcon sx={{ fontSize: 20 }} />
                      <Typography variant="body1" fontWeight={500}>
                        {session.device}
                      </Typography>
                      {session.current && (
                        <Chip label="Current" size="small" color="primary" sx={{ ml: 1 }} />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        {session.location}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Last active: {session.lastActive}
                      </Typography>
                    </Box>
                  }
                />
                {!session.current && (
                  <ListItemSecondaryAction>
                    <IconButton edge="end" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            ))}
          </List>
        </Box>
      </Box>
    </Paper>
  );
};

export default Security;
