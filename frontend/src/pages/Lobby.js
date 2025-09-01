// src/pages/Lobby.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Lobby() {
  const [rooms, setRooms] = useState([]);
  const [newRoomId, setNewRoomId] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
    // optionally poll periodically or use websockets to get live room updates
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/rooms");
      const data = await res.json();
      setRooms(data || []);
    } catch (err) {
      console.error("Fetch rooms error:", err);
    }
  };

  const createRoom = async () => {
    if (!newRoomId) return alert("Enter room id (e.g., abc123)");
    try {
      const res = await fetch("http://localhost:5000/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: newRoomId, name: newRoomName, difficulty }),
      });
      if (!res.ok) {
        const err = await res.json();
        return alert("Error creating room: " + (err.error || res.status));
      }
      setNewRoomId("");
      setNewRoomName("");
      await fetchRooms();
    } catch (err) {
      console.error(err);
      alert("Create room failed");
    }
  };

  const joinRoom = (roomId) => {
    if (!username) return alert("Enter a username to join");
    // navigate to /room/:roomId and pass username via state
    navigate(`/room/${roomId}`, { state: { username } });
  };

  return (
    <div className="main-content">
      <div className="container" style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 var(--space-md)" }}>
        <header className="slide-in-up" style={{ marginBottom: "var(--space-xl)" }}>
          <h1 className="text-gradient" style={{ fontSize: "2.5rem", marginBottom: "var(--space-md)" }}>
            <i className="fas fa-code"></i> CodeBattle Arena
          </h1>
          <p className="text-secondary" style={{ fontSize: "1.1rem", maxWidth: "600px" }}>
            Challenge other developers in real-time coding battles. Choose your language, solve problems, and climb the leaderboard!
          </p>
        </header>

        <div className="card fade-in" style={{ marginBottom: "var(--space-xl)" }}>
          <div className="card-header">
            <h2 style={{ margin: 0, fontSize: "1.25rem" }}>
              <i className="fas fa-user-circle"></i> Player Information
            </h2>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Your Name</label>
              <input 
                className="form-control" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="Enter your username" 
              />
            </div>
          </div>
        </div>

        <div className="card fade-in" style={{ marginBottom: "var(--space-xl)" }}>
          <div className="card-header">
            <h2 style={{ margin: 0, fontSize: "1.25rem" }}>
              <i className="fas fa-plus-circle"></i> Create New Room
            </h2>
          </div>
          <div className="card-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)", marginBottom: "var(--space-md)" }}>
              <div className="form-group">
                <label className="form-label">Room ID</label>
                <input 
                  className="form-control" 
                  placeholder="Enter a unique room ID" 
                  value={newRoomId} 
                  onChange={(e) => setNewRoomId(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ 
                  marginBottom: "var(--space-sm)",
                  fontWeight: "600",
                  color: "var(--text-primary)",
                  display: "block"
                }}>Room Name</label>
                <input 
                  className="form-control" 
                  placeholder="Give your room a name (optional)" 
                  value={newRoomName} 
                  onChange={(e) => setNewRoomName(e.target.value)} 
                  style={{ 
                    padding: "var(--space-md)",
                    borderRadius: "var(--radius-md)",
                    border: "2px solid var(--border)",
                    fontSize: "1rem",
                    width: "100%",
                    transition: "all var(--transition-normal)",
                    ":focus": {
                      borderColor: "var(--primary)",
                      boxShadow: "0 0 0 3px rgba(67, 97, 238, 0.3)"
                    }
                  }}
                />
              </div>
            </div>
            
            <div className="form-group" style={{ marginBottom: "var(--space-lg)" }}>
              <label className="form-label" style={{ 
                marginBottom: "var(--space-sm)",
                fontWeight: "600",
                color: "var(--text-primary)",
                display: "block"
              }}>Difficulty Level</label>
              <select 
                className="form-control" 
                value={difficulty} 
                onChange={(e) => setDifficulty(e.target.value)}
                style={{ 
                  padding: "var(--space-md)",
                  borderRadius: "var(--radius-md)",
                  border: "2px solid var(--border)",
                  fontSize: "1rem",
                  width: "100%",
                  transition: "all var(--transition-normal)",
                  backgroundColor: "var(--surface)",
                  color: "var(--text-primary)",
                  ":focus": {
                    borderColor: "var(--primary)",
                    boxShadow: "0 0 0 3px rgba(67, 97, 238, 0.3)"
                  }
                }}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            
            <button 
              className="btn btn-primary" 
              onClick={createRoom}
              style={{ 
                padding: "var(--space-md) var(--space-xl)",
                borderRadius: "var(--radius-md)",
                fontSize: "1rem",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "var(--space-sm)",
                backgroundColor: "var(--primary)",
                border: "none",
                color: "white",
                boxShadow: "var(--shadow-md)",
                transition: "all var(--transition-normal)",
                ":hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "var(--shadow-lg)",
                  backgroundColor: "var(--primary-dark)"
                },
                ":active": {
                  transform: "translateY(1px)"
                }
              }}
            >
              <i className="fas fa-plus"></i> Create Room
            </button>
          </div>
        </div>

        <div className="card fade-in" style={{ 
          boxShadow: "var(--shadow-md)",
          transform: "translateY(0)",
          transition: "all var(--transition-normal)",
          border: "1px solid var(--border-light)",
          ":hover": {
            transform: "translateY(-5px)",
            boxShadow: "var(--shadow-lg)"
          }
        }}>
          <div className="card-header" style={{ 
            borderBottom: "2px solid var(--primary-light)",
            padding: "var(--space-md) var(--space-lg)"
          }}>
            <div className="d-flex justify-content-between align-items-center">
              <h2 style={{ 
                margin: 0, 
                fontSize: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "var(--space-sm)"
              }}>
                <i className="fas fa-door-open" style={{ color: "var(--primary)" }}></i> 
                <span>Available Rooms</span>
              </h2>
              <button 
                className="btn btn-sm btn-outline-primary" 
                onClick={fetchRooms}
                style={{ 
                  padding: "var(--space-sm) var(--space-md)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.9rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-sm)",
                  border: "2px solid var(--primary-light)",
                  backgroundColor: "transparent",
                  color: "var(--primary)",
                  transition: "all var(--transition-normal)",
                  ":hover": {
                    backgroundColor: "rgba(67, 97, 238, 0.1)"
                  }
                }}
              >
                <i className="fas fa-sync-alt" style={{ animation: "spin 1s linear infinite" }}></i> 
                <span>Refresh</span>
              </button>
            </div>
          </div>
          <div className="card-body" style={{ padding: "var(--space-lg)" }}>
            {rooms.length === 0 ? (
              <div className="text-center text-secondary" style={{ 
                padding: "var(--space-xl)",
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                borderRadius: "var(--radius-md)",
                border: "1px dashed var(--border)"
              }}>
                <i className="fas fa-info-circle fa-3x" style={{ 
                  marginBottom: "var(--space-md)",
                  color: "var(--text-tertiary)",
                  opacity: "0.7"
                }}></i>
                <p style={{ fontSize: "1.1rem", color: "var(--text-secondary)" }}>
                  No rooms available. Create a new room to get started!
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "var(--space-lg)" }}>
                {rooms.map(r => (
                  <div key={r.id} className="card" style={{ 
                    marginBottom: 0,
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                    backgroundColor: "var(--surface-light)",
                    boxShadow: "var(--shadow-sm)",
                    transition: "all var(--transition-normal)",
                    transform: "translateY(0)",
                    ":hover": {
                      transform: "translateY(-5px)",
                      boxShadow: "var(--shadow-md)",
                      borderColor: "var(--primary-light)"
                    }
                  }}>
                    <div className="card-body" style={{ 
                      padding: "var(--space-md)", 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center" 
                    }}>
                      <div>
                        <h3 style={{ 
                          margin: 0, 
                          marginBottom: "var(--space-xs)", 
                          fontSize: "1.1rem",
                          fontWeight: "600",
                          color: "var(--primary)"
                        }}>
                          {r.name || `Room ${r.id}`}
                        </h3>
                        <div style={{ display: "flex", gap: "var(--space-md)", alignItems: "center" }}>
                          <span className="badge badge-secondary" style={{ 
                            padding: "var(--space-xs) var(--space-sm)",
                            borderRadius: "var(--radius-full)",
                            fontSize: "0.8rem",
                            backgroundColor: "var(--surface-dark)",
                            color: "var(--text-secondary)"
                          }}>
                            ID: {r.id}
                          </span>
                          <span className="badge badge-primary" style={{ 
                            padding: "var(--space-xs) var(--space-sm)",
                            borderRadius: "var(--radius-full)",
                            fontSize: "0.8rem",
                            backgroundColor: "var(--primary-light)",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--space-xs)"
                          }}>
                            <i className="fas fa-users"></i> {r.playersCount} players
                          </span>
                        </div>
                      </div>
                      <button 
                        className="btn btn-success" 
                        onClick={() => joinRoom(r.id)}
                        disabled={!username}
                        title={!username ? "Enter your name first" : ""}
                        style={{ 
                          padding: "var(--space-sm) var(--space-lg)",
                          borderRadius: "var(--radius-md)",
                          fontSize: "0.95rem",
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          gap: "var(--space-sm)",
                          backgroundColor: "var(--success)",
                          border: "none",
                          color: "white",
                          opacity: !username ? "0.6" : "1",
                          cursor: !username ? "not-allowed" : "pointer",
                          transition: "all var(--transition-normal)",
                          ":hover": {
                            transform: !username ? "none" : "translateY(-2px)",
                            boxShadow: !username ? "none" : "var(--shadow-md)"
                          }
                        }}
                      >
                        <i className="fas fa-sign-in-alt"></i> Join
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <footer className="footer" style={{ marginTop: "var(--space-xl)" }}>
        <div className="container">
          <p>© {new Date().getFullYear()} CodeBattle Arena. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Lobby;
