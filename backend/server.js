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

// rooms
const rooms = new Map();
// inside createRoom function:
function createRoom({id,name}){
  if(!id) throw new Error("room id Required");
  const room ={
    id,
    name: name || `Room-${id}`,
    players:[],
    createdAt: Date.now(),
    codes:{},
    match: { // NEW match state
      started: false,
      startedAt: null,
      scores: {}, // { socketId: number }
    }
  }
  rooms.set(id,room);
  return room;
}

function getRoom(id){
  return rooms.get(id)
}
function listRooms(){
  return Array.from(rooms.values()).map(r => ({
    id:r.id,
    name:r.name,
    playersCount:r.players.length,
    createdAt:r.createdAt,

  }));
}
function joinRoom(roomId, socketId, username) {
  const room = getRoom(roomId);
  if (!room) return null;
  // avoid duplicate
  if (!room.players.find(p => p.socketId === socketId)) {
    room.players.push({ socketId, username });
  }
  return room;
}
function leaveRoom(roomId, socketId) {
  const room = getRoom(roomId);
  if (!room) return null;
  room.players = room.players.filter(p => p.socketId !== socketId);
  return room;
}

function removeRoomIfEmpty(roomId) {
  const room = getRoom(roomId);
  if (room && room.players.length === 0) {
    rooms.delete(roomId);
  }
}

function findRoomIdBySocket(socketId) {
  for (const [roomId, room] of rooms.entries()) {
    if (room.players.some(p => p.socketId === socketId)) {
      return roomId;
    }
  }
  return null;
}


io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", ({ roomId, username }, callback) => {
    if (!roomId || !username) {
        return callback?.({ ok: false, error: "roomId or username is required" });
    }

    let room = getRoom(roomId) || createRoom({ id: roomId, name: `Room-${roomId}` });

    // Check if room already has 4 players
    if (room.players && room.players.length >= 4) {
        return callback?.({ ok: false, error: "Room is full (max 4 players)" });
    }

    socket.join(roomId);
    joinRoom(roomId, socket.id, username);

    // Create an empty playground for this player
    if (!room.codes) room.codes = {};
    room.codes[socket.id] = "// Start coding here...\n";

    // Send player list
    const playerList = (getRoom(roomId)?.players || []).map(p => ({
        socketId: p.socketId,
        username: p.username
    }));
    io.to(roomId).emit("player-list", playerList);

    // Send all playground codes to the newly joined player
    socket.emit("all-codes", room.codes);

    console.log(`Socket ${socket.id} joined room ${roomId} as ${username}`);
    callback?.({ ok: true, room: { id: roomId, name: room.name } });
  });

  socket.on("leave-room",({roomId},callback) =>{
    socket.leave(roomId);
    leaveRoom(roomId,socket.id);
    const room = getRoom(roomId);
    if(room){
      io.to(roomId).emit("room-players",room.players);

    }else{
      io.emit("room-removed",roomId);

    }
    removeRoomIfEmpty(roomId);
    callback?.({ok:true});
  });
  socket.on("room-code-update", ({ roomId, code }) => {
    // Send the code to everyone else in the same room
    socket.to(roomId).emit("code-update", code);
  });
  
  // Start match
  socket.on("start-match", ({ roomId }) => {
    const room = getRoom(roomId);
    if (!room) return;

    // Reset match state
    room.match.started = true;
    room.match.startedAt = Date.now();
    room.match.scores = {};
    room.players.forEach(p => {
      room.match.scores[p.socketId] = 0; // everyone starts at 0
    });

    io.to(roomId).emit("match-started", { 
      startedAt: room.match.startedAt,
      scores: room.match.scores 
    });

    console.log(`Match started in room ${roomId}`);
  });

  // Stop match
  socket.on("stop-match", ({ roomId }) => {
    const room = getRoom(roomId);
    if (!room || !room.match.started) return;

    room.match.started = false;

    // Get winner(s)
    const scores = room.match.scores || {};
    const maxScore = Math.max(...Object.values(scores), 0);
    const winners = Object.keys(scores).filter(id => scores[id] === maxScore);

    io.to(roomId).emit("match-stopped", {
      scores,
      winners,
    });

    console.log(`Match stopped in room ${roomId}`);
  });


  // When socket disconnects, remove from any rooms they were in
  socket.on("disconnecting", () => {
    // socket.rooms is a Set including socket.id and joined rooms
    for (const roomId of socket.rooms) {
      if (roomId === socket.id) continue; // skip personal room
      leaveRoom(roomId, socket.id);
      const room = getRoom(roomId);
      if (room) {
        io.to(roomId).emit("room-players", room.players);
      } else {
        io.emit("room-removed", roomId);
      }
      removeRoomIfEmpty(roomId);
    }
  });
  socket.on("code-change", ({ roomId, code }) => {
    const room = getRoom(roomId);
    if (!room || !room.codes) return;

    // Update only the sender's playground
    room.codes[socket.id] = code;

    // Broadcast updated codes to everyone
    io.to(roomId).emit("all-codes", room.codes);
});

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    const roomId = findRoomIdBySocket(socket.id);
    if (roomId) {
        const room = getRoom(roomId);
        if (room) {
            room.players = room.players.filter(p => p.socketId !== socket.id);
            delete room.codes[socket.id];

            // Send updated player list & codes
            const playerList = room.players.map(p => ({
                socketId: p.socketId,
                username: p.username
            }));
            io.to(roomId).emit("player-list", playerList);
            io.to(roomId).emit("all-codes", room.codes);
        }
    }
  });
});

app.get("/api/rooms", (req, res) => {
  res.json(listRooms());
});

app.post("/api/rooms", (req, res) => {
  const { id, name } = req.body || {};
  if (!id) return res.status(400).json({ error: "id required" });
  if (rooms.has(id)) return res.status(409).json({ error: "room already exists" });
  const room = createRoom({ id, name });
  res.status(201).json({ room });
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
    // ✅ Award points if match is active
    if (roomId && socketId) {
      const room = getRoom(roomId);
      if (room && room.match?.started && result.exitCode === 0) {
        room.match.scores[socketId] = (room.match.scores[socketId] || 0) + 1;
        io.to(roomId).emit("score-update", room.match.scores);
      }
    }

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
