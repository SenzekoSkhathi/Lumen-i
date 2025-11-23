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
  FormControl,
  Select,
  MenuItem,
  ListItemSecondaryAction,
  Button, // <-- 1. THIS IS THE FIX
} from "@mui/material";
import { useOutletContext } from "react-router-dom";
import { useSettings } from "../context/SettingsContext.jsx";
import {
  DownloadDone as DownloadDoneIcon,
  Wifi as WifiIcon,
  Hd as HdIcon,
  DeleteSweep as DeleteSweepIcon,
} from "@mui/icons-material";

export default function Downloads() {
  const { darkMode } = useOutletContext();
  const { downloadSettings, setDownloadSettings } = useSettings();

  const panelStyle = {
    p: { xs: 2, md: 3 },
    bgcolor: darkMode ? "#2A2A2A" : "#ffffff",
    color: darkMode ? "#FFFFFF" : "#000000",
    borderRadius: 3,
    mb: 3,
  };

  // Generic handler for all download setting changes
  const handleChange = (key, value) => {
    setDownloadSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const selectSx = {
    color: darkMode ? "#fff" : "#000",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: darkMode ? "#444" : "#ccc",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: darkMode ? "#fff" : "#000",
    },
    "& .MuiSvgIcon-root": { color: darkMode ? "#fff" : "#777" },
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", color: darkMode ? "#fff" : "#000" }}>
      <Typography variant="h4" fontWeight="600" gutterBottom sx={{ mb: 3 }}>
        Downloads
      </Typography>

      {/* --- Manage Downloads --- */}
      <Paper sx={panelStyle}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <DownloadDoneIcon sx={{ mr: 1.5 }} />
          <Typography variant="h6" fontWeight="500">
            Manage Downloads
          </Typography>
        </Box>
        <Divider sx={{ mb: 2, bgcolor: darkMode ? "#444" : "#eee" }} />
        <List>
          <ListItem>
            <ListItemText
              primary="Downloaded Videos"
              secondary="No videos downloaded. (This feature is coming soon)"
            />
            <Button variant="outlined" disabled> {/* <-- 2. This now works */}
              Manage
            </Button>
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Automatic delete after watched"
              secondary="Remove videos from downloads after you finish watching them."
            />
            <Switch
              edge="end"
              checked={downloadSettings.autoDelete}
              onChange={(e) => handleChange("autoDelete", e.target.checked)}
            />
          </ListItem>
        </List>
      </Paper>

      {/* --- Download Preferences --- */}
      <Paper sx={panelStyle}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <HdIcon sx={{ mr: 1.5 }} />
          <Typography variant="h6" fontWeight="500">
            Download Preferences
          </Typography>
        </Box>
        <Divider sx={{ mb: 2, bgcolor: darkMode ? "#444" : "#eee" }} />
        <List>
          <ListItem>
            <ListItemText
              primary="Auto-download next video"
              secondary="Automatically download the next video in a playlist."
            />
            <Switch
              edge="end"
              checked={downloadSettings.autoDownloadNext}
              onChange={(e) =>
                handleChange("autoDownloadNext", e.target.checked)
              }
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <WifiIcon />
            </ListItemIcon>
            <ListItemText
              primary="Download only on Wi-Fi"
              secondary="Prevent downloads over your mobile data connection."
            />
            <Switch
              edge="end"
              checked={downloadSettings.downloadOnWifiOnly}
              onChange={(e) =>
                handleChange("downloadOnWifiOnly", e.target.checked)
              }
            />
          </ListItem>
          <ListItem>
            <ListItemText primary="Download Quality" />
            <ListItemSecondaryAction>
              <FormControl size="small">
                <Select
                  value={downloadSettings.downloadQuality}
                  onChange={(e) =>
                    handleChange("downloadQuality", e.target.value)
                  }
                  sx={selectSx}
                >
                  <MenuItem value="1080p">Full HD (1080p)</MenuItem>
                  <MenuItem value="720p">HD (720p)</MenuItem>
                  <MenuItem value="360p">Standard (360p)</MenuItem>
                </Select>
              </FormControl>
            </ListItemSecondaryAction>
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
}