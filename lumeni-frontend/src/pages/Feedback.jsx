import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating,
  Divider,
} from "@mui/material";
import { useOutletContext, useNavigate } from "react-router-dom";
import {
  Feedback as FeedbackIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  BugReport as BugReportIcon,
  Lightbulb as LightbulbIcon,
  Poll as PollIcon,
  VideoLabel as VideoLabelIcon,
} from "@mui/icons-material";

export default function Feedback() {
  const { darkMode } = useOutletContext();
  const navigate = useNavigate();

  // State for forms
  const [rating, setRating] = useState(0);
  const [feedbackType, setFeedbackType] = useState("suggestion");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  // State for UI Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const panelStyle = {
    p: { xs: 2, md: 3 },
    bgcolor: darkMode ? "#2A2A2A" : "#ffffff",
    color: darkMode ? "#FFFFFF" : "#000000",
    borderRadius: 3,
    mb: 3,
  };

  const inputSx = (darkMode) => ({
    mb: 2,
    "& .MuiInputBase-input": { color: darkMode ? "#fff" : "#000" },
    "& label": { color: darkMode ? "#aaa" : "#555" },
    "& label.Mui-focused": { color: "#1976d2" },
    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: darkMode ? "#444" : "#ccc" },
      "&:hover fieldset": { borderColor: darkMode ? "#fff" : "#000" },
      "&.Mui-focused fieldset": { borderColor: "#1976d2" },
    },
  });

  const selectSx = {
    color: darkMode ? "#fff" : "#000",
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: darkMode ? "#444" : "#ccc",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: darkMode ? "#fff" : "#000",
    },
    "& .MuiSvgIcon-root": { color: darkMode ? "#fff" : "#777" },
  };
  
  const handleRatingSubmit = () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    // Mock API call
    setTimeout(() => {
      setSuccess(`Thank you for giving us ${rating} stars!`);
      setLoading(false);
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    // Mock API call
    setTimeout(() => {
      setSuccess("Your feedback has been submitted successfully! Thank you.");
      setSubject("");
      setDescription("");
      setFeedbackType("suggestion");
      setLoading(false);
    }, 1500);
  };

  // Helper to get placeholder text
  const getSubjectPlaceholder = () => {
    switch (feedbackType) {
      case "suggestion":
        return "My new feature idea is...";
      case "survey":
        return "My overall experience has been...";
      case "content_feedback":
        return "Feedback on 'Calculus 101' video...";
      default:
        return "Subject";
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", color: darkMode ? "#fff" : "#000" }}>
      <Typography variant="h4" fontWeight="600" gutterBottom sx={{ mb: 3 }}>
        Give Feedback
      </Typography>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {/* --- 1. Rate the App --- */}
      <Paper sx={panelStyle}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <StarIcon sx={{ mr: 1.5 }} />
          <Typography variant="h6" fontWeight="500">
            Rate the App
          </Typography>
        </Box>
        <Divider sx={{ mb: 2, bgcolor: darkMode ? "#444" : "#eee" }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography gutterBottom>How would you rate your experience?</Typography>
          <Rating
            name="app-rating"
            value={rating}
            precision={0.5}
            onChange={(event, newValue) => {
              setRating(newValue);
            }}
            icon={<StarIcon fontSize="inherit" />}
            emptyIcon={<StarBorderIcon fontSize="inherit" />}
            sx={{ fontSize: "2.5rem" }}
          />
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            disabled={loading || rating === 0}
            onClick={handleRatingSubmit}
          >
            Submit Rating
          </Button>
        </Box>
      </Paper>

      {/* --- 2. Written Feedback Form --- */}
      <Paper sx={panelStyle}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <FeedbackIcon sx={{ mr: 1.5 }} />
          <Typography variant="h6" fontWeight="500">
            Tell Us More
          </Typography>
        </Box>
        <Divider sx={{ mb: 2, bgcolor: darkMode ? "#444" : "#eee" }} />
        <Box component="form" onSubmit={handleSubmit}>
          <FormControl fullWidth sx={inputSx(darkMode)}>
            <InputLabel id="feedback-type-label">Feedback Type</InputLabel>
            <Select
              labelId="feedback-type-label"
              value={feedbackType}
              label="Feedback Type"
              onChange={(e) => setFeedbackType(e.target.value)}
              sx={selectSx}
            >
              <MenuItem value="suggestion">
                <LightbulbIcon sx={{ mr: 1, fontSize: "1.2rem" }} /> Suggest a Feature
              </MenuItem>
              <MenuItem value="survey">
                <PollIcon sx={{ mr: 1, fontSize: "1.2rem" }} /> Overall Experience Survey
              </MenuItem>
              <MenuItem value="content_feedback">
                <VideoLabelIcon sx={{ mr: 1, fontSize: "1.2rem" }} /> Tutor/Video-specific Feedback
              </MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Subject"
            variant="outlined"
            fullWidth
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            sx={inputSx(darkMode)}
            placeholder={getSubjectPlaceholder()}
          />
          <TextField
            label="Description"
            variant="outlined"
            fullWidth
            multiline
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            sx={inputSx(darkMode)}
            placeholder="Please provide as much detail as possible..."
          />
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={20} color="inherit" /> : <FeedbackIcon />
            }
          >
            Submit Feedback
          </Button>
        </Box>
      </Paper>

      {/* --- 3. Report a Bug --- */}
      <Paper sx={panelStyle}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <BugReportIcon sx={{ mr: 1.5 }} />
          <Typography variant="h6" fontWeight="500">
            Found a Bug?
          </Typography>
        </Box>
        <Divider sx={{ mb: 2, bgcolor: darkMode ? "#444" : "#eee" }} />
        <Typography sx={{ opacity: 0.8, mb: 2 }}>
          Spotted something not working right? Our bug report form is located
          on the Help Center page.
        </Typography>
        <Button
          variant="outlined"
          startIcon={<BugReportIcon />}
          onClick={() => navigate("/settings/help")}
        >
          Go to Bug Report Form
        </Button>
      </Paper>
    </Box>
  );
}