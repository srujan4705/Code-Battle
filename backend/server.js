const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require("axios");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json({ limit: "200kb" }));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// ===== In-memory Rooms =====
const rooms = new Map();

function createRoom({ id, name, creatorSocketId }) {
  if (!id) throw new Error("room id Required");
  const room = {
    id,
    name: name || `Room-${id}`,
    players: [],
    createdAt: Date.now(),
    creatorSocketId, // Track the creator of the room
    codes: {}, // { socketId: code }
    match: {
      started: false,
      startedAt: null,
      scores: {}, // { socketId: number }
    },
  };
  rooms.set(id, room);
  return room;
}
function getRoom(id) {
  return rooms.get(id);
}
function listRooms() {
  return Array.from(rooms.values()).map((r) => ({
    id: r.id,
    name: r.name,
    playersCount: r.players.length,
    createdAt: r.createdAt,
  }));
}
function joinRoom(roomId, socketId, username) {
  const room = getRoom(roomId);
  if (!room) return null;
  if (!room.players.find((p) => p.socketId === socketId)) {
    room.players.push({ socketId, username });
  }
  return room;
}
function leaveRoom(roomId, socketId) {
  const room = getRoom(roomId);
  if (!room) return null;
  room.players = room.players.filter((p) => p.socketId !== socketId);
  delete room.codes?.[socketId];
  delete room.match?.scores?.[socketId];
  return room;
}
function removeRoomIfEmpty(roomId) {
  const room = getRoom(roomId);
  if (room && room.players.length === 0) {
    rooms.delete(roomId);
  }
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ===== Join room =====
  socket.on("join-room", ({ roomId, username }, callback) => {
    if (!roomId || !username) {
      return callback?.({ ok: false, error: "roomId or username is required" });
    }

    // Check if room exists
    let room = getRoom(roomId);
    
    // If room exists, check if match has started
    if (room && room.match.started) {
      return callback?.({ ok: false, error: "Match has already started. Please create or join another room." });
    }
    
    // Create room if it doesn't exist
    if (!room) {
      room = createRoom({ id: roomId, name: `Room-${roomId}`, creatorSocketId: socket.id });
    }

    // Enforce max 4 players
    if (room.players.length >= 4) {
      return callback?.({ ok: false, error: "Room is full (max 4 players)" });
    }

    socket.join(roomId);
    joinRoom(roomId, socket.id, username);

    // Ensure a code buffer for this player
    room.codes[socket.id] = room.codes[socket.id] || "// Start coding here...\n";

    // Ensure scores map includes everyone (0 by default)
    room.players.forEach((p) => {
      if (room.match.scores[p.socketId] == null) room.match.scores[p.socketId] = 0;
    });

    // Broadcast player list + all codes + scores
    const playerList = room.players.map((p) => ({ socketId: p.socketId, username: p.username }));
    io.to(roomId).emit("player-list", playerList);
    io.to(roomId).emit("all-codes", room.codes);
    io.to(roomId).emit("score-update", room.match.scores);

    console.log(`Socket ${socket.id} joined room ${roomId} as ${username}`);
    callback?.({ ok: true, room: { id: roomId, name: room.name } });
  });

  // ===== Leave room (explicit) =====
  socket.on("leave-room", ({ roomId }, callback) => {
    socket.leave(roomId);
    const room = leaveRoom(roomId, socket.id);

    if (room) {
      const playerList = room.players.map((p) => ({ socketId: p.socketId, username: p.username }));
      io.to(roomId).emit("player-list", playerList);
      io.to(roomId).emit("all-codes", room.codes);
      io.to(roomId).emit("score-update", room.match.scores);
    } else {
      io.emit("room-removed", roomId);
    }

    removeRoomIfEmpty(roomId);
    callback?.({ ok: true });
  });

  // ===== Code sync (per player editor) =====
  socket.on("code-change", ({ roomId, code }) => {
    const room = getRoom(roomId);
    if (!room) return;

    room.codes[socket.id] = code;
    io.to(roomId).emit("all-codes", room.codes);
  });

  // ===== Update score (for submissions) =====
  socket.on("update-score", ({ roomId, points }) => {
    const room = getRoom(roomId);
    if (!room || !room.match?.started) return;

    // Add points to the player's score
    room.match.scores[socket.id] = (room.match.scores[socket.id] || 0) + points;
    
    // Broadcast updated scores to all players in the room
    io.to(roomId).emit("score-update", room.match.scores);
    
    console.log(`Score updated for ${socket.id} in room ${roomId}: +${points} points`);
  });

  // ===== Start / Stop Match =====
  socket.on("start-match", ({ roomId }) => {
    const room = getRoom(roomId);
    if (!room) return;
    
    // Check if the socket is the room creator
    if (room.creatorSocketId !== socket.id) {
      socket.emit("match-error", { error: "Only the room creator can start the match" });
      return;
    }
    
    // Check if there are at least 2 players in the room
    if (room.players.length < 2) {
      socket.emit("match-error", { error: "At least 2 players are required to start a match" });
      return;
    }

    room.match.started = true;
    room.match.startedAt = Date.now();

    // reset/ensure scores = 0 for current players
    room.match.scores = {};
    room.players.forEach((p) => (room.match.scores[p.socketId] = 0));

    io.to(roomId).emit("match-started", {
      startedAt: room.match.startedAt,
      scores: room.match.scores,
    });

    console.log(`Match started in room ${roomId}`);
  });

  socket.on("stop-match", ({ roomId }) => {
    const room = getRoom(roomId);
    if (!room || !room.match.started) return;

    room.match.started = false;

    const scores = room.match.scores || {};
    const values = Object.values(scores);
    const maxScore = values.length ? Math.max(...values) : 0;
    const winners = Object.keys(scores).filter((id) => scores[id] === maxScore);

    io.to(roomId).emit("match-stopped", { scores, winners });
    console.log(`Match stopped in room ${roomId}`);
  });

  // ===== Disconnect handling =====
  socket.on("disconnecting", () => {
    for (const roomId of socket.rooms) {
      if (roomId === socket.id) continue; // skip personal room
      const room = leaveRoom(roomId, socket.id);
      if (room) {
        const playerList = room.players.map((p) => ({ socketId: p.socketId, username: p.username }));
        io.to(roomId).emit("player-list", playerList);
        io.to(roomId).emit("all-codes", room.codes);
        io.to(roomId).emit("score-update", room.match.scores);
      } else {
        io.emit("room-removed", roomId);
      }
      removeRoomIfEmpty(roomId);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// ===== REST: rooms =====
app.get("/api/rooms", (req, res) => {
  res.json(listRooms());
});

app.post("/api/rooms", (req, res) => {
  const { id, name, creatorSocketId } = req.body || {};
  if (!id) return res.status(400).json({ error: "id required" });
  if (rooms.has(id)) return res.status(409).json({ error: "room already exists" });
  const room = createRoom({ id, name, creatorSocketId });
  res.status(201).json({ room });
});

// ===== Piston runner =====
const PISTON_URL = process.env.PISTON_URL || "https://emkc.org/api/v2/piston";

const runLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 8,
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

/**
 * IMPORTANT:
 * Frontend must send { language, code, stdin?, version?, roomId, socketId }
 * so we can award points to the correct player when match is started
 * and the run exitCode === 0.
 */
app.post("/api/run", runLimiter, async (req, res) => {
  try {
    const { language, version = "*", code, stdin = "", roomId, socketId, isSubmission = false } = req.body || {};

    if (!language || !code) {
      return res.status(400).json({ error: "Missing 'language' or 'code'." });
    }

    const payload = {
      language,
      version,
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
      isSubmission
    };

    // Award points only if: valid room + match active + successful run
    // Note: Points for submissions are handled by the update-score socket event
    if (roomId && socketId && !isSubmission) {
      const room = getRoom(roomId);
      if (room && room.match?.started && result.exitCode === 0) {
        room.match.scores[socketId] = (room.match.scores[socketId] || 0) + 1;
        io.to(roomId).emit("score-update", room.match.scores);
      }
    }

    res.json(result);
  } catch (err) {
    const status = err.response?.status || 502;
    const message = err.response?.data?.message || err.message || "Piston execution failed";
    console.error("Run error:", message);
    res.status(status).json({ error: message });
  }
});

app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

const PORT = 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
