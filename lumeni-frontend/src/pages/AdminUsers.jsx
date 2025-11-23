import { useState, useEffect, useContext } from "react";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Divider,
  Button,
  Chip,
  Tooltip,
} from "@mui/material";
import { useOutletContext } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import apiClient from "../api/api";
import { 
  ArrowUpward as PromoteIcon, 
  ArrowDownward as DemoteIcon, 
  Shield as AdminIcon,
  School as StudentIcon,
} from "@mui/icons-material";

const panelStyle = (darkMode) => ({
  p: 3,
  bgcolor: darkMode ? "#2A2A2A" : "#ffffff",
  color: darkMode ? "#FFFFFF" : "#000000",
  borderRadius: 3,
  mb: 3,
});

export default function AdminUsers() {
  const { darkMode } = useOutletContext();
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      // [FIX] Removed /api prefix
      const response = await apiClient.get("/admin/users");
      setUsers(response.data);
    } catch (err) {
      setError("Failed to load user list.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, action) => {
    const originalUsers = [...users];
    const newRole = action === 'promote' ? 'admin' : 'student';
    
    setUsers(prevUsers => 
      prevUsers.map(u => u.id === userId ? { ...u, role: newRole } : u)
    );

    try {
      // [FIX] Removed /api prefix
      await apiClient.put(`/admin/users/${userId}/${action}`);
    } catch (err) {
      setError(`Failed to ${action} user.`);
      setUsers(originalUsers);
      console.error(err);
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto" }}>
      <Typography 
        variant="h4" 
        fontWeight="600" 
        gutterBottom
        sx={{ color: darkMode ? '#fff' : '#001440', mb: 3 }}
      >
        User Management
      </Typography>

      <Paper sx={panelStyle(darkMode)}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            All Registered Users: {users.length}
          </Typography>
          <Typography variant="body2" sx={{ color: darkMode ? "#aaa" : "#555" }}>
            Total Views: {users.length} | Subscribed: {users.length}
          </Typography>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress sx={{ color: darkMode ? "#fff" : "#001440" }} />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <List sx={{ width: '100%' }}>
            {users.length === 0 ? (
              <Typography sx={{ textAlign: 'center', opacity: 0.7, py: 3 }}>
                No users found.
              </Typography>
            ) : (
              users.map((user, index) => (
                <div key={user.id}>
                  <ListItem>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: darkMode ? "#333" : "#001440" }}>
                        {user.full_name[0].toUpperCase()}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={user.full_name}
                      secondary={user.email}
                      primaryTypographyProps={{ color: darkMode ? "#fff" : "#000", fontWeight: 500 }}
                      secondaryTypographyProps={{ color: darkMode ? "#aaa" : "#555" }}
                    />
                    
                    <Chip 
                      icon={user.role === 'admin' ? <AdminIcon /> : <StudentIcon />}
                      label={user.role === 'admin' ? 'Admin' : 'Student'}
                      color={user.role === 'admin' ? 'success' : 'default'}
                      variant={darkMode ? "outlined" : "filled"}
                      sx={{ 
                        color: darkMode && user.role === 'admin' ? '#66bb6a' : (darkMode ? '#fff' : 'inherit'),
                        borderColor: darkMode ? '#66bb6a' : 'default',
                        mr: 2,
                        minWidth: 100,
                      }}
                    />

                    {user.id === currentUser.id ? (
                      <Tooltip title="You cannot change your own role.">
                        <span>
                          <Button 
                            variant="outlined" 
                            disabled 
                            sx={{ minWidth: 110 }}
                          >
                            (You)
                          </Button>
                        </span>
                      </Tooltip>
                    ) : user.role === 'student' ? (
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<PromoteIcon />}
                        onClick={() => handleRoleChange(user.id, 'promote')}
                        sx={{ minWidth: 110 }}
                      >
                        Promote
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        startIcon={<DemoteIcon />}
                        onClick={() => handleRoleChange(user.id, 'demote')}
                        sx={{ minWidth: 110 }}
                      >
                        Demote
                      </Button>
                    )}
                  </ListItem>
                  {index < users.length - 1 && <Divider sx={{ bgcolor: darkMode ? "#333" : "#eee" }} component="li" />}
                </div>
              ))
            )}
          </List>
        )}
      </Paper>
    </Box>
  );
}