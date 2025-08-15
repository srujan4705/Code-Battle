import React, { useState, useEffect } from "react";
import socket from "./socket";
import CodeEditor from "./components/CodeEditor";

function App() {
  const [code, setCode] = useState("// Start typing...");

  useEffect(() => {
    // Log connection once
    socket.on("connect", () => {
      console.log("Connected to server:", socket.id);
    });

    // Listen for code changes
    socket.on("code-update", (newCode) => {
      setCode(newCode);
    });

    // Cleanup only event listeners (not full disconnect)
    return () => {
      socket.off("connect");
      socket.off("code-update");
    };
  }, []);

  const handleCodeChange = (value) => {
    setCode(value);
    socket.emit("code-update", value);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h1>CodeBattle Arena 🏆</h1>
      <CodeEditor code={code} onChange={handleCodeChange} />
    </div>
  );
}

export default App;
