import { useState, useEffect } from 'react';
import { useParams, useOutletContext, Link } from 'react-router-dom';
import { 
  Box, Typography, CircularProgress, Paper, Alert, Grid, List, ListItem, ListItemAvatar, ListItemText, Avatar, Divider
} from '@mui/material';
import YouTube from 'react-youtube';
import apiClient from '../api/api';
import { useSettings } from '../context/SettingsContext.jsx';

const formatDuration = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export default function VideoPlayer() {
  const { videoId } = useParams();
  const { darkMode } = useOutletContext();
  const { autoplay } = useSettings();
  
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(true);

  useEffect(() => {
    setLoading(true);
    setLoadingRelated(true);
    setError(null);
    setVideo(null);
    setRelatedVideos([]);

    const recordView = async () => {
      try {
        // [FIX] Removed '/api' prefix
        await apiClient.post(`/videos/${videoId}/view`);
      } catch (err) {
        console.error("Failed to record video view:", err);
      }
    };

    const fetchVideo = async () => {
      try {
        // [FIX] Removed '/api' prefix
        const response = await apiClient.get(`/videos/${videoId}`);
        setVideo(response.data);
        recordView();
      } catch (err) {
        setError('Failed to load video.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [videoId]);

  useEffect(() => {
    if (video) {
      const fetchRelated = async () => {
        setLoadingRelated(true);
        try {
          let results = [];
          try {
            // [FIX] Removed '/api' prefix
            const searchRes = await apiClient.get(
              `/search/videos?q=${encodeURIComponent(video.title)}`
            );
            results = searchRes.data;
          } catch (e) {
            console.warn("Semantic search failed, falling back to category.");
          }

          if (results.length < 5) {
            // [FIX] Removed '/api' prefix
            const categoryRes = await apiClient.get(
              `/videos/browse?category=${encodeURIComponent(video.category)}&page_size=10`
            );
            const categoryItems = categoryRes.data.items || [];
            results = [...results, ...categoryItems];
          }

          const uniqueVideos = [];
          const seenIds = new Set();
          seenIds.add(video.id); 

          for (const v of results) {
            if (!seenIds.has(v.id)) {
              seenIds.add(v.id);
              uniqueVideos.push(v);
            }
          }
          setRelatedVideos(uniqueVideos.slice(0, 15)); 
        } catch (err) {
          console.error("Failed to load related videos:", err);
        } finally {
          setLoadingRelated(false);
        }
      };
      fetchRelated();
    }
  }, [video]);

  const playerOptions = {
    height: '100%', width: '100%',
    playerVars: { autoplay: autoplay ? 1 : 0, rel: 0, },
  };

  if (loading) {
    return (<Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress sx={{ color: darkMode ? "#fff" : "#001440" }} /></Box>);
  }

  if (error || !video) {
    return (<Alert severity="error" sx={{ m: 3 }}>{error || 'Video not found.'}</Alert>);
  }

  return (
    <Box sx={{ maxWidth: 1600, mx: 'auto', p: { xs: 1, sm: 3 } }}>
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper elevation={0} sx={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 3, bgcolor: '#000', mb: 2 }}>
            <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
              <YouTube videoId={video.video_url} opts={playerOptions} style={{ width: '100%', height: '100%' }} />
            </Box>
          </Paper>
          <Box sx={{ px: { xs: 1, md: 0 } }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: darkMode ? '#fff' : '#001440', fontSize: { xs: '1.2rem', md: '1.5rem'} }}>{video.title}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
               <Typography variant="body2" sx={{ color: darkMode ? '#aaa' : '#555' }}>{Number(video.views).toLocaleString()} views • {video.category}</Typography>
            </Box>
            <Divider sx={{ bgcolor: darkMode ? '#333' : '#eee', mb: 2 }} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Link to={`/channel/${video.tutor_name}`} style={{ textDecoration: 'none' }}>
                <Avatar sx={{ width: 48, height: 48, bgcolor: darkMode ? '#333' : '#001440', fontWeight: 'bold', fontSize: '1.2rem' }}>{video.tutor_name ? video.tutor_name[0].toUpperCase() : "T"}</Avatar>
              </Link>
              <Box>
                <Link to={`/channel/${video.tutor_name}`} style={{ textDecoration: 'none' }}>
                  <Typography variant="subtitle1" fontWeight="600" sx={{ color: darkMode ? '#fff' : '#001440' }}>{video.tutor_name}</Typography>
                </Link>
                <Typography variant="body2" sx={{ color: darkMode ? '#ccc' : '#333', mt: 1, whiteSpace: 'pre-wrap' }}>{video.description}</Typography>
              </Box>
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Box sx={{ position: { lg: 'sticky' }, top: { lg: 20 } }}>
            <Typography variant="h6" fontWeight="600" sx={{ color: darkMode ? '#fff' : '#001440', mb: 2, px: 1 }}>Up Next</Typography>
            {loadingRelated ? (<Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={30} sx={{ color: darkMode ? "#fff" : "#001440" }} /></Box>) : (
              <List sx={{ width: '100%', p: 0 }}>
                {relatedVideos.map((related) => (
                  <ListItem key={related.id} button component={Link} to={`/video/${related.id}`} alignItems="flex-start" sx={{ mb: 1, borderRadius: 2, p: 1, '&:hover': { bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' } }}>
                    <ListItemAvatar sx={{ mr: 1.5, mt: 0 }}>
                      <Box sx={{ position: 'relative', width: 168, height: 94, borderRadius: 2, overflow: 'hidden' }}>
                        <img src={related.thumbnail_url || "https://placehold.co/168x94"} alt={related.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <Typography variant="caption" sx={{ position: 'absolute', bottom: 4, right: 4, bgcolor: 'rgba(0, 0, 0, 0.8)', color: 'white', borderRadius: 1, px: 0.5, fontSize: '0.75rem', fontWeight: 600 }}>{formatDuration(related.duration)}</Typography>
                      </Box>
                    </ListItemAvatar>
                    <ListItemText primary={<Typography variant="body2" fontWeight="600" sx={{ color: darkMode ? '#fff' : '#001440', lineHeight: 1.2, mb: 0.5, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{related.title}</Typography>} secondary={<Box component="span" sx={{ display: 'flex', flexDirection: 'column' }}><Typography component="span" variant="caption" sx={{ color: darkMode ? "#aaa" : "#606060" }}>{related.tutor_name}</Typography><Typography component="span" variant="caption" sx={{ color: darkMode ? "#aaa" : "#606060" }}>{Number(related.views).toLocaleString()} views</Typography></Box>} sx={{ m: 0 }} />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}