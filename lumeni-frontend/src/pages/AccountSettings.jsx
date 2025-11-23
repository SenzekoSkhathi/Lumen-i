// pages/AccountSettings.jsx

import React, { useContext, useState, useRef } from "react";
import {
  Box,
  Typography,
  Avatar,
  Button,
  TextField,
  Badge,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
} from "@mui/material";
import { AuthContext } from "../context/AuthContext.jsx";
import { useSettings } from "../context/SettingsContext.jsx";
import { useOutletContext } from "react-router-dom";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
// --- [FIX] Import from the correct file with .js extension ---
import apiClient from "../api/api.js";

// --- CROPPER IMPORTS ---
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

// --- (Cropper helper functions remain the same) ---
function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

const getCroppedImg = (image, crop, fileName) => {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d");

  const pixelRatio = window.devicePixelRatio;
  canvas.width = crop.width * pixelRatio;
  canvas.height = crop.height * pixelRatio;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        blob.name = fileName;
        resolve(blob);
      },
      "image/png",
      1
    );
  });
};
// --- END OF HELPERS ---

export default function AccountSettings() {
  const { user, setUser } = useContext(AuthContext);
  const { darkMode } = useOutletContext();
  const { autoplay, setAutoplay, language, setLanguage } = useSettings();
  const fileInputRef = useRef(null);

  // --- State for Forms ---
  const [editedName, setEditedName] = useState(user?.full_name || "");
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  // --- State for UI Feedback ---
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);

  // --- CROPPER STATE ---
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [aspect, setAspect] = useState(1);
  const imgRef = useRef(null);
  // --- END CROPPER STATE ---

  const panelStyle = {
    p: { xs: 2, md: 3 },
    bgcolor: darkMode ? "#2A2A2A" : "#ffffff",
    color: darkMode ? "#FFFFFF" : "#000000",
    borderRadius: 3,
    mb: 3,
  };

  const inputSx = (darkMode) => ({
    mb: 2,
    "& .MuiInputBase-input": { color: darkMode ? "#fff" : "#000" },
    "& .MuiInputBase-input.Mui-disabled": { color: darkMode ? "#888" : "#777" },
    "& label": { color: darkMode ? "#aaa" : "#555" },
    "& label.Mui-focused": { color: "#1976d2" },
    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: darkMode ? "#444" : "#ccc" },
      "&:hover fieldset": { borderColor: darkMode ? "#fff" : "#000" },
      "&.Mui-focused fieldset": { borderColor: "#1976d2" },
      "&.Mui-disabled fieldset": { borderColor: darkMode ? "#333" : "#eee" },
    },
  });

  // --- Handlers for Profile Info ---
  const handleSaveName = async () => {
    setIsSavingName(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      const response = await apiClient.put("/auth/me", {
        full_name: editedName,
      });
      setUser(response.data);
      setSaveSuccess("Username updated successfully!");
    } catch (err) {
      console.error("Failed to update profile:", err);
      setSaveError("Failed to update username. Please try again.");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener("load", () =>
        setImgSrc(reader.result?.toString() || "")
      );
      reader.readAsDataURL(e.target.files[0]);
      setIsCropping(true);
    }
  };

  const handleSaveCrop = async () => {
    if (!completedCrop || !imgRef.current) {
      setSaveError("Could not process image crop.");
      return;
    }
    setIsSavingAvatar(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      const croppedBlob = await getCroppedImg(
        imgRef.current,
        completedCrop,
        "new-avatar.png"
      );
      const formData = new FormData();
      formData.append("file", croppedBlob, "new-avatar.png");
      const response = await apiClient.post("/auth/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser(response.data);
      setSaveSuccess("Avatar updated successfully!");
      setIsCropping(false);
      setImgSrc("");
    } catch (err) {
      console.error("Failed to upload avatar:", err);
      setSaveError("Failed to upload avatar. Please try again.");
    } finally {
      setIsSavingAvatar(false);
    }
  };

  function onImageLoad(e) {
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspect));
    }
  }

  // --- Handlers for Security ---
  const handlePasswordChangeInput = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSavePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(null);

    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (passwordData.new_password.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    setIsSavingPassword(true);
    try {
      await apiClient.post("/auth/me/password", {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      setPasswordSuccess("Password changed successfully!");
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (err) {
      const detail = err.response?.data?.detail || "An error occurred.";
      setPasswordError(`Failed to change password: ${detail}`);
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", color: darkMode ? "#fff" : "#000" }}>
      <Typography variant="h4" fontWeight="600" gutterBottom sx={{ mb: 3 }}>
        Account Settings
      </Typography>

      {/* --- Global Alerts --- */}
      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSaveSuccess(null)}>
          {saveSuccess}
        </Alert>
      )}
      {saveError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveError(null)}>
          {saveError}
        </Alert>
      )}

      {/* === 1. PROFILE INFO === */}
      <Paper sx={panelStyle}>
        <Typography variant="h6" fontWeight="500" gutterBottom>
          Profile Info
        </Typography>
        <Divider sx={{ my: 2, bgcolor: darkMode ? "#444" : "#eee" }} />

        {/* Profile Picture */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 3 }}>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            badgeContent={
              <IconButton
                onClick={() => fileInputRef.current.click()}
                sx={{
                  p: 0.5,
                  bgcolor: "rgba(42,42,42,0.8)",
                  border: "2px solid white",
                  "&:hover": { bgcolor: "rgba(26,26,26,0.9)" },
                }}
              >
                <PhotoCameraIcon sx={{ color: "white", fontSize: 20 }} />
              </IconButton>
            }
          >
            <Avatar
              sx={{
                bgcolor: darkMode ? "#222" : "#001440",
                width: 100,
                height: 100,
                fontSize: "2rem",
                cursor: "pointer",
              }}
              src={user?.avatar_url || undefined}
              onClick={() => fileInputRef.current.click()}
            >
              {!user?.avatar_url &&
                (user?.full_name?.[0]?.toUpperCase() || "U")}
            </Avatar>
          </Badge>
          <Box>
            <Typography variant="body1" fontWeight="500">
              Profile Picture
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Click the camera to upload a new photo.
            </Typography>
          </Box>
        </Box>

        {/* Profile Details */}
        <TextField
          label="Username (Full Name)"
          variant="outlined"
          fullWidth
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          disabled={isSavingName}
          sx={inputSx(darkMode)}
        />
        <TextField
          label="Email"
          variant="outlined"
          fullWidth
          value={user?.email || ""}
          disabled
          sx={inputSx(darkMode)}
        />
        <Button
          variant="contained"
          onClick={handleSaveName}
          disabled={isSavingName}
          sx={{
            bgcolor: "#1976d2",
            color: "#fff",
            "&:hover": { bgcolor: "#115293" },
          }}
        >
          {isSavingName ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Save Username"
          )}
        </Button>
      </Paper>

      {/* === 2. SECURITY === */}
      <Paper sx={panelStyle}>
        <Typography variant="h6" fontWeight="500" gutterBottom>
          Security
        </Typography>
        <Divider sx={{ my: 2, bgcolor: darkMode ? "#444" : "#eee" }} />

        {/* Password Change */}
        <Typography variant="body1" fontWeight="500" sx={{ mb: 1 }}>
          Change Password
        </Typography>
        <TextField
          label="Current Password"
          name="current_password"
          type="password"
          variant="outlined"
          fullWidth
          value={passwordData.current_password}
          onChange={handlePasswordChangeInput}
          disabled={isSavingPassword}
          sx={inputSx(darkMode)}
        />
        <TextField
          label="New Password (min. 8 characters)"
          name="new_password"
          type="password"
          variant="outlined"
          fullWidth
          value={passwordData.new_password}
          onChange={handlePasswordChangeInput}
          disabled={isSavingPassword}
          sx={inputSx(darkMode)}
        />
        <TextField
          label="Confirm New Password"
          name="confirm_password"
          type="password"
          variant="outlined"
          fullWidth
          value={passwordData.confirm_password}
          onChange={handlePasswordChangeInput}
          disabled={isSavingPassword}
          sx={inputSx(darkMode)}
        />
        {passwordSuccess && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setPasswordSuccess(null)}>
            {passwordSuccess}
          </Alert>
        )}
        {passwordError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPasswordError(null)}>
            {passwordError}
          </Alert>
        )}
        <Button
          variant="contained"
          onClick={handleSavePassword}
          disabled={isSavingPassword}
        >
          {isSavingPassword ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Update Password"
          )}
        </Button>

        <Divider sx={{ my: 3, bgcolor: darkMode ? "#444" : "#eee" }} />

        {/* Other Security Options (Stubbed) */}
        <List>
          <ListItem disablePadding>
            <ListItemText
              primary="Two-Factor Authentication"
              secondary="Manage your 2FA settings for enhanced security."
            />
            <Button variant="outlined" disabled>
              Coming Soon
            </Button>
          </ListItem>
          <ListItem disablePadding sx={{ mt: 2 }}>
            <ListItemText
              primary="Manage Login Sessions"
              secondary="Review and revoke active login sessions on other devices."
            />
            <Button variant="outlined" disabled>
              Coming Soon
            </Button>
          </ListItem>
          <ListItem disablePadding sx={{ mt: 2 }}>
            <ListItemText
              primary="Logout All Other Devices"
              secondary="Sign out from all devices except this one."
            />
            <Button variant="outlined" disabled>
              Coming Soon
            </Button>
          </ListItem>
        </List>
      </Paper>

      {/* === 3. PREFERENCES === */}
      <Paper sx={panelStyle}>
        <Typography variant="h6" fontWeight="500" gutterBottom>
          Preferences
        </Typography>
        <Divider sx={{ my: 2, bgcolor: darkMode ? "#444" : "#eee" }} />

        <FormControl fullWidth sx={inputSx(darkMode)}>
          <InputLabel id="language-select-label">Language</InputLabel>
          <Select
            labelId="language-select-label"
            value={language}
            label="Language"
            onChange={(e) => setLanguage(e.target.value)}
            disabled // Stubbed for now
          >
            <MenuItem value="en-US">English (United States)</MenuItem>
            <MenuItem value="es-ES" disabled>
              Español (Coming Soon)
            </MenuItem>
            <MenuItem value="fr-FR" disabled>
              Français (Coming Soon)
            </MenuItem>
          </Select>
          <Typography variant="caption" sx={{ opacity: 0.7, mt: 1 }}>
            (Language selection is coming soon)
          </Typography>
        </FormControl>

        <FormControlLabel
          control={
            <Switch
              checked={autoplay}
              onChange={(e) => setAutoplay(e.target.checked)}
              color="primary"
            />
          }
          label="Autoplay next video"
          sx={{ mt: 2, display: "block" }}
        />
        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          Automatically play the next video in a series or playlist.
        </Typography>
      </Paper>

      {/* --- CROPPER MODAL (Unchanged) --- */}
      <Dialog
        open={isCropping}
        onClose={() => setIsCropping(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Crop Your Avatar</DialogTitle>
        <DialogContent>
          {imgSrc && (
            <Box>
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspect}
                circularCrop
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={imgSrc}
                  style={{
                    transform: `scale(${scale}) rotate(${rotate}deg)`,
                    maxHeight: "70vh",
                    width: "100%",
                  }}
                  onLoad={onImageLoad}
                />
              </ReactCrop>
              <Typography gutterBottom sx={{ mt: 2 }}>
                Zoom
              </Typography>
              <Slider
                value={scale}
                min={1}
                max={3}
                step={0.1}
                onChange={(e, newScale) => setScale(newScale)}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setIsCropping(false)} disabled={isSavingAvatar}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveCrop}
            variant="contained"
            disabled={isSavingAvatar}
            startIcon={
              isSavingAvatar ? (
                <CircularProgress size={20} color="inherit" />
              ) : null
            }
          >
            Save Avatar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}