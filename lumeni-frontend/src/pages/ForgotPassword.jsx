import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/api.js";

/**
 * ForgotPassword page implements a simple email form to initiate a
 * password reset.  The backend endpoint `/auth/forgot-password`
 * responds with a 202 whether or not the user exists to prevent
 * account enumeration.  A success or error message is displayed
 * accordingly.  Users can navigate back to the login page via a
 * button.
 */
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ error: "", success: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ error: "", success: "" });
    setLoading(true);
    try {
      await apiClient.post("/auth/forgot-password", { email });
      setStatus({
        success:
          "If an account exists for this email, a reset link has been sent.",
        error: "",
      });
    } catch (err) {
      setStatus({
        success: "",
        error: "Could not start password reset. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: "#001440",
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          maxWidth: 480,
          width: "100%",
          p: 4,
          borderRadius: 4,
          backgroundColor: "#ffffff",
        }}
      >
        <Box sx={{ mb: 3, textAlign: "center" }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: "#001440", mb: 0.5 }}
          >
            Reset your password
          </Typography>
          <Typography variant="body2" sx={{ color: "#475569" }}>
            Enter the email you use for Lumeni and we’ll send a reset link.
          </Typography>
        </Box>

        {status.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {status.error}
          </Alert>
        )}
        {status.success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {status.success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            type="email"
            label="Email address"
            fullWidth
            required
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              mt: 2,
              mb: 1,
              py: 1.2,
              textTransform: "none",
              fontWeight: 600,
              bgcolor: "#001440",
              "&:hover": { bgcolor: "#012260" },
            }}
          >
            {loading ? "Sending link..." : "Send reset link"}
          </Button>
        </form>
        <Button
          fullWidth
          variant="text"
          onClick={() => navigate("/login")}
          sx={{
            mt: 1,
            textTransform: "none",
            color: "#0f172a",
            fontWeight: 500,
          }}
        >
          Back to login
        </Button>
      </Paper>
    </Box>
  );
}