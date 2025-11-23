// pages/Profile.jsx (Only the fetchHistory logic needs attention, here is the corrected full file)

import React, { useContext, useEffect, useState, useRef } from "react";
import {
  Box,
  Typography,
  Avatar,
  Divider,
  Card,
  CardContent,
  Button,
  TextField,
  Badge,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  CardMedia,
} from "@mui/material";
import { AuthContext } from "../context/AuthContext.jsx";
import { useOutletContext, useNavigate, Link } from "react-router-dom";
import SwitchAccountIcon from "@mui/icons-material/SwitchAccount";
import EditIcon from "@mui/icons-material/Edit";
import LogoutIcon from "@mui/icons-material/Logout";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import AddIcon from "@mui/icons-material/Add";
import apiClient from "../api/api.js";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

// ... (Helper functions getCroppedImg, centerAspectCrop, formatDuration remain the same) ...
function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth, mediaHeight
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
  ctx.drawImage(image, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY, 0, 0, crop.width, crop.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error("Canvas is empty")); return; }
      blob.name = fileName;
      resolve(blob);
    }, "image/png", 1);
  });
};
const formatDuration = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default function Profile() {
  const { user, logout, setUser } = useContext(AuthContext);
  const { darkMode } = useOutletContext();
  const navigate = useNavigate();

  const buttonStyle = {
    bgcolor: darkMode ? "#2A2A2A" : "#e0e0e0",
    color: darkMode ? "#fff" : "#000",
    borderRadius: "50px",
    textTransform: "none",
    fontWeight: 500,
    fontSize: "0.8rem",
    "&:hover": { bgcolor: darkMode ? "#222" : "#d5d5d5" },
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.full_name || "");
  const fileInputRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const [aspect, setAspect] = useState(1);
  const imgRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);
  const linkedAccounts = [
    { id: 2, name: "Senzeko (Work)", initial: "W" },
    { id: 3, name: "Senzeko (Personal 2)", initial: "P" },
  ];
  const handleSwitchMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleSwitchMenuClose = () => setAnchorEl(null);
  const handleAccountSelect = (accountId) => handleSwitchMenuClose();
  const handleAddAccountClick = () => { navigate("/login"); handleSwitchMenuClose(); };

  const [watchHistory, setWatchHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        // [FIX] Removed '/api' prefix
        const response = await apiClient.get("/history?limit=5");
        const data = Array.isArray(response.data) 
          ? response.data 
          : (response.data.items || []);
        setWatchHistory(data);
      } catch (error) {
        console.error("Failed to fetch watch history:", error);
        setWatchHistory([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleEditClick = () => { setIsEditing(true); setEditedName(user?.full_name || ""); setSaveError(null); setSaveSuccess(null); };
  const handleCancelClick = () => { setIsEditing(false); setSaveError(null); setSaveSuccess(null); };
  const handleSaveNameClick = async () => {
    setIsSaving(true); setSaveError(null); setSaveSuccess(null);
    try {
      const response = await apiClient.put("/auth/me", { full_name: editedName });
      setUser(response.data); setSaveSuccess("Profile updated successfully!"); setIsEditing(false);
    } catch (err) { setSaveError("Failed to update profile."); } finally { setIsSaving(false); }
  };
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener("load", () => setImgSrc(reader.result?.toString() || ""));
      reader.readAsDataURL(e.target.files[0]);
      setIsCropping(true);
    }
  };
  const handleSaveCrop = async () => {
    if (!completedCrop || !imgRef.current) return;
    setIsSaving(true); setSaveError(null); setSaveSuccess(null);
    try {
      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop, "new-avatar.png");
      const formData = new FormData();
      formData.append("file", croppedBlob, "new-avatar.png");
      const response = await apiClient.post("/auth/me/avatar", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setUser(response.data); setSaveSuccess("Avatar updated successfully!"); setIsCropping(false); setImgSrc("");
    } catch (err) { setSaveError("Failed to upload avatar."); } finally { setIsSaving(false); }
  };
  function onImageLoad(e) { if (aspect) { const { width, height } = e.currentTarget; setCrop(centerAspectCrop(width, height, aspect)); } }
  const handleLogout = async () => { try { await logout(); navigate("/login"); } catch (err) { console.error("Failed to log out:", err); } };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, height: "100%", color: darkMode ? "#fff" : "#001440", mt: -6 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
        <Typography variant="h4" sx={{ fontWeight: "600", color: darkMode ? "#fff" : "#001440" }}></Typography>
      </Box>
      {saveSuccess && <Alert severity="success" sx={{ mb: 2 }}>{saveSuccess}</Alert>}
      {saveError && <Alert severity="error" sx={{ mb: 2 }}>{saveError}</Alert>}
      <Card sx={{ bgcolor: "#1A1A1A", backgroundImage: 'none', color: darkMode ? "#fff" : "#001440", borderRadius: 3, boxShadow: "none" }}>
        <CardContent sx={{ display: "flex", alignItems: "center", gap: 3 }}>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} />
          <Badge overlap="circular" anchorOrigin={{ vertical: "bottom", horizontal: "right" }} badgeContent={isEditing ? <IconButton onClick={() => fileInputRef.current.click()} sx={{ p: 0.5, bgcolor: "hsla(0, 0%, 17%, 0.80)", border: "2px solid white", "&:hover": { bgcolor: "rgba(26,26,26,0.9)" } }}><PhotoCameraIcon sx={{ color: "white", fontSize: 20 }} /></IconButton> : null}>
            <Avatar sx={{ bgcolor: darkMode ? "#222" : "#001440", width: 120, height: 120, fontSize: "2rem", cursor: isEditing ? "pointer" : "default" }} src={user?.avatar_url || undefined} onClick={() => { if (isEditing) fileInputRef.current.click(); }}>{!user?.avatar_url && (user?.full_name?.[0]?.toUpperCase() || "U")}</Avatar>
          </Badge>
          <Box sx={{ width: "100%" }}>
            {isEditing ? <TextField label="Full Name" variant="standard" fullWidth value={editedName} onChange={(e) => setEditedName(e.target.value)} disabled={isSaving} sx={{ mb: 1, input: { color: darkMode ? "#fff" : "#000", fontSize: "1.25rem", fontWeight: 600 }, label: { color: darkMode ? "#ccc" : "#555" }, "& .MuiInput-underline:before": { borderBottomColor: darkMode ? "#555" : "#ccc" } }} /> : <Typography variant="h6" sx={{ fontWeight: 600 }}>{user?.full_name || "Student User"}</Typography>}
            <Typography variant="body2" sx={{ opacity: 0.8 }}>{user?.email || "user@example.com"}</Typography>
            {isEditing ? <Box sx={{ display: "flex", gap: 1.5, mt: 2 }}><Button variant="contained" onClick={handleSaveNameClick} disabled={isSaving} sx={{ ...buttonStyle, bgcolor: "#1976d2", "&:hover": { bgcolor: "#115293" } }}>{isSaving ? <CircularProgress size={20} color="inherit" /> : "Save"}</Button><Button variant="contained" onClick={handleCancelClick} disabled={isSaving} sx={buttonStyle}>Cancel</Button></Box> : <Box sx={{ display: "flex", gap: 1.5, mt: 2 }}><Button variant="contained" sx={buttonStyle} startIcon={<SwitchAccountIcon />} onClick={handleSwitchMenuClick}>Switch account</Button><Button variant="contained" sx={buttonStyle} startIcon={<EditIcon />} onClick={handleEditClick}>Edit profile</Button><Button variant="contained" sx={buttonStyle} startIcon={<LogoutIcon />} onClick={handleLogout}>Logout</Button></Box>}
          </Box>
        </CardContent>
      </Card>
      <Menu anchorEl={anchorEl} open={menuOpen} onClose={handleSwitchMenuClose} PaperProps={{ sx: { bgcolor: darkMode ? "#2A2A2A" : "#fff", color: darkMode ? "#fff" : "#000", borderRadius: 2, minWidth: 300, boxShadow: "0px 4px 20px rgba(0,0,0,0.4)" } }}>
        <MenuItem sx={{ gap: 1.5, mb: 1, ":hover": { bgcolor: "transparent" } }} disableRipple><Avatar sx={{ width: 40, height: 40, bgcolor: darkMode ? "#222" : "#001440" }} src={user?.avatar_url || undefined}>{!user?.avatar_url && (user?.full_name?.[0]?.toUpperCase() || "U")}</Avatar><Box><Typography sx={{ fontWeight: 600 }}>{user?.full_name || "Student User"}</Typography><Typography variant="body2" sx={{ opacity: 0.8 }}>{user?.email || "user@example.com"}</Typography></Box></MenuItem><Divider sx={{ my: 0.5, bgcolor: darkMode ? "#444" : "#ccc" }} />{linkedAccounts.map((account) => (<MenuItem key={account.id} onClick={() => handleAccountSelect(account.id)} sx={{ gap: 1.5, ":hover": { bgcolor: darkMode ? "#222" : "#eaeaea" } }}><Avatar sx={{ width: 40, height: 40, bgcolor: darkMode ? "#333" : "#f0f0f0", color: darkMode ? "#fff" : "#000" }}>{account.initial}</Avatar><Typography>{account.name}</Typography></MenuItem>))}<Divider sx={{ my: 0.5, bgcolor: darkMode ? "#444" : "#ccc" }} /><MenuItem onClick={handleAddAccountClick} sx={{ gap: 1, ":hover": { bgcolor: darkMode ? "#222" : "#eaeaea" } }}><ListItemIcon><AddIcon sx={{ color: darkMode ? "#fff" : "#000" }} /></ListItemIcon>Add account</MenuItem>
      </Menu>
      <Box sx={{ flexGrow: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5, flexWrap: "nowrap", width: "100%" }}><Typography variant="h5" sx={{ fontWeight: 600, color: darkMode ? "#fff" : "#001440", flexShrink: 0 }}>Watch History</Typography><Button size="small" sx={{ textTransform: "none", color: darkMode ? "#aaa" : "#ccc", borderRadius: "20px", px: 1.5, py: 0.5, fontWeight: 500, fontSize: "0.9rem", "&:hover": { bgcolor: darkMode ? "#222" : "#eaeaea" } }} onClick={() => navigate("/watch-history")}>View all</Button></Box>
        <Box sx={{ display: "flex", gap: 2, overflowX: "auto", pb: 2, minHeight: 180, alignItems: "center", justifyContent: "flex-start", "&::-webkit-scrollbar": { height: "8px" }, "&::-webkit-scrollbar-thumb": { backgroundColor: darkMode ? "#333" : "#ccc", borderRadius: "4px" } }}>
          {isLoading ? (<Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}><CircularProgress sx={{ color: darkMode ? "#fff" : "#2A2A2A" }} /></Box>) : watchHistory.length === 0 ? (<Typography variant="body2" sx={{ opacity: 0.7, pl: 1 }}>No watch history available.</Typography>) : (watchHistory.map((video) => (<Link key={video.id} to={`/video/${video.id}`} style={{ textDecoration: "none" }}><Box sx={{ width: { xs: 250, sm: 300 }, flexShrink: 0, cursor: "pointer", bgcolor: darkMode ? "#1A1A1A" : "#fff", borderRadius: 2, overflow: "hidden", boxShadow: 1, transition: "transform 0.2s", "&:hover": { transform: "scale(1.02)" } }}><CardMedia component="img" height="160" image={video.thumbnail_url || "https://placehold.co/300x160"} alt={video.title} /><Box sx={{ p: 1.5 }}><Typography variant="subtitle2" fontWeight="bold" sx={{ color: darkMode ? "#fff" : "#000", mb: 0.5 }} noWrap>{video.title}</Typography><Typography variant="caption" sx={{ color: darkMode ? "#aaa" : "#666" }}>{formatDuration(video.duration)} • {video.tutor_name || "Unknown"}</Typography></Box></Box></Link>)))}
        </Box>
      </Box>
      <Dialog open={isCropping} onClose={() => setIsCropping(false)} maxWidth="sm" fullWidth><DialogTitle>Crop Your Avatar</DialogTitle><DialogContent>{imgSrc && (<Box><ReactCrop crop={crop} onChange={(_, percentCrop) => setCrop(percentCrop)} onComplete={(c) => setCompletedCrop(c)} aspect={aspect} circularCrop><img ref={imgRef} alt="Crop me" src={imgSrc} style={{ transform: `scale(${scale}) rotate(${rotate}deg)`, maxHeight: "70vh", width: "100%" }} onLoad={onImageLoad} /></ReactCrop><Typography gutterBottom sx={{ mt: 2 }}>Zoom</Typography><Slider value={scale} min={1} max={3} step={0.1} onChange={(e, newScale) => setScale(newScale)} /></Box>)}</DialogContent><DialogActions sx={{ p: 2 }}><Button onClick={() => setIsCropping(false)} disabled={isSaving}>Cancel</Button><Button onClick={handleSaveCrop} variant="contained" disabled={isSaving} startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : null}>Save Avatar</Button></DialogActions></Dialog>
    </Box>
  );
}