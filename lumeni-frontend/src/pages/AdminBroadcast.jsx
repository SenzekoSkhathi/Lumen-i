import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Stack,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { useOutletContext } from "react-router-dom";
import apiClient from "../api/api";
import { 
  Send as SendIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from "@mui/icons-material";

const panelStyle = (darkMode) => ({
  p: 3,
  bgcolor: darkMode ? "#2A2A2A" : "#ffffff",
  color: darkMode ? "#FFFFFF" : "#000000",
  borderRadius: 3,
  mb: 3,
});

const inputSx = (darkMode) => ({
  mb: 2,
  textarea: { color: darkMode ? "#fff" : "#000" },
  input: { color: darkMode ? "#fff" : "#000" },
  label: { color: darkMode ? "#aaa" : "#555" },
  "& .MuiOutlinedInput-root": {
    "& fieldset": { borderColor: darkMode ? "#444" : "#ccc" },
    "&:hover fieldset": { borderColor: darkMode ? "#fff" : "#000" },
  },
});

// [FIX] Robust timezone handling
const isEditable = (isoString) => {
  if (!isoString) return false;
  
  // If the string doesn't have timezone info, assume it's UTC (server standard)
  // Appending 'Z' forces JS Date to treat it as UTC and convert to local time correctly.
  let dateStr = isoString;
  if (!dateStr.endsWith("Z") && !dateStr.includes("+")) {
      dateStr += "Z";
  }

  const createdDate = new Date(dateStr);
  const now = new Date();
  const diffInMinutes = (now.getTime() - createdDate.getTime()) / (1000 * 60);
  
  // Check if it's within 15 minutes
  return diffInMinutes < 15;
};

export default function AdminBroadcast() {
  const { darkMode } = useOutletContext();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [pastMessages, setPastMessages] = useState([]);
  
  const [loadingSend, setLoadingSend] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  const [sendError, setSendError] = useState(null);
  const [sendSuccess, setSendSuccess] = useState(null);
  const [historyError, setHistoryError] = useState(null);

  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingSubject, setEditingSubject] = useState("");
  const [editingText, setEditingText] = useState("");

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoadingHistory(true);
      setHistoryError(null);
      try {
        // [FIX] Removed /api prefix
        const response = await apiClient.get("/notifications/broadcasts");
        setPastMessages(response.data.reverse()); // Newest first
      } catch (err) {
        setHistoryError("Failed to load past announcements.");
        console.error(err);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, []);

  const handleSendBroadcast = async () => {
    if (!message.trim() || !subject.trim()) {
      setSendError("Subject and message cannot be empty.");
      return;
    }
    setLoadingSend(true);
    setSendError(null);
    setSendSuccess(null);
    try {
      // [FIX] Removed /api prefix
      const response = await apiClient.post("/admin/broadcast", {
        subject: subject,
        message: message,
      });
      
      setSendSuccess("Broadcast sent successfully!");
      setMessage("");
      setSubject("");
      
      setPastMessages((prev) => [response.data, ...prev]);

    } catch (err) {
      setSendError("Failed to send broadcast. Please try again.");
      console.error(err);
    } finally {
      setLoadingSend(false);
    }
  };

  const handleOpenDeleteDialog = (broadcastId) => {
    setMessageToDelete(broadcastId);
    setIsDeleteDialogOpen(true);
    setDeleteError(null);
  };

  const handleCloseDeleteDialog = () => {
    if (isDeleting) return;
    setIsDeleteDialogOpen(false);
    setMessageToDelete(null);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!messageToDelete) return; 
    setIsDeleting(true);
    setDeleteError(null);
    try {
      // [FIX] Removed /api prefix and ensured endpoint exists in backend
      await apiClient.delete(`/admin/broadcasts/${messageToDelete}`);
      setPastMessages((prev) => prev.filter((msg) => msg.id !== messageToDelete));
      handleCloseDeleteDialog();
    } catch (err) {
      console.error("Failed to delete message:", err);
      setDeleteError("Failed to delete message. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = (msg) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.message);
    setEditingSubject(msg.subject);
    setSendError(null);
    setSendSuccess(null);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText("");
    setEditingSubject("");
  };

  const handleSaveEdit = async () => {
    if (!editingText.trim() || !editingSubject.trim()) {
      setSendError("Subject and message cannot be empty.");
      return;
    }

    setLoadingSend(true);
    setSendError(null);
    
    try {
      // [FIX] Removed /api prefix and ensured endpoint exists in backend
      const response = await apiClient.put(
        `/admin/broadcasts/${editingMessageId}`,
        { 
          subject: editingSubject,
          message: editingText 
        }
      );
      setPastMessages((prev) =>
        prev.map((msg) =>
          msg.id === editingMessageId ? response.data : msg
        )
      );
      handleCancelEdit();
    } catch (err) {
      console.error("Failed to update message:", err);
      if (err.response && err.response.status === 403) {
        setSendError("Failed to save: The 15-minute edit window has passed.");
      } else {
        setSendError("Failed to save message. Please try again.");
      }
    } finally {
      setLoadingSend(false);
    }
  };


  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      <Typography 
        variant="h4" 
        fontWeight="600" 
        gutterBottom
        sx={{ color: darkMode ? '#fff' : '#001440', mb: 3 }}
      >
        Broadcast Management
      </Typography>

      <Paper sx={panelStyle(darkMode)}>
        <Typography variant="h6" gutterBottom>
          Send New Announcement
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.7, mb: 2 }}>
          This will send a real-time notification to all connected users.
        </Typography>
        
        <TextField
          label="Subject"
          variant="outlined"
          fullWidth
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={loadingSend}
          InputLabelProps={{
            style: { color: darkMode ? "#aaa" : "#555" },
          }}
          sx={inputSx(darkMode)}
        />
        
        <TextField
          label="Your Message"
          variant="outlined"
          fullWidth
          multiline
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={loadingSend}
          InputLabelProps={{
            style: { color: darkMode ? "#aaa" : "#555" },
          }}
          sx={inputSx(darkMode)}
        />
        {sendSuccess && <Alert severity="success" sx={{ mb: 2 }}>{sendSuccess}</Alert>}
        {sendError && <Alert severity="error" sx={{ mb: 2 }}>{sendError}</Alert>}
        <Button
          variant="contained"
          size="large"
          startIcon={loadingSend ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
          disabled={loadingSend}
          onClick={handleSendBroadcast}
          sx={{ 
            bgcolor: "#001440", 
            color: "#fff",
            "&:hover": { bgcolor: "#002880" }
          }}
        >
          Send to All Users
        </Button>
      </Paper>

      <Paper sx={panelStyle(darkMode)}>
        <Typography variant="h6" gutterBottom>
          Past Announcements
        </Typography>
        
        {loadingHistory ? (
          <CircularProgress sx={{ color: darkMode ? "#fff" : "#001440" }} />
        ) : historyError ? (
          <Alert severity="error">{historyError}</Alert>
        ) : (
          <List sx={{ width: '100%', maxHeight: 400, overflowY: 'auto' }}>
            {pastMessages.length === 0 ? (
              <Typography sx={{ textAlign: 'center', opacity: 0.7 }}>
                No announcements sent yet.
              </Typography>
            ) : (
              pastMessages.map((msg, index) => (
                <div key={msg.id}>
                  {editingMessageId === msg.id ? (
                    <Box sx={{ p: 2, border: '1px solid #444', borderRadius: 2 }}>
                      <TextField
                        label="Subject"
                        variant="outlined"
                        fullWidth
                        value={editingSubject}
                        onChange={(e) => setEditingSubject(e.target.value)}
                        disabled={loadingSend}
                        sx={inputSx(darkMode)}
                      />
                      <TextField
                        label="Message"
                        variant="outlined"
                        fullWidth
                        multiline
                        rows={3}
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        disabled={loadingSend}
                        sx={inputSx(darkMode)}
                      />
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={loadingSend ? <CircularProgress size={16} /> : <SaveIcon />}
                          disabled={loadingSend}
                          onClick={handleSaveEdit}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<CancelIcon />}
                          onClick={handleCancelEdit}
                          disabled={loadingSend}
                          sx={{ color: darkMode ? "#fff" : "#000", borderColor: darkMode ? "#fff" : "#000" }}
                        >
                          Cancel
                        </Button>
                      </Stack>
                    </Box>
                  ) : (
                    <ListItem
                      secondaryAction={
                        <Stack direction="row" spacing={0.5}>
                          <IconButton
                            edge="end"
                            aria-label="edit"
                            onClick={() => handleEditClick(msg)}
                            // [FIX] Pass the raw created_at string to the robust check
                            disabled={!isEditable(msg.created_at)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleOpenDeleteDialog(msg.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Stack>
                      }
                    >
                      <ListItemText
                        primary={msg.subject}
                        secondary={`${new Date(msg.created_at).toLocaleString()} - ${msg.message}`}
                        primaryTypographyProps={{ 
                          color: darkMode ? "#fff" : "#000", 
                          fontWeight: 600
                        }}
                        secondaryTypographyProps={{ 
                          color: darkMode ? "#aaa" : "#555",
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      />
                    </ListItem>
                  )}
                  {index < pastMessages.length - 1 && <Divider sx={{ bgcolor: darkMode ? "#333" : "#eee" }} />}
                </div>
              ))
            )}
          </List>
        )}
      </Paper>

      {/* Delete Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        PaperProps={{ sx: { bgcolor: darkMode ? "#2A2A2A" : "#fff", color: darkMode ? "#fff" : "#000", borderRadius: 2 } }}
      >
        <DialogTitle fontWeight="600">Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: darkMode ? "#ccc" : "#444" }}>
            Are you sure you want to permanently delete this announcement? This
            action cannot be undone.
          </DialogContentText>
          {deleteError && <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDeleteDialog} disabled={isDeleting} sx={{ color: darkMode ? "#fff" : "#555" }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}