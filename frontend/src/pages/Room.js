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
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Language selector
  const [language, setLanguage] = useState("javascript");
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(true);


  // Track if current user is the room creator
  const [isRoomCreator, setIsRoomCreator] = useState(false);

  useEffect(() => {
    socket.emit("join-room", { roomId, username }, (resp) => {
      if (!resp || !resp.ok) {
        alert("Failed to join room: " + (resp?.error || "unknown"));
        navigate("/");
      } else {
        // If this is a new room, the current user is the creator
        if (players.length === 0) {
          setIsRoomCreator(true);
        }
      }
    });

    socket.on("player-list", (list) => {
      setPlayers(list);

      // Ensure editor buffers exist
      setPlayerEditors((prev) => {
        const updated = { ...prev };
        list.forEach((p) => {
          if (!updated[p.socketId]) {
            // If it's the current user, initialize with language template
            if (p.socketId === socket.id) {
              updated[p.socketId] = getStarterTemplate(language);
            } else {
              updated[p.socketId] = "// waiting for code...";
            }
          }
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
      
      // Check if current user is the room creator (first player to join)
      if (list.length > 0 && list[0].socketId === socket.id) {
        setIsRoomCreator(true);
      } else {
        setIsRoomCreator(false);
      }
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
    
    // Listen for match errors
    socket.on("match-error", ({ error }) => {
      alert(error);
    });
    
    // Match error handling is now added

    // We'll use our predefined languages instead of fetching all from the backend
    // This keeps the language selection limited to the ones we want to support
    const fetchLanguages = async () => {
      setIsLoadingLanguages(true);
      try {
        // We'll still fetch from the backend to ensure our languages are supported
        const response = await fetch("http://localhost:5000/api/runtimes");
        if (response.ok) {
          const data = await response.json();
          // Get the list of supported language IDs from the backend
          const supportedLanguageIds = data.map(runtime => runtime.language);
          
          // Filter our predefined languages to only include those supported by the backend
          const filteredLanguages = [
            { id: "javascript", name: "JavaScript" },
            { id: "python", name: "Python" },
            { id: "java", name: "Java" },
            { id: "c", name: "C" },
            { id: "cpp", name: "C++" },
            { id: "csharp", name: "C#" },
            { id: "go", name: "Go" },
            { id: "ruby", name: "Ruby" },
            { id: "rust", name: "Rust" },
            { id: "php", name: "PHP" }
          ].filter(lang => supportedLanguageIds.includes(lang.id));
          
          setAvailableLanguages(filteredLanguages);
        } else {
          // If API fails, use default languages
          setAvailableLanguages([
            { id: "javascript", name: "JavaScript" },
            { id: "python", name: "Python" },
            { id: "java", name: "Java" }
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch languages:", error);
        // Use a minimal set of default languages if fetch fails
        setAvailableLanguages([
          { id: "javascript", name: "JavaScript" },
          { id: "python", name: "Python" },
          { id: "java", name: "Java" }
        ]);
      } finally {
        setIsLoadingLanguages(false);
      }
    };

    fetchLanguages();

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

  // Generate starter code template based on selected language
  const getStarterTemplate = (lang) => {
    switch (lang) {
      case 'javascript':
        return '// JavaScript code\nconsole.log("Hello, World!");';
      case 'python':
        return '# Python code\nprint("Hello, World!")';
      case 'java':
        return '// Java code\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}';
      case 'c':
        return '// C code\n#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\n");\n    return 0;\n}';
      case 'cpp':
        return '// C++ code\n#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}';
      case 'csharp':
        return '// C# code\nusing System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}';
      case 'go':
        return '// Go code\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}';
      case 'ruby':
        return '# Ruby code\nputs "Hello, World!"';
      case 'rust':
        return '// Rust code\nfn main() {\n    println!("Hello, World!");\n}';
      case 'php':
        return '<?php\n// PHP code\necho "Hello, World!";\n?>';
      default:
        return '// Write your code here';
    }
  };

  const startMatch = () => socket.emit("start-match", { roomId });
  const stopMatch = () => socket.emit("stop-match", { roomId });

  const runOwnCode = async () => {
    const code = playerEditors[socket.id] || "";
    setIsEvaluating(true);
    try {
      const resp = await fetch("http://localhost:5000/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language, // Now using the selected language from state
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
          alert("Run successful! +1 point");
        } else {
          console.log("Program error or failed test.");
          alert("Run failed. Your code has errors.");
        }
      }
    } catch (e) {
      alert(e.message || "Network error");
    } finally {
      setIsEvaluating(false);
    }
  };

  const submitCode = async () => {
    const code = playerEditors[socket.id] || "";
    setIsEvaluating(true);
    try {
      const resp = await fetch("http://localhost:5000/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language, // Using the selected language from state
          code,
          stdin: "",
          roomId,
          socketId: socket.id,
          isSubmission: true, // Flag to indicate this is a submission
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        alert(data?.error || "Submission failed");
      } else {
        if (data.exitCode === 0) {
          // Add 2 points for a successful submission
          socket.emit("update-score", { roomId, points: 2 });
          alert("Submission successful! +2 points");
        } else {
          alert("Submission failed. Your code has errors.");
        }
      }
    } catch (e) {
      alert(e.message || "Network error");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div style={{ padding: "20px", height: "100vh", boxSizing: "border-box", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <div>
          <h2>Room: {roomId}</h2>
          <p>Logged in as: {username}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <label htmlFor="language-select" style={{ marginRight: "10px", fontWeight: "bold" }}>
            Language:
          </label>
          {isLoadingLanguages ? (
            <div style={{ 
              padding: "8px", 
              borderRadius: "4px", 
              border: "1px solid #ccc", 
              backgroundColor: "#f8f8f8", 
              fontSize: "14px",
              minWidth: "120px",
              textAlign: "center"
            }}>
              Loading...
            </div>
          ) : (
            <select 
              id="language-select"
              value={language}
              onChange={(e) => {
                const newLanguage = e.target.value;
                setLanguage(newLanguage);
                // Update code with template for the new language if current editor is empty or has default template
                if (socket.id && playerEditors[socket.id]) {
                  const currentCode = playerEditors[socket.id];
                  // Check if current code is empty or just a default template
                  const isDefaultOrEmpty = currentCode.trim() === "" || 
                    availableLanguages.some(lang => 
                      currentCode === getStarterTemplate(lang.id));
                  
                  if (isDefaultOrEmpty) {
                    const newTemplate = getStarterTemplate(newLanguage);
                    handleCodeChange(socket.id, newTemplate);
                  }
                }
              }}
              style={{
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                backgroundColor: "#f8f8f8",
                cursor: "pointer",
                fontSize: "14px",
                minWidth: "120px"
              }}
              disabled={availableLanguages.length === 0}
            >
              {availableLanguages.length === 0 ? (
                <option>No languages available</option>
              ) : (
                availableLanguages.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name}
                  </option>
                ))
              )}
            </select>
          )}
        </div>
      </div>
      
      {/* Dedicated Run and Submit buttons in top right */}
      <div style={{ 
        position: "absolute", 
        top: "20px", 
        right: "20px", 
        display: "flex", 
        gap: "10px" 
      }}>
        <button 
          onClick={runOwnCode} 
          disabled={!matchStarted || isEvaluating} 
          style={{ 
            padding: "8px 16px", 
            backgroundColor: "#4CAF50", 
            color: "white", 
            border: "none", 
            borderRadius: "4px", 
            cursor: (matchStarted && !isEvaluating) ? "pointer" : "not-allowed", 
            fontWeight: "bold",
            opacity: isEvaluating ? 0.7 : 1,
            minWidth: "100px"
          }}
        >
          {isEvaluating ? "Running..." : "Run Code"}
        </button>
        <button 
          onClick={submitCode} 
          disabled={!matchStarted || isEvaluating} 
          style={{ 
            padding: "8px 16px", 
            backgroundColor: "#2196F3", 
            color: "white", 
            border: "none", 
            borderRadius: "4px", 
            cursor: (matchStarted && !isEvaluating) ? "pointer" : "not-allowed", 
            fontWeight: "bold",
            opacity: isEvaluating ? 0.7 : 1,
            minWidth: "100px"
          }}
        >
          {isEvaluating ? "Submitting..." : "Submit"}
        </button>
      </div>

      {/* Match controls - only visible to room creator */}
      <div style={{ marginBottom: 12 }}>
        {isRoomCreator ? (
          !matchStarted ? (
            <button 
              onClick={startMatch} 
              disabled={players.length < 2}
              title={players.length < 2 ? "Need at least 2 players to start" : ""}
              style={{
                opacity: players.length < 2 ? 0.6 : 1,
                cursor: players.length < 2 ? "not-allowed" : "pointer"
              }}
            >
              Start Match {players.length < 2 ? "(Need more players)" : ""}
            </button>
          ) : (
            <button onClick={stopMatch}>Stop Match</button>
          )
        ) : (
          matchStarted ? (
            <div>Match in progress...</div>
          ) : (
            <div>Waiting for room creator to start the match...</div>
          )
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
                      language={player.socketId === socket.id ? language : language}
                      style={{ width: "100%", height: "100%" }}
                    />
                    {/* Removed individual Run button since we now have dedicated buttons in the top right */}
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
