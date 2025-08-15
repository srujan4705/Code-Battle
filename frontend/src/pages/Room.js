// src/pages/Room.js
import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import socket from "../socket";
import CodeEditor from "../components/CodeEditor";
import RunPanel from "../components/RunPanel";
import OutputPanel from "../components/OutputPanel";

function Room() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const username = location.state?.username || `guest-${Math.floor(Math.random()*1000)}`;

  const [code, setCode] = useState("// waiting for others...");
  const [players, setPlayers] = useState([]);
  const [stdout, setStdout] = useState("");
  const [stderr, setStderr] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [stdin, setStdin] = useState("");
  const [running, setRunning] = useState(false);

  // keep a ref to avoid emitting on initial code population if desired
  const initialSyncDone = useRef(false);

  useEffect(() => {
    // Join the room via socket
    socket.emit("join-room", { roomId, username }, (resp) => {
      if (!resp || !resp.ok) {
        alert("Failed to join room: " + (resp?.error || "unknown"));
        navigate("/");
      } else {
        console.log("Joined room:", resp.room);
      }
    });

    // Listeners
    socket.on("room-players", (list) => {
      setPlayers(list);
    });

    // code updates scoped to room
    socket.on("code-update", (newCode) => {
      // avoid clobbering while typing locally? (you can add OT later)
      setCode(newCode);
      initialSyncDone.current = true;
    });

    socket.on("match-started", (data) => {
      // handle match start
      alert("Match started!");
    });

    // cleanup on leave/unmount
    return () => {
      socket.emit("leave-room", { roomId }, () => {});
      socket.off("room-players");
      socket.off("code-update");
      socket.off("match-started");
    };
  }, [roomId, username, navigate]);

  // When the editor changes, emit room-code-update only if joined
  const handleCodeChange = (value) => {
    setCode(value);
    // throttle/debounce in production
    socket.emit("room-code-update", { roomId, code: value });
  };

  const startMatch = () => {
    socket.emit("start-match", { roomId });
  };

  // Run code via backend /api/run (same as Stage 3)
  const runCode = async () => {
    setRunning(true);
    setStdout(""); setStderr("");
    try {
      const res = await fetch("http://localhost:5000/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code, stdin })
      });
      const data = await res.json();
      if (!res.ok) {
        setStderr(data?.error || "run failed");
      } else {
        setStdout(data.stdout || "");
        setStderr(data.stderr || "");
      }
    } catch (err) {
      setStderr(err.message || "network error");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: "18px auto", padding: "0 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Room: {roomId}</h2>
        <div>
          <strong>{username}</strong>
          <button style={{ marginLeft: 12 }} onClick={() => navigate("/")}>Leave</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 12 }}>
        <div>
          <CodeEditor code={code} onChange={handleCodeChange} />
          <RunPanel
            language={language}
            setLanguage={setLanguage}
            stdin={stdin}
            setStdin={setStdin}
            onRun={runCode}
            running={running}
          />
          <OutputPanel stdout={stdout} stderr={stderr} exitCode={null} />
        </div>

        <aside style={{ borderLeft: "1px solid #eee", paddingLeft: 12 }}>
          <h4>Players</h4>
          <ul>
            {players.map(p => (
              <li key={p.socketId}>{p.username}{p.socketId === socket.id ? " (you)" : ""}</li>
            ))}
          </ul>

          <div style={{ marginTop: 18 }}>
            <button onClick={startMatch}>Start Match</button>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Room;
