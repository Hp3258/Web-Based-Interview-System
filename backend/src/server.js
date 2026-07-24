import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { serve } from "inngest/express";
import { clerkMiddleware } from "@clerk/express";

import { ENV } from "./lib/env.js";
import { connectDB } from "./lib/db.js";
import { inngest, functions } from "./lib/inngest.js";

import chatRoutes from "./routes/chatRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import codeRoutes from "./routes/codeRoutes.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { 
    origin: function (origin, callback) { callback(null, true); }, 
    credentials: true 
  }
});

// Socket.io connection
io.on("connection", (socket) => {
  console.log("User connected to socket:", socket.id);

  socket.on("join_session_room", (sessionId) => {
    socket.join(sessionId);
    console.log(`User ${socket.id} joined room ${sessionId}`);
  });

  socket.on("request_to_join", ({ sessionId, candidateName }) => {
    // Notify HR
    socket.to(sessionId).emit("candidate_request", { candidateName, socketId: socket.id });
  });

  socket.on("hr_response", ({ candidateSocketId, action }) => {
    // action is 'accept' or 'reject'
    io.to(candidateSocketId).emit("join_response", { action });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

import compression from "compression";

// middleware
app.use(compression());
app.use(express.json());
app.use(cors({ 
  origin: function (origin, callback) { callback(null, true); }, 
  credentials: true 
}));
app.use(clerkMiddleware());

// test route
app.get("/", (req, res) => {
  res.send("Backend is running successfully");
});

// health
app.get("/health", (req, res) => {
  res.status(200).json({ msg: "API is running" });
});

// IMPORTANT: Inngest
app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions,
  })
);

// Chat routes
app.use("/api/chat", chatRoutes);

// Session routes
app.use("/api/sessions", sessionRoutes);  //antigravity

// Code execution routes
app.use("/api/code", codeRoutes);

// start server
const startServer = async () => {
  try {
    await connectDB();

    server.listen(ENV.PORT, () => {
      console.log(`Server running on port ${ENV.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};



startServer();