import React from "react";

const LANGUAGES = [
  { label: "JavaScript (node)", value: "javascript" },
  { label: "Python 3", value: "python" },
  { label: "C++ (G++)", value: "cpp" },
  { label: "Java", value: "java" },
  { label: "C (GCC)", value: "c" },
];

function RunPanel({ language, setLanguage, stdin, setStdin, onRun, running }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "12px",
      margin: "12px 0"
    }}>
      <div>
        <label style={{ display: "block", marginBottom: 6 }}>Language</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={{ width: "100%", padding: 8 }}
        >
          {LANGUAGES.map(l => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={{ display: "block", marginBottom: 6 }}>STDIN (optional)</label>
        <input
          value={stdin}
          onChange={(e) => setStdin(e.target.value)}
          placeholder="Input for your program"
          style={{ width: "100%", padding: 8 }}
        />
      </div>

      <div>
        <button
          onClick={onRun}
          disabled={running}
          style={{
            padding: "10px 16px",
            cursor: running ? "not-allowed" : "pointer",
            width: "100%"
          }}
        >
          {running ? "Running..." : "Run ▶"}
        </button>
      </div>
    </div>
  );
}

export default RunPanel;
