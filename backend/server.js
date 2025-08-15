const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require("axios");
const rateLimit = require("express-rate-limit");
require("dotenv").config();




const app = express();
app.use(cors({origin:"http://localhost:3000"}));
app.use(express.json({limit:"200kb"}));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Allow only React app in dev
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("code-update", (newCode) => {
    socket.broadcast.emit("code-update", newCode);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PISTON_URL = process.env.PISTON_URL || "https://emkc.org/api/v2/piston";

const runLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 8,              // max 8 runs per 10s per IP in dev
  standardHeaders: true,
  legacyHeaders: false,
});

app.get("/api/runtimes", async (req, res) => {
  try {
    const { data } = await axios.get(`${PISTON_URL}/runtimes`, { timeout: 8000 });
    res.json(data);
  } catch (err) {
    console.error("Runtimes error:", err.message);
    res.status(502).json({ error: "Failed to fetch runtimes" });
  }
});

app.post("/api/run", runLimiter, async (req, res) => {
  try {
    const { language, version = "*", code, stdin = "" } = req.body || {};

    if (!language || !code) {
      return res.status(400).json({ error: "Missing 'language' or 'code'." });
    }

    // Keep payload minimal; Piston expects files array
    const payload = {
      language,
      version, // "*" lets piston pick latest
      files: [{ content: code }],
      stdin,
      args: [],
      compile_timeout: 5000,
      run_timeout: 5000,
      compile_memory_limit: -1,
      run_memory_limit: -1,
    };

    const { data } = await axios.post(`${PISTON_URL}/execute`, payload, {
      timeout: 10000,
      headers: { "Content-Type": "application/json" },
    });

    // Normalize a friendly response
    const result = {
      ran: !!data?.run,
      stdout: data?.run?.stdout || "",
      stderr: data?.run?.stderr || "",
      exitCode: data?.run?.code ?? null,
      signal: data?.run?.signal ?? null,
      language,
      version: data?.language?.version || version,
      compile_stderr: data?.compile?.stderr || "",
      compile_stdout: data?.compile?.stdout || "",
    };

    res.json(result);
  } catch (err) {
    // Timeouts & network errors show up here
    const status = err.response?.status || 502;
    const message =
      err.response?.data?.message ||
      err.message ||
      "Piston execution failed";
    console.error("Run error:", message);
    res.status(status).json({ error: message });
  }
});

app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

const PORT = 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
