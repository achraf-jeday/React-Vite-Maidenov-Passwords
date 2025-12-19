import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEncryption } from '../contexts/EncryptionContext';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  useScrollTrigger,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

// Scroll trigger for elevation
const ElevationScroll = ({ children }) => {
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0,
  });

  return React.cloneElement(children, {
    elevation: trigger ? 4 : 0,
  });
};

const Header = ({ onDrawerToggle }) => {
  const { user, logout, loading, isAuthenticated } = useAuth();
  const { clearKey } = useEncryption();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);

  // Don't show header if user is not authenticated
  if (!user || loading) {
    return null;
  }

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    try {
      // Clear encryption key from memory
      clearKey();
      // Logout from auth system (shows logout screen then navigates)
      await logout();
      // After logout completes and screen is shown, navigate to login
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login', { replace: true });
    }
  };

  const handleNavigate = (path) => {
    handleMenuClose();
    navigate(path);
  };

  return (
    <ElevationScroll>
      <AppBar
        position="sticky"
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
          backdropFilter: 'blur(10px)',
          zIndex: 1300,
          width: '100vw',
          left: 0,
          right: 0,
          margin: 0,
          padding: 0,
          position: 'sticky',
          top: 0,
          minWidth: '100%',
          flexShrink: 0
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 64, md: 72 }, px: { xs: 2, md: 4 } }}>
          {/* Logo/Brand */}
          <Box display="flex" alignItems="center" gap={2} sx={{ mr: 3 }}>
            <Avatar
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                width: 40,
                height: 40,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              <DashboardIcon sx={{ color: 'white' }} />
            </Avatar>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                  background: 'linear-gradient(135deg, #fff, #f0f0f0)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  fontSize: { xs: '1.1rem', md: '1.25rem' }
                }}
              >
                Maidenov Passwords
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontWeight: 500,
                  fontStyle: 'italic',
                  fontSize: '16px',
                  mt: '-8px',
                  display: 'block'
                }}
              >
                Stay secure
              </Typography>
            </Box>
          </Box>

          {/* Desktop Navigation */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              flexGrow: 1,
              justifyContent: 'center',
              gap: { md: 3, lg: 4 }
            }}
          >
            <Typography
              onClick={() => navigate('/dashboard')}
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: 600,
                cursor: 'pointer',
                px: 2,
                py: 1,
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  color: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)'
                }
              }}
            >
              Dashboard
            </Typography>
            <Typography
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: 600,
                cursor: 'pointer',
                px: 2,
                py: 1,
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  color: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)'
                }
              }}
            >
              Users
            </Typography>
            <Typography
              onClick={() => navigate('/settings')}
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontWeight: 600,
                cursor: 'pointer',
                px: 2,
                py: 1,
                borderRadius: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  color: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)'
                }
              }}
            >
              Settings
            </Typography>
          </Box>

          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />

          {/* User Section */}
          <Box display="flex" alignItems="center" gap={2}>
            {/* User Info */}
            <Box
              display={{ xs: 'none', md: 'flex' }}
              alignItems="center"
              gap={2}
              sx={{
                px: 2,
                py: 1,
                borderRadius: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.15)'
                }
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  color: '#667eea',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
              >
                {user?.name?.charAt(0) || 'U'}
              </Avatar>
              <Box textAlign="left">
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 700,
                    color: 'white',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                  }}
                >
                  {user?.name || 'Admin'}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontWeight: 500
                  }}
                >
                  {user?.email || 'Administrator'}
                </Typography>
              </Box>
            </Box>

            {/* User Menu Button */}
            <Tooltip title="User Menu">
              <IconButton
                onClick={handleMenuOpen}
                size="large"
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  color: '#667eea',
                  borderRadius: '12px',
                  border: '2px solid rgba(102, 126, 234, 0.8)',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                    transform: 'scale(1.05)',
                    boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
                    borderColor: 'rgba(102, 126, 234, 1)'
                  },
                  '&:active': {
                    transform: 'scale(0.98)'
                  }
                }}
              >
                <PersonIcon sx={{ fontSize: 24, color: '#667eea' }} />
              </IconButton>
            </Tooltip>

            {/* Mobile Menu Button */}
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={onDrawerToggle}
              sx={{ display: { md: 'none' }, mr: 1 }}
            >
              <MenuIcon sx={{ color: 'white', fontSize: 28 }} />
            </IconButton>
          </Box>

          {/* User Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 240,
                backgroundColor: 'background.paper',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                borderRadius: 2,
                py: 1
              }
            }}
          >
            <MenuItem onClick={handleMenuClose} disabled>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}>
                  {user?.name?.charAt(0) || 'U'}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" fontWeight="700">
                    {user?.name || 'User'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.email || 'user@example.com'}
                  </Typography>
                </Box>
              </Box>
            </MenuItem>
            <Divider sx={{ my: 1 }} />
            <MenuItem onClick={() => handleNavigate('/dashboard')}>
              <Box display="flex" alignItems="center" gap={2}>
                <DashboardIcon sx={{ color: 'text.secondary' }} />
                <Typography variant="body2">Dashboard</Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={() => handleNavigate('/settings')}>
              <Box display="flex" alignItems="center" gap={2}>
                <SettingsIcon sx={{ color: 'text.secondary' }} />
                <Typography variant="body2">Settings</Typography>
              </Box>
            </MenuItem>
            <Divider sx={{ my: 1 }} />
            <MenuItem onClick={handleLogout}>
              <Box display="flex" alignItems="center" gap={2}>
                <LogoutIcon sx={{ color: 'error.main' }} />
                <Typography variant="body2" color="error.main">Logout</Typography>
              </Box>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
    </ElevationScroll>
  );
};

export default Header;