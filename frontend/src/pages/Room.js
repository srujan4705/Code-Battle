// src/pages/Room.js
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import socket from "../socket";
import CodeEditor from "../components/CodeEditor";
import TestResultsPanel from "../components/TestResultsPanel";
import MatchResultsPanel from "../components/MatchResultsPanel";

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
  
  // Challenge state
  const [currentChallenge, setCurrentChallenge] = useState(null);
  
  // Test results state
  const [testResults, setTestResults] = useState(null);
  const [isSubmissionResults, setIsSubmissionResults] = useState(false);
  
  // Match results state
  const [matchResults, setMatchResults] = useState(null);


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

    socket.on("match-started", ({ scores: initialScores, challenge }) => {
      setMatchStarted(true);
      if (initialScores) setScores(initialScores);
      if (challenge) setCurrentChallenge(challenge);
    });
    
    // Listen for new challenges
    socket.on("new-challenge", (challenge) => {
      setCurrentChallenge(challenge);
    });
    socket.on("match-stopped", ({ scores, winners, winnerDetails, challengeDetails, matchSummary }) => {
      setMatchStarted(false);
      if (scores) setScores(scores);
      
      // Display match results to all players
      if (matchSummary) {
        alert(matchSummary);
      }
      
      // Store winner information for display
      setMatchResults({
        winners: winnerDetails || [],
        challenge: challengeDetails,
        scores
      });
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
      socket.off("new-challenge");
      socket.off("match-error");
      
      // Reset match state
      setMatchResults(null);
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
    setTestResults(null); // Clear previous test results
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
        // Display test results
        console.log("Run result:", data);
        setTestResults(data.testResults || []);
        setIsSubmissionResults(false);
        
        if (data.passedTests === 0) {
          // No tests passed
          console.log("No tests passed.");
        } else if (data.passedTests === data.totalTests) {
          // All tests passed
          console.log(`All tests passed! (${data.passedTests}/${data.totalTests})`);
        } else {
          // Some tests passed
          console.log(`${data.passedTests}/${data.totalTests} tests passed.`);
        }
        
        // Points are awarded server-side
        if (data.pointsAwarded) {
          console.log(`+${data.pointsAwarded} point(s) awarded!`);
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
    setTestResults(null); // Clear previous test results
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
        // Display test results
        console.log("Submission result:", data);
        setTestResults(data.testResults || []);
        setIsSubmissionResults(true);
        
        if (data.passedTests === 0) {
          // No tests passed
          alert("Your submission didn't pass any tests. No points awarded.");
        } else if (data.passedTests === data.totalTests) {
          // All tests passed
          alert(`Great job! Your solution passed all ${data.totalTests} test cases.`);
        } else {
          // Some tests passed
          alert(`Your solution passed ${data.passedTests} out of ${data.totalTests} test cases.`);
        }
        
        // Points are awarded server-side
        if (data.pointsAwarded) {
          alert(`+${data.pointsAwarded} points awarded for passing hidden test cases!`);
        }
      }
    } catch (e) {
      alert(e.message || "Network error");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="main-content">
      <div className="container">
        <div className="card fade-in" style={{ marginBottom: "var(--space-xl)" }}>
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <h2 style={{ margin: 0, fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="fas fa-gamepad" style={{ color: "var(--primary)" }}></i> Room: {roomId}
              </h2>
              <div className="d-flex gap-md align-items-center">
                <div className="form-group mb-0">
                  <select 
                    className="form-control"
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
                    disabled={availableLanguages.length === 0}
                    style={{ borderRadius: "var(--radius-md)", padding: "8px 12px" }}
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
                </div>
                {isRoomCreator && (
                  <>
                    {!matchStarted ? (
                      <button 
                        className="btn btn-primary" 
                        onClick={startMatch}
                        disabled={players.length < 2}
                        title={players.length < 2 ? "Need at least 2 players to start" : ""}
                        style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "8px",
                          padding: "8px 16px",
                          transition: "all 0.3s ease",
                          animation: players.length >= 2 ? "pulse 2s infinite" : "none"
                        }}
                      >
                        <i className="fas fa-play"></i> Start Match {players.length < 2 ? "(Need more players)" : ""}
                      </button>
                    ) : (
                      <button 
                        className="btn btn-warning" 
                        onClick={stopMatch}
                        style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "8px",
                          padding: "8px 16px"
                        }}
                      >
                        <i className="fas fa-stop"></i> Stop Match
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Run and Submit buttons */}
        <div className="action-buttons" style={{ 
          position: "fixed", 
          top: "20px", 
          right: "20px", 
          zIndex: 100,
          display: "flex", 
          gap: "10px" 
        }}>
          <button 
            className="btn btn-success"
            onClick={runOwnCode} 
            disabled={!matchStarted || isEvaluating} 
          >
            <i className="fas fa-play-circle"></i> {isEvaluating ? "Running..." : "Run Code"}
          </button>
          <button 
            className="btn btn-primary"
            onClick={submitCode} 
            disabled={!matchStarted || isEvaluating} 
          >
            <i className="fas fa-check-circle"></i> {isEvaluating ? "Submitting..." : "Submit"}
          </button>
        </div>

        {/* Challenge Display */}
        {currentChallenge && (
          <div className="card fade-in" style={{ marginBottom: "var(--space-xl)", boxShadow: "var(--shadow-md)" }}>
            <div className="card-header" style={{ borderBottom: "2px solid var(--primary-light)" }}>
              <h3 style={{ margin: 0, fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <i className="fas fa-code-branch" style={{ color: "var(--primary)" }}></i> Challenge: {currentChallenge.title}
              </h3>
            </div>
            <div className="card-body" style={{ padding: "var(--space-lg)" }}>
              <div style={{ whiteSpace: "pre-wrap" }}>
                <p style={{ fontSize: "1.1rem", lineHeight: "1.6", backgroundColor: "rgba(255, 255, 255, 0.05)", padding: "var(--space-md)", borderRadius: "var(--radius-md)" }}>
                  <strong style={{ color: "var(--primary-light)" }}>Description:</strong> {currentChallenge.description}
                </p>
                {currentChallenge.constraints && (
                  <p style={{ fontSize: "1rem", backgroundColor: "rgba(255, 255, 255, 0.03)", padding: "var(--space-md)", borderRadius: "var(--radius-md)", marginTop: "var(--space-md)" }}>
                    <strong style={{ color: "var(--warning)" }}>Constraints:</strong> {currentChallenge.constraints}
                  </p>
                )}
                <div className="d-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "var(--space-lg)" }}>
                  <div style={{ backgroundColor: "var(--surface-light)", padding: "var(--space-md)", borderRadius: "var(--radius-md)" }}>
                    <p><strong style={{ color: "var(--primary-light)" }}>Example Input:</strong></p>
                    <pre className="code-block" style={{ padding: "var(--space-md)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-light)" }}>{currentChallenge.exampleInput}</pre>
                  </div>
                  <div style={{ backgroundColor: "var(--surface-light)", padding: "var(--space-md)", borderRadius: "var(--radius-md)" }}>
                    <p><strong style={{ color: "var(--success)" }}>Example Output:</strong></p>
                    <pre className="code-block" style={{ padding: "var(--space-md)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-light)" }}>{currentChallenge.exampleOutput}</pre>
                  </div>
                </div>
                <p style={{ marginTop: "var(--space-lg)", display: "inline-block", padding: "var(--space-xs) var(--space-md)", backgroundColor: currentChallenge.difficulty === "Easy" ? "var(--success-light)" : currentChallenge.difficulty === "Hard" ? "var(--danger-light)" : "var(--warning-light)", borderRadius: "var(--radius-full)" }}>
                  <strong>Difficulty:</strong> {currentChallenge.difficulty}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Match Results Panel - shown when match ends */}
        {!matchStarted && matchResults && <MatchResultsPanel matchResults={matchResults} />}
        
        {/* Test Results Display */}
        {testResults && testResults.length > 0 && (
          <TestResultsPanel 
            testResults={testResults} 
            isSubmission={isSubmissionResults} 
          />
        )}

        {/* Scoreboard */}
        <div className="card fade-in" style={{ marginBottom: "var(--space-lg)", boxShadow: "var(--shadow-md)" }}>
          <div className="card-header" style={{ borderBottom: "2px solid var(--primary-light)" }}>
            <h3 style={{ margin: 0, fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="fas fa-trophy" style={{ color: "var(--warning)" }}></i> Scores
            </h3>
          </div>
          <div className="card-body">
            <ul className="score-list" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {players.map((p) => (
                <li 
                  key={p.socketId} 
                  className={p.socketId === socket.id ? "current-user" : ""}
                  style={{ 
                    padding: "var(--space-md)", 
                    margin: "var(--space-xs) 0", 
                    borderRadius: "var(--radius-md)",
                    backgroundColor: p.socketId === socket.id ? "rgba(67, 97, 238, 0.1)" : "var(--surface-light)",
                    border: p.socketId === socket.id ? "1px solid var(--primary)" : "1px solid var(--border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "all 0.3s ease"
                  }}
                >
                  <span style={{ fontWeight: p.socketId === socket.id ? 600 : 400 }}>
                    {p.username}
                    {p.socketId === socket.id ? " (You)" : ""}
                  </span>
                  <span 
                    className="score-value"
                    style={{ 
                      fontWeight: "bold", 
                      backgroundColor: "var(--surface)", 
                      padding: "var(--space-xs) var(--space-sm)",
                      borderRadius: "var(--radius-full)",
                      minWidth: "50px",
                      textAlign: "center",
                      color: scores[p.socketId] > 0 ? "var(--success)" : "var(--text-secondary)"
                    }}
                  >
                    {scores[p.socketId] ?? 0}
                  </span>
                </li>
              ))}
            </ul>
            <div className="info-text" style={{ 
              marginTop: "var(--space-lg)", 
              padding: "var(--space-md)", 
              backgroundColor: "rgba(255, 255, 255, 0.05)", 
              borderRadius: "var(--radius-md)",
              fontSize: "0.9rem",
              color: "var(--text-tertiary)",
              borderLeft: "3px solid var(--primary-light)"
            }}>
              Run: +1 point for passing visible test cases. Submit: +10 points per hidden test case passed.
            </div>
          </div>
        </div>

        {/* 2x2 editors grid */}
        <div className="editors-grid">
          {Array.from({ length: 4 }).map((_, idx) => {
            const player = players[idx];

            return (
              <div
                key={player?.socketId || idx}
                className="editor-container"
              >
                <div className="editor-header">
                  {player ? (
                    <>
                      {player.username}
                      {player.socketId === socket.id && " (You)"}
                      <span className="editor-score">
                        {scores[player?.socketId] ?? 0} pts
                      </span>
                    </>
                  ) : (
                    `Waiting for player ${idx + 1}...`
                  )}
                </div>

                <div className="editor-body">
                  {player ? (
                    <>
                      <CodeEditor
                        code={playerEditors[player.socketId] || ""}
                        onChange={(value) => handleCodeChange(player.socketId, value)}
                        readOnly={player.socketId !== socket.id}
                        language={player.socketId === socket.id ? language : language}
                        style={{ width: "100%", height: "100%" }}
                      />
                    </>
                  ) : (
                    <div className="waiting-placeholder">
                      Waiting for player...
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Room;
