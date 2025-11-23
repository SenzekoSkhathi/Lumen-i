﻿import { useState, useEffect, useRef } from "react";
import { 
  Grid, 
  Card, 
  CardMedia, 
  CardContent, 
  Typography, 
  Box, 
  Chip,
  CircularProgress,
  Alert
} from "@mui/material";
import { useOutletContext, Link, useSearchParams } from "react-router-dom"; 
import apiClient from "../api/api.js";

// Helper to format duration
const formatDuration = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  let parts = [];
  if (hours > 0) parts.push(String(hours));
  if (parts.length > 0) {
    parts.push(String(minutes).padStart(2, "0"));
  } else {
    parts.push(String(minutes));
  }
  parts.push(String(seconds).padStart(2, "0"));
  return parts.join(":");
};

export default function Home() {
  // [FIX] Destructured 'collapsed' from context
  const { darkMode, collapsed } = useOutletContext();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get("search");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [page, setPage] = useState(1);
  const pageSize = 24;
  const sentinelRef = useRef(null);
  const [hasMore, setHasMore] = useState(true);

  const categories = [
    "All", "Mathematics", "Physics", "Computer Science",
    "Chemistry", "Biology", "Engineering", "Business", "Arts",
  ];

  async function fetchVideos(reset = false) {
    if (reset) {
        setLoading(true);
    }
    setError(null);

    let url = `/videos/browse?page=${reset ? 1 : page}&page_size=${pageSize}`;
    
    if (selectedCategory !== "All") {
      url += `&category=${encodeURIComponent(selectedCategory)}`;
    }
    
    if (searchTerm) {
      url += `&search=${encodeURIComponent(searchTerm)}`;
    }

    try {
      const response = await apiClient.get(url);
      
      const responseData = response.data;
      const newItems = responseData.items || [];
      const totalItems = responseData.total || 0;

      if (reset) {
        setVideos(newItems);
      } else {
        setVideos((prev) => {
          const existingIds = new Set(prev.map(v => v.id));
          const uniqueNew = newItems.filter(v => !existingIds.has(v.id));
          return [...prev, ...uniqueNew];
        });
      }

      const currentCount = reset ? newItems.length : videos.length + newItems.length;
      setHasMore(currentCount < totalItems && newItems.length > 0);

    } catch (err) {
      setError("Failed to load videos.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchVideos(true);
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    if (page > 1) {
        fetchVideos(false);
    }
  }, [page]);

  useEffect(() => {
    if (loading || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      },
      { rootMargin: "200px" }
    );

    if (sentinelRef.current) observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [loading, hasMore]);

  return (
    <Box sx={{ px: 3, py: 2, color: darkMode ? "#fff" : "#001440" }}>
      {searchTerm && (
        <Typography variant="h5" fontWeight="600" sx={{ mb: 2 }}>
          Search results for: "{searchTerm}"
        </Typography>
      )}

      {/* Categories Chips - Left Aligned */}
      <Box sx={{ 
          display: "flex", 
          flexWrap: "wrap", 
          gap: 1.5, 
          mb: 4, 
          justifyContent: 'flex-start' 
      }}>
        {categories.map((cat) => {
          const active = selectedCategory === cat;
          const chipBg = darkMode
            ? active ? "#fff" : "#2A2A2A"
            : active ? "#001440" : "#f5f5f5";
          const chipColor = darkMode
            ? active ? "#000" : "#fff"
            : active ? "#fff" : "#001440";
          const chipBorder = darkMode ? "1px solid #444" : "1px solid #ddd";
          return (
            <Chip
              key={cat}
              label={cat}
              clickable
              onClick={() => setSelectedCategory(cat)}
              sx={{
                bgcolor: chipBg,
                color: chipColor,
                border: chipBorder,
                fontWeight: active ? 600 : 400,
                "&:hover": {
                  bgcolor: darkMode
                    ? active ? "#fff" : "#333"
                    : active ? "#001440" : "#eee",
                },
              }}
            />
          );
        })}
      </Box>

      {loading && videos.length === 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress sx={{ color: darkMode ? "#fff" : "#001440" }} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      ) : videos.length === 0 ? (
        <Typography align="center" sx={{ mt: 8 }}>
          {searchTerm
            ? `No videos found for "${searchTerm}".`
            : "No videos found for this category."}
        </Typography>
      ) : (
        <Grid container spacing={3}> 
          {videos.map((video) => (
            <Grid 
              item 
              key={video.id} 
              xs={12} sm={6} md={4} lg={4} xl={3} 
              sx={{ display: "flex" }} 
            >
              <Card
                sx={{
                  width: collapsed ? "420px" : "360px",
                  height: "100%",
                  bgcolor: darkMode ? "#1A1A1A" : "#ffffff",
                  color: darkMode ? "#ffffff" : "#001440",
                  borderRadius: 3,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  transition: 'transform 0.2s',
                  boxShadow: darkMode
                    ? "0 4px 12px rgba(0,0,0,0.4)"
                    : "0 4px 12px rgba(0,0,0,0.08)",
                  "&:hover": {
                    transform: "scale(1.02)",
                  },
                }}
              >
                <Link to={`/video/${video.id}`} style={{ textDecoration: "none", color: 'inherit' }}>
                  <Box sx={{ position: "relative" }}>
                    <CardMedia
                      component="img"
                      height="180"
                      image={video.thumbnail_url || "https://placehold.co/400x225"}
                      alt={video.title}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        position: "absolute",
                        bottom: 8,
                        right: 8,
                        bgcolor: "rgba(0, 0, 0, 0.8)",
                        color: "white",
                        borderRadius: "4px",
                        px: 0.75,
                        py: 0.25,
                        fontWeight: 600,
                        fontSize: "0.75rem"
                      }}
                    >
                      {formatDuration(video.duration)}
                    </Typography>
                  </Box>
                </Link>

                <CardContent sx={{ flexGrow: 1, p: 2 }}>
                  <Link to={`/video/${video.id}`} style={{ textDecoration: "none", color: 'inherit' }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      title={video.title}
                      noWrap
                      sx={{ mb: 1 }}
                    >
                      {video.title}
                    </Typography>
                  </Link>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Link
                      to={`/channel/${video.tutor_name}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: darkMode ? "#ccc" : "#555", 
                          '&:hover': { textDecoration: 'underline' }
                        }}
                      >
                        {video.tutor_name || "Unknown Channel"}
                      </Typography>
                    </Link>

                    <Typography variant="body2" sx={{ color: darkMode ? "#aaa" : "#777", opacity: 0.8 }}>
                      {Number(video.views).toLocaleString()} views
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {hasMore && (
          <div ref={sentinelRef} style={{ height: "20px", marginTop: "20px", textAlign: "center" }}>
               {loading && videos.length > 0 && (
                   <CircularProgress size={24} sx={{ color: darkMode ? "#fff" : "#001440" }} />
               )}
          </div>
      )}
    </Box>
  );
}