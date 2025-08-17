// src/pages/Room.js
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import socket from "../socket";
import CodeEditor from "../components/CodeEditor";

function Room() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const username =
    location.state?.username || `guest-${Math.floor(Math.random() * 1000)}`;

  const [players, setPlayers] = useState([]);
  const [playerEditors, setPlayerEditors] = useState({}); // { socketId: code }
  const [scores, setScores] = useState({});
  const [matchStarted, setMatchStarted] = useState(false);

  // Optional: single language selector for now
  const [language] = useState("javascript");

  useEffect(() => {
    socket.emit("join-room", { roomId, username }, (resp) => {
      if (!resp || !resp.ok) {
        alert("Failed to join room: " + (resp?.error || "unknown"));
        navigate("/");
      }
    });

    socket.on("player-list", (list) => {
      setPlayers(list);

      // Ensure editor buffers exist
      setPlayerEditors((prev) => {
        const updated = { ...prev };
        list.forEach((p) => {
          if (!updated[p.socketId]) updated[p.socketId] = "// waiting for code...";
        });
        return updated;
      });

      // Ensure scores are present for all players
      setScores((prev) => {
        const updated = { ...prev };
        list.forEach((p) => {
          if (updated[p.socketId] == null) updated[p.socketId] = 0;
        });
        return updated;
      });
    });

    socket.on("all-codes", (codes) => setPlayerEditors(codes));
    socket.on("score-update", (updatedScores) => setScores(updatedScores));

    socket.on("match-started", ({ scores: initialScores }) => {
      setMatchStarted(true);
      if (initialScores) setScores(initialScores);
    });
    socket.on("match-stopped", ({ scores }) => {
      setMatchStarted(false);
      if (scores) setScores(scores);
    });

    return () => {
      socket.emit("leave-room", { roomId });
      socket.off("player-list");
      socket.off("all-codes");
      socket.off("score-update");
      socket.off("match-started");
      socket.off("match-stopped");
    };
  }, [roomId, username, navigate]);

  const handleCodeChange = (playerId, value) => {
    setPlayerEditors((prev) => ({ ...prev, [playerId]: value }));
    socket.emit("code-change", { roomId, code: value });
  };

  const startMatch = () => socket.emit("start-match", { roomId });
  const stopMatch = () => socket.emit("stop-match", { roomId });

  const runOwnCode = async () => {
    const code = playerEditors[socket.id] || "";
    try {
      const resp = await fetch("http://localhost:5000/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language, // keep simple; enhance later with per-editor choice
          code,
          stdin: "",
          roomId,
          socketId: socket.id, // critical for awarding points
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        alert(data?.error || "Run failed");
      } else {
        // Scoring happens server-side if match is active and exitCode===0
        // You can show output here if you want:
        console.log("Run result:", data);
        if (data.exitCode === 0) {
          // optional local toast
          console.log("Success ✓ (point should be awarded)");
        } else {
          console.log("Program error or failed test.");
        }
      }
    } catch (e) {
      alert(e.message || "Network error");
    }
  };

  return (
    <div style={{ padding: "20px", height: "100vh", boxSizing: "border-box" }}>
      <h2>Room: {roomId}</h2>
      <p>Logged in as: {username}</p>

      {/* Match controls */}
      <div style={{ marginBottom: 12 }}>
        {!matchStarted ? (
          <button onClick={startMatch}>Start Match</button>
        ) : (
          <button onClick={stopMatch}>Stop Match</button>
        )}
      </div>

      {/* Scoreboard */}
      <div style={{ marginBottom: 16 }}>
        <h3>Scores</h3>
        <ul>
          {players.map((p) => (
            <li key={p.socketId}>
              {p.username}
              {p.socketId === socket.id ? " (You)" : ""}: {scores[p.socketId] ?? 0}
            </li>
          ))}
        </ul>
        <small>
          Runs award points only while a match is active and if the program exits with code 0.
        </small>
      </div>

      {/* 2x2 editors grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: "10px",
          height: "85vh",
        }}
      >
        {Array.from({ length: 4 }).map((_, idx) => {
          const player = players[idx];

          return (
            <div
              key={player?.socketId || idx}
              style={{
                border: "1px solid #ccc",
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
              }}
            >
              <div style={{ background: "#eee", padding: "5px", flexShrink: 0 }}>
                {player ? (
                  <>
                    {player.username}
                    {player.socketId === socket.id && " (You)"}
                    <span style={{ float: "right" }}>
                      {scores[player?.socketId] ?? 0} pts
                    </span>
                  </>
                ) : (
                  `Waiting for player ${idx + 1}...`
                )}
              </div>

              <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
                {player ? (
                  <>
                    <CodeEditor
                      code={playerEditors[player.socketId] || ""}
                      onChange={(value) => handleCodeChange(player.socketId, value)}
                      readOnly={player.socketId !== socket.id}
                      style={{ width: "100%", height: "100%" }}
                    />
                    {/* Own Run button under your editor only */}
                    {player.socketId === socket.id && (
                      <div style={{ padding: "6px", borderTop: "1px solid #eee" }}>
                        <button onClick={runOwnCode} disabled={!matchStarted}>
                          Run Code {matchStarted ? "" : "(match not started)"}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div
                    style={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "#f9f9f9",
                    }}
                  >
                    Waiting for player...
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Room;
