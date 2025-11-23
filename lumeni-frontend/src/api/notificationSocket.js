let socket = null;

export const connectNotificationSocket = (onMessage) => {
  if (socket) return; // avoid duplicate sockets

  socket = new WebSocket("ws://127.0.0.1:8000/ws/notifications");

  socket.onopen = () => console.log("[Lumeni] 🔌 WebSocket connected");

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage && onMessage(data);
    } catch (err) {
      console.error("[Lumeni] ❌ Notification parse error:", err);
    }
  };

  socket.onclose = () => {
    console.warn("[Lumeni] ⚠️ Socket closed, retrying...");
    socket = null;
    setTimeout(() => connectNotificationSocket(onMessage), 3000);
  };
};
