import { useState, useEffect } from "react";
import { useParams, Link, useOutletContext } from "react-router-dom";
import {
  Box, Typography, Grid, Card, CardMedia, CardContent,
  CircularProgress, Avatar, Paper, Alert, Tabs, Tab
} from "@mui/material";
import apiClient from "../api/api";
import VerifiedIcon from '@mui/icons-material/Verified';
import { VideoLibrary, PlaylistPlay } from '@mui/icons-material';

// --- VideoGrid Component ---
const VideoGrid = ({ videos, darkMode, collapsed }) => {
  const formatDuration = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Grid container spacing={3}>
      {videos.map((video) => (
        // [FIX] Added display: flex to grid item
        <Grid key={video.id} xs={12} sm={6} md={4} sx={{ display: 'flex' }}>
          <Link 
            to={`/video/${video.id}`} 
            style={{ textDecoration: 'none', width: '100%' }} // Ensure Link takes full width
          >
            <Card sx={{
              // [FIX] Dynamic Width Logic matches Home Page
              width: collapsed ? "420px" : "360px", 
              height: '100%',
              bgcolor: darkMode ? "#1A1A1A" : "#fff",
              color: darkMode ? "#fff" : "#000",
              borderRadius: 3,
              transition: 'transform 0.2s',
              display: 'flex',
              flexDirection: 'column',
              "&:hover": { transform: 'scale(1.02)' }
            }}>
              <CardMedia
                component="img"
                height="180"
                image={video.thumbnail_url || "https://placehold.co/400"}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold" noWrap title={video.title}>
                  {video.title}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.7, mt: 1 }}>
                  {formatDuration(video.duration)} • {Number(video.views).toLocaleString()} views
                </Typography>
              </CardContent>
            </Card>
          </Link>
        </Grid>
      ))}
    </Grid>
  );
};

// --- PlaylistGrid Component ---
const PlaylistGrid = ({ playlists, darkMode, collapsed }) => (
  <Grid container spacing={3}>
    {playlists.map((pl) => (
      // [FIX] Added display: flex to grid item
      <Grid key={pl.id} xs={12} sm={6} md={4} sx={{ display: 'flex' }}>
        <Link 
          to={`/playlist/${pl.id}`} 
          style={{ textDecoration: 'none', width: '100%' }}
        >
          <Card sx={{
            // [FIX] Dynamic Width Logic matches Home Page
            width: collapsed ? "420px" : "360px",
            height: '100%',
            bgcolor: darkMode ? "#1A1A1A" : "#fff",
            color: darkMode ? "#fff" : "#000",
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.2s',
            "&:hover": { transform: 'scale(1.02)' }
          }}>
            <CardMedia
              component="img"
              height="180"
              image={pl.thumbnail_url || "https://placehold.co/400"}
            />
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h6" fontWeight="bold" noWrap>
                {pl.name}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7, mt: 1 }}>
                {(pl.video_count ?? (pl.video_ids ? pl.video_ids.length : 0))} videos
              </Typography>
            </CardContent>
          </Card>
        </Link>
      </Grid>
    ))}
  </Grid>
);


export default function ChannelPage() {
  const { tutorName } = useParams();
  // [FIX] Destructure collapsed from context
  const { darkMode, collapsed } = useOutletContext();
  const [videos, setVideos] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0); 

  useEffect(() => {
    const fetchChannelData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [vidRes, plRes] = await Promise.all([
          apiClient.get(`/videos/browse?tutor_name=${encodeURIComponent(tutorName)}&page_size=1000`),
          apiClient.get(`/playlists/by-tutor/${encodeURIComponent(tutorName)}`)
        ]);

        setVideos(vidRes.data.items);
        setPlaylists(plRes.data);
      } catch (err) {
        console.error("Failed to load channel data", err);
        setError("Failed to load data for this channel.");
      } finally {
        setLoading(false);
      }
    };

    if (tutorName) {
      fetchChannelData();
    }
  }, [tutorName]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress sx={{ color: darkMode ? "#fff" : "#001440" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Paper
        elevation={0}
        sx={{
          p: 4, mb: 4, borderRadius: 4, bgcolor: darkMode ? "#2A2A1A" : "#f0f0f0",
          color: darkMode ? "#fff" : "#000", display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'center', gap: 3
        }}
      >
        <Avatar sx={{ width: 100, height: 100, bgcolor: '#001440', fontSize: 40, fontWeight: 'bold' }}>
          {tutorName ? tutorName.charAt(0).toUpperCase() : "?"}
        </Avatar>
        <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
          <Typography variant="h3" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
            {tutorName}
            <VerifiedIcon color="primary" sx={{ fontSize: 30 }} />
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.7, mt: 1 }}>
            {videos.length} Videos • {playlists.length} Playlists
          </Typography>
        </Box>
      </Paper>

      <Tabs
        value={tab}
        onChange={(e, newValue) => setTab(newValue)}
        textColor="inherit"
        indicatorColor="primary"
        sx={{ mb: 3 }}
      >
        <Tab icon={<VideoLibrary />} iconPosition="start" label="Videos" />
        <Tab icon={<PlaylistPlay />} iconPosition="start" label="Playlists" />
      </Tabs>

      {error && <Alert severity="error">{error}</Alert>}

      <Box>
        {tab === 0 && (
          videos.length === 0 ? (
            <Typography>This channel has no videos yet.</Typography>
          ) : (
            // [FIX] Passed collapsed prop
            <VideoGrid videos={videos} darkMode={darkMode} collapsed={collapsed} />
          )
        )}
        {tab === 1 && (
          playlists.length === 0 ? (
            <Typography>This channel has no playlists yet.</Typography>
          ) : (
            // [FIX] Passed collapsed prop
            <PlaylistGrid playlists={playlists} darkMode={darkMode} collapsed={collapsed} />
          )
        )}
      </Box>
    </Box>
  );
}