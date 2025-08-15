import { io } from "socket.io-client";

// Create a persistent socket connection
const socket = io("http://localhost:5000", {
  autoConnect: true,
  transports: ["websocket"], // Force websocket for stability
});

export default socket;
