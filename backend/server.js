const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require("axios");
const rateLimit = require("express-rate-limit");
const { generateChallenge } = require("./challengeGenerator");
const mongoose = require("mongoose");

// Load environment variables first
require("dotenv").config();

// Connect to MongoDB with improved error handling
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
  })
  .catch(err => {
    console.error("❌ MongoDB connection error:", err);
    // Don't exit the process, allow the server to start even if DB connection fails
    // The challenge generator will use fallback challenges if DB is unavailable
  });

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json({ limit: "200kb" }));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
  },
});

// ===== In-memory Rooms =====
const rooms = new Map();

function createRoom({ id, name, creatorSocketId, difficulty = 'medium' }) {
  if (!id) throw new Error("room id Required");
  const room = {
    id,
    name: name || `Room-${id}`,
    players: [],
    createdAt: Date.now(),
    creatorSocketId, // Track the creator of the room
    difficulty, // Store the difficulty level for challenges
    codes: {}, // { socketId: code }
    match: {
      started: false,
      startedAt: null,
      scores: {}, // { socketId: number }
      currentChallenge: null, // Store the current coding challenge
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
      room = createRoom({ id: roomId, name: `Room-${roomId}`, creatorSocketId: socket.id, difficulty: 'medium' });
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
  socket.on("start-match", async ({ roomId }) => {
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
    // Reset tracking of passed tests
    room.match.passedVisibleTests = {};
    room.match.passedHiddenTests = {};
    room.players.forEach((p) => (room.match.scores[p.socketId] = 0));

    try {
      // Generate a coding challenge using only the room's difficulty setting
      const challenge = await generateChallenge(room.difficulty);
      room.match.currentChallenge = challenge;
      
      // Emit match started event with the challenge
      io.to(roomId).emit("match-started", {
        startedAt: room.match.startedAt,
        scores: room.match.scores,
        challenge: challenge
      });
      
      // Also emit a separate event for the challenge
      io.to(roomId).emit("new-challenge", challenge);
      
      console.log(`Match started in room ${roomId} with challenge: ${challenge.title}`);
    } catch (error) {
      console.error(`Error generating challenge for room ${roomId}:`, error);
      
      // Use the fallback challenge from challengeGenerator.js
      // The generateChallenge function will return a random fallback challenge when there's an error
      
      room.match.currentChallenge = fallbackChallenge;
      
      io.to(roomId).emit("match-started", {
        startedAt: room.match.startedAt,
        scores: room.match.scores,
        challenge: fallbackChallenge
      });
      
      io.to(roomId).emit("new-challenge", fallbackChallenge);
      
      console.log(`Match started in room ${roomId} with fallback challenge due to error`);
    }
  });

  socket.on("stop-match", ({ roomId }) => {
    const room = getRoom(roomId);
    if (!room || !room.match.started) return;

    room.match.started = false;

    const scores = room.match.scores || {};
    const values = Object.values(scores);
    const maxScore = values.length ? Math.max(...values) : 0;
    const winners = Object.keys(scores).filter((id) => scores[id] === maxScore);
    
    // Get player usernames for winners
    const winnerDetails = winners.map(winnerId => {
      const player = room.players.find(p => p.socketId === winnerId);
      return {
        socketId: winnerId,
        username: player ? player.username : 'Unknown Player',
        score: scores[winnerId]
      };
    });
    
    // Get challenge details for the match summary
    const challenge = room.match.currentChallenge;
    const challengeDetails = challenge ? {
      title: challenge.title,
      hiddenTestCount: challenge.hiddenTestCases?.length || 0,
      visibleTestCount: challenge.visibleTestCases?.length || 0
    } : null;

    io.to(roomId).emit("match-stopped", { 
      scores, 
      winners, 
      winnerDetails,
      challengeDetails,
      matchSummary: `Match ended! ${winnerDetails.length === 1 ? 
        `${winnerDetails[0].username} won with ${winnerDetails[0].score} points!` : 
        `${winnerDetails.map(w => w.username).join(' and ')} tied with ${maxScore} points!`}`
    });
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
  const { id, name, creatorSocketId, difficulty } = req.body || {};
  if (!id) return res.status(400).json({ error: "id required" });
  if (rooms.has(id)) return res.status(409).json({ error: "room already exists" });
  const room = createRoom({ id, name, creatorSocketId, difficulty });
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

    // Get the room and current challenge
    const room = getRoom(roomId);
    const challenge = room?.match?.currentChallenge;
    
    if (!challenge) {
      return res.status(400).json({ error: "No active challenge found in this room." });
    }

    // Determine which test cases to use based on whether this is a submission or a run
    const testCases = isSubmission 
      ? [...(challenge.visibleTestCases || []), ...(challenge.hiddenTestCases || [])] 
      : (challenge.visibleTestCases || []);
    
    if (testCases.length === 0) {
      return res.status(400).json({ error: "No test cases available for this challenge." });
    }

    // Run the code against each test case
    const testResults = [];
    let totalPassed = 0;
    
    for (const testCase of testCases) {
      // Prepare test input
      const testInput = testCase.input.replace(/^"|"$/g, ''); // Remove quotes if present
      
      const payload = {
        language,
        version,
        files: [{ content: code }],
        stdin: testInput,
        args: [],
        compile_timeout: 5000,
        run_timeout: 5000,
        compile_memory_limit: -1,
        run_memory_limit: -1,
      };

      try {
        const { data } = await axios.post(`${PISTON_URL}/execute`, payload, {
          timeout: 10000,
          headers: { "Content-Type": "application/json" },
        });

        const expectedOutput = testCase.expected.replace(/^"|"$/g, '').trim();
        const actualOutput = (data?.run?.stdout || "").trim();
        const passed = data?.run?.code === 0 && actualOutput === expectedOutput;
        
        if (passed) totalPassed++;
        
        testResults.push({
          input: testCase.input,
          expected: testCase.expected,
          actual: actualOutput,
          passed,
          error: data?.run?.stderr || "",
          exitCode: data?.run?.code ?? null
        });
      } catch (error) {
        // If a single test case fails to execute, add it as a failed test
        testResults.push({
          input: testCase.input,
          expected: testCase.expected,
          actual: "",
          passed: false,
          error: error.message || "Execution failed",
          exitCode: 1
        });
      }
    }

    const result = {
      ran: testResults.length > 0,
      testResults,
      totalTests: testResults.length,
      passedTests: totalPassed,
      language,
      version,
      isSubmission
    };
    
    // Award points based on test results
    if (roomId && socketId && room && room.match?.started) {
      if (isSubmission) {
        // For submissions, award points based on number of passed tests
        // Each hidden test case is worth 10 points
        const hiddenTestCount = challenge.hiddenTestCases?.length || 0;
        const visibleTestCount = challenge.visibleTestCases?.length || 0;
        
        if (hiddenTestCount > 0) {
          // Calculate how many hidden tests were passed (they come after the visible tests)
          const hiddenTestsPassed = totalPassed - Math.min(totalPassed, visibleTestCount);
          const pointsPerHiddenTest = 10;
          const points = hiddenTestsPassed * pointsPerHiddenTest;
          
          // Track which hidden tests have been passed in the room object
          if (!room.match.passedHiddenTests) {
            room.match.passedHiddenTests = {};
          }
          if (!room.match.passedHiddenTests[socketId]) {
            room.match.passedHiddenTests[socketId] = new Set();
          }
          
          // Calculate points only for newly passed tests
          let newPoints = 0;
          const passedHiddenTestsSet = room.match.passedHiddenTests[socketId];
          
          // Check which hidden tests are newly passed
          for (let i = visibleTestCount; i < testResults.length; i++) {
            if (testResults[i].passed && !passedHiddenTestsSet.has(i)) {
              passedHiddenTestsSet.add(i);
              newPoints += pointsPerHiddenTest;
            }
          }
          
          if (newPoints > 0) {
            room.match.scores[socketId] = (room.match.scores[socketId] || 0) + newPoints;
            io.to(roomId).emit("score-update", room.match.scores);
            result.pointsAwarded = newPoints;
          }
        }
      } else {
        // For regular runs, award 1 point if at least one test passes
        // Track which visible tests have been passed
        if (!room.match.passedVisibleTests) {
          room.match.passedVisibleTests = {};
        }
        if (!room.match.passedVisibleTests[socketId]) {
          room.match.passedVisibleTests[socketId] = new Set();
        }
        
        // Calculate points only for newly passed tests
        let newPoints = 0;
        const passedVisibleTestsSet = room.match.passedVisibleTests[socketId];
        
        // Check which visible tests are newly passed
        for (let i = 0; i < testResults.length; i++) {
          if (testResults[i].passed && !passedVisibleTestsSet.has(i)) {
            passedVisibleTestsSet.add(i);
            newPoints += 1;
          }
        }
        
        if (newPoints > 0) {
          room.match.scores[socketId] = (room.match.scores[socketId] || 0) + newPoints;
          io.to(roomId).emit("score-update", room.match.scores);
          result.pointsAwarded = newPoints;
        }
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
