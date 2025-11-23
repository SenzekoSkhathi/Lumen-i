// pages/Privacy.jsx

import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Switch,
  Divider,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useOutletContext } from "react-router-dom";
import { useSettings } from "../context/SettingsContext.jsx";
// --- [FIX] Import from the correct file with .js extension ---
import apiClient from "../api/api.js";
import {
  Visibility as VisibilityIcon,
  Storage as StorageIcon,
  Security as SecurityIcon,
  DeleteForever as DeleteForeverIcon,
} from "@mui/icons-material";

export default function Privacy() {
  const { darkMode } = useOutletContext();
  const { privacySettings, setPrivacySettings } = useSettings();

  // State for dialogs
  const [clearHistoryOpen, setClearHistoryOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  // State for API calls
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const panelStyle = {
    p: { xs: 2, md: 3 },
    bgcolor: darkMode ? "#2A2A2A" : "#ffffff",
    color: darkMode ? "#FFFFFF" : "#000000",
    borderRadius: 3,
    mb: 3,
  };

  const handleToggle = (key) => {
    setPrivacySettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleClearHistory = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await apiClient.delete("/api/history/clear-all");
      setSuccess("Your watch history has been successfully cleared.");
    } catch (err) {
      setError("Failed to clear watch history. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
      setClearHistoryOpen(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", color: darkMode ? "#fff" : "#000" }}>
      <Typography variant="h4" fontWeight="600" gutterBottom sx={{ mb: 3 }}>
        Privacy & Data
      </Typography>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* --- Visibility Settings --- */}
      <Paper sx={panelStyle}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <VisibilityIcon sx={{ mr: 1.5 }} />
          <Typography variant="h6" fontWeight="500">
            Visibility Settings
          </Typography>
        </Box>
        <Divider sx={{ mb: 2, bgcolor: darkMode ? "#444" : "#eee" }} />
        <List>
          <ListItem>
            <ListItemText
              primary="Allow tutors to view your learning progress"
              secondary="This helps tutors provide personalized feedback. (Coming Soon)"
            />
            <Switch
              edge="end"
              checked={privacySettings.allowTutorView}
              onChange={() => handleToggle("allowTutorView")}
              disabled
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Show your profile picture to others"
              secondary="Your avatar will be visible in comments and forums."
            />
            <Switch
              edge="end"
              checked={privacySettings.showProfilePicture}
              onChange={() => handleToggle("showProfilePicture")}
              disabled
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Hide your watch history (Private Mode)"
              secondary="Your viewing activity will not be saved or shown."
            />
            <Switch
              edge="end"
              checked={privacySettings.hideWatchHistory}
              onChange={() => handleToggle("hideWatchHistory")}
              disabled
            />
          </ListItem>
        </List>
      </Paper>

      {/* --- Data Controls --- */}
      <Paper sx={panelStyle}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <StorageIcon sx={{ mr: 1.5 }} />
          <Typography variant="h6" fontWeight="500">
            Data Controls
          </Typography>
        </Box>
        <Divider sx={{ mb: 2, bgcolor: darkMode ? "#444" : "#eee" }} />
        <List>
          <ListItem>
            <ListItemText
              primary="Download my data"
              secondary="Request a copy of your account info and watch history."
            />
            <Button variant="outlined" disabled>Coming Soon</Button>
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Clear watch history"
              secondary="Permanently delete all of your viewing history."
            />
            <Button
              variant="outlined"
              color="error"
              onClick={() => setClearHistoryOpen(true)}
            >
              Clear
            </Button>
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Clear search history"
              secondary="Permanently delete all of your past searches."
            />
            <Button variant="outlined" color="error" disabled>
              Clear
            </Button>
          </ListItem>
        </List>
      </Paper>

      {/* --- Security & Permissions --- */}
      <Paper sx={panelStyle}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <SecurityIcon sx={{ mr: 1.5 }} />
          <Typography variant="h6" fontWeight="500">
            Security & Permissions
          </Typography>
        </Box>
        <Divider sx={{ mb: 2, bgcolor: darkMode ? "#444" : "#eee" }} />
        <List>
          <ListItem>
            <ListItemText primary="Connected devices" />
            <Button variant="outlined" disabled>Manage</Button>
          </ListItem>
          <ListItem>
            <ListItemText primary="Allowed browser sessions" />
            <Button variant="outlined" disabled>Manage</Button>
          </ListItem>
          <ListItem>
            <ListItemText primary="Blocked users" />
            <Button variant="outlined" disabled>Manage</Button>
          </ListItem>
        </List>
      </Paper>

      {/* --- Account Deletion --- */}
      <Paper sx={panelStyle}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <DeleteForeverIcon sx={{ mr: 1.5, color: "error.main" }} />
          <Typography variant="h6" fontWeight="500" color="error.main">
            Account Deletion
          </Typography>
        </Box>
        <Divider sx={{ mb: 2, bgcolor: darkMode ? "#444" : "#eee" }} />
        <List>
          <ListItem>
            <ListItemText
              primary="Temporary deactivate account"
              secondary="Your profile and data will be hidden until you log back in."
            />
            <Button variant="outlined" color="error" onClick={() => setDeactivateOpen(true)}>
              Deactivate
            </Button>
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Permanently delete account"
              secondary="This action is irreversible and all your data will be lost."
            />
            <Button
              variant="contained"
              color="error"
              onClick={() => setDeleteAccountOpen(true)}
            >
              Delete
            </Button>
          </ListItem>
        </List>
      </Paper>

      {/* --- Confirmation Dialogs --- */}

      {/* Clear History Dialog */}
      <Dialog open={clearHistoryOpen} onClose={() => setClearHistoryOpen(false)}>
        <DialogTitle>Clear Watch History?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete your entire watch
            history? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearHistoryOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleClearHistory}
            color="error"
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Clear History"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deactivate Account Dialog (Stub) */}
      <Dialog open={deactivateOpen} onClose={() => setDeactivateOpen(false)}>
        <DialogTitle>Deactivate Account</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This feature is coming soon.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeactivateOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog (Stub) */}
      <Dialog open={deleteAccountOpen} onClose={() => setDeleteAccountOpen(false)}>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This feature is coming soon.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAccountOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}