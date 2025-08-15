import React, { useState, useEffect } from "react";
import socket from "./socket";
import CodeEditor from "./components/CodeEditor";
import RunPanel from "./components/RunPanel";
import OutputPanel from "./components/OutputPanel";

function App() {
  const [code, setCode] = useState(`// Try me!
function main() {
  console.log("Hello from CodeBattle Arena!");
}
main();`);
  const [language, setLanguage] = useState("javascript");
  const [stdin, setStdin] = useState("");
  const [running, setRunning] = useState(false);
  const [stdout, setStdout] = useState("");
  const [stderr, setStderr] = useState("");
  const [exitCode, setExitCode] = useState(null);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server:", socket.id);
    });

    socket.on("code-update", (newCode) => setCode(newCode));

    return () => {
      socket.off("connect");
      socket.off("code-update");
    };
  }, []);

  const handleCodeChange = (value) => {
    setCode(value);
    socket.emit("code-update", value);
  };

  const runCode = async () => {
    setRunning(true);
    setStdout("");
    setStderr("");
    setExitCode(null);

    try {
      const res = await fetch("http://localhost:5000/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          code,
          stdin,
          // version: "*"  // optional; backend defaults to latest
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStderr(data?.error || "Run failed");
      } else {
        setStdout(data.stdout || "");
        setStderr(data.stderr || "");
        setExitCode(data.exitCode ?? null);
      }
    } catch (err) {
      setStderr(err.message || "Network error");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: "16px auto", padding: "0 12px" }}>
      <h1>CodeBattle Arena 🏆</h1>
      <RunPanel
        language={language}
        setLanguage={setLanguage}
        stdin={stdin}
        setStdin={setStdin}
        onRun={runCode}
        running={running}
      />
      <CodeEditor code={code} onChange={handleCodeChange} />
      <OutputPanel stdout={stdout} stderr={stderr} exitCode={exitCode} />
    </div>
  );
}

export default App;
