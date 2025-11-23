import { useState, useEffect } from "react";
import { useParams, Link, useOutletContext } from "react-router-dom";
import {
  Box, Typography, CircularProgress, Paper, Alert,
  List, ListItem, ListItemIcon, ListItemText, Avatar
} from "@mui/material";
import apiClient from "../api/api";
import { PlayCircleOutline as PlayIcon } from "@mui/icons-material";

const formatDuration = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default function PlaylistPage() {
  const { playlistId } = useParams();
  const { darkMode } = useOutletContext();
  const [playlist, setPlaylist] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlaylistData = async () => {
      setLoading(true);
      setError(null);
      try {
        // [FIX] Removed '/api' prefix
        const [plRes, vidRes] = await Promise.all([
          apiClient.get(`/playlists/${playlistId}`),
          apiClient.get(`/playlists/${playlistId}/videos`)
        ]);
        setPlaylist(plRes.data);
        setVideos(vidRes.data);
      } catch (err) {
        setError("Failed to load playlist.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaylistData();
  }, [playlistId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress sx={{ color: darkMode ? "#fff" : "#001440" }} />
      </Box>
    );
  }

  if (error || !playlist) {
    return <Alert severity="error" sx={{ m: 3 }}>{error || "Playlist not found."}</Alert>;
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", p: { xs: 2, md: 4 } }}>
      <Paper
        elevation={0}
        sx={{
          p: 3, mb: 4, borderRadius: 4, bgcolor: darkMode ? "#2A2A2A" : "#f0f0f0",
          color: darkMode ? "#fff" : "#000", display: "flex", gap: 3
        }}
      >
        <Avatar
          variant="rounded"
          src={playlist.thumbnail_url || "https://placehold.co/160x90"}
          sx={{ width: 160, height: 90 }}
        />
        <Box>
          <Typography variant="h4" fontWeight="bold">{playlist.name}</Typography>
          <Typography variant="body1" sx={{ opacity: 0.8, mt: 1 }}>{playlist.tutor_name}</Typography>
          <Typography variant="body2" sx={{ opacity: 0.6 }}>{videos.length} videos</Typography>
        </Box>
      </Paper>

      <List sx={{ bgcolor: darkMode ? "#1A1A1A" : "#fff", borderRadius: 3 }}>
        {videos.map((video, index) => (
          <ListItem
            key={video.id}
            button
            component={Link}
            to={`/video/${video.id}`}
            sx={{
              borderBottom: index < videos.length - 1 ? (darkMode ? "1px solid #333" : "1px solid #eee") : "none"
            }}
          >
            <ListItemIcon sx={{ color: darkMode ? "#aaa" : "#555", fontSize: 30, mr: 1 }}>
              {index + 1}
            </ListItemIcon>
            <Avatar
              variant="rounded"
              src={video.thumbnail_url || "https://placehold.co/120x68"}
              sx={{ width: 120, height: 68, mr: 2 }}
            />
            <ListItemText
              primary={video.title}
              secondary={`${formatDuration(video.duration)} • ${video.views.toLocaleString()} views`}
              primaryTypographyProps={{ fontWeight: 600, color: darkMode ? "#fff" : "#000" }}
              secondaryTypographyProps={{ color: darkMode ? "#aaa" : "#555" }}
            />
            <PlayIcon sx={{ color: darkMode ? "#aaa" : "#777", ml: 2 }} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}