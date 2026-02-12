import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Tabs,
  Tab,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Stack,
  Divider,
} from "@mui/material";
import apiClient from "../api/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import "./StudentWorkspace.css";

const NOTE_STARTER = "Paste your study notes here or start typing.";

export default function StudentWorkspace() {
  const { user } = useAuth();
  const [tabIndex, setTabIndex] = useState(0);
  const [modules, setModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [loadingModules, setLoadingModules] = useState(true);
  const [status, setStatus] = useState(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);

  const [notes, setNotes] = useState([{ id: 1, title: "Untitled Note", content: "" }]);
  const [activeNoteId, setActiveNoteId] = useState(1);
  const [toolOutput, setToolOutput] = useState("");
  const [loadingTool, setLoadingTool] = useState(false);

  const activeNote = useMemo(
    () => notes.find((note) => note.id === activeNoteId),
    [notes, activeNoteId]
  );

  const canAccess = user && user.role === "student";

  const loadModules = async () => {
    setLoadingModules(true);
    try {
      const response = await apiClient.get("/modules/mine");
      const data = Array.isArray(response.data) ? response.data : [];
      setModules(data);
      if (data.length && !selectedModuleId) {
        setSelectedModuleId(String(data[0].id));
      }
    } catch (error) {
      setStatus({ type: "error", message: "Failed to load modules." });
    } finally {
      setLoadingModules(false);
    }
  };

  useEffect(() => {
    if (canAccess) {
      loadModules();
    }
  }, [canAccess]);

  const handleSendChat = async () => {
    if (!input.trim()) {
      return;
    }

    const userMsg = { from: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoadingChat(true);

    try {
      const formData = new FormData();
      formData.append("message", userMsg.text);
      if (selectedModuleId) {
        formData.append("module_id", selectedModuleId);
      }

      const response = await apiClient.post("/chat/send", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const content = response.data?.new_message?.content || "";
      const citations = response.data?.citations || [];
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: content, citations },
      ]);
    } catch (error) {
      setStatus({ type: "error", message: "Chat failed. Please try again." });
    } finally {
      setLoadingChat(false);
    }
  };

  const handleHelpRequest = async () => {
    if (!messages.length) {
      setStatus({ type: "error", message: "Ask a question first." });
      return;
    }

    const lastUserMessage = [...messages].reverse().find((msg) => msg.from === "user");
    if (!lastUserMessage) {
      setStatus({ type: "error", message: "Ask a question first." });
      return;
    }

    try {
      await apiClient.post("/help-requests", {
        module_id: selectedModuleId ? Number(selectedModuleId) : null,
        message: lastUserMessage.text,
      });
      setStatus({ type: "success", message: "Help request logged." });
    } catch (error) {
      setStatus({ type: "error", message: "Could not log help request." });
    }
  };

  const handleNoteChange = (value) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === activeNoteId ? { ...note, content: value } : note
      )
    );
  };

  const addNote = () => {
    const nextId = notes.length ? Math.max(...notes.map((note) => note.id)) + 1 : 1;
    const newNote = { id: nextId, title: `Note ${nextId}`, content: "" };
    setNotes((prev) => [...prev, newNote]);
    setActiveNoteId(nextId);
  };

  const runNoteTool = async (mode) => {
    if (!activeNote?.content?.trim()) {
      setStatus({ type: "error", message: "Add some note content first." });
      return;
    }

    setLoadingTool(true);
    setToolOutput("");
    try {
      const prompt = `You are a study assistant. ${mode}. Use the note below:\n\n${activeNote.content}`;
      const formData = new FormData();
      formData.append("message", prompt);
      if (selectedModuleId) {
        formData.append("module_id", selectedModuleId);
      }

      const response = await apiClient.post("/chat/send", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const content = response.data?.new_message?.content || "";
      setToolOutput(content);
    } catch (error) {
      setStatus({ type: "error", message: "Tool generation failed." });
    } finally {
      setLoadingTool(false);
    }
  };

  if (!canAccess) {
    return (
      <Box className="workspace-shell">
        <Paper className="workspace-card">
          <Typography variant="h5">Student Workspace</Typography>
          <Typography sx={{ mt: 2 }}>
            This area is only available to students.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box className="workspace-shell">
      <Box className="workspace-hero">
        <Typography variant="h2">Student Workspace</Typography>
        <Typography className="workspace-subtitle">
          Study with module-aware tutoring and personal knowledge tools.
        </Typography>
      </Box>

      <Paper className="workspace-card">
        <Box className="workspace-topbar">
          {loadingModules ? (
            <CircularProgress size={24} />
          ) : (
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="module-label">Module</InputLabel>
              <Select
                labelId="module-label"
                label="Module"
                value={selectedModuleId}
                onChange={(event) => setSelectedModuleId(event.target.value)}
              >
                {modules.map((module) => (
                  <MenuItem key={module.id} value={String(module.id)}>
                    {module.code} · {module.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Tabs
            value={tabIndex}
            onChange={(event, value) => setTabIndex(value)}
            textColor="inherit"
            indicatorColor="secondary"
          >
            <Tab label="Lumeni Tutor" />
            <Tab label="Workspace" />
          </Tabs>
        </Box>

        {status ? (
          <Alert severity={status.type} sx={{ mb: 2 }}>
            {status.message}
          </Alert>
        ) : null}

        {tabIndex === 0 && (
          <Box className="workspace-panel">
            <Box className="workspace-chat">
              {messages.length === 0 ? (
                <Typography className="workspace-empty">
                  Ask a question about your module materials.
                </Typography>
              ) : (
                messages.map((msg, index) => (
                  <Box
                    key={`${msg.from}-${index}`}
                    className={`workspace-message workspace-${msg.from}`}
                  >
                    <Typography>{msg.text}</Typography>
                    {msg.citations?.length ? (
                      <Box className="workspace-citations">
                        {msg.citations.map((cite) => (
                          <Chip key={cite} label={cite} size="small" />
                        ))}
                      </Box>
                    ) : null}
                  </Box>
                ))
              )}
            </Box>

            <Box className="workspace-input">
              <TextField
                placeholder="Ask Lumeni about your module..."
                value={input}
                onChange={(event) => setInput(event.target.value)}
                fullWidth
              />
              <Button variant="contained" onClick={handleSendChat} disabled={loadingChat}>
                {loadingChat ? "Thinking..." : "Send"}
              </Button>
              <Button variant="outlined" color="warning" onClick={handleHelpRequest}>
                Request Human Help
              </Button>
            </Box>
          </Box>
        )}

        {tabIndex === 1 && (
          <Box className="workspace-panel">
            <Box className="workspace-notes">
              <Box className="workspace-note-list">
                <Typography variant="subtitle2">Notes</Typography>
                <Stack spacing={1}>
                  {notes.map((note) => (
                    <Button
                      key={note.id}
                      variant={note.id === activeNoteId ? "contained" : "outlined"}
                      onClick={() => setActiveNoteId(note.id)}
                    >
                      {note.title}
                    </Button>
                  ))}
                  <Button variant="text" onClick={addNote}>
                    + Add Note
                  </Button>
                </Stack>
              </Box>

              <Box className="workspace-note-editor">
                <Typography variant="subtitle2">Active Note</Typography>
                <TextField
                  multiline
                  minRows={10}
                  placeholder={NOTE_STARTER}
                  value={activeNote?.content || ""}
                  onChange={(event) => handleNoteChange(event.target.value)}
                  fullWidth
                />
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box className="workspace-tools">
              <Typography variant="subtitle2">Generative Tools</Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <Button variant="outlined" onClick={() => runNoteTool("Generate 5 multiple choice questions")}
                  disabled={loadingTool}
                >
                  Generate Quiz
                </Button>
                <Button variant="outlined" onClick={() => runNoteTool("Create flashcards with term and definition")}
                  disabled={loadingTool}
                >
                  Create Flashcards
                </Button>
                <Button variant="outlined" onClick={() => runNoteTool("Create a markdown outline mapping the concepts")}
                  disabled={loadingTool}
                >
                  Map It
                </Button>
              </Stack>

              <Paper className="workspace-tool-output">
                {loadingTool ? (
                  <CircularProgress size={24} />
                ) : (
                  <Typography>{toolOutput || "Run a tool to see output here."}</Typography>
                )}
              </Paper>
            </Box>
          </Box>
        )}
      </Paper>

      <Paper className="workspace-card workspace-footer">
        <Typography variant="subtitle2">Session Summary</Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Box className="workspace-stat">
            <span className="workspace-stat-label">Module</span>
            <span className="workspace-stat-value">
              {selectedModuleId ? modules.find((m) => String(m.id) === String(selectedModuleId))?.code : "--"}
            </span>
          </Box>
          <Box className="workspace-stat">
            <span className="workspace-stat-label">Messages</span>
            <span className="workspace-stat-value">{messages.length}</span>
          </Box>
          <Box className="workspace-stat">
            <span className="workspace-stat-label">Notes</span>
            <span className="workspace-stat-value">{notes.length}</span>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}
