import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tabs,
  Tab,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useOutletContext } from "react-router-dom";
import apiClient from "../api/api.js";
import {
  Upload as UploadIcon,
  PlaylistAdd as PlaylistAddIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from "@mui/icons-material";

const panelStyle = (darkMode) => ({
  p: 3,
  bgcolor: darkMode ? "#2A2A2A" : "#ffffff",
  color: darkMode ? "#FFFFFF" : "#000000",
  borderRadius: 3,
  mb: 3,
});

const initialFormData = {
  title: "",
  description: "",
  category: "",
  duration: 0,
  video_url: "",
  thumbnail_url: "",
  tutor_name: "",
};

const categories = [
  "Mathematics",
  "Physics",
  "Computer Science",
  "Chemistry",
  "Biology",
  "Engineering",
  "Business",
  "Arts",
];

const inputSx = (darkMode) => ({
  mb: 2,
  textarea: { color: darkMode ? "#fff" : "#000" },
  input: { color: darkMode ? "#fff" : "#000" },
  label: { color: darkMode ? "#aaa" : "#555" },
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: darkMode ? "#444" : "#ccc" },
    "&:hover fieldset": { borderColor: darkMode ? "#fff" : "#000" },
  },
});

export default function AdminUpload() {
  const { darkMode } = useOutletContext();
  const [tab, setTab] = useState(0);

  // === State for Uploads Tab ===
  const [formData, setFormData] = useState(initialFormData);
  const [myVideos, setMyVideos] = useState([]);
  const [loadingForm, setLoadingForm] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [videosError, setVideosError] = useState(null);
  const [playlistId, setPlaylistId] = useState("");
  const [importCategory, setImportCategory] = useState("");
  const [importTutorName, setImportTutorName] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(null);

  // === State for Playlists Tab ===
  const [playlists, setPlaylists] = useState([]);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTutor, setNewTutor] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createSuccess, setCreateSuccess] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState("");

  const [selectedVideos, setSelectedVideos] = useState([]); 

  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState(null);
  const [addSuccess, setAddSuccess] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editVideo, setEditVideo] = useState(null);
  const [editData, setEditData] = useState(initialFormData);
  const [editLoading, setEditLoading] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewVideo, setPreviewVideo] = useState(null);

  const fetchData = async () => {
    setLoadingVideos(true);
    setVideosError(null);
    try {
      // [FIX] Removed /api prefix
      const [videoRes, playlistRes] = await Promise.all([
        apiClient.get("/videos/my-videos"),
        apiClient.get("/playlists/all-admin"),
      ]);
      const vids = [...videoRes.data].reverse();
      setMyVideos(vids);
      setPlaylists(playlistRes.data);
    } catch (err) {
      setVideosError("Failed to load your uploaded videos.");
      console.error(err);
    } finally {
      setLoadingVideos(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteVideo = async (id, videoURL, thumbnailURL) => {
    if (!window.confirm("Are you sure you want to delete this video?")) return;

    try {
      // [FIX] Removed /api prefix
      await apiClient.delete(`/videos/${id}`);

      await apiClient.post("/storage/delete", {
        video_url: videoURL,
        thumbnail_url: thumbnailURL,
      });

      setMyVideos((prev) => prev.filter((v) => v.id !== id));
      setSelectedIds((prev) => prev.filter((vid) => vid !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete video.");
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = (visibleVideos) => {
    const allIds = visibleVideos.map((v) => v.id);
    const allSelected = allIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !allIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...allIds])));
    }
  };

  const handleBulkDelete = async (visibleVideos) => {
    if (selectedIds.length === 0) return;
    if (!window.confirm("Delete all selected videos?")) return;

    setBulkDeleting(true);
    try {
      for (const video of visibleVideos) {
        if (!selectedIds.includes(video.id)) continue;
        try {
          // [FIX] Removed /api prefix
          await apiClient.delete(`/videos/${video.id}`);
          await apiClient.post("/storage/delete", {
            video_url: video.video_url,
            thumbnail_url: video.thumbnail_url,
          });
        } catch (err) {
          console.error("Failed to delete video in bulk:", err);
        }
      }
      setMyVideos((prev) => prev.filter((v) => !selectedIds.includes(v.id)));
      setSelectedIds([]);
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "duration" ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingForm(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      // [FIX] Removed /api prefix
      const response = await apiClient.post("/videos/upload", formData);
      setFormSuccess(`Video "${response.data.title}" added successfully!`);
      setFormData(initialFormData);
      fetchData(); 
    } catch (err) {
      setFormError("Failed to add video.");
    } finally {
      setLoadingForm(false);
    }
  };

  const handleImportPlaylist = async (e) => {
    e.preventDefault();
    setIsImporting(true);
    setImportError(null);
    setImportSuccess(null);
    const cleanedPlaylistId = playlistId.split("&")[0].trim();
    if (!importCategory || !cleanedPlaylistId || !importTutorName) {
      setImportError("Please enter Playlist ID, Category, and Tutor Name.");
      setIsImporting(false);
      return;
    }
    try {
      // [FIX] Removed /api prefix
      const response = await apiClient.post("/admin/import-playlist", {
        playlist_id: cleanedPlaylistId,
        category: importCategory,
        tutor_name: importTutorName,
      });
      setImportSuccess(response.data.message);
      setPlaylistId("");
      setImportCategory("");
      setImportTutorName("");
      fetchData();
    } catch (err) {
      setImportError(
        err.response?.data?.detail || "Failed to import playlist."
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);
    setCreateSuccess(null);
    try {
      // [FIX] Removed /api prefix
      await apiClient.post("/playlists/create", {
        name: newName,
        description: newDesc,
        tutor_name: newTutor,
      });
      setNewName("");
      setNewDesc("");
      setNewTutor("");
      setCreateSuccess("Playlist created successfully!");
      fetchData();
    } catch (err) {
      setCreateError("Failed to create playlist.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAddVideo = async (e) => {
    e.preventDefault();
    if (!selectedPlaylist || selectedVideos.length === 0) {
      setAddError("Please select a playlist and at least one video.");
      return;
    }
    setAddLoading(true);
    setAddError(null);
    setAddSuccess(null);
    try {
      // [FIX] Removed /api prefix
      await apiClient.put(`/playlists/${selectedPlaylist}/add-video`, {
        video_ids: selectedVideos,
      });
      setAddSuccess("Videos added to playlist!");
      setSelectedVideos([]);
      setSelectedPlaylist("");
      fetchData();
    } catch (err) {
      setAddError("Failed to add videos.");
    } finally {
      setAddLoading(false);
    }
  };

  const openEditDialog = (video) => {
    setEditVideo(video);
    setEditData({
      title: video.title || "",
      description: video.description || "",
      category: video.category || "",
      duration: video.duration || 0,
      video_url: video.video_url || "",
      thumbnail_url: video.thumbnail_url || "",
      tutor_name: video.tutor_name || "",
    });
    setEditOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: name === "duration" ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleEditSave = async () => {
    if (!editVideo) return;
    setEditLoading(true);
    try {
      // [FIX] Removed /api prefix
      const resp = await apiClient.put(`/videos/${editVideo.id}`, editData);
      const updated = resp.data || editData;

      setMyVideos((prev) =>
        prev.map((v) =>
          v.id === editVideo.id
            ? {
                ...v,
                ...updated,
              }
            : v
        )
      );
      setEditOpen(false);
      setEditVideo(null);
    } catch (err) {
      console.error("Failed to update video:", err);
      alert("Failed to update video.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditClose = () => {
    if (editLoading) return;
    setEditOpen(false);
    setEditVideo(null);
  };

  const openPreview = (video) => {
    setPreviewVideo(video);
    setPreviewOpen(true);
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewVideo(null);
  };

  const selectSx = {
    color: darkMode ? "#fff" : "#000",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: darkMode ? "#444" : "#ccc",
    },
    "& .MuiSvgIcon-root": { color: darkMode ? "#fff" : "#777" },
  };
  const menuProps = {
    PaperProps: {
      sx: {
        bgcolor: darkMode ? "#333" : "#fff",
        color: darkMode ? "#fff" : "#000",
      },
    },
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();

  let visibleVideos = myVideos;

  if (normalizedSearch) {
    visibleVideos = visibleVideos.filter((v) => {
      const title = v.title?.toLowerCase() || "";
      const tutor = v.tutor_name?.toLowerCase() || "";
      const category = v.category?.toLowerCase() || "";
      return (
        title.includes(normalizedSearch) ||
        tutor.includes(normalizedSearch) ||
        category.includes(normalizedSearch)
      );
    });
  }

  visibleVideos = [...visibleVideos].sort((a, b) => {
    if (sortOption === "newest") {
      return (b.id || 0) - (a.id || 0);
    } else if (sortOption === "oldest") {
      return (a.id || 0) - (b.id || 0);
    } else if (sortOption === "mostViews") {
      return (b.views || 0) - (a.views || 0);
    } else if (sortOption === "leastViews") {
      return (a.views || 0) - (b.views || 0);
    }
    return 0;
  });

  const allVisibleSelected =
    visibleVideos.length > 0 &&
    visibleVideos.every((v) => selectedIds.includes(v.id));

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      <Typography
        variant="h4"
        fontWeight="600"
        gutterBottom
        sx={{ color: darkMode ? "#fff" : "#001440", mb: 3 }}
      >
        Upload Management
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(e, val) => setTab(val)}
          textColor="inherit"
          indicatorColor="primary"
        >
          <Tab label="Uploads" />
          <Tab label="Playlists" />
        </Tabs>
      </Box>

      {tab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Paper sx={panelStyle(darkMode)}>
              <Typography variant="h6" gutterBottom>
                Import from YouTube Playlist
              </Typography>
              <Box component="form" onSubmit={handleImportPlaylist}>
                <TextField
                  label="YouTube Playlist ID"
                  value={playlistId}
                  onChange={(e) => setPlaylistId(e.target.value)}
                  fullWidth
                  required
                  sx={inputSx(darkMode)}
                />
                <TextField
                  label="Tutor / Channel Name"
                  value={importTutorName}
                  onChange={(e) => setImportTutorName(e.target.value)}
                  fullWidth
                  required
                  sx={inputSx(darkMode)}
                  placeholder="e.g. Khan Academy"
                />
                <FormControl fullWidth required sx={inputSx(darkMode)}>
                  <InputLabel id="import-category-label">
                    Assign Category
                  </InputLabel>
                  <Select
                    labelId="import-category-label"
                    value={importCategory}
                    label="Assign Category"
                    onChange={(e) => setImportCategory(e.target.value)}
                    sx={selectSx}
                    MenuProps={menuProps}
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {importSuccess && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    {importSuccess}
                  </Alert>
                )}
                {importError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {importError}
                  </Alert>
                )}
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={
                    isImporting ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <PlaylistAddIcon />
                    )
                  }
                  disabled={isImporting}
                  sx={{
                    bgcolor: "#001440",
                    color: "#fff",
                    "&:hover": { bgcolor: "#002880" },
                  }}
                >
                  Import Playlist
                </Button>
              </Box>
            </Paper>

            <Paper sx={panelStyle(darkMode)}>
              <Typography variant="h6" gutterBottom>
                Add Single Video
              </Typography>
              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  label="Tutor / Channel Name"
                  name="tutor_name"
                  value={formData.tutor_name}
                  onChange={handleChange}
                  fullWidth
                  required
                  sx={inputSx(darkMode)}
                />
                <TextField
                  label="Video Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  fullWidth
                  required
                  sx={inputSx(darkMode)}
                />
                <TextField
                  label="YouTube Video ID"
                  name="video_url"
                  value={formData.video_url}
                  onChange={handleChange}
                  fullWidth
                  required
                  sx={inputSx(darkMode)}
                />
                <FormControl fullWidth required sx={inputSx(darkMode)}>
                  <InputLabel id="category-select-label">Category</InputLabel>
                  <Select
                    labelId="category-select-label"
                    name="category"
                    value={formData.category}
                    label="Category"
                    onChange={handleChange}
                    sx={selectSx}
                    MenuProps={menuProps}
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Duration (in seconds)"
                  name="duration"
                  type="number"
                  value={formData.duration}
                  onChange={handleChange}
                  fullWidth
                  required
                  sx={inputSx(darkMode)}
                />
                <TextField
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  multiline
                  rows={3}
                  fullWidth
                  sx={inputSx(darkMode)}
                />
                <TextField
                  label="Thumbnail URL (Optional)"
                  name="thumbnail_url"
                  value={formData.thumbnail_url}
                  onChange={handleChange}
                  fullWidth
                  sx={inputSx(darkMode)}
                />
                {formSuccess && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    {formSuccess}
                  </Alert>
                )}
                {formError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {formError}
                  </Alert>
                )}
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={
                    loadingForm ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <UploadIcon />
                    )
                  }
                  disabled={loadingForm}
                  sx={{
                    bgcolor: "#001440",
                    color: "#fff",
                    "&:hover": { bgcolor: "#002880" },
                  }}
                >
                  Add Video
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={7}>
            <Paper sx={panelStyle(darkMode)}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                <Typography variant="h6" sx={{ mb: 0 }}>
                  My Uploaded Videos
                </Typography>

                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <TextField
                    size="small"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{
                      minWidth: 180,
                      "& .MuiInputBase-input": {
                        color: darkMode ? "#fff" : "#000",
                      },
                    }}
                  />
                  <FormControl size="small">
                    <Select
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value)}
                      sx={selectSx}
                      MenuProps={menuProps}
                    >
                      <MenuItem value="newest">Newest</MenuItem>
                      <MenuItem value="oldest">Oldest</MenuItem>
                      <MenuItem value="mostViews">Most Views</MenuItem>
                      <MenuItem value="leastViews">Least Views</MenuItem>
                    </Select>
                  </FormControl>
                  <IconButton
                    onClick={fetchData}
                    disabled={loadingVideos}
                    title="Refresh"
                  >
                    <RefreshIcon sx={{ color: darkMode ? "#fff" : "#000" }} />
                  </IconButton>
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 1,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Checkbox
                    checked={allVisibleSelected}
                    indeterminate={
                      selectedIds.length > 0 && !allVisibleSelected
                    }
                    onChange={() => handleSelectAllVisible(visibleVideos)}
                    sx={{ color: darkMode ? "#fff" : "#000" }}
                  />
                  <Typography variant="body2">
                    Select all visible ({visibleVideos.length})
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={
                    bulkDeleting ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <DeleteIcon />
                    )
                  }
                  disabled={selectedIds.length === 0 || bulkDeleting}
                  onClick={() => handleBulkDelete(visibleVideos)}
                >
                  Delete Selected ({selectedIds.length})
                </Button>
              </Box>

              {loadingVideos ? (
                <CircularProgress
                  sx={{ color: darkMode ? "#fff" : "#001440" }}
                />
              ) : videosError ? (
                <Alert severity="error">{videosError}</Alert>
              ) : visibleVideos.length === 0 ? (
                <Typography>No videos found.</Typography>
              ) : (
                <List sx={{ width: "100%", maxHeight: 800, overflowY: "auto" }}>
                  {visibleVideos.map((video) => (
                    <div key={video.id}>
                      <ListItem
                        secondaryAction={
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <IconButton
                              onClick={() => openEditDialog(video)}
                              sx={{
                                color: darkMode ? "#60a5fa" : "#1d4ed8",
                              }}
                              title="Edit"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              onClick={() =>
                                handleDeleteVideo(
                                  video.id,
                                  video.video_url,
                                  video.thumbnail_url
                                )
                              }
                              sx={{
                                color: darkMode ? "#ff6b6b" : "#b30000",
                                "&:hover": {
                                  color: darkMode ? "#ff8787" : "#e60000",
                                },
                              }}
                              title="Delete"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        }
                      >
                        <Checkbox
                          edge="start"
                          checked={selectedIds.includes(video.id)}
                          onChange={() => handleToggleSelect(video.id)}
                          tabIndex={-1}
                          disableRipple
                          sx={{ color: darkMode ? "#fff" : "#000", mr: 1 }}
                        />

                        <ListItemIcon sx={{ cursor: "pointer" }}>
                          <img
                            onClick={() => openPreview(video)}
                            src={
                              video.thumbnail_url ||
                              "https://placehold.co/120x90"
                            }
                            alt={video.title}
                            style={{
                              width: 80,
                              height: 45,
                              borderRadius: 4,
                              objectFit: "cover",
                            }}
                          />
                        </ListItemIcon>

                        <ListItemText
                          primary={video.title}
                          secondary={`Tutor: ${
                            video.tutor_name || "N/A"
                          } • Views: ${Number(
                            video.views || 0
                          ).toLocaleString()}`}
                          primaryTypographyProps={{
                            color: darkMode ? "#fff" : "#000",
                          }}
                        />
                      </ListItem>
                    </div>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {tab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={panelStyle(darkMode)}>
              <Typography variant="h6" gutterBottom>
                Import from YouTube Playlist
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7, mb: 2 }}>
                Paste a YouTube Playlist ID or URL and we’ll pull in the
                videos.
              </Typography>

              {importError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {importError}
                </Alert>
              )}
              {importSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {importSuccess}
                </Alert>
              )}

              <form onSubmit={handleImportPlaylist}>
                <TextField
                  label="Playlist ID or URL"
                  value={playlistId}
                  onChange={(e) => setPlaylistId(e.target.value)}
                  fullWidth
                  margin="normal"
                />
                <TextField
                  label="Category"
                  value={importCategory}
                  onChange={(e) => setImportCategory(e.target.value)}
                  fullWidth
                  margin="normal"
                />
                <TextField
                  label="Tutor Name"
                  value={importTutorName}
                  onChange={(e) => setImportTutorName(e.target.value)}
                  fullWidth
                  margin="normal"
                />

                <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={
                      isImporting ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <PlaylistAddIcon />
                      )
                    }
                    disabled={isImporting}
                    sx={{
                      bgcolor: "#001440",
                      color: "#fff",
                      "&:hover": { bgcolor: "#002880" },
                    }}
                  >
                    Import Playlist
                  </Button>
                </Box>
              </form>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={panelStyle(darkMode)}>
              <Typography variant="h6" gutterBottom>
                Create Playlist
              </Typography>

              {createError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {createError}
                </Alert>
              )}
              {createSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {createSuccess}
                </Alert>
              )}

              <form onSubmit={handleCreatePlaylist}>
                <TextField
                  label="Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  fullWidth
                  margin="normal"
                />
                <TextField
                  label="Description"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  fullWidth
                  margin="normal"
                  multiline
                  rows={2}
                />
                <TextField
                  label="Tutor Name"
                  value={newTutor}
                  onChange={(e) => setNewTutor(e.target.value)}
                  fullWidth
                  margin="normal"
                />

                <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={createLoading}
                    sx={{
                      bgcolor: "#001440",
                      color: "#fff",
                      "&:hover": { bgcolor: "#002880" },
                    }}
                  >
                    {createLoading ? "Creating..." : "Create Playlist"}
                  </Button>
                </Box>
              </form>

              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Add Videos to Playlist
                </Typography>

                {addError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {addError}
                  </Alert>
                )}
                {addSuccess && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    {addSuccess}
                  </Alert>
                )}

                <FormControl fullWidth margin="normal">
                  <InputLabel>Playlist</InputLabel>
                  <Select
                    value={selectedPlaylist}
                    label="Playlist"
                    onChange={(e) => setSelectedPlaylist(e.target.value)}
                  >
                    {playlists.map((pl) => (
                      <MenuItem key={pl.id} value={pl.id}>
                        {pl.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Video IDs (comma-separated) or pick from 'Uploads' tab list"
                  value={selectedVideos.join(",")}
                  onChange={(e) =>
                    setSelectedVideos(
                      e.target.value
                        .split(",")
                        .map((id) => id.trim())
                        .filter(Boolean)
                    )
                  }
                  fullWidth
                  margin="normal"
                  placeholder="E.g. 1, 2, 3"
                />

                <Box
                  sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}
                >
                  <Button
                    variant="contained"
                    disabled={addLoading}
                    onClick={handleAddVideo}
                    sx={{
                      bgcolor: "#001440",
                      color: "#fff",
                      "&:hover": { bgcolor: "#002880" },
                    }}
                  >
                    {addLoading ? "Adding..." : "Add to Playlist"}
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      <Dialog open={editOpen} onClose={handleEditClose} fullWidth maxWidth="sm">
        <DialogTitle>Edit Video</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Title"
            name="title"
            value={editData.title}
            onChange={handleEditChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Description"
            name="description"
            value={editData.description}
            onChange={handleEditChange}
            fullWidth
            margin="normal"
            multiline
            rows={3}
          />
          <TextField
            label="Category"
            name="category"
            value={editData.category}
            onChange={handleEditChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Duration (seconds)"
            name="duration"
            type="number"
            value={editData.duration}
            onChange={handleEditChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Tutor Name"
            name="tutor_name"
            value={editData.tutor_name}
            onChange={handleEditChange}
            fullWidth
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose} disabled={editLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleEditSave}
            variant="contained"
            disabled={editLoading}
          >
            {editLoading ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={previewOpen}
        onClose={closePreview}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Preview</DialogTitle>
        <DialogContent dividers>
          {previewVideo && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {previewVideo.title}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Category: {previewVideo.category || "N/A"} • Tutor:{" "}
                {previewVideo.tutor_name || "N/A"}
              </Typography>
              <Box
                sx={{
                  position: "relative",
                  pt: "56.25%",
                  borderRadius: 2,
                  overflow: "hidden",
                  bgcolor: "#000",
                }}
              >
                <iframe
                  src={previewVideo.video_url}
                  title={previewVideo.title}
                  style={{
                    position: "absolute",
                    inset: 0,
                    border: 0,
                    width: "100%",
                    height: "100%",
                  }}
                  allowFullScreen
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closePreview}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}