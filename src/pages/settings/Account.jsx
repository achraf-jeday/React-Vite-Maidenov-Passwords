import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  Switch
} from '@mui/material';
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const Account = () => {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState('');
  const [accountSettings, setAccountSettings] = React.useState({
    accountActive: true,
    publicProfile: false
  });

  const handleDeleteAccount = () => {
    if (confirmText === 'DELETE') {
      console.log('Account deletion confirmed');
      setDeleteDialogOpen(false);
    }
  };

  const handleExportData = () => {
    console.log('Exporting user data...');
  };

  return (
    <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
        Account Settings
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Account Status */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Account Status
          </Typography>
          <List>
            <ListItem sx={{ px: 0 }}>
              <ListItemText
                primary="Account Active"
                secondary="Your account is currently active and accessible"
              />
              <Switch
                checked={accountSettings.accountActive}
                onChange={(e) => setAccountSettings({ ...accountSettings, accountActive: e.target.checked })}
              />
            </ListItem>
            <ListItem sx={{ px: 0 }}>
              <ListItemText
                primary="Public Profile"
                secondary="Make your profile visible to other users"
              />
              <Switch
                checked={accountSettings.publicProfile}
                onChange={(e) => setAccountSettings({ ...accountSettings, publicProfile: e.target.checked })}
              />
            </ListItem>
          </List>
        </Box>

        <Divider />

        {/* Data Export */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Export Your Data
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Download a copy of all your data including passwords, settings, and activity.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportData}
          >
            Export Data
          </Button>
        </Box>

        <Divider />

        {/* Danger Zone */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'error.main' }}>
            Danger Zone
          </Typography>

          <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
            Once you delete your account, there is no going back. Please be certain.
          </Alert>

          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete Account
          </Button>
        </Box>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'error.main', fontWeight: 600 }}>
          Delete Account
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            This action cannot be undone. This will permanently delete your account and remove all of your data from our servers.
          </DialogContentText>
          <DialogContentText sx={{ mb: 2, fontWeight: 600 }}>
            Please type <strong>DELETE</strong> to confirm:
          </DialogContentText>
          <TextField
            fullWidth
            placeholder="DELETE"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            variant="outlined"
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAccount}
            color="error"
            variant="contained"
            disabled={confirmText !== 'DELETE'}
          >
            Delete My Account
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default Account;
