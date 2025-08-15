// src/pages/Lobby.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Lobby() {
  const [rooms, setRooms] = useState([]);
  const [newRoomId, setNewRoomId] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
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
        body: JSON.stringify({ id: newRoomId, name: newRoomName }),
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
    <div style={{ maxWidth: 900, margin: "24px auto", padding: "0 12px" }}>
      <h1>CodeBattle Arena — Lobby</h1>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 6 }}>Your name</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g., srujan" />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input placeholder="Room id (unique string)" value={newRoomId} onChange={(e)=>setNewRoomId(e.target.value)} />
        <input placeholder="Room name (optional)" value={newRoomName} onChange={(e)=>setNewRoomName(e.target.value)} />
        <button onClick={createRoom}>Create Room</button>
      </div>

      <h3>Available Rooms</h3>
      <div>
        {rooms.length === 0 && <div>No rooms yet. Create one!</div>}
        {rooms.map(r => (
          <div key={r.id} style={{ display: "flex", justifyContent: "space-between", border: "1px solid #ddd", padding: 8, marginBottom: 6 }}>
            <div>
              <strong>{r.name}</strong> <small>({r.id})</small>
              <div style={{ fontSize: 12, opacity: 0.8 }}>{r.playersCount} players</div>
            </div>
            <div>
              <button onClick={() => joinRoom(r.id)}>Join</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Lobby;
