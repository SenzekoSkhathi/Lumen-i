import { useState, useEffect, useContext } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Menu,
  MenuItem,
  Badge,
  Typography,
  Divider,
  Autocomplete,
  TextField,
  Paper,
  CircularProgress,
  Avatar,
} from '@mui/material';
import {
  Home as HomeIcon,
  Person as ProfileIcon,
  Search as SearchIcon,
  Menu as MenuIcon,
  NotificationsNone as NotificationsIcon,
  Settings as SettingsIcon,
  AccountCircleOutlined,
  NotificationsOutlined,
  DownloadOutlined,
  LockOutlined,
  GavelOutlined,
  HelpOutline,
  FeedbackOutlined,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { connectNotificationSocket } from '../notificationSocket.js';
import apiClient from '../api/api.js';
import { debounce } from 'lodash-es';

export default function MainLayout() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const darkMode = true;
  const darkBg = '#1A1A1A';
  const darkText = '#FFFFFF';

  const [collapsed, setCollapsed] = useState(true);
  const toggleSidebar = () => setCollapsed((prev) => !prev);

  let menuItems = [];
  if (user && user.role === 'admin') {
    menuItems = [
      { text: 'Home', icon: <HomeIcon />, path: '/home' },
      { text: 'Faculty Studio', icon: <BarChartIcon />, path: '/faculty' },
      { text: 'Dashboard', icon: <BarChartIcon />, path: '/admin' },
      { text: 'Profile', icon: <ProfileIcon />, path: '/profile' },
    ];
  } else if (user && user.role === 'lecturer') {
    menuItems = [
      { text: 'Home', icon: <HomeIcon />, path: '/home' },
      { text: 'Faculty Studio', icon: <BarChartIcon />, path: '/faculty' },
      { text: 'Profile', icon: <ProfileIcon />, path: '/profile' },
    ];
  } else {
    menuItems = [
      { text: 'Home', icon: <HomeIcon />, path: '/home' },
      { text: 'Workspace', icon: <BarChartIcon />, path: '/workspace' },
      {
        text: 'Lumeni',
        icon: (
          <img
            src={darkMode ? '/logo2.jpg' : '/logo.jpg'}
            alt="Lumeni"
            style={{ width: 22, height: 22 }}
          />
        ),
        path: '/lumeni',
      },
      { text: 'Profile', icon: <ProfileIcon />, path: '/profile' },
    ];
  }

  const isLumeniPage = location.pathname === '/lumeni';
  const isProfilePage = location.pathname === '/profile' || location.pathname.startsWith('/settings');
  const isAdminPage = location.pathname.startsWith('/admin');

  const [searchValue, setSearchValue] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = async (query) => {
    if (!query) {
      setOptions([]);
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.get(`/search/videos?q=${query}`);
      const data = Array.isArray(response.data) ? response.data : [];
      
      const suggestions = data.map((video) => ({
        label: video.title,
        id: video.id,
      }));
      setOptions(suggestions);
    } catch (error) {
      console.error('Failed to fetch search suggestions:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetch = debounce(fetchSuggestions, 300);

  const handleInputChange = (event, newInputValue) => {
    setSearchValue(newInputValue);
    debouncedFetch(newInputValue);
  };

  const handleOptionSelected = (event, value) => {
    if (value) {
      navigate(`/video/${value.id}`);
      setSearchValue('');
      setOptions([]);
    } else {
      if (searchValue.trim()) {
        navigate(`/home?search=${searchValue.trim()}`);
        setSearchValue('');
        setOptions([]);
      }
    }
  };

  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);
  const settingsMenuOpen = Boolean(settingsAnchorEl);
  const handleSettingsMenuOpen = (event) =>
    setSettingsAnchorEl(event.currentTarget);
  const handleSettingsMenuClose = () => setSettingsAnchorEl(null);

  const handleMenuNavigate = (path) => {
    handleSettingsMenuClose();
    navigate(path);
  };

  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const notificationMenuOpen = Boolean(notificationAnchorEl);
  const [notifications, setNotifications] = useState([]);
  const handleNotificationMenuOpen = (event) =>
    setNotificationAnchorEl(event.currentTarget);
  const handleNotificationMenuClose = () => setNotificationAnchorEl(null);

  const handleNotificationClick = (notificationId) => {
    handleNotificationMenuClose();
    navigate(`/notification/${notificationId}`);
  };

  useEffect(() => {
    const formatNotification = (data) => {
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) {
          return { id: Date.now(), text: data, subject: 'Notification' };
        }
      }
      if (data.subject && data.message) {
        return {
          id: data.id,
          text: `${data.subject}: ${data.message}`,
        };
      }
      if (data.message) {
        return { id: data.id, text: data.message, subject: 'Notification' };
      }
      return { id: Date.now(), text: 'New notification', subject: 'Notification' };
    };

    const handleNewSocketMessage = (messageData) => {
      const newNotification = formatNotification(messageData);
      setNotifications((prevNotifs) =>
        [newNotification, ...prevNotifs].slice(0, 20)
      );
    };

    const loadNotifications = async () => {
      try {
        const response = await apiClient.get('/notifications/broadcasts');
        
        const rawData = Array.isArray(response.data) 
          ? response.data 
          : (response.data.items || []); 

        const oldNotifications = rawData.map(formatNotification).reverse();
        
        setNotifications(oldNotifications);
        connectNotificationSocket(handleNewSocketMessage);
      } catch (error) {
        console.error('Failed to load notifications:', error);
        connectNotificationSocket(handleNewSocketMessage);
      }
    };

    loadNotifications();
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        bgcolor: darkBg,
        color: darkText,
      }}
    >
      <Box
        component="aside"
        sx={{
          width: collapsed ? 80 : 256,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 2,
          transition: 'width 0.3s ease',
          bgcolor: darkBg,
          color: darkText,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            width: '100%',
            px: 2,
            mb: 3,
          }}
        >
          <MenuIcon
            onClick={toggleSidebar}
            sx={{ color: darkText, fontSize: 28, cursor: 'pointer' }}
          />
        </Box>

        <List sx={{ width: '100%' }}>
          {menuItems.map((item) => (
            <Tooltip
              title={collapsed ? item.text : ''}
              placement="right"
              key={item.text}
              arrow
            >
              <ListItemButton
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
                disableRipple
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  color: '#ffffff',
                  backgroundColor:
                    location.pathname === item.path
                      ? '#2A2A2A'
                      : 'transparent',
                  ':hover': {
                    backgroundColor:
                      location.pathname === item.path ? '#2A2A2A' : '#222222',
                  },
                  justifyContent: collapsed ? 'center' : 'flex-start',
                }}
              >
                <ListItemIcon
                  sx={{
                    color: '#ffffff',
                    minWidth: collapsed ? 0 : 40,
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText primary={item.text} sx={{ color: '#ffffff' }} />
                )}
              </ListItemButton>
            </Tooltip>
          ))}
        </List>
      </Box>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {!isLumeniPage && (
          <AppBar
            position="sticky"
            sx={{
              bgcolor: '#1A1A1A',
              backgroundImage: 'none',
              color: darkText,
              boxShadow: 'none',
              px: 4,
            }}
          >
            <Toolbar sx={{ justifyContent: 'space-between' }}>
              {!isProfilePage && !isAdminPage ? (
                <Autocomplete
                  freeSolo
                  id="lumeni-search-bar"
                  sx={{ flexGrow: 1, mr: 3 }}
                  options={options}
                  loading={loading}
                  onChange={handleOptionSelected}
                  inputValue={searchValue}
                  onInputChange={handleInputChange}
                  PaperComponent={(props) => (
                    <Paper
                      {...props}
                      sx={{
                        bgcolor: darkMode ? '#2A2A2A' : '#fff',
                        color: darkMode ? darkText : darkBg,
                      }}
                    />
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search videos..."
                      variant="standard"
                      InputProps={{
                        ...params.InputProps,
                        disableUnderline: true,
                        startAdornment: (
                          <SearchIcon sx={{ color: darkText, mr: 1 }} />
                        ),
                        endAdornment: (
                          <>
                            {loading ? (
                              <CircularProgress color="inherit" size={20} />
                            ) : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                        sx: {
                          bgcolor: '#2A2A2A',
                          borderRadius: 4,
                          px: 2,
                          py: 0.5,
                          color: darkText,
                          fontSize: '0.95rem',
                        },
                      }}
                      sx={{
                        '& .MuiInputBase-input': {
                          color: darkText,
                        },
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props} key={option.id}>
                      {option.label}
                    </Box>
                  )}
                />
              ) : (
                <Box sx={{ flexGrow: 1 }} />
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton onClick={handleNotificationMenuOpen}>
                  <Badge badgeContent={notifications.length} color="error">
                    <NotificationsIcon sx={{ color: darkText }} />
                  </Badge>
                </IconButton>

                {(isProfilePage || isAdminPage) && (
                  <IconButton onClick={handleSettingsMenuOpen}>
                    <SettingsIcon sx={{ color: darkText }} />
                  </IconButton>
                )}

                <IconButton onClick={() => navigate("/profile")} sx={{ p: 0 }}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: '#2A2A2A',
                      color: darkText,
                      fontSize: "1rem",
                    }}
                    src={user?.avatar_url || undefined}
                    alt={user?.full_name || "Profile"}
                  >
                    {!user?.avatar_url && (user?.full_name?.[0]?.toUpperCase() || "U")}
                  </Avatar>
                </IconButton>
              </Box>
            </Toolbar>
          </AppBar>
        )}

        <Box
          sx={{
            flexGrow: 1,
            p: isLumeniPage ? 0 : 3,
            bgcolor: darkBg,
            overflowY: 'auto',
          }}
        >
          {/* [FIX] Passed 'collapsed' to Outlet context */}
          <Outlet context={{ darkMode, collapsed }} />
        </Box>
      </Box>

      <Menu
        anchorEl={settingsAnchorEl}
        open={settingsMenuOpen}
        onClose={handleSettingsMenuClose}
        PaperProps={{
          sx: {
            bgcolor: darkMode ? '#2A2A2A' : '#fff',
            color: darkMode ? '#fff' : '#000',
            borderRadius: 2,
            minWidth: 240,
            boxShadow: '0px 4px 20px rgba(0,0,0,0.4)',
          },
        }}
      >
        <MenuItem onClick={() => handleMenuNavigate('/settings/account')}>
          <ListItemIcon>
            <AccountCircleOutlined sx={{ color: darkMode ? '#fff' : '#000' }} />
          </ListItemIcon>
          Account
        </MenuItem>
        <MenuItem onClick={() => handleMenuNavigate('/settings/notifications')}>
          <ListItemIcon>
            <NotificationsOutlined sx={{ color: darkMode ? '#fff' : '#000' }} />
          </ListItemIcon>
          Notifications
        </MenuItem>
        <MenuItem onClick={() => handleMenuNavigate('/settings/downloads')}>
          <ListItemIcon>
            <DownloadOutlined sx={{ color: darkMode ? '#fff' : '#000' }} />
          </ListItemIcon>
          Downloads
        </MenuItem>
        <MenuItem onClick={() => handleMenuNavigate('/settings/privacy')}>
          <ListItemIcon>
            <LockOutlined sx={{ color: darkMode ? '#fff' : '#000' }} />
          </ListItemIcon>
          Privacy
        </MenuItem>
        <MenuItem onClick={() => handleMenuNavigate('/settings/terms')}>
          <ListItemIcon>
            <GavelOutlined sx={{ color: darkMode ? '#fff' : '#000' }} />
          </ListItemIcon>
          Policy & T's & C's
        </MenuItem>
        <MenuItem onClick={() => handleMenuNavigate('/settings/help')}>
          <ListItemIcon>
            <HelpOutline sx={{ color: darkMode ? '#fff' : '#000' }} />
          </ListItemIcon>
          Help
        </MenuItem>
        <MenuItem onClick={() => handleMenuNavigate('/settings/feedback')}>
          <ListItemIcon>
            <FeedbackOutlined sx={{ color: darkMode ? '#fff' : '#000' }} />
          </ListItemIcon>
          Give Feedback
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={notificationAnchorEl}
        open={notificationMenuOpen}
        onClose={handleNotificationMenuClose}
        PaperProps={{
          sx: {
            bgcolor: darkMode ? '#2A2A2A' : '#fff',
            color: darkMode ? '#fff' : '#000',
            borderRadius: 2,
            minWidth: 320,
            maxWidth: 360,
            boxShadow: '0px 4px 20px rgba(0,0,0,0.4)',
          },
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, px: 2, py: 1.5 }}>
          Notifications
        </Typography>
        <Divider sx={{ bgcolor: darkMode ? '#444' : '#ccc' }} />

        {notifications.length === 0 ? (
          <MenuItem disabled>
            <ListItemText
              primary="No new notifications"
              primaryTypographyProps={{
                textAlign: 'center',
                fontStyle: 'italic',
                opacity: 0.7,
              }}
            />
          </MenuItem>
        ) : (
          notifications.map((notif) => (
            <MenuItem
              key={notif.id}
              onClick={() => handleNotificationClick(notif.id)}
              sx={{ py: 1.5 }}
            >
              <ListItemText
                primary={
                  <Typography
                    sx={{ whiteSpace: 'normal' }}
                    dangerouslySetInnerHTML={{
                      __html: notif.text.replace(
                        new RegExp('^([^:]+):'),
                        '<b>$1:</b>'
                      ),
                    }}
                  />
                }
              />
            </MenuItem>
          ))
        )}
      </Menu>
    </Box>
  );
}