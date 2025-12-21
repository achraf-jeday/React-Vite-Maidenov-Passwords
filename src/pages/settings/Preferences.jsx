import React from 'react';
import {
  Paper,
  Typography,
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
  Select,
  MenuItem,
  InputLabel,
  Divider,
  Button
} from '@mui/material';
import {
  Save as SaveIcon
} from '@mui/icons-material';

const Preferences = () => {
  const [preferences, setPreferences] = React.useState({
    theme: 'light',
    language: 'en',
    notifications: true,
    emailNotifications: false,
    twoFactorAuth: false,
    dataSharing: false
  });

  const handleChange = (name, value) => {
    setPreferences({
      ...preferences,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Preferences updated:', preferences);
  };

  return (
    <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Preferences
      </Typography>

      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Theme Selection */}
          <Box>
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ fontWeight: 600, mb: 2 }}>
                Theme
              </FormLabel>
              <RadioGroup
                value={preferences.theme}
                onChange={(e) => handleChange('theme', e.target.value)}
              >
                <FormControlLabel value="light" control={<Radio />} label="Light" />
                <FormControlLabel value="dark" control={<Radio />} label="Dark" />
                <FormControlLabel value="auto" control={<Radio />} label="Auto (System)" />
              </RadioGroup>
            </FormControl>
          </Box>

          <Divider />

          {/* Language Selection */}
          <Box>
            <FormControl fullWidth>
              <InputLabel>Language</InputLabel>
              <Select
                value={preferences.language}
                label="Language"
                onChange={(e) => handleChange('language', e.target.value)}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="es">Spanish</MenuItem>
                <MenuItem value="fr">French</MenuItem>
                <MenuItem value="de">German</MenuItem>
                <MenuItem value="ar">Arabic</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Divider />

          {/* Notifications */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Notifications
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body1" component="span">Push Notifications</Typography>
                  <Typography variant="body2" color="text.secondary" component="span">
                    Receive push notifications in your browser
                  </Typography>
                </Box>
                <Switch
                  checked={preferences.notifications}
                  onChange={(e) => handleChange('notifications', e.target.checked)}
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body1" component="span">Email Notifications</Typography>
                  <Typography variant="body2" color="text.secondary" component="span">
                    Receive notifications via email
                  </Typography>
                </Box>
                <Switch
                  checked={preferences.emailNotifications}
                  onChange={(e) => handleChange('emailNotifications', e.target.checked)}
                />
              </Box>
            </Box>
          </Box>

          <Divider />

          {/* Privacy */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Privacy
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body1" component="span">Data Sharing</Typography>
                <Typography variant="body2" color="text.secondary" component="span">
                  Share usage data to help improve the application
                </Typography>
              </Box>
              <Switch
                checked={preferences.dataSharing}
                onChange={(e) => handleChange('dataSharing', e.target.checked)}
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
            <Button variant="outlined" color="secondary">
              Reset to Default
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
              Save Preferences
            </Button>
          </Box>
        </Box>
      </form>
    </Paper>
  );
};

export default Preferences;
