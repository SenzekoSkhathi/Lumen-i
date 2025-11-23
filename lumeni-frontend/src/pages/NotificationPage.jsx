// pages/NotificationPage.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Alert,
  IconButton,
  Divider,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import apiClient from '../api/api.js';

export default function NotificationPage() {
  const { notificationId } = useParams();
  const { darkMode } = useOutletContext();
  const navigate = useNavigate();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotification = async () => {
      setLoading(true);
      setError(null);
      try {
        // [FIX] Removed '/api' prefix because api.js already adds it
        const response = await apiClient.get(
          `/notifications/${notificationId}`
        );
        setNotification(response.data);
      } catch (err) {
        setError('Failed to load notification. It may have been deleted.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotification();
  }, [notificationId]);

  const panelStyle = {
    p: { xs: 2, md: 4 },
    bgcolor: darkMode ? '#2A2A2A' : '#ffffff',
    color: darkMode ? '#FFFFFF' : '#000000',
    borderRadius: 3,
  };

  const formatDate = (isoString) => {
    if (!isoString) return '...';
    return new Date(isoString).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton
          onClick={() => navigate(-1)} // Go back to the previous page
          sx={{ color: darkMode ? '#fff' : '#000', mr: 1 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography
          variant="h5"
          fontWeight="600"
          sx={{ color: darkMode ? '#fff' : '#001440' }}
        >
          Notification
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress sx={{ color: darkMode ? '#fff' : '#001440' }} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      ) : notification ? (
        <Paper sx={panelStyle}>
          <Typography
            variant="h4"
            fontWeight="600"
            gutterBottom
          >
            {notification.subject}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: darkMode ? '#aaa' : '#555', mb: 3 }}
          >
            Sent on: {formatDate(notification.created_at)}
          </Typography>
          <Divider sx={{ mb: 3, bgcolor: darkMode ? '#444' : '#eee' }} />
          <Typography
            variant="body1"
            sx={{ fontSize: '1.1rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}
          >
            {notification.message}
          </Typography>
        </Paper>
      ) : null}
    </Box>
  );
}