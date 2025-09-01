// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Lobby from "./pages/Lobby";
import Room from "./pages/Room";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <header className="header" style={{ 
          padding: "var(--space-lg) 0",
          borderBottom: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
          backgroundColor: "var(--surface)",
          animation: "fadeIn 0.5s ease-in-out"
        }}>
          <div className="container header-container" style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            padding: "0 var(--space-xl)"
          }}>
            <Link to="/" className="logo" style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "var(--space-sm)",
              fontSize: "1.8rem",
              fontWeight: "700",
              color: "var(--primary)",
              textDecoration: "none",
              transition: "all var(--transition-normal)",
              transform: "translateY(0)",
              ":hover": {
                transform: "translateY(-2px)"
              }
            }}>
              <i className="fas fa-code" style={{ 
                fontSize: "2rem",
                color: "var(--primary)",
                animation: "pulse 2s infinite"
              }}></i>
              <span style={{ 
                background: "linear-gradient(90deg, var(--primary) 0%, var(--primary-light) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}>CodeBattle</span>
            </Link>
            <nav>
              <Link to="/" className="btn btn-outline" style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "var(--space-sm)",
                padding: "var(--space-sm) var(--space-lg)",
                borderRadius: "var(--radius-md)",
                fontSize: "1rem",
                fontWeight: "600",
                transition: "all var(--transition-normal)",
                boxShadow: "var(--shadow-sm)",
                border: "2px solid var(--primary-light)",
                ":hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "var(--shadow-md)"
                }
              }}>
                <i className="fas fa-home" style={{ color: "var(--primary)" }}></i> Lobby
              </Link>
            </nav>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Lobby />} />
          <Route path="/room/:roomId" element={<Room />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
