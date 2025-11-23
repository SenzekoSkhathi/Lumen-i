import React from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  Divider,
} from "@mui/material";
import { useOutletContext } from "react-router-dom";
import { useSettings } from "../context/SettingsContext.jsx";
import { 
  NotificationsActive as NotificationsActiveIcon, 
  Email as EmailIcon 
} from "@mui/icons-material";

export default function NotificationSettings() {
  const { darkMode } = useOutletContext();
  const {
    notificationSettings,
    setNotificationSettings,
    emailSettings,
    setEmailSettings,
  } = useSettings();

  const panelStyle = {
    p: { xs: 2, md: 3 },
    bgcolor: darkMode ? "#2A2A2A" : "#ffffff",
    color: darkMode ? "#FFFFFF" : "#000000",
    borderRadius: 3,
    mb: 3,
  };

  // --- Handlers for toggles ---
  const handleNotificationToggle = (key) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleEmailToggle = (key) => {
    setEmailSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", color: darkMode ? "#fff" : "#000" }}>
      <Typography variant="h4" fontWeight="600" gutterBottom sx={{ mb: 3 }}>
        Notification Settings
      </Typography>

      {/* --- In-App Notifications --- */}
      <Paper sx={panelStyle}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <NotificationsActiveIcon sx={{ mr: 1.5 }} />
          <Typography variant="h6" fontWeight="500">
            In-App Notifications
          </Typography>
        </Box>
        <Divider sx={{ mb: 2, bgcolor: darkMode ? "#444" : "#eee" }} />
        <List>
          <ListItem>
            <ListItemText
              primary="New video uploaded"
              secondary="Get notified when a tutor uploads a new video."
            />
            <Switch
              edge="end"
              checked={notificationSettings.newVideo}
              onChange={() => handleNotificationToggle("newVideo")}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Tutor uploaded new playlist"
              secondary="Get notified when a new playlist is available."
            />
            <Switch
              edge="end"
              checked={notificationSettings.newPlaylist}
              onChange={() => handleNotificationToggle("newPlaylist")}
            />
          </ListItem>
        </List>
      </Paper>

      {/* --- Email Notifications --- */}
      <Paper sx={panelStyle}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <EmailIcon sx={{ mr: 1.5 }} />
          <Typography variant="h6" fontWeight="500">
            Email Notifications
          </Typography>
        </Box>
        <Divider sx={{ mb: 2, bgcolor: darkMode ? "#444" : "#eee" }} />
        <List>
          <ListItem>
            <ListItemText
              primary="Weekly progress emails"
              secondary="Receive a summary of your learning activity each week."
            />
            <Switch
              edge="end"
              checked={emailSettings.weeklyProgress}
              onChange={() => handleEmailToggle("weeklyProgress")}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Password changes"
              secondary="Receive an email confirmation when your password is changed."
            />
            <Switch
              edge="end"
              checked={emailSettings.passwordChange}
              onChange={() => handleEmailToggle("passwordChange")}
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Billing emails"
              secondary="Receive invoices and subscription updates. (Coming Soon)"
            />
            <Switch
              edge="end"
              checked={emailSettings.billing}
              onChange={() => handleEmailToggle("billing")}
              disabled // Disabled as requested
            />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
}