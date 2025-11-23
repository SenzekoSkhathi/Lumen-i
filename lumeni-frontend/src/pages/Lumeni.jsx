// pages/Lumeni.jsx

import { useState, useRef, useEffect, Fragment } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  InputAdornment,
  Divider,
  IconButton,
  Avatar,
  keyframes,
} from "@mui/material";
import {
  Send,
  Search,
  Add,
  ChevronLeft,
  ChevronRight,
  Mic as MicIcon,
  Description as DescriptionIcon,
  Close as CloseIcon,
  ContentCopy,
  ThumbUpAltOutlined,
  ThumbDownAltOutlined,
  Check,
} from "@mui/icons-material";
import { useOutletContext } from "react-router-dom";
import apiClient from "../api/api.js"; // [FIX] Import from the correct file with .js extension

// --- (Markdown, Math, and Syntax Highlighter imports) ---
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

// --- (Animations) ---
const pulse = keyframes`
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
`;

const typingDots = keyframes`
  0%   { opacity: 0.2; transform: translateY(0px); }
  20%  { opacity: 1;   transform: translateY(-2px); }
  40%  { opacity: 0.2; transform: translateY(0px); }
  100% { opacity: 0.2; transform: translateY(0px); }
`;

export default function Lumeni() {
  const { darkMode } = useOutletContext();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [attachedFiles, setAttachedFiles] = useState([]);
  
  // [FIX] Removed message truncation state
  // const [expandedMessages, setExpandedMessages] = useState({});
  
  const [copiedMessageIndex, setCopiedMessageIndex] = useState(null);
  const [messageFeedback, setMessageFeedback] = useState({});

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // useEffect to load chat history on mount
  useEffect(() => {
    const fetchChatHistory = async () => {
      setChatLoading(true); // Show a brief loading for the sidebar
      let loadedChats = [];
      try {
        const response = await apiClient.get("/api/chat/history");
        loadedChats = response.data; // Get the chats
      } catch (error) {
        console.error("Failed to fetch chat history:", error);
      } finally {
        setChats([
          { id: null, title: "New Chat", lastUpdated: "Now" },
          ...loadedChats, // Add the fetched chats after
        ]);
        
        // Set the main pane to a new chat state
        setActiveChat(null); 
        setMessages([]);
        setAttachedFiles([]);
        
        // [FIX] Removed message truncation state reset
        // setExpandedMessages({}); 
        
        setMessageFeedback({});
        setChatLoading(false); // Now we are ready
      }
    };
    fetchChatHistory();
  }, []); // Empty array means this runs once on mount

  // Smooth auto-scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      const timeout = setTimeout(() => {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [messages, loading, chatLoading]);

  // --- (Clipboard and Feedback handlers are unchanged) ---
  const handleCopyToClipboard = async (text) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  const handleCopyMessage = async (index, text) => {
    await handleCopyToClipboard(text);
    setCopiedMessageIndex(index);
    setTimeout(() => setCopiedMessageIndex(null), 1500);
  };

  const handleFeedback = (index, type) => {
    setMessageFeedback((prev) => {
      const current = prev[index];
      if (current === type) {
        const clone = { ...prev };
        delete clone[index];
        return clone;
      }
      return { ...prev, [index]: type };
    });
  };

  // [FIX] Removed toggleExpanded
  /*
  const toggleExpanded = (index) => {
    setExpandedMessages((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };
  */

  // --- (handleSendMessage is largely unchanged) ---
  const handleSendMessage = async () => {
    if (!input.trim() && attachedFiles.length === 0) return;

    const userMsg = { from: "user", text: input };
    const thinkingMsg = {
      from: "bot",
      text: "",
      id: "thinking-msg",
    };

    setMessages((prev) => [...prev, userMsg, thinkingMsg]);

    const formData = new FormData();
    formData.append("message", input);

    if (activeChat) {
      formData.append("chat_id", activeChat);
    }

    if (attachedFiles.length > 0) {
      attachedFiles.forEach((file) => {
        formData.append("files", file);
      });
    }

    const currentActiveChatId = activeChat; // Store the ID before clearing
    setInput("");
    setAttachedFiles([]);
    setLoading(true);

    try {
      const response = await apiClient.post("/api/chat/send", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = response.data;
      const aiMsg = { from: "bot", text: data.new_message.content };

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== "thinking-msg"),
        aiMsg,
      ]);

      if (data.chat_title) {
        const newChat = {
          id: data.chat_id,
          title: data.chat_title,
          lastUpdated: "Now",
        };
        setChats((prevChats) => [
          newChat, 
          ...prevChats.filter((c) => c.id !== null),
        ]);
        setActiveChat(data.chat_id);
      } else {
        setChats((prevChats) => {
          const chatToMove = prevChats.find(
            (c) => c.id === currentActiveChatId
          );
          if (!chatToMove) return prevChats; 
          chatToMove.lastUpdated = "Now";
          const otherChats = prevChats.filter(
            (c) => c.id !== currentActiveChatId
          );
          return [chatToMove, ...otherChats];
        });
      }

    } catch (error) {
      console.error("Chat send failed:", error);
      const errorMsg = {
        from: "bot",
        text: "⚠️ Could not connect to AI service.",
      };
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== "thinking-msg"),
        errorMsg,
      ]);
    } finally {
      setLoading(false);
    }
  };

  // --- (handleNewChat is largely unchanged) ---
  const handleNewChat = () => {
    setActiveChat(null);
    setMessages([]);
    setAttachedFiles([]);
    
    // [FIX] Removed truncation state reset
    // setExpandedMessages({});
    
    setMessageFeedback({});
    // Ensure "New Chat" is at the top and selected
    setChats((prev) => [
      { id: null, title: "New Chat", lastUpdated: "Now" },
      ...prev.filter((c) => c.id !== null),
    ]);
  };

  // --- (handleChatClick is largely unchanged) ---
  const handleChatClick = async (chat) => {
    if (chat.id === null) {
      // This is the "New Chat" placeholder
      setActiveChat(null);
      setMessages([]);
      
      // [FIX] Removed truncation state reset
      // setExpandedMessages({});
      
      setMessageFeedback({});
      return;
    }
    
    if (chat.id === activeChat && messages.length > 0) {
      return;
    }

    setChatLoading(true);
    setActiveChat(chat.id);
    setMessages([]);
    
    // [FIX] Removed truncation state reset
    // setExpandedMessages({});
    
    setMessageFeedback({});

    try {
      const response = await apiClient.get(`/api/chat/${chat.id}`);
      const formattedMessages = response.data.messages.map((msg) => ({
        from: msg.role === "model" ? "bot" : msg.role, 
        text: msg.content,
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error("Failed to fetch chat messages:", error);
      setMessages([
        { from: "bot", text: "⚠️ Error loading this conversation." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // --- (File handlers are unchanged) ---
  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files || []);
    if (newFiles.length === 0) return;

    setAttachedFiles((prevFiles) => {
      const combinedFiles = [...prevFiles, ...newFiles];
      if (combinedFiles.length > 5) {
        console.warn("File limit (5) exceeded.");
      }
      return combinedFiles.slice(0, 5);
    });

    event.target.value = null;
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveFile = (fileToRemove) => {
    setAttachedFiles((prevFiles) =>
      prevFiles.filter((file) => file !== fileToRemove)
    );
  };

  // --- (Theme colors and fonts are unchanged) ---
  const bgColor = "#1A1A1A";
  const panelColor = "#1A1A1A";
  const textColor = "#ffffff";
  const borderColor = "#1A1A1A";
  const buttonColor = "#1A1A1A";
  const buttonTextColor = "#ffffff";

  const commonFontFamily =
    '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

  // --- (renderGeminiStyleInput is unchanged) ---
  const renderGeminiStyleInput = () => {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          bgcolor: "#2A2A2A",
          p: 1.5,
          borderRadius: 6,
          boxShadow: "0 0 4px #111",
          width: "100%",
          fontFamily: commonFontFamily,
        }}
      >
        {/* File preview area */}
        {attachedFiles.length > 0 && (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              mb: 1,
              maxHeight: 110,
              overflowY: "auto",
            }}
          >
            {attachedFiles.map((file, index) => (
              <Paper
                key={index}
                elevation={0}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  p: 1,
                  bgcolor: "#3C3C3C",
                  color: textColor,
                  borderRadius: 2,
                  maxWidth: "100%",
                }}
              >
                <DescriptionIcon fontSize="small" />
                <Typography
                  variant="body2"
                  noWrap
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontFamily: commonFontFamily,
                  }}
                >
                  {file.name}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => handleRemoveFile(file)}
                  sx={{ color: textColor, p: 0.2 }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Paper>
            ))}
          </Box>
        )}

        {/* Thinking indicator in input bar */}
        {loading && (
          <Box sx={{ display: "flex", alignItems: "center", px: 1.5, pb: 0.5 }}>
            <CircularProgress size={16} sx={{ color: textColor, mr: 1 }} />
            <Typography
              variant="body2"
              sx={{
                color: textColor,
                animation: `${pulse} 1.5s infinite ease-in-out`,
                fontFamily: commonFontFamily,
              }}
            >
              Lumeni is thinking...
            </Typography>
          </Box>
        )}

        {/* Input row */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            width: "100%",
            gap: 1,
          }}
        >
          <IconButton
            sx={{ color: textColor, mt: 0.5 }}
            disabled={loading || attachedFiles.length >= 5}
            onClick={handleUploadClick}
          >
            <Add />
          </IconButton>
          <TextField
            fullWidth
            placeholder="Ask Lumeni"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            size="small"
            disabled={loading}
            variant="standard"
            multiline
            maxRows={5}
            InputProps={{
              disableUnderline: true,
              sx: {
                color: textColor,
                fontFamily: commonFontFamily,
                input: {
                  color: textColor,
                  py: 1.2,
                  fontSize: "1rem",
                  fontFamily: commonFontFamily,
                },
              },
            }}
          />
          <IconButton sx={{ color: textColor, mt: 0.5 }} disabled={loading}>
            <MicIcon />
          </IconButton>
          <IconButton
            onClick={handleSendMessage}
            disabled={loading || (!input.trim() && attachedFiles.length === 0)}
            sx={{
              color: textColor,
              mt: 0.5,
              opacity:
                loading || (!input.trim() && attachedFiles.length === 0)
                  ? 0.5
                  : 1,
            }}
          >
            {!loading && <Send />}
          </IconButton>
        </Box>
      </Box>
    );
  };

  // --- (renderInputArea is unchanged) ---
  const renderInputArea = (location) => {
    // location is 'middle' or 'bottom'
    
    // Logic for the MIDDLE bar
    if (location === 'middle') {
      // Only show middle bar if NOT loading a chat AND there are NO messages
      if (!chatLoading && messages.length === 0) {
        return (
          <Box
            sx={{
              width: "100%",
              maxWidth: "800px",
              mt: 3,
            }}
          >
            {renderGeminiStyleInput()}
          </Box>
        );
      }
    }
    
    // Logic for the BOTTOM bar
    if (location === 'bottom') {
      // Only show bottom bar if NOT loading a chat AND there ARE messages
      if (!chatLoading && messages.length > 0) {
        return (
          <Box sx={{ maxWidth: "900px", mx: "auto", width: "100%", pt: 2 }}>
             {renderGeminiStyleInput()}
          </Box>
        );
      }
    }
    
    return null;
  };

  return (
    <Box
      sx={{
        display: "flex",
        height: "100%",
        bgcolor: bgColor,
        color: textColor,
        transition: "all 0.3s ease",
        fontFamily: commonFontFamily,
      }}
    >
      {/* --- (File input is unchanged) --- */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
        accept="image/*,application/pdf,.txt,.py,.java,.js,.md,.docx,.pptx"
        multiple
      />

      {/* Chat Area */}
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          p: 2,
          bgcolor: bgColor,
        }}
      >
        {/* Messages */}
        <Paper
          elevation={0}
          sx={{
            flexGrow: 1,
            p: 2,
            mb: (messages.length > 0 && !chatLoading) ? 2 : 0,
            overflowY: "auto",
            borderRadius: 2,
            bgcolor: panelColor,
            color: textColor,
            transition: "all 0.3s ease",
          }}
        >
          <Box sx={{ maxWidth: "900px", mx: "auto", height: "100%" }}>
            {/* --- (Message display logic is unchanged) --- */}
            {chatLoading ? (
              <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%'}}>
                <CircularProgress sx={{color: textColor}} />
              </Box>
            ) : messages.length === 0 ? (
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: textColor,
                  textAlign: "center",
                }}
              >
                <Typography
                  variant="h5"
                  fontWeight={500}
                  sx={{ mb: 1, fontFamily: commonFontFamily }}
                >
                  How can I help?
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ mb: 3, opacity: 0.8, fontFamily: commonFontFamily }}
                >
                  Ask Lumeni anything about your code, studies, or projects.
                </Typography>
                {renderInputArea('middle')}
              </Box>
            ) : (
              <>
                {messages.map((msg, index) => {
                  const isUser = msg.from === "user";
                  const isThinking = msg.id === "thinking-msg";
                  const isBot = !isUser;

                  return (
                    <Fragment key={index}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: isUser
                            ? "flex-end"
                            : "flex-start",
                          mb: 2.5,
                          width: "100%",
                        }}
                      >
                        {isBot ? (
                          isThinking ? (
                            // --- (Typing animation is unchanged) ---
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "flex-start",
                                width: "100%",
                                maxWidth: "900px",
                                bgcolor: "#232323",
                                p: 2,
                                borderRadius: 2,
                                boxShadow: "0px 0px 2px #000",
                              }}
                            >
                              <Avatar
                                src="/logo2.jpg"
                                sx={{
                                  width: 32,
                                  height: 32,
                                  mr: 1.5,
                                  mt: 0.5,
                                }}
                              />
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.6,
                                  mt: 0.5,
                                }}
                              >
                                {[0, 1, 2].map((i) => (
                                  <Box
                                    key={i}
                                    sx={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: "50%",
                                      backgroundColor: "#e0e0e0",
                                      animation: `${typingDots} 1.1s infinite`,
                                      animationDelay: `${i * 0.18}s`,
                                    }}
                                  />
                                ))}
                              </Box>
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                position: "relative",
                                display: "flex",
                                alignItems: "flex-start",
                                width: "100%",
                                maxWidth: "900px",
                                bgcolor: "#232323",
                                p: 2,
                                borderRadius: 2,
                                boxShadow: "0px 0px 2px #000",
                                "&:hover .message-actions": {
                                  opacity: 1,
                                  pointerEvents: "auto",
                                },
                              }}
                            >
                              {/* --- (Hover actions box is unchanged) --- */}
                              <Box
                                className="message-actions"
                                sx={{
                                  position: "absolute",
                                  top: 6,
                                  right: 8,
                                  display: "flex",
                                  gap: 0.5,
                                  opacity: 0,
                                  pointerEvents: "none",
                                  transition: "opacity 0.2s ease",
                                }}
                              >
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleCopyMessage(index, msg.text)
                                  }
                                  sx={{
                                    width: 26,
                                    height: 26,
                                    bgcolor: "rgba(255,255,255,0.04)",
                                  }}
                                >
                                  {copiedMessageIndex === index ? (
                                    <Check fontSize="small" />
                                  ) : (
                                    <ContentCopy fontSize="small" />
                                  )}
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleFeedback(index, "up")
                                  }
                                  sx={{
                                    width: 26,
                                    height: 26,
                                    bgcolor:
                                      messageFeedback[index] === "up"
                                        ? "rgba(76, 175, 80, 0.25)"
                                        : "rgba(255,255,255,0.04)",
                                  }}
                                >
                                  <ThumbUpAltOutlined fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleFeedback(index, "down")
                                  }
                                  sx={{
                                    width: 26,
                                    height: 26,
                                    bgcolor:
                                      messageFeedback[index] === "down"
                                        ? "rgba(244, 67, 54, 0.25)"
                                        : "rgba(255,255,255,0.04)",
                                  }}
                                >
                                  <ThumbDownAltOutlined fontSize="small" />
                                </IconButton>
                              </Box>

                              <Avatar
                                src="/logo2.jpg"
                                sx={{
                                  width: 32,
                                  height: 32,
                                  mr: 1.5,
                                  mt: 0.5,
                                }}
                              />

                              <Box
                                sx={{
                                  flexGrow: 1,
                                  pt: 0.5,
                                  color: "#e0e0e0",
                                  fontFamily: commonFontFamily,
                                  "& p": {
                                    marginBlock: "0.35rem",
                                    fontFamily: commonFontFamily,
                                    lineHeight: 1.6
                                  },
                                  "& ol, & ul": {
                                    pl: 2.5,
                                  },
                                  "& li": {
                                    mb: 0.5,
                                  }
                                }}
                              >
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm, remarkMath]}
                                  rehypePlugins={[rehypeKatex]}
                                  components={{
                                    code({
                                      node,
                                      inline,
                                      className,
                                      children,
                                      ...props
                                    }) {
                                      const match =
                                        /language-(\w+)/.exec(
                                          className || ""
                                        );
                                      const text = String(children).replace(
                                        /\n$/,
                                        ""
                                      );
                                      if (!inline) {
                                        return (
                                          <Box
                                            sx={{
                                              position: "relative",
                                              mt: 1.5,
                                              mb: 1.5,
                                            }}
                                          >
                                            <IconButton
                                              size="small"
                                              onClick={() =>
                                                handleCopyToClipboard(text)
                                              }
                                              sx={{
                                                position: "absolute",
                                                top: 6,
                                                right: 6,
                                                zIndex: 1,
                                                width: 26,
                                                height: 26,
                                                bgcolor:
                                                  "rgba(0,0,0,0.35)",
                                              }}
                                            >
                                              <ContentCopy
                                                fontSize="small"
                                              />
                                            </IconButton>
                                            <SyntaxHighlighter
                                              style={oneDark}
                                              language={
                                                match?.[1] || "plaintext"
                                              }
                                              PreTag="div"
                                              customStyle={{
                                                borderRadius: "10px",
                                                padding: "16px",
                                                background: "#1e1e1e",
                                                fontSize: "0.9rem",
                                                fontFamily:
                                                  "Consolas, SFMono-Regular, Menlo, Monaco, 'Liberation Mono', 'Courier New', monospace",
                                              }}
                                              {...props}
                                            >
                                              {text}
                                            </SyntaxHighlighter>
                                          </Box>
                                        );
                                      }
                                      return (
                                        <code
                                          style={{
                                            backgroundColor: "#333",
                                            padding: "2px 4px",
                                            borderRadius: "4px",
                                            fontSize: "0.9rem",
                                            fontFamily:
                                              "Consolas, SFMono-Regular, Menlo, Monaco, 'Liberation Mono', 'Courier New', monospace",
                                          }}
                                          {...props}
                                        >
                                          {children}
                                        </code>
                                      );
                                    },
                                  }}
                                >
                                  {msg.text} 
                                </ReactMarkdown>
                              </Box>
                            </Box>
                          )
                        ) : (
                          <Paper
                            elevation={0}
                            sx={{
                              p: 1.5,
                              px: 2,
                              maxWidth: "70%",
                              bgcolor: "#2A2A2A",
                              color: buttonTextColor,
                              borderRadius: 3,
                              fontFamily: commonFontFamily,
                            }}
                          >
                            <Typography
                              variant="body1"
                              sx={{ fontFamily: commonFontFamily, whiteSpace: "pre-wrap" }}
                            >
                              {msg.text}
                            </Typography>
                          </Paper>
                        )}
                      </Box>

                      {index < messages.length - 1 && (
                        <Divider
                          sx={{
                            my: 1,
                            borderColor: "rgba(255,255,255,0.04)",
                          }}
                        />
                      )}
                    </Fragment>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </Box>
        </Paper>

        {/* Input Area */}
        {renderInputArea("bottom")}
      </Box>

      {/* --- (Right Sidebar is unchanged) --- */}
      <Box
        sx={{
          width: sidebarOpen ? 260 : 60,
          transition: "width 0.3s ease",
          borderLeft: `1px solid ${borderColor}`,
          bgcolor: panelColor,
          display: "flex",
          flexDirection: "column",
          alignItems: sidebarOpen ? "stretch" : "center",
          p: 2,
          color: textColor,
        }}
      >
        <IconButton
          onClick={() => setSidebarOpen((prev) => !prev)}
          sx={{
            alignSelf: sidebarOpen ? "flex-end" : "center",
            mb: sidebarOpen ? 1 : 2,
            color: textColor,
          }}
        >
          {sidebarOpen ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>
        {sidebarOpen && (
          <>
            <Button
              variant="contained"
              startIcon={<Add />}
              fullWidth
              onClick={handleNewChat}
              sx={{
                mb: 2,
                bgcolor: buttonColor,
                color: buttonTextColor,
                fontFamily: commonFontFamily,
                "&:hover": { bgcolor: "#2A2A2A" },
              }}
            >
              New Chat
            </Button>
            <TextField
              variant="standard"
              placeholder="Search chats..."
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" sx={{ color: textColor }} />
                  </InputAdornment>
                ),
                sx: {
                  color: textColor,
                  input: { color: textColor, fontFamily: commonFontFamily },
                },
              }}
              sx={{ mb: 2 }}
            />
            <Divider sx={{ mb: 2, borderColor }} />
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                mb: 1,
                color: textColor,
                fontFamily: commonFontFamily,
              }}
            >
              Chats
            </Typography>
            <List sx={{ flexGrow: 1, overflowY: "auto" }}>
              {chats.map((chat) => (
                <ListItemButton
                  key={chat.id || "new-chat"}
                  selected={chat.id === activeChat}
                  onClick={() => handleChatClick(chat)}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    "&.Mui-selected": {
                      backgroundColor: buttonColor,
                      color: buttonTextColor,
                    },
                  }}
                >
                  <ListItemText
                    primary={chat.title}
                    secondary={chat.lastUpdated}
                    primaryTypographyProps={{
                      fontSize: 14,
                      fontWeight: 500,
                      fontFamily: commonFontFamily,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    secondaryTypographyProps={{
                      fontSize: 11,
                      color: "#cccccc",
                      fontFamily: commonFontFamily,
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          </>
        )}
      </Box>
    </Box>
  );
}