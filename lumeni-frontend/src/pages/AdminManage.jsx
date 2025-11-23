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
  Avatar,
  Divider,
} from "@mui/material";
import { useOutletContext } from "react-router-dom";
import apiClient from "../api/api";
import { PersonAdd as PersonAddIcon } from "@mui/icons-material";

const panelStyle = (darkMode) => ({
  p: 3,
  bgcolor: darkMode ? "#2A2A2A" : "#ffffff",
  color: darkMode ? "#FFFFFF" : "#000000",
  borderRadius: 3,
  mb: 3,
  height: '100%',
});

const initialFormData = {
  email: "",
  password: "",
  full_name: "",
  role: "admin",
};

const inputSx = (darkMode) => ({
  mb: 2,
  input: { color: darkMode ? "#fff" : "#000" },
  label: { color: darkMode ? "#aaa" : "#555" },
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: darkMode ? "#444" : "#ccc" },
    "&:hover fieldset": { borderColor: darkMode ? "#fff" : "#000" },
  },
});

export default function AdminManage() {
  const { darkMode } = useOutletContext();
  const [formData, setFormData] = useState(initialFormData);
  const [adminUsers, setAdminUsers] = useState([]);
  
  const [loadingForm, setLoadingForm] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [listError, setListError] = useState(null);

  const fetchAdmins = async () => {
    setLoadingList(true);
    setListError(null);
    try {
      // [FIX] Removed /api prefix
      const response = await apiClient.get("/admin/users?role=admin");
      setAdminUsers(response.data); 
    } catch (err) {
      setListError("Failed to load admin list.");
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingForm(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      // [FIX] Removed /api prefix
      const response = await apiClient.post("/admin/create-admin", formData);
      setFormSuccess(`Admin "${response.data.full_name}" created successfully!`);
      setFormData(initialFormData); 
      fetchAdmins(); 
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Failed to create admin.";
      setFormError(errorMsg);
      console.error(err);
    } finally {
      setLoadingForm(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      <Typography 
        variant="h4" 
        fontWeight="600" 
        gutterBottom
        sx={{ color: darkMode ? '#fff' : '#001440', mb: 3 }}
      >
        Admin Management
      </Typography>

      <Grid container spacing={3}>
        {/* Create Admin Form */}
        <Grid item xs={12} md={5}>
          <Paper sx={panelStyle(darkMode)}>
            <Typography variant="h6" gutterBottom>
              Create New Admin
            </Typography>
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                label="Full Name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                fullWidth required sx={inputSx(darkMode)}
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                fullWidth required sx={inputSx(darkMode)}
              />
              <TextField
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                fullWidth required sx={inputSx(darkMode)}
              />

              {formSuccess && <Alert severity="success" sx={{ mb: 2 }}>{formSuccess}</Alert>}
              {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}

              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={loadingForm ? <CircularProgress size={20} color="inherit" /> : <PersonAddIcon />}
                disabled={loadingForm}
                sx={{ 
                  bgcolor: "#001440", 
                  color: "#fff",
                  "&:hover": { bgcolor: "#002880" }
                }}
              >
                Create Admin
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Admin List */}
        <Grid item xs={12} md={7}>
          <Paper sx={panelStyle(darkMode)}>
            <Typography variant="h6" gutterBottom>
              Current Admins
            </Typography>
            
            {loadingList ? (
              <CircularProgress sx={{ color: darkMode ? "#fff" : "#001440" }} />
            ) : listError ? (
              <Alert severity="error">{listError}</Alert>
            ) : (
              <List sx={{ width: '100%' }}>
                {adminUsers.length === 0 ? (
                  <Typography sx={{ textAlign: 'center', opacity: 0.7 }}>
                    No admins found.
                  </Typography>
                ) : (
                  adminUsers.map((user, index) => (
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
                      </ListItem>
                      {index < adminUsers.length - 1 && <Divider sx={{ bgcolor: darkMode ? "#333" : "#eee" }} component="li" />}
                    </div>
                  ))
                )}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}