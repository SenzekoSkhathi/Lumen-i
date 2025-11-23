import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useOutletContext, useNavigate } from "react-router-dom";
import {
  ExpandMore as ExpandMoreIcon,
  HelpOutline as HelpIcon,
  School as SchoolIcon,
  ContactSupport as ContactSupportIcon,
  Email as EmailIcon,
  WhatsApp as WhatsAppIcon,
  BugReport as BugReportIcon,
  LiveHelp as LiveHelpIcon,
  PlayCircleOutline as PlayCircleIcon,
  Login as LoginIcon,
  Feedback as FeedbackIcon,
} from "@mui/icons-material";

export default function Help() {
  const { darkMode } = useOutletContext();
  const navigate = useNavigate();

  const [faqExpanded, setFaqExpanded] = useState(false);
  const [troubleExpanded, setTroubleExpanded] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);

  // Bug report form state
  const [bugSubject, setBugSubject] = useState("");
  const [bugDescription, setBugDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const panelStyle = {
    p: { xs: 2, md: 3 },
    bgcolor: darkMode ? "#2A2A2A" : "#ffffff",
    color: darkMode ? "#FFFFFF" : "#000000",
    borderRadius: 3,
    mb: 3,
    height: "100%", // For Grid layout
  };

  const accordionStyle = {
    bgcolor: darkMode ? "#1A1A1A" : "#f9f9f9",
    color: darkMode ? "#FFFFFF" : "#000000",
    "&:before": { display: "none" },
    boxShadow: "none",
  };

  const handleFaqChange = (panel) => (event, isExpanded) => {
    setFaqExpanded(isExpanded ? panel : false);
  };

  const handleTroubleChange = (panel) => (event, isExpanded) => {
    setTroubleExpanded(isExpanded ? panel : false);
  };

  const handleBugSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    // Mock API call
    setTimeout(() => {
      if (bugSubject.toLowerCase().includes("error")) {
        setError("Mock Error: Failed to submit bug report.");
      } else {
        setSuccess("Bug report submitted successfully! Thank you.");
        setBugSubject("");
        setBugDescription("");
      }
      setLoading(false);
    }, 1500);
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", color: darkMode ? "#fff" : "#000" }}>
      <Typography variant="h4" fontWeight="600" gutterBottom sx={{ mb: 3 }}>
        Help Center
      </Typography>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* --- How Lumeni Works --- */}
        <Grid item xs={12} md={6}>
          <Paper sx={panelStyle}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <SchoolIcon sx={{ mr: 1.5 }} />
              <Typography variant="h6" fontWeight="500">
                How Lumeni Works
              </Typography>
            </Box>
            <Divider sx={{ mb: 2, bgcolor: darkMode ? "#444" : "#eee" }} />
            <Typography sx={{ mb: 2, opacity: 0.8 }}>
              New to Lumeni? Take a quick tutorial to learn about the chat
              interface, finding videos, and managing your profile.
            </Typography>
            <Button variant="contained" onClick={() => setTutorialOpen(true)}>
              Start Tutorial
            </Button>
          </Paper>
        </Grid>

        {/* --- Contact Support --- */}
        <Grid item xs={12} md={6}>
          <Paper sx={panelStyle}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <ContactSupportIcon sx={{ mr: 1.5 }} />
              <Typography variant="h6" fontWeight="500">
                Contact Support
              </Typography>
            </Box>
            <Divider sx={{ mb: 2, bgcolor: darkMode ? "#444" : "#eee" }} />
            <List>
              <ListItemButton component="a" href="mailto:support@lumeni.com">
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Email Support"
                  secondary="support@lumeni.com"
                />
              </ListItemButton>
              <ListItemButton component="a" href="https://wa.me/1234567890" target="_blank">
                <ListItemIcon>
                  <WhatsAppIcon />
                </ListItemIcon>
                <ListItemText
                  primary="WhatsApp Support"
                  secondary="(Coming Soon)"
                />
              </ListItemButton>
            </List>
          </Paper>
        </Grid>
      </Grid>

      {/* --- FAQ Page --- */}
      <Paper sx={panelStyle}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <HelpIcon sx={{ mr: 1.5 }} />
          <Typography variant="h6" fontWeight="500">
            Frequently Asked Questions (FAQ)
          </Typography>
        </Box>
        <Divider sx={{ mb: 2, bgcolor: darkMode ? "#444" : "#eee" }} />
        <Accordion
          expanded={faqExpanded === "faq1"}
          onChange={handleFaqChange("faq1")}
          sx={accordionStyle}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: darkMode ? "#fff" : "#000" }} />}>
            <Typography>What is Lumeni?</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              Lumeni is a smart learning platform that combines curated
              educational videos with a powerful AI chat assistant. It's
              designed to help you understand complex topics by providing video
              content and Socratic-style questioning.
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion
          expanded={faqExpanded === "faq2"}
          onChange={handleFaqChange("faq2")}
          sx={accordionStyle}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: darkMode ? "#fff" : "#000" }} />}>
            <Typography>How does the "Lumeni" AI chat work?</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              The Lumeni chat is your personal AI tutor. You can ask it to
              summarize a video, quiz you on a topic, or explain a difficult
              concept. It's designed to guide you to the answer rather than
              just giving it to you.
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion
          expanded={faqExpanded === "faq3"}
          onChange={handleFaqChange("faq3")}
          sx={accordionStyle}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: darkMode ? "#fff" : "#000" }} />}>
            <Typography>Is Lumeni free?</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              Lumeni is currently free to use while in its beta period.
              Subscription plans may be introduced in the future to support
              the platform.
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Paper>

      {/* --- Report a Problem --- */}
      <Paper sx={panelStyle}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <LiveHelpIcon sx={{ mr: 1.5 }} />
          <Typography variant="h6" fontWeight="500">
            Report a Problem
          </Typography>
        </Box>
        <Divider sx={{ mb: 2, bgcolor: darkMode ? "#444" : "#eee" }} />

        {/* Troubleshooting */}
        <Typography variant="body1" fontWeight={500} sx={{ px: 2, mt: 1 }}>
          Troubleshooting
        </Typography>
        <Accordion
          expanded={troubleExpanded === "t1"}
          onChange={handleTroubleChange("t1")}
          sx={accordionStyle}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: darkMode ? "#fff" : "#000" }} />}>
            <PlayCircleIcon sx={{ mr: 1.5, opacity: 0.7 }} />
            <Typography>Playback Issues</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              If a video isn't playing, please try the following:
              <br />1. Refresh the page.
              <br />2. Check your internet connection.
              <br />3. Try a different web browser.
              <br />4. If the issue persists, it may be an issue with the
              original YouTube video. Please report it to us.
            </Typography>
          </AccordionDetails>
        </Accordion>
        <Accordion
          expanded={troubleExpanded === "t2"}
          onChange={handleTroubleChange("t2")}
          sx={accordionStyle}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: darkMode ? "#fff" : "#000" }} />}>
            <LoginIcon sx={{ mr: 1.5, opacity: 0.7 }} />
            <Typography>Login Problems</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>
              If you can't log in:
              <br />1. Double-check your email and password.
              <br />2. Try using the "Continue with Google" login method if
              that's how you signed up.
              <br />3. If you've forgotten your password, a "Forgot Password"
              feature will be available soon. For now, please email support.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: 2, bgcolor: darkMode ? "#444" : "#eee" }} />

        {/* Feedback Link */}
        <ListItemButton onClick={() => navigate("/settings/feedback")}>
          <ListItemIcon>
            <FeedbackIcon />
          </ListItemIcon>
          <ListItemText
            primary="Feedback on tutors/videos"
            secondary="Have a suggestion or comment about content? Let us know."
          />
        </ListItemButton>
        
        <Divider sx={{ my: 2, bgcolor: darkMode ? "#444" : "#eee" }} />

        {/* Bug Report Form */}
        <Box component="form" onSubmit={handleBugSubmit} sx={{ px: 2 }}>
          <Typography variant="body1" fontWeight={500} sx={{ mb: 2 }}>
            <BugReportIcon sx={{ mr: 1, verticalAlign: "bottom" }} />
            Bug Reporting Form
          </Typography>
          <TextField
            label="Subject"
            variant="outlined"
            fullWidth
            value={bugSubject}
            onChange={(e) => setBugSubject(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            label="Describe the bug"
            variant="outlined"
            fullWidth
            multiline
            rows={4}
            value={bugDescription}
            onChange={(e) => setBugDescription(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={20} color="inherit" /> : <BugReportIcon />
            }
          >
            Submit Report
          </Button>
        </Box>
      </Paper>

      {/* --- Tutorial Dialog --- */}
      <Dialog open={tutorialOpen} onClose={() => setTutorialOpen(false)}>
        <DialogTitle>How Lumeni Works</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This modal will contain a short tutorial or carousel explaining
            the main features of the app.
            <br /><br />
            1. Find videos on the 'Home' page.
            <br />
            2. Talk to the 'Lumeni' AI to get quizzes and summaries.
            <br />
            3. Track your progress in your 'Profile'.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTutorialOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}