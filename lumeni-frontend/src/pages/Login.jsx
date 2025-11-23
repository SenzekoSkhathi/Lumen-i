import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Divider,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Google as GoogleIcon } from "@mui/icons-material";
import { AuthContext } from "../context/AuthContext";
import { login, signup } from "../api/auth";

export default function AuthPage() {
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  // [FIX] Get the API URL from the environment file
  const API_URL = import.meta.env.VITE_API_URL;

  // State for toggling password visibility
  const [showPassword, setShowPassword] = useState(false);

  const [tab, setTab] = useState("login");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    full_name: "",
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleGoogleLogin = () => {
    // [FIX] Use the dynamic API_URL instead of localhost
    window.location.href = `${API_URL}/api/auth/login/google`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Trim inputs to avoid trailing space issues
    const cleanUsername = formData.username?.trim() || "";
    const cleanPassword = formData.password?.trim() || "";
    const cleanEmail = formData.email?.trim() || "";

    try {
      if (tab === "login") {
        const res = await login(
          new URLSearchParams({
            username: cleanUsername,
            password: cleanPassword,
          })
        );
        localStorage.setItem("token", res.data.access_token);

        // [FIX] Use the dynamic API_URL here too
        const userRes = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${res.data.access_token}` },
        });
        const userData = await userRes.json();
        setUser(userData);
        navigate("/home");
      } else {
        await signup({
          email: cleanEmail,
          password: cleanPassword,
          full_name: formData.full_name,
          role: "student",
        });
        setSuccess("Account created successfully! You can now log in.");
        setTab("login");
      }
    } catch (err) {
      setError(
        tab === "login"
          ? "Invalid email or password."
          : "Signup failed. Email may be taken."
      );
      console.error(err);
    }
  };

  // Shared styles for input text color (Normal + Autofill)
  const inputStyles = {
    "& .MuiInputBase-input": {
      color: "#001440", // Normal text color
    },
    // Fix browser autofill background and text color
    "& .MuiInputBase-input:-webkit-autofill": {
      WebkitBoxShadow: "0 0 0 100px white inset",
      WebkitTextFillColor: "#001440",
    },
  };

  return (
    <Box
      sx={{
        backgroundColor: "#ffffff",
        color: "#001440",
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: "100%",
          maxWidth: 420,
          p: 6,
          borderRadius: 4,
          textAlign: "center",
          backgroundColor: "#ffffff",
        }}
      >
        <img
          src="/logo.jpg"
          alt="Lumeni Logo"
          style={{
            height: 64,
            marginBottom: 20,
            objectFit: "contain",
          }}
        />
        <Typography variant="h4" color="#001440" fontWeight="bold" gutterBottom>
          Welcome to Lumeni
        </Typography>
        <Typography variant="body2" color="#001440" mb={3}>
          Sign in to your account or create a new one
        </Typography>

        <Tabs
          value={tab}
          onChange={(_, v) => {
            setTab(v);
            setError("");
            setSuccess("");
            setFormData({ username: "", password: "", email: "", full_name: "" });
          }}
          variant="fullWidth"
          sx={{
            mb: 3,
            "& .MuiTabs-indicator": { backgroundColor: "#001440" },
          }}
        >
          <Tab
            value="login"
            label="Login"
            sx={{
              fontWeight: "bold",
              color: tab === "login" ? "#001440" : "gray",
            }}
          />
          <Tab
            value="signup"
            label="Sign Up"
            sx={{
              fontWeight: "bold",
              color: tab === "signup" ? "#001440" : "gray",
            }}
          />
        </Tabs>

        <Button
          variant="outlined"
          fullWidth
          startIcon={<GoogleIcon />}
          onClick={handleGoogleLogin}
          sx={{
            mb: 3,
            py: 1.5,
            borderColor: "#001440",
            color: "#001440",
            textTransform: "none",
            fontWeight: "bold",
          }}
        >
          Continue with Google
        </Button>

        <Divider sx={{ color: "#001440", mb: 3 }}>OR</Divider>

        <form onSubmit={handleSubmit}>
          {/* --- SIGN UP FORM --- */}
          {tab === "signup" && (
            <>
              <TextField
                label="Full Name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                fullWidth
                margin="normal"
                required
                sx={inputStyles}
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                fullWidth
                margin="normal"
                required
                sx={inputStyles}
              />
              <TextField
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                fullWidth
                margin="normal"
                required
                sx={inputStyles}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: "#001440" }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </>
          )}

          {/* --- LOGIN FORM --- */}
          {tab === "login" && (
            <>
              <TextField
                label="Email"
                name="username"
                value={formData.username}
                onChange={handleChange}
                fullWidth
                margin="normal"
                required
                sx={inputStyles}
              />
              <TextField
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                fullWidth
                margin="normal"
                required
                sx={inputStyles}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: "#001440" }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </>
          )}

          {error && (
            <Typography color="error" variant="body2" mt={1}>
              {error}
            </Typography>
          )}
          {success && (
            <Typography color="success.main" variant="body2" mt={1}>
              {success}
            </Typography>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 3,
              mb: 2,
              py: 1.3,
              fontWeight: "bold",
              backgroundColor: "#001440",
              color: "#ffffff",
              ":hover": {
                backgroundColor: "hsla(225, 100%, 19%, 1.00)",
              },
            }}
          >
            {tab === "login" ? "Sign In" : "Sign Up"}
          </Button>
        </form>
      </Paper>
    </Box>
  );
}