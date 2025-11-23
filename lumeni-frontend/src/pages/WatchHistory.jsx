// pages/WatchHistory.jsx

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardMedia,
  CardContent,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useOutletContext, useNavigate, Link } from "react-router-dom";
import apiClient from "../api/api.js";

const formatDuration = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  let parts = [];
  if (hours > 0) parts.push(String(hours));
  if (parts.length > 0) parts.push(String(minutes).padStart(2, "0"));
  else parts.push(String(minutes));
  parts.push(String(seconds).padStart(2, "0"));
  return parts.join(":");
};

const formatDate = (isoString) => {
  if (!isoString) return "";
  return new Date(isoString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function WatchHistory() {
  const { darkMode } = useOutletContext();
  const navigate = useNavigate();
  const [watchHistory, setWatchHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // [FIX] Removed '/api' prefix
        const response = await apiClient.get("/history");
        setWatchHistory(response.data);
      } catch (error) {
        console.error("Failed to fetch all watch history:", error);
        setError("Could not load your watch history. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllHistory();
  }, []);

  return (
    <Box sx={{ color: darkMode ? "#fff" : "#001440" }}>
      <IconButton onClick={() => navigate("/profile")} sx={{ color: darkMode ? "#fff" : "#001440", mb: 1 }}>
        <ArrowBackIcon />
      </IconButton>
      <Typography variant="h4" sx={{ fontWeight: "600", color: darkMode ? "#fff" : "#001440", mb: 2 }}>
        Watch History
      </Typography>
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress sx={{ color: darkMode ? "#fff" : "#2A2A2A" }} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      ) : watchHistory.length === 0 ? (
        <Typography variant="body2" sx={{ opacity: 0.7, mt: 2 }}>
          You haven't watched any videos yet.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {watchHistory.map((video) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={video.id}>
              <Link to={`/video/${video.id}`} style={{ textDecoration: "none", width: "100%" }}>
                <Card sx={{ bgcolor: darkMode ? "#1A1A1A" : "#ffffff", color: darkMode ? "#ffffff" : "#001440", borderRadius: 3, overflow: "hidden", height: "100%", display: "flex", flexDirection: "column", boxShadow: darkMode ? "0 4px 12px rgba(0,0,0,0.4)" : "0 4px 12px rgba(0,0,0,0.08)", "&:hover": { transform: "scale(1.03)", transition: "transform 0.2s ease-in-out" } }}>
                  <Box sx={{ position: "relative" }}>
                    <CardMedia component="img" height="180" image={video.thumbnail_url || "https://placehold.co/400x225"} alt={video.title} />
                    <Typography variant="caption" sx={{ position: "absolute", bottom: 8, right: 8, bgcolor: "rgba(0, 0, 0, 0.75)", color: "white", borderRadius: "4px", px: 0.75, py: 0.25, fontWeight: 600 }}>
                      {formatDuration(video.duration)}
                    </Typography>
                  </Box>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" fontWeight="600" title={video.title} sx={{ overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", mb: 0.5, minHeight: "2.8em" }}>
                      {video.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: darkMode ? "#ccc" : "#555", mt: 0.5 }}>
                      {video.tutor_name || "Unknown Channel"}
                    </Typography>
                    <Typography variant="body2" sx={{ color: darkMode ? "#aaa" : "#777" }}>
                      Watched: {formatDate(video.watched_at)}
                    </Typography>
                  </CardContent>
                </Card>
              </Link>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}