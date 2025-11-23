// In src/notificationSocket.js

let socket = null;
let messageHandler = null;

// This function will be called by MainLayout.jsx
export const connectNotificationSocket = (onMessage) => {
  // Store the function MainLayout gives us, so we can call it later
  messageHandler = onMessage;

  // Avoid creating duplicate sockets if one is already open or connecting
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    console.log("[Lumeni] 🔌 WebSocket connection already established.");
    return;
  }

  // --- [FIX START] Dynamic URL Logic ---
  // Get the base API URL from your environment file
  const API_URL = import.meta.env.VITE_API_URL;
  
  // Convert "http" -> "ws" and "https" -> "wss" automatically
  // This ensures it works on both localhost and your secure live server
  const WS_URL = API_URL.replace("https", "wss").replace("http", "ws");
  
  // Connect using the dynamic URL
  socket = new WebSocket(`${WS_URL}/ws/notifications`);
  // --- [FIX END] ---

  // --- WebSocket Event Listeners ---

  // 1. When the connection is successfully opened
  socket.onopen = () => {
    console.log("[Lumeni] 🔌 WebSocket connected successfully.");
  };

  // 2. When a message is received from the server
  socket.onmessage = (event) => {
    try {
      // Our simple backend just sends a plain text string.
      const messageText = event.data;
      
      // If MainLayout gave us a function to call, call it with the message.
      if (messageHandler) {
        messageHandler(messageText);
      }
    } catch (err) {
      console.error("[Lumeni] ❌ Error processing notification:", err);
    }
  };

  // 3. When the connection is closed (e.g., server restarts)
  socket.onclose = () => {
    console.warn("[Lumeni] ⚠️ Socket closed. Attempting to reconnect in 3 seconds...");
    socket = null; // Clear the old socket
    
    // This is key: it automatically tries to reconnect after a delay.
    setTimeout(() => {
      connectNotificationSocket(onMessage); // Re-run the connect logic
    }, 3000); // 3-second delay
  };

  // 4. If an error occurs
  socket.onerror = (error) => {
    console.error("[Lumeni] ❌ WebSocket error:", error);
    // The 'onclose' event will usually fire right after this,
    // which will then trigger the reconnection logic.
  };
};