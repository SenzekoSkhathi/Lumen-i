// pages/AdminDashboard.jsx

import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
} from "@mui/material";
import { useOutletContext, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import apiClient from "../api/api.js";

// --- Chart.js ---
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// --- Panel styles ---
const panelStyle = (darkMode) => ({
  p: 2.5,
  bgcolor: darkMode ? "#2A2A2A" : "#ffffff",
  color: darkMode ? "#FFFFFF" : "#000000",
  borderRadius: 3,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  textAlign: "center",
  height: "100px",
  width: "300px",
  cursor: "pointer",
  transition: "all 0.2s ease-in-out",
  "&:hover": {
    transform: "scale(1.02)",
    boxShadow: darkMode
      ? "0px 4px 20px rgba(255,255,255,0.1)"
      : "0px 4px 20px rgba(0,0,0,0.1)",
  },
});

const graphPanelStyle = (darkMode) => ({
  p: 3,
  bgcolor: darkMode ? "#2A2A2A" : "#ffffff",
  color: darkMode ? "#FFFFFF" : "#000000",
  borderRadius: 3,
  minHeight: "400px",
  width: "100%",
  boxSizing: "border-box",
});

// --- UPDATED CHART OPTIONS: Y-axis 0 → 100 with steps of 10 ---
const getChartOptions = (darkMode) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
  },
  scales: {
    x: {
      ticks: { color: darkMode ? "#aaa" : "#555" },
      grid: {
        color: darkMode
          ? "rgba(255, 255, 255, 0.1)"
          : "rgba(0, 0, 0, 0.1)",
      },
    },
    y: {
      min: 0,
      max: 100,
      ticks: {
        stepSize: 10,
        color: darkMode ? "#aaa" : "#555",
      },
      grid: {
        color: darkMode
          ? "rgba(255, 255, 255, 0.1)"
          : "rgba(0, 0, 0, 0.1)",
      },
    },
  },
});

export default function AdminDashboard() {
  const [activeUsers, setActiveUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  const [graphFilter, setGraphFilter] = useState("7D");
  const [chartData, setChartData] = useState(null);
  const [chartError, setChartError] = useState(null);

  const { darkMode } = useOutletContext();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const textColor = darkMode ? "#FFFFFF" : "#000000";

  // --- Load basic stats ---
  useEffect(() => {
    async function loadBaseStats() {
      try {
        // [FIX] Removed /api prefix
        const active = await apiClient.get("/admin/stats/active_users");
        setActiveUsers(active.data.active_users);
      } catch (err) {
        console.error("Failed to load stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBaseStats();
  }, []);

  // --- Load chart data ---
  useEffect(() => {
    async function loadChart() {
      setChartData(null);
      setChartError(null);

      const filterToDays = {
        "1D": 1,
        "7D": 7,
        "1M": 30,
        "3M": 90,
        "6M": 180,
        "1Y": 365,
      };

      const days = filterToDays[graphFilter];

      try {
        // [FIX] Removed /api prefix
        const res = await apiClient.get(
          `/admin/stats/user_signups?days=${days}`
        );

        const labels = res.data.map((d) => d.date);
        const values = res.data.map((d) => d.count);

        setChartData({
          labels,
          datasets: [
            {
              label: "New Users",
              data: values,
              fill: true,
              borderColor: darkMode ? "#ffffff" : "#001440",
              backgroundColor: darkMode
                ? "rgba(255,255,255,0.1)"
                : "rgba(0, 20, 64, 0.1)",
              tension: 0.1,
            },
          ],
        });
      } catch (err) {
        console.error("Chart error:", err);
        setChartError("Could not load statistics.");
      }
    }

    loadChart();
  }, [graphFilter, darkMode]);

  const handleGraphFilterChange = (e, val) => {
    if (val) setGraphFilter(val);
  };

  return (
    <Box sx={{ color: textColor, width: "100%" }}>
      {/* TOP CARDS */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-evenly",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
          mb: 3,
        }}
      >
        <Paper sx={panelStyle(darkMode)} onClick={() => navigate("/admin/users")}>
          <Typography variant="h6" sx={{ color: darkMode ? "#aaa" : "#555" }}>
            Active users
          </Typography>
        </Paper>

        <Paper sx={panelStyle(darkMode)} onClick={() => navigate("/admin/broadcast")}>
          <Typography variant="h6" sx={{ color: darkMode ? "#aaa" : "#555" }}>
            Broadcast
          </Typography>
        </Paper>

        <Paper sx={panelStyle(darkMode)} onClick={() => navigate("/admin/manage")}>
          <Typography variant="h6" sx={{ color: darkMode ? "#aaa" : "#555" }}>
            Admin
          </Typography>
        </Paper>

        <Paper sx={panelStyle(darkMode)} onClick={() => navigate("/admin/upload")}>
          <Typography variant="h6" sx={{ color: darkMode ? "#aaa" : "#555" }}>
            Upload
          </Typography>
        </Paper>
      </Box>

      {/* GRAPH */}
      <Paper sx={graphPanelStyle(darkMode)}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1.5,
          }}
        >
          <Typography variant="h6">
            Active Users
          </Typography>

          <ToggleButtonGroup
            value={graphFilter}
            exclusive
            onChange={handleGraphFilterChange}
            size="small"
          >
            <ToggleButton value="1D" sx={{ color: textColor }}>1D</ToggleButton>
            <ToggleButton value="7D" sx={{ color: textColor }}>7D</ToggleButton>
            <ToggleButton value="1M" sx={{ color: textColor }}>1M</ToggleButton>
            <ToggleButton value="3M" sx={{ color: textColor }}>3M</ToggleButton>
            <ToggleButton value="6M" sx={{ color: textColor }}>6M</ToggleButton>
            <ToggleButton value="1Y" sx={{ color: textColor }}>1Y</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Box
          sx={{
            height: 350,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {chartError ? (
            <Alert severity="error">{chartError}</Alert>
          ) : chartData ? (
            <Line data={chartData} options={getChartOptions(darkMode)} />
          ) : (
            <CircularProgress sx={{ color: textColor }} />
          )}
        </Box>
      </Paper>
    </Box>
  );
}
