import { io } from "socket.io-client";

// Get the base URL (stripping out /api if it exists)
const SOCKET_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:3000";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
});
