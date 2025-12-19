import React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Person as PersonIcon,
  Tune as TuneIcon,
  Security as SecurityIcon,
  AccountCircle as AccountIcon
} from '@mui/icons-material';
import Profile from './settings/Profile';
import Preferences from './settings/Preferences';
import Security from './settings/Security';
import Account from './settings/Account';

const Settings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const menuItems = [
    { path: '/settings/profile', label: 'Profile', icon: <PersonIcon /> },
    { path: '/settings/preferences', label: 'Preferences', icon: <TuneIcon /> },
    { path: '/settings/security', label: 'Security', icon: <SecurityIcon /> },
    { path: '/settings/account', label: 'Account', icon: <AccountIcon /> }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          mb: 3,
          color: 'text.primary'
        }}
      >
        Settings
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Sidebar */}
        <Paper
          elevation={2}
          sx={{
            width: { xs: '100%', md: 280 },
            height: 'fit-content',
            position: { xs: 'relative', md: 'sticky' },
            top: { md: 24 },
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <Box sx={{ p: 2, bgcolor: 'primary.main' }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
              Settings Menu
            </Typography>
          </Box>
          <Divider />
          <List sx={{ py: 1 }}>
            {menuItems.map((item) => (
              <ListItem key={item.path} disablePadding>
                <ListItemButton
                  selected={isActive(item.path)}
                  onClick={() => navigate(item.path)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    '&.Mui-selected': {
                      bgcolor: 'primary.light',
                      color: 'primary.main',
                      borderLeft: '4px solid',
                      borderColor: 'primary.main',
                      '&:hover': {
                        bgcolor: 'primary.light'
                      }
                    },
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive(item.path) ? 'primary.main' : 'text.secondary',
                      minWidth: 40
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: isActive(item.path) ? 600 : 500
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* Content Area */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Routes>
            <Route path="profile" element={<Profile />} />
            <Route path="preferences" element={<Preferences />} />
            <Route path="security" element={<Security />} />
            <Route path="account" element={<Account />} />
            <Route path="/" element={<Navigate to="/settings/profile" replace />} />
          </Routes>
        </Box>
      </Box>
    </Container>
  );
};

export default Settings;
