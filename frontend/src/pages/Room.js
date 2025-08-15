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
  const [playerEditors, setPlayerEditors] = useState({}); // { playerId: code }

  useEffect(() => {
    // Join room
    socket.emit("join-room", { roomId, username }, (resp) => {
      if (!resp || !resp.ok) {
        alert("Failed to join room: " + (resp?.error || "unknown"));
        navigate("/");
      }
    });

    socket.on("player-list", (list) => {
      setPlayers(list);
      // Ensure each player has an editor slot
      setPlayerEditors((prev) => {
        const updated = { ...prev };
        list.forEach((p) => {
          if (!updated[p.socketId]) {
            updated[p.socketId] = "// waiting for code...";
          }
        });
        return updated;
      });
    });

    // Listen for code changes from others
    socket.on("all-codes", (codes) => {
      setPlayerEditors(codes);
    });

    return () => {
      socket.emit("leave-room", { roomId });
      socket.off("player-list");
      socket.off("all-codes");
    };
  }, [roomId, username, navigate]);

  const handleCodeChange = (playerId, value) => {
    setPlayerEditors((prev) => ({
      ...prev,
      [playerId]: value,
    }));
    socket.emit("code-change", { roomId, code: value });
  };

  return (
    <div style={{ padding: "20px", height: "100vh", boxSizing: "border-box" }}>
      <h2>Room: {roomId}</h2>
      <p>Logged in as: {username}</p>

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
                minHeight: 0, // important for flex children
              }}
            >
              <div
                style={{
                  background: "#eee",
                  padding: "5px",
                  flexShrink: 0,
                }}
              >
                {player ? (
                  <>
                    {player.username}
                    {player.socketId === socket.id && " (You)"}
                  </>
                ) : (
                  `Waiting for player ${idx + 1}...`
                )}
              </div>

              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflow: "hidden",
                }}
              >
                {player && (
                  <CodeEditor
                    code={playerEditors[player.socketId] || ""}
                    onChange={(value) =>
                      handleCodeChange(player.socketId, value)
                    }
                    readOnly={player.socketId !== socket.id}
                    style={{ width: "100%", height: "100%" }}
                  />
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
