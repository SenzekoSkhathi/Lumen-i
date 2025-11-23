// src/pages/GoogleCallback.jsx
import { useEffect, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";
import { AuthContext } from "../context/AuthContext";
// [FIX] Import the centralized API client
import apiClient from "../api/api.js"; 

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  useEffect(() => {
    const token = searchParams.get("token");

    if (token) {
      // 1. Store the token from the URL
      localStorage.setItem("token", token);

      // 2. [FIX] Use apiClient to fetch the user. 
      // apiClient automatically adds the "Authorization: Bearer ..." header
      apiClient.get("/auth/me")
        .then((res) => {
          setUser(res.data);
          navigate("/home");
        })
        .catch((err) => {
          console.error("Failed to fetch user:", err);
          localStorage.removeItem("token"); // Clean up if invalid
          navigate("/login");
        });

    } else {
      navigate("/login");
    }
  }, [searchParams, navigate, setUser]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', bgcolor: '#001440', color: 'white' }}>
      <CircularProgress color="inherit" />
      <Typography sx={{ mt: 2 }}>Logging you in...</Typography>
    </Box>
  );
}