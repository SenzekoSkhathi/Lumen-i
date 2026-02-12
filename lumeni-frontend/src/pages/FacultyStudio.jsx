import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  Stack,
} from "@mui/material";
import { useAuth } from "../context/AuthContext.jsx";
import apiClient from "../api/api.js";
import "./FacultyStudio.css";

const EMPTY_GUIDELINE = "For this module, never give the final answer directly. Ask for pseudo-code first.";

export default function FacultyStudio() {
  const { user } = useAuth();
  const [modules, setModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [materials, setMaterials] = useState([]);
  const [guidelines, setGuidelines] = useState("");
  const [uploadTag, setUploadTag] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [loadingModules, setLoadingModules] = useState(true);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [status, setStatus] = useState(null);
  const [materialEdits, setMaterialEdits] = useState({});

  const selectedModule = useMemo(
    () => modules.find((module) => String(module.id) === String(selectedModuleId)),
    [modules, selectedModuleId]
  );

  const canAccess = user && (user.role === "lecturer" || user.role === "admin");

  const loadModules = async () => {
    setLoadingModules(true);
    try {
      const response = await apiClient.get("/faculty/modules");
      const data = Array.isArray(response.data) ? response.data : [];
      setModules(data);
      if (data.length && !selectedModuleId) {
        setSelectedModuleId(String(data[0].id));
        setGuidelines(data[0].system_prompt || "");
      }
    } catch (error) {
      setStatus({ type: "error", message: "Failed to load modules." });
    } finally {
      setLoadingModules(false);
    }
  };

  const loadMaterials = async (moduleId) => {
    if (!moduleId) {
      return;
    }

    setLoadingMaterials(true);
    try {
      const response = await apiClient.get(`/faculty/modules/${moduleId}/materials`);
      const data = Array.isArray(response.data) ? response.data : [];
      setMaterials(data);
      const edits = {};
      data.forEach((item) => {
        edits[item.id] = { tag: item.tag, file: null };
      });
      setMaterialEdits(edits);
    } catch (error) {
      setStatus({ type: "error", message: "Failed to load module materials." });
    } finally {
      setLoadingMaterials(false);
    }
  };

  useEffect(() => {
    if (canAccess) {
      loadModules();
    }
  }, [canAccess]);

  useEffect(() => {
    if (selectedModuleId) {
      const module = modules.find((item) => String(item.id) === String(selectedModuleId));
      setGuidelines(module?.system_prompt || "");
      loadMaterials(selectedModuleId);
    }
  }, [selectedModuleId, modules]);

  const handleGuidelinesSave = async () => {
    if (!selectedModuleId) {
      return;
    }
    try {
      const form = new FormData();
      form.append("guidelines", guidelines || "");
      const response = await apiClient.put(`/faculty/modules/${selectedModuleId}/guidelines`, form);
      const updated = response.data;
      setModules((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setStatus({ type: "success", message: "Guidelines saved." });
    } catch (error) {
      setStatus({ type: "error", message: "Failed to save guidelines." });
    }
  };

  const handleUpload = async () => {
    if (!selectedModuleId || !uploadFile || !uploadTag.trim()) {
      setStatus({ type: "error", message: "Add a tag and file before uploading." });
      return;
    }

    const form = new FormData();
    form.append("tag", uploadTag.trim());
    form.append("file", uploadFile);

    try {
      await apiClient.post(`/faculty/modules/${selectedModuleId}/materials`, form);
      setUploadTag("");
      setUploadFile(null);
      setStatus({ type: "success", message: "Material uploaded." });
      loadMaterials(selectedModuleId);
    } catch (error) {
      setStatus({ type: "error", message: "Upload failed." });
    }
  };

  const handleMaterialUpdate = async (materialId) => {
    const edit = materialEdits[materialId];
    if (!edit) {
      return;
    }

    const form = new FormData();
    if (edit.tag) {
      form.append("tag", edit.tag);
    }
    if (edit.file) {
      form.append("file", edit.file);
    }

    try {
      await apiClient.put(`/faculty/materials/${materialId}`, form);
      setStatus({ type: "success", message: "Material updated." });
      loadMaterials(selectedModuleId);
    } catch (error) {
      setStatus({ type: "error", message: "Failed to update material." });
    }
  };

  const handleMaterialDelete = async (materialId) => {
    try {
      await apiClient.delete(`/faculty/materials/${materialId}`);
      setStatus({ type: "success", message: "Material deleted." });
      loadMaterials(selectedModuleId);
    } catch (error) {
      setStatus({ type: "error", message: "Delete failed." });
    }
  };

  if (!canAccess) {
    return (
      <Box className="faculty-studio">
        <Paper className="faculty-card">
          <Typography variant="h5">Faculty Studio</Typography>
          <Typography sx={{ mt: 2 }}>
            This area is only available to lecturers and administrators.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box className="faculty-studio">
      <Box className="faculty-hero">
        <Typography variant="h2">Faculty Studio</Typography>
        <Typography className="faculty-subtitle">
          Build the official knowledge core your students will learn from.
        </Typography>
      </Box>

      <Paper className="faculty-card">
        <Box className="faculty-grid">
          <Box className="faculty-panel">
            <Typography variant="h6">Module Control</Typography>
            <Typography className="faculty-panel-sub">
              Select a module and define the learning instructions.
            </Typography>

            {loadingModules ? (
              <Box className="faculty-loading">
                <CircularProgress size={28} />
              </Box>
            ) : (
              <FormControl fullWidth>
                <InputLabel id="module-select-label">Module</InputLabel>
                <Select
                  labelId="module-select-label"
                  value={selectedModuleId}
                  label="Module"
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

            <Box className="faculty-guidelines">
              <Typography variant="subtitle2">AI Instructions</Typography>
              <TextField
                multiline
                minRows={6}
                placeholder={EMPTY_GUIDELINE}
                value={guidelines}
                onChange={(event) => setGuidelines(event.target.value)}
                fullWidth
              />
              <Button variant="contained" onClick={handleGuidelinesSave}>
                Save Guidelines
              </Button>
            </Box>
          </Box>

          <Box className="faculty-panel">
            <Typography variant="h6">Upload Materials</Typography>
            <Typography className="faculty-panel-sub">
              PDFs, DOCX, and TXT files only. Tag every upload for retrieval.
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Material Tag"
                value={uploadTag}
                onChange={(event) => setUploadTag(event.target.value)}
                placeholder="Week 1 Slides"
                fullWidth
              />
              <input
                className="faculty-file"
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
              />
              <Button variant="contained" onClick={handleUpload}>
                Upload Material
              </Button>
            </Stack>
          </Box>
        </Box>
      </Paper>

      <Paper className="faculty-card">
        <Box className="faculty-panel">
          <Typography variant="h6">Module Materials</Typography>
          <Typography className="faculty-panel-sub">
            Keep the knowledge base current and organized.
          </Typography>

          {status ? (
            <Alert severity={status.type} sx={{ mb: 2 }}>
              {status.message}
            </Alert>
          ) : null}

          {loadingMaterials ? (
            <Box className="faculty-loading">
              <CircularProgress size={28} />
            </Box>
          ) : (
            <Box className="faculty-materials">
              {materials.length === 0 ? (
                <Typography className="faculty-empty">No materials uploaded yet.</Typography>
              ) : (
                materials.map((material) => (
                  <Box className="faculty-material" key={material.id}>
                    <Box>
                      <Typography className="faculty-material-title">
                        {material.original_filename}
                      </Typography>
                      <Typography className="faculty-material-meta">
                        Uploaded {new Date(material.created_at).toLocaleDateString()}
                      </Typography>
                      <Chip label={material.tag} className="faculty-chip" />
                    </Box>

                    <Box className="faculty-material-actions">
                      <TextField
                        label="Tag"
                        size="small"
                        value={materialEdits[material.id]?.tag || ""}
                        onChange={(event) =>
                          setMaterialEdits((prev) => ({
                            ...prev,
                            [material.id]: {
                              ...prev[material.id],
                              tag: event.target.value,
                            },
                          }))
                        }
                      />
                      <input
                        className="faculty-file-inline"
                        type="file"
                        accept=".pdf,.docx,.txt"
                        onChange={(event) =>
                          setMaterialEdits((prev) => ({
                            ...prev,
                            [material.id]: {
                              ...prev[material.id],
                              file: event.target.files?.[0] || null,
                            },
                          }))
                        }
                      />
                      <Stack direction="row" spacing={1}>
                        <Button variant="outlined" onClick={() => handleMaterialUpdate(material.id)}>
                          Update
                        </Button>
                        <Button
                          variant="text"
                          color="error"
                          onClick={() => handleMaterialDelete(material.id)}
                        >
                          Delete
                        </Button>
                      </Stack>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          )}
        </Box>
      </Paper>

      <Paper className="faculty-card faculty-footer">
        <Box>
          <Typography variant="h6">Module Snapshot</Typography>
          <Typography className="faculty-panel-sub">
            {selectedModule ? `${selectedModule.code} · ${selectedModule.name}` : "Select a module"}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <Box className="faculty-stat">
              <span className="faculty-stat-label">Materials</span>
              <span className="faculty-stat-value">{materials.length}</span>
            </Box>
            <Box className="faculty-stat">
              <span className="faculty-stat-label">Guidelines</span>
              <span className="faculty-stat-value">{guidelines ? "Active" : "Draft"}</span>
            </Box>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
