import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout.jsx";

// context
import { AuthProvider } from "./context/AuthContext.jsx";
import { ThemeModeProvider } from "./context/ThemeContext.jsx";
import { SettingsProvider } from "./context/SettingsContext.jsx";
import { useAuth } from "./context/AuthContext.jsx";

// pages
import Login from "./pages/Login.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import Home from "./pages/Home.jsx";
import Lumeni from "./pages/Lumeni.jsx";
import Profile from "./pages/Profile.jsx";
import WatchHistory from "./pages/WatchHistory.jsx";
import VideoPlayer from "./pages/VideoPlayer.jsx"; // <-- ADDED IMPORT
import AccountSettings from "./pages/AccountSettings.jsx";
import NotificationSettings from "./pages/NotificationSettings.jsx";
import Downloads from "./pages/Downloads.jsx";
import Privacy from "./pages/Privacy.jsx";
import Terms from "./pages/Terms.jsx";
import Help from "./pages/Help.jsx";
import Feedback from "./pages/Feedback.jsx";
import ChannelPage from "./pages/ChannelPage.jsx";
import PlaylistPage from "./pages/PlaylistPage.jsx";
import NotificationPage from "./pages/NotificationPage.jsx";
import GoogleCallback from "./pages/GoogleCallback.jsx";

// components
import AdminRoute from "./components/AdminRoute.jsx";

// admin pages
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminUpload from "./pages/AdminUpload.jsx";
import AdminManage from "./pages/AdminManage.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import AdminBroadcast from "./pages/AdminBroadcast.jsx";

import { Box, CircularProgress } from "@mui/material";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, height: '100vh', alignItems: 'center', bgcolor: '#1A1A1A' }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <ThemeModeProvider>
      <SettingsProvider>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public authentication routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/google-callback" element={<GoogleCallback />} />

              {/* Authenticated area with MainLayout */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                {/* Redirect root to home */}
                <Route index element={<Navigate to="/home" replace />} />

                {/* Regular user routes */}
                <Route path="home" element={<Home />} />
                <Route path="lumeni" element={<Lumeni />} />
                <Route path="profile" element={<Profile />} />
                
                {/* --- FIX: Standardized Watch History Path --- */}
                <Route path="watch-history" element={<WatchHistory />} />
                
                {/* --- FIX: Added Video Player Route --- */}
                <Route path="video/:videoId" element={<VideoPlayer />} />
                
                {/* --- FIX: Changed :channelId to :tutorName to match ChannelPage.jsx --- */}
                <Route path="channel/:tutorName" element={<ChannelPage />} />
                
                <Route path="playlist/:playlistId" element={<PlaylistPage />} />
                <Route path="notification/:notificationId" element={<NotificationPage />} />

                {/* Settings routes */}
                <Route path="settings/account" element={<AccountSettings />} />
                <Route path="settings/notifications" element={<NotificationSettings />} />
                <Route path="settings/downloads" element={<Downloads />} />
                <Route path="settings/privacy" element={<Privacy />} />
                <Route path="settings/terms" element={<Terms />} />
                <Route path="settings/help" element={<Help />} />
                <Route path="settings/feedback" element={<Feedback />} />

                {/* Admin routes */}
                {/* --- FIX: Removed nested <MainLayout> inside AdminRoute --- */}
                <Route path="admin" element={<AdminRoute />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="upload" element={<AdminUpload />} />
                  <Route path="manage" element={<AdminManage />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="broadcast" element={<AdminBroadcast />} />
                </Route>
              </Route>

              {/* Catch-all route */}
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </SettingsProvider>
    </ThemeModeProvider>
  );
}